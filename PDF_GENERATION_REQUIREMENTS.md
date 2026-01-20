# PDF Generation Requirements

## Overview
This document specifies the technical requirements for generating PDF documents from chat responses with mixed content (text and charts).

---

## 1. PDF Creation Process

### 1.1 Library and Setup

**Primary Library**: jsPDF (v4.0.0)
```javascript
import jsPDF from 'jspdf';

const pdf = new jsPDF('p', 'mm', 'a4');
```

**Parameters:**
- `'p'`: Portrait orientation
- `'mm'`: Measurements in millimeters
- `'a4'`: A4 page size (210mm × 297mm)

### 1.2 PDF Initialization

```javascript
const pageWidth = pdf.internal.pageSize.getWidth();    // 210mm
const pageHeight = pdf.internal.pageSize.getHeight();  // 297mm
let yPosition = 15;                                     // Initial Y position (mm)
const lineHeight = 7;                                   // Space between lines (mm)
const margin = 15;                                      // Left and right margin (mm)
const maxWidth = pageWidth - 2 * margin;               // 180mm usable width
```

### 1.3 File Naming and Saving

```javascript
const timestamp = new Date().toISOString().slice(0, 10);  // YYYY-MM-DD
pdf.save(`chat-response-${timestamp}.pdf`);
```

**Example Output:** `chat-response-2026-01-20.pdf`

---

## 2. Text Content Formatting

### 2.1 Text Layout Structure

**Header Sections:**
1. Document Title: "Chat Response"
2. Question: "You asked: [user question]"
3. AI Response: "[AI answer]"

### 2.2 Font and Size Configuration

**Title Section**
```javascript
pdf.setFontSize(14);
pdf.setFont(undefined, 'bold');
pdf.setTextColor(0, 0, 0);  // Black
pdf.text('Chat Response', margin, yPosition);
yPosition += 10;
```

**Section Headings**
```javascript
pdf.setFontSize(11);
pdf.setFont(undefined, 'bold');
pdf.setTextColor(0, 0, 0);  // Black
```

**Body Text**
```javascript
pdf.setFontSize(10);
pdf.setFont(undefined, 'normal');
pdf.setTextColor(0, 0, 0);  // Black
```

**Timestamps and Metadata**
```javascript
pdf.setFontSize(9);
pdf.setFont(undefined, 'italic');
pdf.setTextColor(150, 150, 150);  // Light gray
```

### 2.3 Text Wrapping and Line Breaking

**Split Text to Fit Width**
```javascript
const textLines = pdf.splitTextToSize(textContent, maxWidth);
```

**Parameters:**
- `textContent`: String to wrap
- `maxWidth`: 180mm (available width after margins)

**Returns:** Array of text lines that fit within maxWidth

**Adding Wrapped Text to PDF**
```javascript
pdf.text(textLines, margin, yPosition);
yPosition += textLines.length * lineHeight + spacing;
```

### 2.4 Text Content Examples

**Question Section**
```javascript
pdf.setFontSize(11);
pdf.setFont(undefined, 'bold');
pdf.text('You asked:', margin, yPosition);
yPosition += 6;

pdf.setFont(undefined, 'normal');
pdf.setFontSize(10);
const questionLines = pdf.splitTextToSize(question, maxWidth);
pdf.text(questionLines, margin, yPosition);
yPosition += questionLines.length * lineHeight + 5;
```

**Answer Section**
```javascript
pdf.setFontSize(11);
pdf.setFont(undefined, 'bold');
pdf.text('AI Response:', margin, yPosition);
yPosition += 6;

pdf.setFont(undefined, 'normal');
pdf.setFontSize(10);
const answerLines = pdf.splitTextToSize(answer, maxWidth);
pdf.text(answerLines, margin, yPosition);
yPosition += answerLines.length * lineHeight + 10;
```

**Generic Text Section**
```javascript
if (section.heading) {
  pdf.setFontSize(11);
  pdf.setFont(undefined, 'bold');
  pdf.text(section.heading, margin, yPosition);
  yPosition += 8;
}

pdf.setFont(undefined, 'normal');
pdf.setFontSize(10);
const textLines = pdf.splitTextToSize(section.content, maxWidth);
pdf.text(textLines, margin, yPosition);
yPosition += textLines.length * lineHeight + 10;
```

### 2.5 Text Formatting Rules

| Element | Font Size | Weight | Color | Spacing |
|---------|-----------|--------|-------|---------|
| Document Title | 14pt | Bold | Black | 10mm after |
| Question/Answer Labels | 11pt | Bold | Black | 6mm after |
| Question/Answer Text | 10pt | Normal | Black | 5-10mm after |
| Section Headings | 11pt | Bold | Black | 8mm after |
| Body Text | 10pt | Normal | Black | 10mm after |
| Timestamp | 9pt | Italic | Gray (150) | 10mm from bottom |

---

## 3. Chart Processing and Insertion

### 3.1 Chart Capture Process

**Step 1: Wait for Chart Rendering**
```javascript
await new Promise(resolve => setTimeout(resolve, 500));
```
- Ensures Recharts has fully rendered in DOM
- 500ms buffer for animation completion

**Step 2: Capture Chart Element as Canvas**
```javascript
const chartCanvas = await html2canvas(chartRefElement, {
  scale: 2,                    // 2x resolution for high quality
  useCORS: true,               // Handle cross-origin resources
  allowTaint: true,            // Allow tainted canvas content
  backgroundColor: '#ffffff',  // White background
  logging: false               // Suppress console logs
});
```

**Parameters Explanation:**
- `scale: 2` - Renders at 2x resolution (300 DPI equivalent)
- `useCORS: true` - Allows images from different origins
- `allowTaint: true` - Permits mixed content
- `backgroundColor` - Sets canvas background color
- `logging: false` - Reduces console noise

### 3.2 Convert Canvas to Image

```javascript
const chartImgData = chartCanvas.toDataURL('image/png');
```

**Output:** Base64-encoded PNG image data

### 3.3 Calculate Image Dimensions

```javascript
const chartWidth = maxWidth;  // Use full available width (180mm)
const chartHeight = (chartCanvas.height * chartWidth) / chartCanvas.width;
```

**Calculation:**
- Maintains aspect ratio of original chart
- Formula: `newHeight = (originalHeight × newWidth) / originalWidth`

### 3.4 Page Break Handling

```javascript
if (yPosition + chartHeight > pageHeight - 15) {
  pdf.addPage();
  yPosition = 15;
}
```

**Logic:**
- Check if chart fits on current page
- If not enough space (15mm from bottom), create new page
- Reset yPosition to top of new page

### 3.5 Insert Chart into PDF

```javascript
pdf.addImage(chartImgData, 'PNG', margin, yPosition, chartWidth, chartHeight);
yPosition += chartHeight + 10;
```

**Parameters:**
- `chartImgData` - Base64 PNG image data
- `'PNG'` - Image format specification
- `margin` - X position (15mm from left)
- `yPosition` - Y position (current vertical position)
- `chartWidth` - Image width (180mm)
- `chartHeight` - Image height (calculated from aspect ratio)

### 3.6 Chart Section Processing

```javascript
if (section.type === 'chart' && sectionRefElement) {
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

  // Capture chart
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

  // Check fit and add
  if (yPosition + chartHeight > pageHeight - 15) {
    pdf.addPage();
    yPosition = 15;
  }

  pdf.addImage(chartImgData, 'PNG', margin, yPosition, chartWidth, chartHeight);
  yPosition += chartHeight + 10;
}
```

---

## 4. Complete PDF Generation Workflow

### 4.1 Full Process Flow

```
1. Initialize PDF (A4, portrait, 210×297mm)
   ↓
2. Add Document Title "Chat Response"
   ↓
3. Add Question Section
   - "You asked:" label (11pt bold)
   - Question text (10pt normal, wrapped)
   ↓
4. Add Answer Section
   - "AI Response:" label (11pt bold)
   - Answer text (10pt normal, wrapped)
   ↓
5. For Each Section in Sections Array:
   
   IF Section Type = 'TEXT':
   ├─ Check page space (30mm)
   ├─ Add section heading if present (11pt bold)
   ├─ Split text to maxWidth
   ├─ Add wrapped text to PDF
   └─ Update yPosition
   
   IF Section Type = 'CHART':
   ├─ Check page space (100mm)
   ├─ Add chart heading if present
   ├─ Wait for render (500ms)
   ├─ Capture chart as canvas
   ├─ Convert to PNG
   ├─ Calculate dimensions (maintain aspect ratio)
   ├─ Check if fits, add page if needed
   ├─ Insert image into PDF
   └─ Update yPosition
   
   ↓
6. Add Timestamp (9pt italic, gray, bottom of page)
   ↓
7. Save PDF with timestamp filename
   (chat-response-YYYY-MM-DD.pdf)
```

### 4.2 Page Dimensions and Spacing

```
A4 Page (210mm × 297mm)
┌─────────────────────────────────┐
│ Margin: 15mm                    │
│ ┌──────────────────────────────┐│
│ │ Usable Width: 180mm          ││
│ │                              ││
│ │ Content Area:                ││
│ │ - Text sections              ││
│ │ - Chart sections             ││
│ │ (Dynamic height)             ││
│ │                              ││
│ │ [Auto page break if needed]  ││
│ │                              ││
│ │ - Timestamp at bottom        ││
│ └──────────────────────────────┘│
│ Margin: 15mm                    │
└─────────────────────────────────┘
```

### 4.3 Spacing Between Elements

| Element Transition | Spacing |
|-------------------|---------|
| Title to Question | 10mm |
| Label to Content | 6mm |
| Text Lines | 7mm (lineHeight) |
| Content to Next | 5-10mm |
| Sections | 10mm |
| Content to Footer | 10mm from bottom |

---

## 5. Section Data Structure

### 5.1 Text Section Format

```javascript
{
  type: 'text',
  id: 'unique-identifier',
  heading: 'Section Title',        // Optional
  content: 'Text content here...'
}
```

**Properties:**
- `type` (required): Must be `'text'`
- `id` (required): Unique identifier for tracking
- `heading` (optional): Section title (11pt bold)
- `content` (required): Body text (10pt normal, auto-wrapped)

### 5.2 Chart Section Format

```javascript
{
  type: 'chart',
  id: 'unique-identifier',
  heading: 'Chart Title',           // Optional
  data: [
    { name: 'Category', value: 1000 },
    { name: 'Category', value: 2000 },
    ...
  ],
  chartType: 'bar'                 // 'bar' or 'line'
}
```

**Properties:**
- `type` (required): Must be `'chart'`
- `id` (required): Unique identifier for ref tracking
- `heading` (optional): Chart title (11pt bold)
- `data` (required): Array of data points
- `chartType` (required): `'bar'` or `'line'`

### 5.3 Data Point Format

```javascript
{
  name: 'Label',     // X-axis label or category name
  value: 1000,       // Y-axis value (primary)
  value2: 800        // Y-axis value (secondary, optional for bar charts)
}
```

---

## 6. Error Handling and Validation

### 6.1 Download State Management

```javascript
const [isDownloading, setIsDownloading] = useState(false);

const downloadMessagePDF = async () => {
  if (isDownloading) return;  // Prevent multiple downloads
  setIsDownloading(true);
  
  try {
    // PDF generation logic
  } catch (error) {
    console.error('Error generating PDF:', error);
    alert('Failed to generate PDF. Please try again.');
  } finally {
    setIsDownloading(false);
  }
};
```

### 6.2 Ref Validation

```javascript
const sectionRefElement = sectionRefs.current[section.id];
if (!sectionRefElement) continue;  // Skip if ref not available
```

### 6.3 Chart Canvas Validation

```javascript
const chartCanvas = await html2canvas(chartRefElement, {...});
if (!chartCanvas) {
  console.warn(`Failed to capture chart: ${section.id}`);
  continue;
}
```

---

## 7. Browser Integration

### 7.1 Chart Rendering (React/Recharts)

**Bar Chart Component:**
```javascript
<ResponsiveContainer width="100%" height={350}>
  <BarChart data={chartData}>
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis dataKey="name" />
    <YAxis />
    <Tooltip />
    <Legend />
    <Bar dataKey="value" fill="#8884d8" />
    {chartData[0]?.value2 && <Bar dataKey="value2" fill="#82ca9d" />}
  </BarChart>
</ResponsiveContainer>
```

**Line Chart Component:**
```javascript
<ResponsiveContainer width="100%" height={350}>
  <LineChart data={chartData}>
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis dataKey="name" />
    <YAxis />
    <Tooltip />
    <Legend />
    <Line type="monotone" dataKey="value" stroke="#8884d8" strokeWidth={2} />
  </LineChart>
</ResponsiveContainer>
```

### 7.2 Ref Assignment for PDF Capture

```javascript
<div 
  ref={(el) => {
    if (el) sectionRefs.current[section.id] = el;
  }}
  className="chart-section"
>
  {/* Chart component */}
</div>
```

---

## 8. Quality Specifications

### 8.1 Image Quality

- **Resolution**: 2x scale (high DPI)
- **Format**: PNG (lossless)
- **Background**: White (#ffffff)
- **Size Impact**: Chart images typically 50-100KB each

### 8.2 Text Quality

- **Font Support**: Standard fonts (Helvetica, Arial, Times)
- **Character Support**: ASCII + extended characters (emoji support varies)
- **Readability**: All text >= 9pt for accessibility

### 8.3 Layout Consistency

- **Margins**: 15mm on all sides
- **Line Height**: 7mm for text lines
- **Page Breaks**: Automatic before content exceeds 15mm from bottom
- **Aspect Ratio**: Maintained for all images

---

## 9. Performance Considerations

### 9.1 Rendering Delay

```javascript
await new Promise(resolve => setTimeout(resolve, 500));
```
- Necessary for Recharts SVG rendering
- Prevents incomplete chart capture

### 9.2 Memory Management

- Charts captured as PNG (not kept in memory)
- Base64 encoding for PDF embedding
- Refs cleaned up when component unmounts

### 9.3 Scalability

- Each page adds ~5-10KB
- Each chart adds ~50-100KB
- PDF size typically 100-300KB for typical responses

---

## 10. Supported Browsers

| Browser | Support | Notes |
|---------|---------|-------|
| Chrome | ✅ Full | Best performance |
| Firefox | ✅ Full | Slightly slower capture |
| Safari | ✅ Full | May have minor rendering differences |
| Edge | ✅ Full | Full support |
| Mobile | ✅ Limited | PDF download works, but better on desktop |

---

## 11. Example Complete Response Data

```javascript
{
  id: 'resp-1',
  type: 'response',
  question: 'Give me a comprehensive analysis?',
  answer: 'Here is our analysis...',
  sections: [
    {
      type: 'text',
      id: 'summary',
      heading: '📈 Executive Summary',
      content: 'Our analysis reveals...'
    },
    {
      type: 'chart',
      id: 'sales-chart',
      heading: '📊 Sales by Region',
      data: [
        { name: 'North', value: 5300 },
        { name: 'South', value: 4500 },
        { name: 'East', value: 3900 }
      ],
      chartType: 'bar'
    },
    {
      type: 'text',
      id: 'insights',
      heading: '💡 Key Insights',
      content: 'Based on the chart...'
    },
    {
      type: 'chart',
      id: 'trend-chart',
      heading: '📉 Revenue Trend',
      data: [
        { name: 'Jan', value: 45000 },
        { name: 'Feb', value: 52000 },
        { name: 'Mar', value: 48000 }
      ],
      chartType: 'line'
    }
  ]
}
```

**PDF Output:**
```
Chat Response

You asked:
Give me a comprehensive analysis?

AI Response:
Here is our analysis...

📈 Executive Summary
Our analysis reveals...

📊 Sales by Region
[Bar Chart Image - High Quality PNG]

💡 Key Insights
Based on the chart...

📉 Revenue Trend
[Line Chart Image - High Quality PNG]

Generated on January 20, 2026, 10:30:45 AM
```

---

## 12. Backward Compatibility

### 12.1 Legacy Props Support

The component supports three levels of configuration:

**Level 1: Single Chart (Legacy)**
```javascript
<ChatResponse
  chartData={[...]}
  chartType="bar"
/>
```

**Level 2: Multiple Charts**
```javascript
<ChatResponse
  charts={[
    { data: [...], type: 'bar' },
    { data: [...], type: 'line' }
  ]}
/>
```

**Level 3: Flexible Sections (Recommended)**
```javascript
<ChatResponse
  sections={[
    { type: 'text', ... },
    { type: 'chart', ... },
    { type: 'text', ... }
  ]}
/>
```

### 12.2 Auto-Conversion Logic

```javascript
const sectionsToRender = 
  sections.length > 0 
    ? sections 
    : (charts.length > 0 
      ? charts.map((chart, i) => ({ 
          type: 'chart', 
          id: `chart-${i}`, 
          heading: `Data Visualization ${i + 1}`,
          ...chart 
        }))
      : (chartData 
        ? [{ 
            type: 'chart', 
            id: 'chart-0', 
            heading: 'Data Visualization',
            data: chartData, 
            chartType 
          }]
        : []
      )
    );
```

---

## Summary

This specification defines a complete system for generating professional PDF documents from chat responses containing:

✅ **Text Content** - Auto-wrapped, properly formatted with headings and body text
✅ **Multiple Charts** - High-quality PNG images of Recharts components
✅ **Flexible Layout** - Mix text and charts in any order
✅ **Automatic Pagination** - Page breaks when needed
✅ **Professional Formatting** - Consistent spacing, fonts, and colors
✅ **High Quality Output** - 2x resolution charts, readable fonts
✅ **Backward Compatible** - Supports legacy props
✅ **Error Handling** - Graceful failure and user feedback
