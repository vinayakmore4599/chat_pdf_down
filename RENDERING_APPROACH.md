# Text and Chart Rendering Approach

## Overview
This document outlines the technical approach used for rendering text content and charts both in the browser UI and converting them to PDF format.

---

## Architecture

### Two-Tier Rendering System
The application uses a two-tier rendering system:
1. **Browser Rendering**: Interactive display using React components
2. **PDF Generation**: Static document creation using jsPDF and html2canvas

---

## Text Rendering

### Browser Text Rendering

**Technology Stack:**
- React for component structure
- CSS for styling
- Flexbox for layout

**Implementation:**
```javascript
{section.type === 'text' && (
  <div className="text-section">
    {section.heading && <h3 className="section-heading">{section.heading}</h3>}
    <p className="section-text">{section.content}</p>
  </div>
)}
```

**Features:**
- Semantic HTML elements (`<h3>` for headings, `<p>` for content)
- CSS classes for consistent styling
- Responsive container with max-width constraints
- Automatic text wrapping
- Support for emoji and special characters

### PDF Text Rendering

**Technology Stack:**
- jsPDF for PDF generation
- splitTextToSize() for text wrapping
- Dynamic font sizing and positioning

**Process:**

1. **Text Splitting**
   ```javascript
   const textLines = pdf.splitTextToSize(section.content, maxWidth);
   ```
   - Wraps text to fit within page width (minus margins)
   - Returns array of text lines

2. **Font Configuration**
   ```javascript
   pdf.setFontSize(11);
   pdf.setFont(undefined, 'bold');      // For headings
   pdf.setFont(undefined, 'normal');    // For body text
   pdf.setFont(undefined, 'italic');    // For timestamps
   ```

3. **Position Tracking**
   ```javascript
   yPosition += section.content.length * lineHeight + spacing;
   ```
   - Tracks vertical position on page
   - Adjusts for number of lines
   - Adds spacing between sections

4. **Page Breaks**
   ```javascript
   if (yPosition > pageHeight - 30) {
     pdf.addPage();
     yPosition = 15;  // Reset to top of new page
   }
   ```
   - Automatically creates new page when content exceeds space
   - Prevents text overflow

---

## Chart Rendering

### Browser Chart Rendering

**Technology Stack:**
- Recharts library for interactive charts
- ResponsiveContainer for dynamic sizing
- SVG-based rendering

**Chart Types Supported:**

**Bar Chart**
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

**Line Chart**
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

**Features:**
- Dynamic sizing with ResponsiveContainer
- Interactive tooltips on hover
- Color-coded bars/lines
- Support for multiple data series (value2)
- Automatic legends

### PDF Chart Rendering

**Technology Stack:**
- html2canvas for DOM-to-image conversion
- jsPDF for embedding images
- PNG format for compatibility

**Three-Step Process:**

**Step 1: Capture Chart as Image**
```javascript
const chartCanvas = await html2canvas(sectionRefElement, {
  scale: 2,              // High quality (2x)
  useCORS: true,         // Handle cross-origin images
  allowTaint: true,      // Allow tainted canvas
  backgroundColor: '#ffffff',  // White background
  logging: false         // Disable logging
});
```

**Step 2: Convert to Data URL**
```javascript
const chartImgData = chartCanvas.toDataURL('image/png');
```
- Converts canvas to PNG image data
- Maintains chart styling and colors
- Ready for PDF embedding

**Step 3: Calculate and Insert into PDF**
```javascript
const chartWidth = maxWidth;  // Full available width
const chartHeight = (chartCanvas.height * chartWidth) / chartCanvas.width;  // Maintain aspect ratio

pdf.addImage(chartImgData, 'PNG', margin, yPosition, chartWidth, chartHeight);
yPosition += chartHeight + 10;
```

**Key Optimizations:**
- `scale: 2` ensures high-quality images
- Aspect ratio maintained during resizing
- Auto page break handling

---

## Sections System

### Data Structure

**Text Section**
```javascript
{
  type: 'text',
  id: 'unique-id',           // Unique identifier for ref tracking
  heading: 'Section Title',  // Optional heading
  content: 'Text content...' // Main text content
}
```

**Chart Section**
```javascript
{
  type: 'chart',
  id: 'unique-id',                    // Unique identifier for ref tracking
  heading: 'Chart Title',             // Optional heading
  data: [                             // Chart data
    { name: 'Category', value: 1000 },
    ...
  ],
  chartType: 'bar'                   // 'bar' or 'line'
}
```

### Rendering Flow

```
User defines sections array
        ↓
Browser renders each section
  ├─ Text sections → <div> with heading + content
  └─ Chart sections → Recharts component with ref
        ↓
User clicks "Download as PDF"
        ↓
For each section:
  ├─ Text section → pdf.text() with wrapping
  └─ Chart section → html2canvas → PNG → pdf.addImage()
        ↓
PDF document generated with all sections
```

---

## Component Props

### ChatResponse Component

```javascript
<ChatResponse
  responseId="resp-1"           // Unique response identifier
  question="Your question..."   // User's question
  answer="AI response..."       // AI's answer
  
  // Legacy support (single/multiple charts)
  chartData={[...]}             // Single chart data
  chartType="bar"               // Chart type
  charts={[...]}                // Multiple charts
  
  // New system (flexible sections)
  sections={[                   // Recommended approach
    { type: 'text', ... },
    { type: 'chart', ... },
    ...
  ]}
/>
```

### Backward Compatibility

The system supports three approaches:
1. **Legacy Single Chart**: Uses `chartData` + `chartType`
2. **Legacy Multiple Charts**: Uses `charts` array
3. **New Sections**: Uses `sections` array (recommended)

Auto-conversion:
```javascript
const sectionsToRender = 
  sections.length > 0 
    ? sections 
    : (charts.length > 0 
      ? charts.map((chart, i) => ({ type: 'chart', id: `chart-${i}`, ... }))
      : (chartData 
        ? [{ type: 'chart', id: 'chart-0', ... }]
        : [])
    );
```

---

## PDF Generation Workflow

### Step 1: Initialize PDF
```javascript
const pdf = new jsPDF('p', 'mm', 'a4');
const pageWidth = pdf.internal.pageSize.getWidth();    // 210mm
const pageHeight = pdf.internal.pageSize.getHeight();  // 297mm
const margin = 15;
const maxWidth = pageWidth - 2 * margin;               // 180mm
let yPosition = 15;
```

### Step 2: Add Header Content
```javascript
// Question
pdf.text('You asked:', margin, yPosition);
yPosition += lineHeight;
const questionLines = pdf.splitTextToSize(question, maxWidth);
pdf.text(questionLines, margin, yPosition);
yPosition += questionLines.length * lineHeight + 10;

// Answer
pdf.text('AI Response:', margin, yPosition);
yPosition += lineHeight;
const answerLines = pdf.splitTextToSize(answer, maxWidth);
pdf.text(answerLines, margin, yPosition);
yPosition += answerLines.length * lineHeight + 10;
```

### Step 3: Process Sections
```javascript
for (let i = 0; i < sectionsToRender.length; i++) {
  const section = sectionsToRender[i];
  
  if (section.type === 'text') {
    // Add text to PDF
  } else if (section.type === 'chart') {
    // Capture chart image and add to PDF
  }
  
  // Page break handling
  if (yPosition + contentHeight > pageHeight - 15) {
    pdf.addPage();
    yPosition = 15;
  }
}
```

### Step 4: Add Metadata and Save
```javascript
pdf.setFontSize(9);
pdf.setFont(undefined, 'italic');
pdf.setTextColor(150);
pdf.text(`Generated on ${new Date().toLocaleString()}`, margin, pageHeight - 10);

const timestamp = new Date().toISOString().slice(0, 10);
pdf.save(`chat-response-${timestamp}.pdf`);
```

---

## Reference Tracking System

### Browser References
```javascript
const sectionRefs = useRef({});  // Object: { 'section-id': DOM element }
```

### Ref Assignment
```javascript
ref={(el) => {
  if (el) sectionRefs.current[section.id] = el;
}}
```

### PDF Capture
```javascript
const sectionRefElement = sectionRefs.current[section.id];
const chartCanvas = await html2canvas(sectionRefElement, {...});
```

---

## Key Technical Decisions

### 1. Two-Phase Rendering
- **Why**: Recharts renders SVG, which jsPDF cannot directly embed
- **Solution**: Convert SVG to raster image (PNG) via html2canvas

### 2. Dynamic Reference Tracking
- **Why**: Multiple charts need independent refs
- **Solution**: Object-based ref storage keyed by section ID

### 3. Aspect Ratio Preservation
- **Why**: Charts should maintain visual proportions in PDF
- **Solution**: Calculate chart height based on canvas dimensions

### 4. Page Break Logic
- **Why**: Prevent content overflow on single page
- **Solution**: Check position before adding each element

### 5. Flexible Sections System
- **Why**: Support any combination of text and charts
- **Solution**: Array of typed sections with rendering logic

---

## Styling Considerations

### Browser CSS Classes
- `.text-section`: Container for text content
- `.section-heading`: Section title styling
- `.section-text`: Paragraph text styling
- `.chart-section`: Chart container
- `.chart-title`: Chart heading

### PDF Font Configuration
- **Title**: 14pt, Bold
- **Section Heading**: 11pt, Bold
- **Body Text**: 10pt, Normal
- **Timestamp**: 9pt, Italic, Gray (150)

### Colors
- **Text**: Black (0, 0, 0)
- **Timestamp**: Gray (150)
- **Bars**: #8884d8 (primary), #82ca9d (secondary)
- **Lines**: #8884d8

---

## Performance Optimizations

### 1. Canvas Rendering Delay
```javascript
await new Promise(resolve => setTimeout(resolve, 500));
```
- Allows Recharts to fully render before capture

### 2. Scale Factor
```javascript
scale: 2  // High DPI rendering
```
- Produces crisp charts in PDF without file size explosion

### 3. Lazy Ref Assignment
```javascript
if (el) sectionRefs.current[section.id] = el;
```
- Only stores non-null refs to avoid memory leaks

---

## Limitations and Considerations

### Browser Rendering
- Charts are interactive (tooltips, legends)
- Text is responsive
- Unlimited content can be scrolled

### PDF Rendering
- Charts become static images (no interactivity)
- Limited to A4 page dimensions
- Text must fit within margins
- Long charts may reduce readability if resized too small

### Font Limitations
- jsPDF supports standard fonts only (Arial, Helvetica, Times)
- Emoji characters may not render correctly in PDF
- Custom fonts require additional configuration

---

## Usage Examples

### Simple Single Chart (Legacy)
```javascript
<ChatResponse
  question="Show sales data"
  answer="Here is the sales data..."
  chartData={[...]}
  chartType="bar"
/>
```

### Multiple Sections (Recommended)
```javascript
<ChatResponse
  question="Complete analysis?"
  answer="Here is comprehensive analysis..."
  sections={[
    { type: 'text', id: 'intro', heading: 'Summary', content: '...' },
    { type: 'chart', id: 'sales', heading: 'Sales', data: [...], chartType: 'bar' },
    { type: 'text', id: 'insights', heading: 'Key Insights', content: '...' },
    { type: 'chart', id: 'trend', heading: 'Trend', data: [...], chartType: 'line' }
  ]}
/>
```

---

## Browser Compatibility

- **Chrome/Edge**: Full support (html2canvas + jsPDF)
- **Firefox**: Full support
- **Safari**: Full support (may have minor rendering differences)
- **Mobile browsers**: Supported but PDF download works best on desktop

---

## Future Enhancements

1. **Custom Fonts**: Add support for @font-face in PDFs
2. **Table Support**: Add table-type sections
3. **Image Sections**: Embed images directly
4. **Watermarks**: Add document watermarks
5. **Multi-column Layout**: Support for columnar text
6. **Custom Styling**: Per-section font and color customization
7. **Template System**: Predefined PDF templates
8. **Batch Download**: Generate multiple PDFs at once
