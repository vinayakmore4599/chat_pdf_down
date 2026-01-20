/**
 * Utility functions for rendering formatted text in PDFs
 * Supports: bold, italic, bullet points, colors, line breaks
 */

/**
 * Common emoji replacements for PDF rendering
 * jsPDF doesn't support emoji rendering, so we replace them with text
 */
const EMOJI_REPLACEMENTS = {
  '💼': '[Briefcase] ',
  '🎯': '[Target] ',
  '📊': '[Chart] ',
  '📈': '[Trending Up] ',
  '📉': '[Trending Down] ',
  '✅': '[Check] ',
  '❌': '[X] ',
  '⚠️': '[Warning] ',
  '💡': '[Idea] ',
  '🔍': '[Search] ',
  '📝': '[Note] ',
  '🚀': '[Rocket] ',
  '⭐': '[Star] ',
  '👍': '[Thumbs Up] ',
  '👎': '[Thumbs Down] ',
  '🔥': '[Fire] ',
  '💰': '[Money] ',
  '📱': '[Phone] ',
  '💻': '[Computer] ',
  '🌟': '[Star] ',
  '📅': '[Calendar] ',
  '🎉': '[Party] ',
  '⏰': '[Clock] ',
  '📧': '[Email] ',
  '🔔': '[Bell] ',
  '📌': '[Pin] ',
  '📑': '[Document] ',
  '🥧': '[Pie] ',
  '📐': '[Ruler] ',
  '🏆': '[Trophy] ',
  '✍️': '[Writing] ',
  '📋': '[Clipboard] ',
  '🗺️': '[Map] ',
};

/**
 * Replace emojis with text equivalents for PDF rendering
 */
export const replaceEmojisForPDF = (text) => {
  if (!text) return text;
  let result = text;
  Object.keys(EMOJI_REPLACEMENTS).forEach(emoji => {
    result = result.split(emoji).join(EMOJI_REPLACEMENTS[emoji]);
  });
  // Remove any remaining emojis (fallback for unlisted ones)
  // Emoji regex pattern - removes most emoji characters
  result = result.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '');
  return result;
};

/**
 * Text formatting object structure
 * {
 *   text: "string content",
 *   bold: true/false,
 *   italic: true/false,
 *   color: [r, g, b] or '#hexcolor',
 *   fontSize: 10,
 *   isBullet: true/false,
 *   indent: 0 (in mm)
 * }
 */

/**
 * Parse simple markdown-like text to formatted segments
 * Supports:
 *   **bold text**
 *   *italic text*
 *   • bullet points
 *   Line breaks with \n
 */
export const parseFormattedText = (text) => {
  // Replace emojis before processing
  const cleanText = replaceEmojisForPDF(text);
  const segments = [];

  // Split by newlines first
  const lines = cleanText.split('\n');

  lines.forEach((line) => {
    if (!line.trim()) {
      segments.push({ text: '', isNewline: true });
      return;
    }

    // Check for bullet point and determine indent level
    const hasTab = line.startsWith('\t');
    const trimmed = line.trim();
    
    // Check if it's a numbered list (1., 2., etc.) - these should NOT be treated as bullets
    const isNumberedList = /^\d+\.\s/.test(trimmed);
    
    // Only treat as bullet if it starts with bullet markers AND is not a numbered list
    const isBullet = !isNumberedList && (trimmed.startsWith('•') || trimmed.startsWith('-') || (trimmed.startsWith('*') && !trimmed.startsWith('**')));
    
    // Determine indent: sub-bullets (with tabs) get more indent
    let indentLevel = 0;
    if (isBullet) {
      if (hasTab) {
        indentLevel = 20; // Sub-bullet indent (increased for better visibility)
      } else {
        indentLevel = 8;  // Main bullet indent
      }
    }
    
    // Remove bullet marker and clean content
    let content = isBullet ? trimmed.replace(/^[•\-*]\s*/, '') : line;

    // Parse inline formatting
    const inlineSegments = parseInlineFormatting(content.trim());

    inlineSegments.forEach((seg, idx) => {
      segments.push({
        ...seg,
        isBullet: isBullet && idx === 0,
        indent: indentLevel,
        isSubBullet: hasTab && isBullet,
      });
    });

    segments.push({ text: '', isNewline: true });
  });

  return segments;
};

/**
 * Parse inline formatting: **bold** and *italic*
 * Preserves emojis and special Unicode symbols
 */
const parseInlineFormatting = (text) => {
  const segments = [];
  let currentText = '';
  let isBold = false;
  let isItalic = false;
  let i = 0;

  while (i < text.length) {
    // Check for ***bold+italic*** (must check this before ** and *)
    if (text.substring(i, i + 3) === '***') {
      if (currentText) {
        segments.push({
          text: currentText,
          bold: isBold,
          italic: isItalic,
        });
        currentText = '';
      }
      isBold = !isBold;
      isItalic = !isItalic;
      i += 3;
      continue;
    }
    
    // Check for **bold**
    if (text.substring(i, i + 2) === '**') {
      if (currentText) {
        segments.push({
          text: currentText,
          bold: isBold,
          italic: isItalic,
        });
        currentText = '';
      }
      isBold = !isBold;
      i += 2;
      continue;
    }

    // Check for *italic* (but not ** or ***)
    if (text[i] === '*' && text[i + 1] !== '*' && text[i - 1] !== '*') {
      if (currentText) {
        segments.push({
          text: currentText,
          bold: isBold,
          italic: isItalic,
        });
        currentText = '';
      }
      isItalic = !isItalic;
      i += 1;
      continue;
    }

    // Preserve all characters including emojis and special symbols
    currentText += text[i];
    i += 1;
  }

  if (currentText) {
    segments.push({
      text: currentText,
      bold: isBold,
      italic: isItalic,
    });
  }

  return segments;
};

/**
 * Add formatted text to PDF
 * @param {jsPDF} pdf - jsPDF instance
 * @param {Array} segments - Array of formatted text segments
 * @param {number} xPosition - Starting X position
 * @param {number} yPosition - Current Y position (will be updated)
 * @param {number} maxWidth - Maximum width for text wrapping
 * @param {Object} options - Additional options
 */
export const addFormattedText = (pdf, segments, xPosition, yPosition, maxWidth, options = {}) => {
  const {
    lineHeight = 7,
    fontSize = 10,
    color = [0, 0, 0],
    pageHeight = 297,
  } = options;

  let currentY = yPosition;
  let currentLineSegments = [];
  let currentBulletIndent = 0;

  segments.forEach((segment, index) => {
    // Handle newlines
    if (segment.isNewline) {
      if (currentLineSegments.length > 0) {
        currentY = renderTextLine(
          pdf,
          currentLineSegments,
          xPosition,
          currentY,
          maxWidth,
          lineHeight,
          fontSize,
          color,
          currentBulletIndent,
          pageHeight
        );
        currentLineSegments = [];
        currentBulletIndent = 0; // Reset bullet indent after rendering
      } else {
        // Empty line - add spacing for paragraph break
        currentY += lineHeight;
      }
      return;
    }

    // Track bullet indent from the segment
    if (segment.isBullet) {
      currentBulletIndent = segment.indent || 8;
    }

    currentLineSegments.push(segment);
  });

  // Render remaining segments
  if (currentLineSegments.length > 0) {
    currentY = renderTextLine(
      pdf,
      currentLineSegments,
      xPosition,
      currentY,
      maxWidth,
      lineHeight,
      fontSize,
      color,
      currentBulletIndent,
      pageHeight
    );
  }

  return currentY;
};

/**
 * Render a single line of formatted text
 */
const renderTextLine = (
  pdf,
  segments,
  xPosition,
  yPosition,
  maxWidth,
  lineHeight,
  baseFontSize,
  baseColor,
  bulletIndent,
  pageHeight
) => {
  const margin = 15;
  let currentY = yPosition;
  const startX = xPosition + bulletIndent;
  let currentX = startX;

  // Add bullet point if needed
  if (bulletIndent > 0) {
    pdf.setFont(undefined, 'normal');
    pdf.setFontSize(baseFontSize);
    if (Array.isArray(baseColor)) {
      pdf.setTextColor(...baseColor);
    }
    // Position bullet based on indent level
    // Main bullets (8mm): position at xPosition + 2
    // Sub-bullets (20mm): position at xPosition + 12 (more indented)
    const bulletX = bulletIndent > 15 ? xPosition + 12 : xPosition + 2;
    pdf.text('•', bulletX, currentY);
  }

  // Render each segment inline, wrapping as needed
  segments.forEach((segment) => {
    if (!segment.text) return;

    // Set font properties for this segment
    let fontStyle = 'normal';
    if (segment.bold && segment.italic) fontStyle = 'bolditalic';
    else if (segment.bold) fontStyle = 'bold';
    else if (segment.italic) fontStyle = 'italic';

    pdf.setFont(undefined, fontStyle);
    pdf.setFontSize(baseFontSize);

    // Set color
    const segmentColor = segment.color || baseColor;
    if (Array.isArray(segmentColor)) {
      pdf.setTextColor(...segmentColor);
    } else if (typeof segmentColor === 'string') {
      const rgb = hexToRgb(segmentColor);
      pdf.setTextColor(rgb.r, rgb.g, rgb.b);
    }

    // Split segment text by spaces for word wrapping
    const words = segment.text.split(' ');
    
    words.forEach((word, wordIdx) => {
      // Add space before word if not first word
      const textToAdd = (wordIdx > 0 || currentX > startX) ? ' ' + word : word;
      const textWidth = pdf.getTextWidth(textToAdd);
      
      // Check if text fits on current line
      if (currentX + textWidth > xPosition + maxWidth - 5) {
        // Move to next line
        currentY += lineHeight;
        currentX = startX;
        
        // Check for page break
        if (currentY > pageHeight - margin - 10) {
          pdf.addPage();
          currentY = margin;
          currentX = startX;
          
          // Re-add bullet if it was a bullet line
          if (bulletIndent > 0) {
            pdf.setFont(undefined, 'normal');
            if (Array.isArray(baseColor)) {
              pdf.setTextColor(...baseColor);
            }
            pdf.text('•', xPosition + 2, currentY);
            pdf.setFont(undefined, fontStyle); // Restore font style
          }
        }
        
        // Render word without leading space on new line
        pdf.text(word, currentX, currentY);
        currentX += pdf.getTextWidth(word);
      } else {
        // Render word on current line
        pdf.text(textToAdd, currentX, currentY);
        currentX += textWidth;
      }
    });
  });

  return currentY + lineHeight;
};

/**
 * Convert hex color to RGB
 */
const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 0, b: 0 };
};

/**
 * Create a formatted text segment
 */
export const createTextSegment = (text, options = {}) => {
  return {
    text,
    bold: options.bold || false,
    italic: options.italic || false,
    color: options.color || [0, 0, 0],
    fontSize: options.fontSize || 10,
    isBullet: options.isBullet || false,
    indent: options.indent || 0,
  };
};

/**
 * Create bullet point text
 */
export const createBulletText = (items) => {
  return items.map((item) => `• ${item}`).join('\n');
};

/**
 * Create bold text segment
 */
export const createBoldText = (text) => {
  return `**${text}**`;
};

/**
 * Create italic text segment
 */
export const createItalicText = (text) => {
  return `*${text}*`;
};
