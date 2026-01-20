# PDF Generation - Quick Reference

## Critical Configuration Points

### 1. Imports (MUST be exact)
```javascript
import { jsPDF } from 'jspdf';           // ✅ Named import
import autoTable from 'jspdf-autotable'; // ✅ Default import
import html2canvas from 'html2canvas';
```

### 2. autoTable API (v5.x+)
```javascript
autoTable(pdf, { head: [...], body: [...] });  // ✅ Function call
// NOT: pdf.autoTable({ ... });  ❌ Old v3.x API
```

### 3. Formatting Order (CRITICAL)
```javascript
// Check *** BEFORE ** and *
if (text.substring(i, i + 3) === '***') { /* bold+italic */ }
if (text.substring(i, i + 2) === '**') { /* bold */ }
if (text[i] === '*') { /* italic */ }
```

### 4. Chart Wait Times
```javascript
await new Promise(resolve => setTimeout(resolve, 1500));  // Initial
// In loop:
await new Promise(resolve => setTimeout(resolve, 300));   // Per chart
```

### 5. Bullet Indentation
```javascript
if (hasTab) indentLevel = 20;  // Sub-bullets
else indentLevel = 8;          // Main bullets
```

### 6. Table Word Wrap
```javascript
columnStyles: {
  0: { cellWidth: 'auto', overflow: 'linebreak' }
},
horizontalPageBreak: false  // Don't split columns
```

### 7. Numbered Lists Detection
```javascript
const isNumberedList = /^\d+\.\s/.test(trimmed);
const isBullet = !isNumberedList && trimmed.startsWith('•');
```

### 8. Empty Line Handling
```javascript
if (!currentLineSegments.length) {
  currentY += lineHeight;  // Add spacing for paragraph break
}
```

---

## Data Structures

### Text Section
```javascript
{
  type: 'text',
  id: 'text-1',
  heading: 'Section Title',
  isFormatted: true,  // Use parseFormattedText
  content: '**Bold** and *italic* text\n• Bullet\n\t• Sub-bullet'
}
```

### Table Section
```javascript
{
  type: 'table',
  id: 'table-1',
  heading: 'Data Table',
  columns: ['Name', 'Value'],
  rows: [['Item 1', '100'], ['Item 2', '200']]
}
```

### Chart Section
```javascript
{
  type: 'chart',
  id: 'chart-1',
  heading: 'Chart Title',
  chartType: 'bar',  // bar|line|pie|area|radar|scatter|radialBar|composed
  data: [{ name: 'A', value: 100 }, { name: 'B', value: 200 }]
}
```

---

## Essential Functions

### pdfTextFormatter.js
- `replaceEmojisForPDF(text)` - Convert emojis to text
- `parseFormattedText(text)` - Parse markdown to segments
- `addFormattedText(pdf, segments, x, y, width, opts)` - Render to PDF

### ChatResponse.js
- `formatTextToHTML(text)` - Convert markdown to HTML for UI
- `renderChart(section)` - Render Recharts component
- `downloadMessagePDF()` - Main PDF generation function

---

## Styling Reference

### Text
- Title: 14pt bold
- Headings: 11pt bold
- Body: 10pt normal
- Line height: 7mm

### Tables
- Header: 8pt bold, blue background (#F0F4F8)
- Body: 7.5pt normal, alternating rows
- Padding: 2.5mm
- Min cell height: 8mm

### Charts
- Height: 350px
- Colors: ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', ...]
- Scale: 2x for high DPI
- Background: #ffffff

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "jsPDF is not a constructor" | Use `import { jsPDF } from 'jspdf'` |
| "pdf.autoTable is not a function" | Use `autoTable(pdf, {...})` |
| Charts appear blank | Add 1500ms wait + 300ms per chart |
| Emojis show as garbled | Use `replaceEmojisForPDF()` |
| Tables overflow page | Set `overflow: 'linebreak'` |
| Sub-bullets not indenting | Check `line.startsWith('\t')` |
| Bold+italic not working | Check `***` before `**` |
| Numbered lists have bullets | Exclude with `/^\d+\.\s/` regex |

---

## Testing Checklist

- [ ] All 8 chart types render
- [ ] Chart data labels visible
- [ ] Tables word wrap long content
- [ ] Bullets indent 8mm
- [ ] Sub-bullets indent 20mm
- [ ] ***Bold+italic*** works
- [ ] Emojis convert to text
- [ ] Numbered lists (no bullets)
- [ ] Empty lines add spacing
- [ ] Page breaks work correctly

---

## Quick Start

1. Install: `npm install jspdf jspdf-autotable html2canvas recharts`
2. Copy `pdfTextFormatter.js` from full guide
3. Import with correct syntax
4. Implement table rendering (Section 3.2 in full guide)
5. Implement chart rendering (Section 4.4 in full guide)
6. Implement main PDF function (Section 5.1 in full guide)
7. Test with comprehensive test data
