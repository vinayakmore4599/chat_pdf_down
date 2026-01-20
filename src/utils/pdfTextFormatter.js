/**
 * Utility functions for rendering formatted text in PDFs
 * Supports: bold, italic, bullet points, colors, line breaks
 */

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
  const segments = [];

  // Split by newlines first
  const lines = text.split('\n');

  lines.forEach((line) => {
    if (!line.trim()) {
      segments.push({ text: '', isNewline: true });
      return;
    }

    // Check for bullet point
    const isBullet = line.trim().startsWith('•') || line.trim().startsWith('-');
    let content = isBullet ? line.replace(/^[\s•\-]+/, '') : line;

    // Parse inline formatting
    const inlineSegments = parseInlineFormatting(content.trim());

    inlineSegments.forEach((seg, idx) => {
      segments.push({
        ...seg,
        isBullet: isBullet && idx === 0,
        indent: isBullet ? 5 : 0,
      });
    });

    segments.push({ text: '', isNewline: true });
  });

  return segments;
};

/**
 * Parse inline formatting: **bold** and *italic*
 */
const parseInlineFormatting = (text) => {
  const segments = [];
  let currentText = '';
  let isBold = false;
  let isItalic = false;
  let i = 0;

  while (i < text.length) {
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

    // Check for *italic* (but not **)
    if (text[i] === '*' && text[i + 1] !== '*') {
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

  segments.forEach((segment) => {
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
          segment.isBullet ? 5 : 0,
          pageHeight
        );
        currentLineSegments = [];
      }
      return;
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
      0,
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
  let currentX = xPosition + bulletIndent;
  let currentY = yPosition;
  const margin = 15;

  // Add bullet point if needed
  if (bulletIndent > 0) {
    pdf.setFont(undefined, 'normal');
    pdf.setFontSize(baseFontSize);
    pdf.setTextColor(...baseColor);
    pdf.text('•', xPosition, currentY);
  }

  // Render each segment
  segments.forEach((segment) => {
    if (!segment.text) return;

    // Check for page break
    if (currentY > pageHeight - margin) {
      pdf.addPage();
      currentY = margin;
      currentX = xPosition + bulletIndent;
    }

    // Set font properties
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

    // Split text to fit width
    const textLines = pdf.splitTextToSize(segment.text, maxWidth - bulletIndent - 5);

    textLines.forEach((line, idx) => {
      pdf.text(line, currentX, currentY);
      if (idx < textLines.length - 1) {
        currentY += lineHeight;
        if (currentY > pageHeight - margin) {
          pdf.addPage();
          currentY = margin;
        }
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
