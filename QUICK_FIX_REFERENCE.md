# Quick Fix Reference - PDF Issues

## 🔴 Problem: Charts Missing After Multiple Chats

**Symptom:** First download works, but after adding more chats, earlier PDFs lose charts.

**Quick Fix:**
```javascript
// In ChatResponse component
const sectionsToRender = useMemo(() => {
  return baseSections.map(section => ({
    ...section,
    id: `${responseId}-${section.id}` // ← Add this line
  }));
}, [baseSections, responseId]);
```

**Why:** Section IDs were duplicated across chats, causing refs to overwrite each other.

---

## 🔴 Problem: Elements Jumbled in PDF

**Symptom:** Text, charts, tables appear in wrong order.

**Quick Fix:**
```javascript
// Use for...of loop (NOT forEach)
for (const section of sections) {
  await processSection(section); // ← Must await
}
```

**Why:** Async operations need sequential processing.

---

## 🔴 Problem: No Bold/Italic/Bullets in PDF

**Symptom:** All text appears plain.

**Quick Fix:**
```javascript
// Mark sections that need formatting
{
  type: 'text',
  isFormatted: true, // ← Add this flag
  content: '**Bold** and *italic* text\n• Bullet point'
}

// In PDF generation
if (section.isFormatted) {
  const segments = parseFormattedText(section.content);
  yPosition = addFormattedText(pdf, segments, ...);
}
```

**Why:** Basic `pdf.text()` doesn't parse markdown formatting.

---

## 🔴 Problem: Table Columns Overlap

**Symptom:** Table text doesn't wrap, columns too wide.

**Quick Fix:**
```javascript
autoTable(pdf, {
  // ...
  bodyStyles: {
    overflow: 'linebreak', // ← Add this
  },
  columnStyles: {
    0: { cellWidth: 'auto', overflow: 'linebreak' } // ← Add this
  }
});
```

**Why:** Need explicit word wrapping configuration.

---

## 🔴 Problem: Elements Overlap Each Other

**Symptom:** Chart appears on top of text.

**Quick Fix:**
```javascript
let yPosition = 15; // Track position

// After each element
yPosition += elementHeight; // ← Update position

// For tables
yPosition = pdf.lastAutoTable.finalY + 10; // ← Get from table
```

**Why:** Must track and update Y position after every element.

---

## 🔴 Problem: Garbage HTML/UI Elements in PDF

**Symptom:** Seeing button text, wrapper divs, or extra UI elements in PDF.

**Quick Fix:**
```javascript
// ❌ WRONG - Ref captures wrapper with UI
<div ref={el => sectionRefs.current[id] = el}>
  <h3>{heading}</h3>
  <button>Click</button>  {/* Gets captured! */}
  {renderChart()}
</div>

// ✅ CORRECT - Ref only on content
<div>
  <h3>{heading}</h3>  {/* Outside ref */}
  <div ref={el => sectionRefs.current[id] = el}>
    {renderChart()}  {/* Only this captured */}
  </div>
  <button>Click</button>  {/* Outside ref */}
</div>
```

**Why:** html2canvas captures everything inside the ref'd element, including UI.

---

## 📚 Full Documentation

- **Complete Guide**: See [PDF_COMPLETE_GUIDE.md](PDF_COMPLETE_GUIDE.md) - All troubleshooting, fixes, and best practices
- **Multiple Chats**: See [PDF_MULTIPLE_CHATS_FIX_GUIDE.md](PDF_MULTIPLE_CHATS_FIX_GUIDE.md) - Specific multi-chat fix
- **Implementation**: See [PDF_GENERATION_GUIDE.md](PDF_GENERATION_GUIDE.md) - Complete implementation guide

---

## ✅ Applied Fixes in This Project

- [x] Multiple chat PDF downloads (unique section IDs)
- [x] PDF filenames include responseId
- [x] Each chat maintains independent refs
- [x] Sequential async processing in place
- [x] Text formatting utility available
- [x] Table word wrapping configured
- [x] YPosition tracking implemented

**Status:** All major issues fixed! ✨
