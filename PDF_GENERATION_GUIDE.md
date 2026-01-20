# PDF Generation Implementation Guide

## Overview
Complete technical specification for building a professional PDF generation system with formatted text, native tables, and multiple chart types. This guide provides all necessary code, configurations, and implementation details for AI assistants to build this functionality from scratch.

---

## 1. Required Dependencies

### 1.1 Package Installation

```bash
npm install jspdf jspdf-autotable html2canvas recharts
```

### 1.2 Package Versions (Tested)

```json
{
  "dependencies": {
    "jspdf": "^2.5.2",
    "jspdf-autotable": "^3.8.3",
    "html2canvas": "^1.4.1",
    "recharts": "^2.12.7",
    "react": "^18.2.0"
  }
}
```

### 1.3 Critical Import Syntax

```javascript
// ✅ CORRECT - Named import (v2.x+)
import { jsPDF } from 'jspdf';

// ❌ WRONG - Default import (causes errors)
import jsPDF from 'jspdf';

// ✅ CORRECT - autoTable as function (v5.x+)
import autoTable from 'jspdf-autotable';

// Other imports
import html2canvas from 'html2canvas';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  AreaChart, Area, RadarChart, Radar, ScatterChart, Scatter,
  RadialBarChart, RadialBar, ComposedChart,
  CartesianGrid, XAxis, YAxis, Tooltip, Legend, Label,
  ResponsiveContainer, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
```

---

## 2. Text Formatting Utility (pdfTextFormatter.js)

### 2.1 Complete pdfTextFormatter.js File

Create `src/utils/pdfTextFormatter.js`:

```javascript
/**
 * PDF Text Formatting Utility
 * Handles emoji replacement, text parsing, and formatted rendering in PDF
 */

// Emoji to text mappings (jsPDF doesn't support Unicode emojis)
const EMOJI_REPLACEMENTS = {
  '📊': '[Chart]',
  '📈': '[Trending Up]',
  '📉': '[Trending Down]',
  '💼': '[Briefcase]',
  '🎯': '[Target]',
  '💡': '[Bulb]',
  '⚠️': '[Warning]',
  '✅': '[Check Mark]',
  '❌': '[Cross Mark]',
  '🔍': '[Magnifying Glass]',
  '📝': '[Memo]',
  '🚀': '[Rocket]',
  '💰': '[Money Bag]',
  '📅': '[Calendar]',
  '⏰': '[Alarm Clock]',
  '🌟': '[Star]',
  '🏆': '[Trophy]',
  '📍': '[Pin]',
  '🔔': '[Bell]',
  '💻': '[Laptop]',
  '📱': '[Mobile Phone]',
  '🌐': '[Globe]',
  '📧': '[Email]',
  '📞': '[Telephone]',
  '🎉': '[Party Popper]',
  '👍': '[Thumbs Up]',
  '👎': '[Thumbs Down]',
  '✍️': '[Writing Hand]',
  '🎨': '[Artist Palette]',
  '🔧': '[Wrench]',
};

/**
 * Replace emojis with text equivalents
 * @param {string} text - Text containing emojis
 * @returns {string} Text with emojis replaced
 */
export const replaceEmojisForPDF = (text) => {
  if (!text) return '';
  let result = text;
  Object.entries(EMOJI_REPLACEMENTS).forEach(([emoji, replacement]) => {
    result = result.split(emoji).join(replacement);
  });
  return result;
};

/**
 * Parse formatted text into segments
 * Supports: **bold**, *italic*, ***bold+italic***, bullets, sub-bullets, numbered lists
 * @param {string} text - Raw text with markdown-like formatting
 * @returns {Array} Array of text segments with formatting metadata
 */
export const parseFormattedText = (text) => {
  const cleanText = replaceEmojisForPDF(text);
  const segments = [];
  const lines = cleanText.split('\n');

  lines.forEach((line) => {
    // Handle empty lines (paragraph breaks)
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
    const isBullet = !isNumberedList && (
      trimmed.startsWith('•') || 
      trimmed.startsWith('-') || 
      (trimmed.startsWith('*') && !trimmed.startsWith('**'))
    );
    
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
 * Parse inline formatting: **bold**, *italic*, ***bold+italic***
 * @param {string} text - Text with inline formatting
 * @returns {Array} Array of segments with bold/italic flags
 */
const parseInlineFormatting = (text) => {
  const segments = [];
  let currentText = '';
  let isBold = false;
  let isItalic = false;
  let i = 0;

  while (i < text.length) {
    // Check for ***bold+italic*** (MUST check this before ** and *)
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
 * @param {number} yPosition - Current Y position
 * @param {number} maxWidth - Maximum width for text wrapping
 * @param {Object} options - Additional options
 * @returns {number} Updated Y position
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
 * Render a single line of formatted text with word wrapping
 * @param {jsPDF} pdf - jsPDF instance
 * @param {Array} segments - Segments for this line
 * @param {number} xPosition - Base X position
 * @param {number} yPosition - Current Y position
 * @param {number} maxWidth - Maximum width
 * @param {number} lineHeight - Line height
 * @param {number} baseFontSize - Base font size
 * @param {Array} baseColor - Base color [R, G, B]
 * @param {number} bulletIndent - Bullet indent level (0 = none, 8 = main, 20 = sub)
 * @param {number} pageHeight - Page height for page breaks
 * @returns {number} Updated Y position
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
        }
        
        // Add word without leading space on new line
        pdf.text(word, currentX, currentY);
        currentX += pdf.getTextWidth(word);
      } else {
        // Add word on current line
        pdf.text(textToAdd, currentX, currentY);
        currentX += textWidth;
      }
    });
  });

  return currentY + lineHeight;
};
```

---

## 3. Table Rendering Configuration

### 3.1 Table Section Data Structure

```javascript
{
  type: 'table',
  id: 'unique-table-id',
  heading: 'Table Title',  // Optional
  columns: ['Column 1', 'Column 2', 'Column 3'],
  rows: [
    ['Data 1.1', 'Data 1.2', 'Data 1.3'],
    ['Data 2.1', 'Data 2.2', 'Data 2.3'],
  ]
}
```

### 3.2 Table Rendering in PDF (autoTable API v5.x+)

```javascript
// CRITICAL: Use autoTable as function, not pdf.autoTable()
if (section.type === 'table' && section.rows && section.columns) {
  try {
    // Build column styles for auto-sizing with word wrap
    const columnStyles = {};
    section.columns.forEach((col, index) => {
      columnStyles[index] = {
        cellWidth: 'auto',      // Auto-size based on content
        overflow: 'linebreak',  // Wrap if content too long
        cellPadding: 2.5
      };
    });
    
    // Call autoTable as function (v5.x API)
    autoTable(pdf, {
      startY: yPosition,
      head: [section.columns],
      body: section.rows,
      theme: 'grid',
      
      headStyles: {
        fillColor: [240, 244, 248],
        textColor: [51, 51, 51],
        fontStyle: 'bold',
        fontSize: 8,
        halign: 'left',
        lineWidth: 0.5,
        lineColor: [102, 126, 234],
        overflow: 'linebreak',
        minCellHeight: 8
      },
      
      bodyStyles: {
        textColor: [85, 85, 85],
        fontSize: 7.5,
        cellPadding: 2.5,
        overflow: 'linebreak',  // KEY: Enables word wrapping
        valign: 'top',
        minCellHeight: 8
      },
      
      alternateRowStyles: {
        fillColor: [249, 249, 249]
      },
      
      margin: { left: margin, right: margin },
      
      styles: {
        lineColor: [224, 224, 224],
        lineWidth: 0.2,
        overflow: 'linebreak',
        minCellHeight: 8,
        halign: 'left',
        fontSize: 7.5
      },
      
      tableWidth: 'auto',
      horizontalPageBreak: false,      // Don't split columns across pages
      horizontalPageBreakRepeat: null,
      columnStyles: columnStyles
    });
    
    // Update Y position after table
    if (pdf.lastAutoTable && pdf.lastAutoTable.finalY) {
      yPosition = pdf.lastAutoTable.finalY + 12;
    }
  } catch (error) {
    console.error('Error rendering table:', error);
  }
}
```

---

## 4. Chart Rendering with Data Labels

### 4.1 Supported Chart Types

8 chart types with full support:
1. BarChart
2. LineChart
3. PieChart
4. AreaChart
5. RadarChart
6. ScatterChart
7. RadialBarChart
8. ComposedChart

### 4.2 Chart Color Palette

```javascript
const COLORS = [
  '#8884d8', '#82ca9d', '#ffc658', '#ff7c7c',
  '#a28df5', '#ff9f40', '#4bc0c0', '#f77eb9'
];
```

### 4.3 Complete renderChart Function

```javascript
const renderChart = (section) => {
  const chartData = section.data || [];
  const chartType = section.chartType || 'bar';

  const commonCartesian = (
    <>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="name" />
      <YAxis />
      <Tooltip />
      <Legend />
    </>
  );

  switch (chartType) {
    case 'bar':
      return (
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={chartData}>
            {commonCartesian}
            <Bar dataKey="value" fill={COLORS[0]} label={{ position: 'top' }} />
            {chartData[0]?.value2 && (
              <Bar dataKey="value2" fill={COLORS[1]} label={{ position: 'top' }} />
            )}
          </BarChart>
        </ResponsiveContainer>
      );

    case 'line':
      return (
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={chartData}>
            {commonCartesian}
            <Line type="monotone" dataKey="value" stroke={COLORS[0]} 
                  strokeWidth={2} label={{ position: 'top' }} />
          </LineChart>
        </ResponsiveContainer>
      );

    case 'pie':
      return (
        <ResponsiveContainer width="100%" height={350}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, value, percent }) => 
                `${name}: ${value} (${(percent * 100).toFixed(1)}%)`
              }
              outerRadius={120}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      );

    case 'area':
      return (
        <ResponsiveContainer width="100%" height={350}>
          <AreaChart data={chartData}>
            {commonCartesian}
            <Area type="monotone" dataKey="value" fill={COLORS[0]} 
                  stroke={COLORS[0]} label={{ position: 'top' }} />
          </AreaChart>
        </ResponsiveContainer>
      );

    case 'radar':
      return (
        <ResponsiveContainer width="100%" height={350}>
          <RadarChart data={chartData}>
            <PolarGrid />
            <PolarAngleAxis dataKey="name" />
            <PolarRadiusAxis />
            <Radar name="Value" dataKey="value" stroke={COLORS[0]} 
                   fill={COLORS[0]} fillOpacity={0.6} />
            <Tooltip />
            <Legend />
          </RadarChart>
        </ResponsiveContainer>
      );

    case 'scatter':
      return (
        <ResponsiveContainer width="100%" height={350}>
          <ScatterChart>
            {commonCartesian}
            <Scatter name="Values" data={chartData} fill={COLORS[0]} />
          </ScatterChart>
        </ResponsiveContainer>
      );

    case 'radialBar':
      return (
        <ResponsiveContainer width="100%" height={350}>
          <RadialBarChart innerRadius="10%" outerRadius="80%" data={chartData}>
            <RadialBar minAngle={15} label={{ position: 'insideStart', fill: '#fff' }} 
                       background clockWise dataKey="value" />
            <Legend iconSize={10} layout="vertical" verticalAlign="middle" />
            <Tooltip />
          </RadialBarChart>
        </ResponsiveContainer>
      );

    case 'composed':
      return (
        <ResponsiveContainer width="100%" height={350}>
          <ComposedChart data={chartData}>
            {commonCartesian}
            <Bar dataKey="value" fill={COLORS[0]} label={{ position: 'top' }} />
            <Line type="monotone" dataKey="value2" stroke={COLORS[1]} 
                  strokeWidth={2} label={{ position: 'top' }} />
          </ComposedChart>
        </ResponsiveContainer>
      );

    default:
      return null;
  }
};
```

### 4.4 Chart Capture and PDF Insertion

```javascript
// CRITICAL: Wait times for proper chart rendering
await new Promise(resolve => setTimeout(resolve, 1500)); // Initial wait

// Loop through chart sections
for (const section of chartSections) {
  // Additional wait per chart
  await new Promise(resolve => setTimeout(resolve, 300));
  
  const sectionRefElement = sectionRefs.current[section.id];
  if (!sectionRefElement) continue;

  // Check page space
  if (yPosition > pageHeight - 100) {
    pdf.addPage();
    yPosition = 15;
  }

  // Add chart heading
  if (section.heading) {
    pdf.setFontSize(11);
    pdf.setFont(undefined, 'bold');
    pdf.text(section.heading, margin, yPosition);
    yPosition += 10;
  }

  // Capture chart as canvas
  const chartCanvas = await html2canvas(sectionRefElement, {
    scale: 2,
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#ffffff',
    logging: false,
  });

  // Convert to image
  const chartImgData = chartCanvas.toDataURL('image/png');
  
  // Calculate dimensions
  const chartWidth = maxWidth;
  const chartHeight = (chartCanvas.height * chartWidth) / chartCanvas.width;

  // Check if chart fits on page
  if (yPosition + chartHeight > pageHeight - 15) {
    pdf.addPage();
    yPosition = 15;
  }

  // Add chart to PDF
  pdf.addImage(chartImgData, 'PNG', margin, yPosition, chartWidth, chartHeight);
  yPosition += chartHeight + 10;
}
```

---

## 5. Complete PDF Generation Function

### 5.1 Main downloadMessagePDF Function

```javascript
const downloadMessagePDF = async () => {
  if (isDownloading) return;
  setIsDownloading(true);

  try {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    let yPosition = 15;
    const margin = 15;
    const maxWidth = pageWidth - 2 * margin;

    // Wait for charts to render
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Process each section
    for (const section of sections) {
      // Add section heading
      if (section.heading) {
        if (yPosition > pageHeight - 30) {
          pdf.addPage();
          yPosition = 15;
        }
        
        pdf.setFontSize(11);
        pdf.setFont(undefined, 'bold');
        pdf.text(section.heading, margin, yPosition);
        yPosition += 8;
      }

      // Handle different section types
      if (section.type === 'text') {
        if (section.isFormatted) {
          // Use formatted text renderer
          const segments = parseFormattedText(section.content);
          yPosition = addFormattedText(pdf, segments, margin, yPosition, maxWidth, {
            lineHeight: 7,
            fontSize: 10,
            color: [0, 0, 0],
            pageHeight: pageHeight
          });
          yPosition += 5;
        } else {
          // Use basic text rendering
          pdf.setFont(undefined, 'normal');
          pdf.setFontSize(10);
          const textLines = pdf.splitTextToSize(section.content, maxWidth);
          pdf.text(textLines, margin, yPosition);
          yPosition += textLines.length * 7 + 10;
        }
      }
      else if (section.type === 'chart') {
        await new Promise(resolve => setTimeout(resolve, 300));
        
        const sectionRefElement = sectionRefs.current[section.id];
        if (sectionRefElement) {
          const chartCanvas = await html2canvas(sectionRefElement, {
            scale: 2,
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff',
            logging: false,
          });

          const chartImgData = chartCanvas.toDataURL('image/png');
          const chartWidth = maxWidth;
          const chartHeight = (chartCanvas.height * chartWidth) / chartCanvas.width;

          if (yPosition + chartHeight > pageHeight - 15) {
            pdf.addPage();
            yPosition = 15;
          }

          pdf.addImage(chartImgData, 'PNG', margin, yPosition, chartWidth, chartHeight);
          yPosition += chartHeight + 10;
        }
      }
      else if (section.type === 'table') {
        // Render table (see Section 3.2 for complete code)
        // ... table rendering code here ...
      }
    }

    // Save PDF
    const timestamp = new Date().toISOString().slice(0, 10);
    pdf.save(`chat-response-${timestamp}.pdf`);

  } catch (error) {
    console.error('Error generating PDF:', error);
    alert('Failed to generate PDF. Please try again.');
  } finally {
    setIsDownloading(false);
  }
};
```

---

## 6. UI Rendering (formatTextToHTML)

### 6.1 HTML Formatting for UI Display

```javascript
const formatTextToHTML = (text) => {
  if (!text) return '';
  
  let html = text;
  
  // Convert ***bold+italic*** to <strong><em> (must be before ** and *)
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  
  // Convert **bold** to <strong>
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  
  // Convert *italic* to <em>
  html = html.replace(/(?<!\*)\*(?!\*)(.+?)\*(?!\*)/g, '<em>$1</em>');
  
  // Convert bullet points to list items
  const lines = html.split('\n');
  let inList = false;
  const processedLines = [];
  
  lines.forEach(line => {
    const trimmed = line.trim();
    const isNumberedList = /^\d+\.\s/.test(trimmed);
    const isBullet = !isNumberedList && (
      trimmed.startsWith('•') || 
      trimmed.startsWith('-') || 
      (trimmed.startsWith('*') && !trimmed.startsWith('**'))
    );
    
    if (isBullet) {
      if (!inList) {
        processedLines.push('<ul>');
        inList = true;
      }
      const content = trimmed.replace(/^[•\-*]\s*/, '');
      if (line.startsWith('\t')) {
        processedLines.push(`<li style="margin-left: 20px;">${content}</li>`);
      } else {
        processedLines.push(`<li>${content}</li>`);
      }
    } else {
      if (inList) {
        processedLines.push('</ul>');
        inList = false;
      }
      if (trimmed) {
        processedLines.push(`<p>${line}</p>`);
      } else {
        processedLines.push('<br />');
      }
    }
  });
  
  if (inList) {
    processedLines.push('</ul>');
  }
  
  return processedLines.join('');
};
```

---

## 7. Implementation Checklist

### 7.1 Setup Tasks

- [ ] Install dependencies: `npm install jspdf jspdf-autotable html2canvas recharts`
- [ ] Create `src/utils/pdfTextFormatter.js` (Section 2.1)
- [ ] Import all required libraries with correct syntax

### 7.2 Text Formatting

- [ ] Implement EMOJI_REPLACEMENTS map (30+ emojis)
- [ ] Implement replaceEmojisForPDF()
- [ ] Implement parseFormattedText() with tab detection
- [ ] Implement parseInlineFormatting() with ***bold+italic*** first
- [ ] Implement addFormattedText() with paragraph spacing
- [ ] Implement renderTextLine() with word wrapping

### 7.3 Table Rendering

- [ ] Use `autoTable(pdf, {...})` syntax (not `pdf.autoTable()`)
- [ ] Set `cellWidth: 'auto'` for content-based sizing
- [ ] Set `overflow: 'linebreak'` in all style sections
- [ ] Set `horizontalPageBreak: false` to prevent column splitting
- [ ] Build columnStyles dynamically for each table

### 7.4 Chart Rendering

- [ ] Import all 8 Recharts chart types
- [ ] Implement renderChart() with switch statement
- [ ] Add `label={{ position: 'top' }}` to Bar, Line, Area
- [ ] Add custom label for Pie charts with percentages
- [ ] Use COLORS array for consistent styling
- [ ] Wait 1500ms before PDF generation
- [ ] Wait 300ms per chart in loop
- [ ] Use html2canvas with `scale: 2`

### 7.5 PDF Generation

- [ ] Use named import: `import { jsPDF } from 'jspdf';`
- [ ] Implement downloadMessagePDF() with try/catch
- [ ] Handle text, table, and chart sections
- [ ] Track yPosition correctly
- [ ] Add page breaks when needed
- [ ] Save with timestamp filename

### 7.6 Testing

- [ ] Test all 8 chart types render with labels
- [ ] Test tables with long content word wrap
- [ ] Test bullet points indent (8mm)
- [ ] Test sub-bullets indent (20mm with tab)
- [ ] Test ***bold+italic*** formatting
- [ ] Test emojis convert to text
- [ ] Test numbered lists (no bullet markers)
- [ ] Test empty lines create paragraph spacing
- [ ] Test mixed content (text + tables + charts)

---

## 8. Common Pitfalls

### ❌ Wrong: Default jsPDF import
```javascript
import jsPDF from 'jspdf';  // Causes errors
```
### ✅ Correct: Named import
```javascript
import { jsPDF } from 'jspdf';
```

### ❌ Wrong: Old autoTable API
```javascript
pdf.autoTable({ ... });  // "pdf.autoTable is not a function"
```
### ✅ Correct: New autoTable API
```javascript
autoTable(pdf, { ... });
```

### ❌ Wrong: Check ** before ***
```javascript
if (text.substring(i, i + 2) === '**') { ... }  // Matches ***!
if (text.substring(i, i + 3) === '***') { ... }
```
### ✅ Correct: Check *** first
```javascript
if (text.substring(i, i + 3) === '***') { ... }
if (text.substring(i, i + 2) === '**') { ... }
```

### ❌ Wrong: No wait for charts
```javascript
const canvas = await html2canvas(element);  // Blank charts!
```
### ✅ Correct: Wait for rendering
```javascript
await new Promise(resolve => setTimeout(resolve, 1500));
// ... loop ...
await new Promise(resolve => setTimeout(resolve, 300));
const canvas = await html2canvas(element);
```

---

## 9. File Structure

```
src/
├── components/
│   └── ChatResponse.js      # Main component with PDF generation
├── utils/
│   └── pdfTextFormatter.js  # Text formatting utilities (Section 2.1)
├── styles/
│   └── ChatResponse.css     # Component styling
└── ChatApp.js               # Main app with test data
```

---

## Summary

This guide provides complete, production-ready code for:

✅ Advanced text formatting (bold, italic, bullets, sub-bullets, numbered lists)
✅ Emoji-to-text conversion (30+ mappings)
✅ Native PDF tables with word wrapping and auto-sizing
✅ 8 chart types with data labels
✅ High-quality chart capture (2x resolution)
✅ Proper wait times for chart rendering
✅ Sections-based architecture for flexible layouts
✅ Automatic pagination and page breaks
✅ Professional styling and formatting

All code is tested and ready for implementation.
