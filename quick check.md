# PDF Generation Quick Check Guide

## Common Issues & Fixes for Text Formatting and Garbage Content

---

## ⚡ HOW TO AVOID GARBAGE IN PDF - Complete Solution

### Step 1: Create Text Cleaning Pipeline

Create or update your `pdfTextFormatter.js` file with this complete cleaning function:

```javascript
/**
 * COMPLETE TEXT CLEANING FOR PDF
 * Call this on ALL text before adding to PDF
 */
export const cleanTextForPDF = (text) => {
  if (!text) return '';
  
  let cleaned = text;
  
  // 1. Remove HTML tags (from CopilotKit, rich text editors)
  cleaned = cleaned.replace(/<[^>]*>/g, '');
  
  // 2. Remove code blocks
  cleaned = cleaned.replace(/```[\s\S]*?```/g, '');
  
  // 3. Remove inline code backticks (keep the text inside)
  cleaned = cleaned.replace(/`([^`]+)`/g, '$1');
  
  // 4. Remove invisible Unicode characters
  cleaned = cleaned.replace(/[\u200B-\u200D\uFEFF]/g, ''); // Zero-width spaces
  cleaned = cleaned.replace(/[\u00AD]/g, ''); // Soft hyphens
  cleaned = cleaned.replace(/[\u202A-\u202E]/g, ''); // Text direction marks
  
  // 5. Replace emojis with text equivalents
  cleaned = replaceEmojisForPDF(cleaned);
  
  // 6. Normalize whitespace
  cleaned = cleaned.replace(/\s+/g, ' '); // Multiple spaces to single
  cleaned = cleaned.replace(/\n\s*\n\s*\n/g, '\n\n'); // Max 2 consecutive newlines
  cleaned = cleaned.trim();
  
  // 7. Remove any remaining high Unicode characters that jsPDF can't render
  // Keep common symbols but remove problematic ones
  cleaned = cleaned.replace(/[\u2700-\u27BF]/g, ''); // Dingbats
  cleaned = cleaned.replace(/[\uE000-\uF8FF]/g, ''); // Private use area
  
  return cleaned;
};
```

### Step 2: Use Cleaning in Your PDF Generation

```javascript
import { jsPDF } from 'jspdf';
import { cleanTextForPDF, parseFormattedText, addFormattedText } from './utils/pdfTextFormatter';

const generatePDF = (messages) => {
  const pdf = new jsPDF();
  let y = 20;
  
  messages.forEach(message => {
    // ✅ ALWAYS clean text first
    const rawText = message.content || message.text || '';
    const cleanedText = cleanTextForPDF(rawText);
    
    // Now process the cleaned text
    const segments = parseFormattedText(cleanedText);
    y = addFormattedText(pdf, segments, 15, y, 180);
    y += 10;
  });
  
  pdf.save('report.pdf');
};
```

### Step 3: Handle CopilotKit Messages Specifically

```javascript
/**
 * Process CopilotKit messages for PDF
 * Handles all CopilotKit-specific formatting
 */
export const processCopilotKitForPDF = (copilotMessage) => {
  // Extract text from CopilotKit message structure
  let text = '';
  
  if (typeof copilotMessage === 'string') {
    text = copilotMessage;
  } else if (copilotMessage.content) {
    text = copilotMessage.content;
  } else if (copilotMessage.text) {
    text = copilotMessage.text;
  } else if (copilotMessage.message) {
    text = copilotMessage.message;
  }
  
  // Clean the text
  return cleanTextForPDF(text);
};

// Usage in PDF generation
const messageText = processCopilotKitForPDF(copilotMessage);
const segments = parseFormattedText(messageText);
addFormattedText(pdf, segments, 15, y, 180);
```

### Step 4: Clean Chart Captures

```javascript
/**
 * Capture chart without garbage text
 */
const captureChartForPDF = async (chartElement) => {
  // Clone the chart to avoid modifying original
  const clone = chartElement.cloneNode(true);
  
  // Remove problematic elements
  clone.querySelectorAll('.recharts-tooltip-wrapper').forEach(el => el.remove());
  clone.querySelectorAll('.recharts-legend-wrapper').forEach(el => el.remove());
  clone.querySelectorAll('[data-tooltip]').forEach(el => el.remove());
  clone.querySelectorAll('[aria-hidden="true"]').forEach(el => el.remove());
  
  // Temporarily add to DOM for capture
  clone.style.position = 'absolute';
  clone.style.left = '-9999px';
  clone.style.visibility = 'hidden';
  document.body.appendChild(clone);
  
  // Capture with proper settings
  const canvas = await html2canvas(clone, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff',
    logging: false,
    removeContainer: true,
    // Ignore text elements if they cause issues
    ignoreElements: (element) => {
      return element.tagName === 'STYLE' || 
             element.classList.contains('tooltip') ||
             element.classList.contains('overlay');
    }
  });
  
  // Clean up
  document.body.removeChild(clone);
  
  return canvas.toDataURL('image/png');
};

// Usage
const chartImage = await captureChartForPDF(chartRef.current);
pdf.addImage(chartImage, 'PNG', 15, y, 180, 100);
```

### Step 5: Complete Example - Avoiding ALL Garbage

```javascript
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';
import { 
  cleanTextForPDF, 
  processCopilotKitForPDF,
  parseFormattedText, 
  addFormattedText 
} from './utils/pdfTextFormatter';

const generateCleanPDF = async (copilotMessages, chartRefs) => {
  const pdf = new jsPDF();
  let y = 20;
  const margin = 15;
  const pageHeight = 297;
  
  // Add title
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(16);
  pdf.text('Chat Report', margin, y);
  y += 15;
  
  // Process each message
  for (let i = 0; i < copilotMessages.length; i++) {
    const message = copilotMessages[i];
    
    // ✅ Clean CopilotKit message
    const cleanedText = processCopilotKitForPDF(message);
    
    // ✅ Parse and add formatted text
    const segments = parseFormattedText(cleanedText);
    y = addFormattedText(pdf, segments, margin, y, 180, {
      lineHeight: 7,
      fontSize: 10
    });
    
    y += 10;
    
    // ✅ Add chart if exists (cleaned)
    if (chartRefs[i]) {
      // Check for page break
      if (y + 100 > pageHeight - margin) {
        pdf.addPage();
        y = margin;
      }
      
      const chartImage = await captureChartForPDF(chartRefs[i]);
      pdf.addImage(chartImage, 'PNG', margin, y, 180, 100);
      y += 110;
    }
    
    // ✅ Add table if exists
    if (message.tableData) {
      if (y > pageHeight - margin - 50) {
        pdf.addPage();
        y = margin;
      }
      
      autoTable(pdf, {
        head: [message.tableHeaders || []],
        body: message.tableData,
        startY: y,
        margin: { left: margin, right: margin }
      });
      
      y = pdf.lastAutoTable.finalY + 10;
    }
  }
  
  pdf.save('clean-report.pdf');
};
```

### Step 6: Add to Your Imports

```javascript
// In your component file
import { jsPDF } from 'jspdf'; // ✅ Named import
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';
import { 
  cleanTextForPDF,           // ✅ Main cleaning function
  processCopilotKitForPDF,   // ✅ CopilotKit-specific
  parseFormattedText,        // ✅ Parse markdown formatting
  addFormattedText           // ✅ Render with formatting
} from './utils/pdfTextFormatter';
```

### Quick Checklist - Avoiding Garbage ✅

- [ ] Using named import: `import { jsPDF } from 'jspdf'`
- [ ] Clean ALL text with `cleanTextForPDF()` before PDF
- [ ] Use `processCopilotKitForPDF()` for CopilotKit messages
- [ ] Remove HTML tags from text
- [ ] Replace emojis with text equivalents
- [ ] Remove invisible Unicode characters
- [ ] Clean chart elements before html2canvas capture
- [ ] Test PDF with console.log of cleaned text

---

### 1. Text Formatting Not Appearing

#### Causes:
- ❌ **Wrong jsPDF import** - Using default import instead of named import
- ❌ **Not parsing formatted text** - Passing raw text directly to PDF
- ❌ **Font not set before rendering** - Missing `setFont()` calls
- ❌ **Formatted segments not applied** - Not using `addFormattedText()` function

#### Fixes:

```javascript
// ✅ CORRECT - Named import (jsPDF v2.x+)
import { jsPDF } from 'jspdf';

// ❌ WRONG - Causes formatting issues
import jsPDF from 'jspdf';

// ✅ CORRECT - Parse and render formatted text
import { parseFormattedText, addFormattedText } from './utils/pdfTextFormatter';

const segments = parseFormattedText(text); // Parse **bold** *italic* etc.
const newY = addFormattedText(pdf, segments, x, y, width, {
  lineHeight: 7,
  fontSize: 10
});

// ❌ WRONG - Just using pdf.text() ignores formatting
pdf.text(text, x, y); // No bold/italic will show
```

---

### 2. Garbage/Corrupted Content in PDF

#### Causes:
- ❌ **Emojis and special Unicode characters** - jsPDF doesn't support them
- ❌ **Not encoding text properly** - Special characters breaking PDF format
- ❌ **Missing emoji replacement** - Unicode emojis render as boxes/garbage

#### Fixes:

```javascript
// ✅ ALWAYS replace emojis before adding to PDF
import { replaceEmojisForPDF } from './utils/pdfTextFormatter';

const cleanText = replaceEmojisForPDF(rawText);
// Converts: "📊 Sales Report" → "[Chart] Sales Report"

// ✅ Expand emoji dictionary for your needs
const EMOJI_REPLACEMENTS = {
  '📊': '[Chart]',
  '💰': '[Money]',
  '✅': '[Check]',
  // Add more as needed
};

// ✅ Fallback regex to remove unlisted emojis
text.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]/gu, '');
```

---

### 3. Other Common Issues

#### Chart Rendering as Blank/Garbage:

```javascript
// ✅ Wait for chart to render before capturing
await new Promise(resolve => setTimeout(resolve, 500));

const canvas = await html2canvas(chartElement, {
  scale: 2,
  useCORS: true,
  backgroundColor: '#ffffff'
});

const imgData = canvas.toDataURL('image/png');
pdf.addImage(imgData, 'PNG', x, y, width, height);
```

#### Table Not Showing:

```javascript
// ✅ CORRECT - autoTable as function (v5.x+)
import autoTable from 'jspdf-autotable';

autoTable(pdf, {
  head: [['Column 1', 'Column 2']],
  body: data,
  startY: yPosition
});

// ❌ WRONG - Old syntax (v3.x)
pdf.autoTable({ ... }); // Won't work in newer versions
```

#### Text Overlapping:

```javascript
// ✅ Track Y position after each element
let currentY = 20;

currentY = addFormattedText(pdf, segments, 15, currentY, 180);
currentY += 10; // Add spacing

autoTable(pdf, {
  startY: currentY,
  // ...
});

// Update currentY after table
currentY = pdf.lastAutoTable.finalY + 10;
```

---

## Quick Diagnostic Checklist

Use this checklist in your PDF generation function:

```javascript
// 1. ✅ Correct imports
import { jsPDF } from 'jspdf'; // Named import
import autoTable from 'jspdf-autotable';
import { replaceEmojisForPDF, parseFormattedText, addFormattedText } from './utils/pdfTextFormatter';

// 2. ✅ Clean text before using
const cleanText = replaceEmojisForPDF(rawText);

// 3. ✅ Parse formatting
const segments = parseFormattedText(cleanText);

// 4. ✅ Use formatter utility
currentY = addFormattedText(pdf, segments, x, currentY, width);

// 5. ✅ Set fonts explicitly when needed
pdf.setFont('helvetica', 'bold');
pdf.setFontSize(12);

// 6. ✅ Track Y position throughout
let currentY = 20;
// Update after each element

// 7. ✅ Handle page breaks
if (currentY > pageHeight - margin) {
  pdf.addPage();
  currentY = margin;
}
```

---

## Complete Working Example

```javascript
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { replaceEmojisForPDF, parseFormattedText, addFormattedText } from './utils/pdfTextFormatter';

const generatePDF = () => {
  const pdf = new jsPDF();
  let y = 20;
  
  // Title
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(16);
  pdf.text('Sales Report', 15, y);
  y += 15;
  
  // Formatted text with emojis
  const rawText = "📊 **Q1 Results:** Revenue increased by *15%* with strong growth in:\n• North Region\n• East Region";
  
  // Clean emojis
  const cleanText = replaceEmojisForPDF(rawText);
  
  // Parse formatting
  const segments = parseFormattedText(cleanText);
  
  // Render formatted text
  y = addFormattedText(pdf, segments, 15, y, 180, {
    lineHeight: 7,
    fontSize: 10
  });
  
  y += 10; // Add spacing
  
  // Add table
  autoTable(pdf, {
    head: [['Region', 'Sales']],
    body: [
      ['North', '$4,500'],
      ['East', '$3,200']
    ],
    startY: y
  });
  
  // Save PDF
  pdf.save('report.pdf');
};
```

---

## Diagnosing Garbage Text Source (CopilotKit vs Chart DOM)

### How to Identify the Source

#### Test 1: Isolate Text Content

```javascript
// Test WITHOUT charts - just text
const testText = "📊 **Q1 Results:** Revenue increased by *15%*";
console.log('Raw text:', testText);

const cleanText = replaceEmojisForPDF(testText);
console.log('After emoji clean:', cleanText);

const segments = parseFormattedText(cleanText);
console.log('Parsed segments:', segments);

// Generate PDF with ONLY text (no charts)
// If garbage appears here → Text processing issue
// If clean → Chart capture issue
```

#### Test 2: Inspect Text Before PDF Generation

```javascript
// Log what CopilotKit is returning
const messageContent = copilotMessage.content;
console.log('CopilotKit raw:', messageContent);
console.log('Has emojis?', /[\u{1F300}-\u{1F9FF}]/gu.test(messageContent));
console.log('Has special chars?', /[^\x00-\x7F]/g.test(messageContent));

// Check for hidden characters
console.log('Char codes:', [...messageContent].map(c => c.charCodeAt(0)));
```

#### Test 3: Check Chart DOM Capture

```javascript
// Before capturing chart
const chartElement = document.getElementById('chart-container');
console.log('Chart HTML:', chartElement.innerHTML);
console.log('Chart text content:', chartElement.textContent);

// If capturing with html2canvas
const canvas = await html2canvas(chartElement, {
  logging: true, // Enable logging
  onclone: (clonedDoc) => {
    console.log('Cloned element:', clonedDoc.getElementById('chart-container'));
  }
});
```

---

### Common CopilotKit Issues

#### Issue: CopilotKit Returns Markdown/HTML

```javascript
// ❌ CopilotKit might return:
"<div>📊 Sales data</div>" // HTML tags
"**Bold text** with markdown" // Markdown formatting
"```javascript\ncode\n```" // Code blocks

// ✅ Solution: Strip HTML/Markdown before processing
import { replaceEmojisForPDF, parseFormattedText } from './utils/pdfTextFormatter';

const cleanForPDF = (copilotText) => {
  let text = copilotText;
  
  // Remove HTML tags
  text = text.replace(/<[^>]*>/g, '');
  
  // Remove code blocks
  text = text.replace(/```[\s\S]*?```/g, '');
  
  // Clean emojis
  text = replaceEmojisForPDF(text);
  
  return text;
};

// Use it
const cleanText = cleanForPDF(copilotMessage.content);
const segments = parseFormattedText(cleanText);
```

#### Issue: CopilotKit Includes Special Unicode

```javascript
// CopilotKit might include:
// - Zero-width spaces: \u200B
// - Right-to-left marks: \u200F
// - Soft hyphens: \u00AD

const removeInvisibleChars = (text) => {
  return text
    .replace(/[\u200B-\u200D\uFEFF]/g, '') // Zero-width chars
    .replace(/[\u00AD]/g, '') // Soft hyphens
    .replace(/[\u202A-\u202E]/g, ''); // Text direction marks
};

// Combine with emoji replacement
const fullClean = (text) => {
  let cleaned = removeInvisibleChars(text);
  cleaned = replaceEmojisForPDF(cleaned);
  return cleaned;
};
```

---

### Common Chart DOM Issues

#### Issue: Chart Library Adds Hidden Text

```javascript
// Some chart libraries add SVG text, tooltips, legends
// that get captured as garbage when using html2canvas

// ✅ Solution: Clone and clean the chart element
const cleanChartForCapture = async (chartElement) => {
  // Clone the element
  const clone = chartElement.cloneNode(true);
  
  // Remove tooltips, popups, legends if needed
  clone.querySelectorAll('.recharts-tooltip').forEach(el => el.remove());
  clone.querySelectorAll('[data-tooltip]').forEach(el => el.remove());
  
  // Hide text elements if causing issues
  // clone.querySelectorAll('text').forEach(el => el.style.display = 'none');
  
  return clone;
};

// Use cleaned clone for capture
const cleanedChart = await cleanChartForCapture(chartElement);
document.body.appendChild(cleanedChart); // Temporarily add to DOM
cleanedChart.style.position = 'absolute';
cleanedChart.style.left = '-9999px';

const canvas = await html2canvas(cleanedChart, {
  scale: 2,
  backgroundColor: '#ffffff'
});

document.body.removeChild(cleanedChart); // Remove after capture
```

#### Issue: SVG Text Not Rendering Correctly

```javascript
// ✅ Better approach: Use specific chart capture settings
const canvas = await html2canvas(chartElement, {
  scale: 2,
  useCORS: true,
  allowTaint: true,
  backgroundColor: '#ffffff',
  logging: false,
  // Force SVG rendering
  foreignObjectRendering: true,
  // Ignore certain elements
  ignoreElements: (element) => {
    // Skip tooltips, overlays
    return element.classList.contains('recharts-tooltip-wrapper') ||
           element.classList.contains('chart-overlay');
  }
});
```

---

### Complete Diagnostic Function

```javascript
const diagnoseGarbageSource = async (copilotMessage, chartElement) => {
  console.log('=== PDF GARBAGE DIAGNOSTIC ===');
  
  // 1. Check CopilotKit text
  console.log('1. CopilotKit Raw Text:', copilotMessage.content);
  
  const hasEmojis = /[\u{1F300}-\u{1F9FF}]/gu.test(copilotMessage.content);
  const hasSpecialChars = /[^\x00-\x7F]/g.test(copilotMessage.content);
  const hasHTML = /<[^>]*>/g.test(copilotMessage.content);
  
  console.log('   - Has Emojis:', hasEmojis);
  console.log('   - Has Special Chars:', hasSpecialChars);
  console.log('   - Has HTML Tags:', hasHTML);
  
  // 2. Check after cleaning
  let cleanText = copilotMessage.content;
  cleanText = cleanText.replace(/<[^>]*>/g, ''); // Remove HTML
  cleanText = replaceEmojisForPDF(cleanText);
  console.log('2. After Cleaning:', cleanText);
  
  // 3. Check chart content
  if (chartElement) {
    console.log('3. Chart Text Content:', chartElement.textContent);
    console.log('   - Has Hidden Elements:', 
      chartElement.querySelectorAll('[style*="display: none"]').length);
    console.log('   - Has Tooltips:', 
      chartElement.querySelectorAll('.recharts-tooltip, [data-tooltip]').length);
  }
  
  // 4. Test PDF generation with text only
  console.log('4. Generate test PDF with text only to isolate issue');
  
  return {
    textIssue: hasEmojis || hasSpecialChars || hasHTML,
    cleanedText: cleanText,
    chartHasHiddenContent: chartElement ? chartElement.textContent.length > 100 : false
  };
};

// Usage
const diagnosis = await diagnoseGarbageSource(message, chartRef.current);
console.log('Diagnosis:', diagnosis);
```

---

### Quick Fix: Filter CopilotKit Content

```javascript
// Complete filter for CopilotKit messages
const processCopilotKitMessage = (message) => {
  let text = message.content || message.text || '';
  
  // 1. Remove HTML tags
  text = text.replace(/<[^>]*>/g, '');
  
  // 2. Remove code blocks
  text = text.replace(/```[\s\S]*?```/g, '');
  
  // 3. Remove inline code
  text = text.replace(/`([^`]+)`/g, '$1');
  
  // 4. Remove invisible characters
  text = text.replace(/[\u200B-\u200D\uFEFF\u00AD\u202A-\u202E]/g, '');
  
  // 5. Replace emojis
  text = replaceEmojisForPDF(text);
  
  // 6. Remove excessive whitespace
  text = text.replace(/\s+/g, ' ').trim();
  
  return text;
};

// Use in PDF generation
const cleanMessage = processCopilotKitMessage(copilotMessage);
const segments = parseFormattedText(cleanMessage);
addFormattedText(pdf, segments, 15, y, 180);
```

---

## Top 3 Most Common Issues

1. **Using default import** instead of `import { jsPDF } from 'jspdf'`
2. **Not calling `replaceEmojisForPDF()`** before adding text (causes garbage)
3. **Not using the text formatter utility** - just calling `pdf.text()` directly (no formatting)

**Check these three things first!**

---

## Required Dependencies

```bash
npm install jspdf jspdf-autotable html2canvas
```

```json
{
  "dependencies": {
    "jspdf": "^2.5.2",
    "jspdf-autotable": "^3.8.3",
    "html2canvas": "^1.4.1"
  }
}
```

---

## When to Use Each Function

| Function | When to Use | Example |
|----------|------------|---------|
| `replaceEmojisForPDF()` | **Always** clean text before adding to PDF | Any text with emojis or special chars |
| `parseFormattedText()` | When text has **bold**, *italic*, bullets | Markdown-like formatted strings |
| `addFormattedText()` | Render parsed segments with proper formatting | After parsing formatted text |
| `pdf.text()` | Simple unformatted text only | Page numbers, simple labels |
| `autoTable()` | Render data tables | Tabular data display |
| `html2canvas()` | Capture charts/complex HTML | React charts (Recharts, etc.) |
