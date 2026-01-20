import React, { useRef, useState } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import '../styles/ChatResponse.css';

const ChatResponse = ({ responseId, question, answer, chartData, chartType = 'bar', charts = [], sections = [] }) => {
  const messageRef = useRef(null);
  const sectionRefs = useRef({});
  const [isDownloading, setIsDownloading] = useState(false);

  // Determine what to render: sections (new) > charts (legacy multiple) > chartData (legacy single)
  const sectionsToRender = sections.length > 0 ? sections : (charts.length > 0 ? charts.map((chart, i) => ({ type: 'chart', id: `chart-${i}`, heading: `Data Visualization ${i + 1}`, ...chart })) : (chartData ? [{ type: 'chart', id: 'chart-0', heading: 'Data Visualization', data: chartData, chartType }] : []));

  const downloadMessagePDF = async () => {
    if (isDownloading) return;
    setIsDownloading(true);

    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      let yPosition = 15;
      const lineHeight = 7;
      const margin = 15;
      const maxWidth = pageWidth - 2 * margin;

      // Set font for title
      pdf.setFontSize(14);
      pdf.setFont(undefined, 'bold');
      pdf.text('Chat Response', margin, yPosition);
      yPosition += 10;

      // Add question
      pdf.setFontSize(11);
      pdf.setFont(undefined, 'bold');
      pdf.text('You asked:', margin, yPosition);
      yPosition += 6;
      pdf.setFont(undefined, 'normal');
      pdf.setFontSize(10);
      const questionLines = pdf.splitTextToSize(question, maxWidth);
      pdf.text(questionLines, margin, yPosition);
      yPosition += questionLines.length * lineHeight + 5;

      // Add answer
      pdf.setFontSize(11);
      pdf.setFont(undefined, 'bold');
      pdf.text('AI Response:', margin, yPosition);
      yPosition += 6;
      pdf.setFont(undefined, 'normal');
      pdf.setFontSize(10);
      const answerLines = pdf.splitTextToSize(answer, maxWidth);
      pdf.text(answerLines, margin, yPosition);
      yPosition += answerLines.length * lineHeight + 10;

      // Add sections if available
      if (sectionsToRender.length > 0) {
        // Wait for all content to render properly
        await new Promise(resolve => setTimeout(resolve, 500));

        for (let i = 0; i < sectionsToRender.length; i++) {
          const section = sectionsToRender[i];
          const sectionRefElement = sectionRefs.current[section.id];

          if (section.type === 'text') {
            // Handle text section
            if (yPosition > pageHeight - 30) {
              pdf.addPage();
              yPosition = 15;
            }

            // Add heading if provided
            if (section.heading) {
              pdf.setFontSize(11);
              pdf.setFont(undefined, 'bold');
              pdf.setTextColor(0);
              pdf.text(section.heading, margin, yPosition);
              yPosition += 8;
            }

            // Add text content
            pdf.setFont(undefined, 'normal');
            pdf.setFontSize(10);
            const textLines = pdf.splitTextToSize(section.content, maxWidth);
            pdf.text(textLines, margin, yPosition);
            yPosition += textLines.length * lineHeight + 10;
          } else if (section.type === 'chart' && sectionRefElement) {
            // Handle chart section
            if (yPosition > pageHeight - 100) {
              pdf.addPage();
              yPosition = 15;
            }

            // Add chart heading
            if (section.heading) {
              pdf.setFontSize(11);
              pdf.setFont(undefined, 'bold');
              pdf.setTextColor(0);
              pdf.text(section.heading, margin, yPosition);
              yPosition += 10;
            }

            // Capture chart as image
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

            // Check if chart fits on current page
            if (yPosition + chartHeight > pageHeight - 15) {
              pdf.addPage();
              yPosition = 15;
            }

            pdf.addImage(chartImgData, 'PNG', margin, yPosition, chartWidth, chartHeight);
            yPosition += chartHeight + 10;
          }
        }
      }

      // Add timestamp
      pdf.setFontSize(9);
      pdf.setFont(undefined, 'italic');
      pdf.setTextColor(150);
      pdf.text(`Generated on ${new Date().toLocaleString()}`, margin, pageHeight - 10);

      const timestamp = new Date().toISOString().slice(0, 10);
      pdf.save(`chat-response-${timestamp}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  const renderChart = (chartData, chartType) => {
    if (!chartData || chartData.length === 0) {
      return null;
    }

    if (chartType === 'line') {
      return (
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="value" stroke="#8884d8" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      );
    }

    return (
      <ResponsiveContainer width="100%" height={350}>
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="value" fill="#8884d8" />
          {chartData[0]?.value2 && <Bar dataKey="value2" fill="#82ca9d" />}
        </BarChart>
      </ResponsiveContainer>
    );
  };

  return (
    <div className="chat-response-container">
      {/* Content to be captured in PDF */}
      <div ref={messageRef} className="chat-response-content">
        
        {/* Question Section */}
        <div className="chat-question-section">
          <div className="question-label">📝 You asked:</div>
          <p className="question-text">{question}</p>
        </div>

        {/* Answer Section */}
        <div className="chat-answer-section">
          <div className="answer-label">🤖 AI Response:</div>
          <p className="answer-text">{answer}</p>
        </div>

        {/* Sections */}
        {sectionsToRender.length > 0 && (
          <div className="sections-container">
            {sectionsToRender.map((section) => (
              <div key={section.id} className={`section section-${section.type}`}>
                {section.type === 'text' && (
                  <div className="text-section">
                    {section.heading && <h3 className="section-heading">{section.heading}</h3>}
                    <p className="section-text">{section.content}</p>
                  </div>
                )}

                {section.type === 'chart' && (
                  <div 
                    className="chart-section" 
                    ref={(el) => {
                      if (el) sectionRefs.current[section.id] = el;
                    }}
                  >
                    {section.heading && <div className="chart-title">{section.heading}</div>}
                    {renderChart(section.data, section.chartType || section.type === 'chart' ? 'bar' : undefined)}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Metadata */}
        <div className="message-metadata">
          <span className="timestamp">
            Generated on {new Date().toLocaleString()}
          </span>
        </div>

      </div>

      {/* Download button OUTSIDE the captured area */}
      <button 
        className={`download-message-btn ${isDownloading ? 'downloading' : ''}`}
        onClick={downloadMessagePDF}
        disabled={isDownloading}
      >
        {isDownloading ? '⏳ Generating PDF...' : '📥 Download as PDF'}
      </button>
    </div>
  );
};

export default ChatResponse;
