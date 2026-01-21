import React, { useRef, useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ScatterChart,
  Scatter,
  ZAxis,
  RadialBarChart,
  RadialBar,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { parseFormattedText, addFormattedText, replaceEmojisForPDF } from '../utils/pdfTextFormatter';
import '../styles/ChatResponse.css';

const ChatResponse = ({ responseId, question, answer, chartData, chartType = 'bar', charts = [], sections = [] }) => {
  const messageRef = useRef(null);
  const sectionRefs = useRef({});
  const [isDownloading, setIsDownloading] = useState(false);

  // Create base sections from various input formats
  const baseSections = useMemo(() => {
    if (sections.length > 0) {
      return sections;
    } else if (charts.length > 0) {
      return charts.map((chart, i) => ({
        type: 'chart',
        id: `chart-${i}`,
        heading: `Data Visualization ${i + 1}`,
        ...chart
      }));
    } else if (chartData) {
      return [{
        type: 'chart',
        id: 'chart-0',
        heading: 'Data Visualization',
        data: chartData,
        chartType
      }];
    }
    return [];
  }, [sections, charts, chartData, chartType]);

  // CRITICAL FIX: Make section IDs unique by prefixing with responseId
  // This prevents refs from being overwritten when multiple ChatResponse components exist
  const sectionsToRender = useMemo(() => {
    return baseSections.map(section => ({
      ...section,
      id: `${responseId}-${section.id}` // Ensures global uniqueness across all chat responses
    }));
  }, [baseSections, responseId]);

  // Convert formatted text to HTML for display
  const formatTextToHTML = (text) => {
    if (!text) return '';
    
    let html = text;
    
    // Convert ***bold+italic*** to <strong><em> (must be before ** and *)
    html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
    
    // Convert **bold** to <strong>
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    
    // Convert *italic* to <em> (but not ** which is already processed)
    html = html.replace(/(?<!\*)\*(?!\*)(.+?)\*(?!\*)/g, '<em>$1</em>');
    
    // Convert bullet points to list items
    const lines = html.split('\n');
    let inList = false;
    const processedLines = [];
    
    lines.forEach(line => {
      const trimmed = line.trim();
      // Check if it's a numbered list
      const isNumberedList = /^\d+\.\s/.test(trimmed);
      
      // Only treat as bullet if it has bullet markers and is NOT a numbered list
      const isBullet = !isNumberedList && (trimmed.startsWith('•') || trimmed.startsWith('-') || (trimmed.startsWith('*') && !trimmed.startsWith('**')));
      
      if (isBullet) {
        if (!inList) {
          processedLines.push('<ul>');
          inList = true;
        }
        const content = trimmed.replace(/^[•\-*]\s*/, '');
        // Check for tab indent (sub-bullet)
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
      pdf.setFontSize(16);
      pdf.setFont(undefined, 'bold');
      pdf.setTextColor(51, 51, 51);
      pdf.text('Chat Response', margin, yPosition);
      yPosition += 12;

      // Add question
      pdf.setFontSize(11);
      pdf.setFont(undefined, 'bold');
      pdf.setTextColor(51, 51, 51);
      pdf.text('Question:', margin, yPosition);
      yPosition += 7;
      
      pdf.setFont(undefined, 'normal');
      pdf.setFontSize(10);
      pdf.setTextColor(85, 85, 85);
      const questionLines = pdf.splitTextToSize(question, maxWidth);
      pdf.text(questionLines, margin, yPosition);
      yPosition += questionLines.length * 6 + 10;

      // Add answer
      pdf.setFontSize(11);
      pdf.setFont(undefined, 'bold');
      pdf.setTextColor(51, 51, 51);
      pdf.text('Answer:', margin, yPosition);
      yPosition += 7;
      
      pdf.setFont(undefined, 'normal');
      pdf.setFontSize(10);
      pdf.setTextColor(85, 85, 85);
      const answerLines = pdf.splitTextToSize(answer, maxWidth);
      pdf.text(answerLines, margin, yPosition);
      yPosition += answerLines.length * 6.5 + 12;

      // Add sections if available
      if (sectionsToRender.length > 0) {
        // Wait for all content to render properly (especially charts with labels)
        await new Promise(resolve => setTimeout(resolve, 1500));

        for (let i = 0; i < sectionsToRender.length; i++) {
          const section = sectionsToRender[i];
          const sectionRefElement = sectionRefs.current[section.id];
          
          console.log('Processing section:', {
            type: section.type,
            id: section.id,
            hasRef: !!sectionRefElement,
            elementType: sectionRefElement?.tagName,
            elementClass: sectionRefElement?.className,
            elementText: sectionRefElement?.textContent?.substring(0, 50)
          });

          if (section.type === 'text' && sectionRefElement) {
            // Handle text section - check if it has rich formatting
            if (section.isFormatted) {
              // Render as formatted text with styling
              if (yPosition > pageHeight - 30) {
                pdf.addPage();
                yPosition = 15;
              }

              // Add heading if provided
              if (section.heading) {
                pdf.setFontSize(11);
                pdf.setFont(undefined, 'bold');
                pdf.setTextColor(51, 51, 51);
                pdf.text(replaceEmojisForPDF(section.heading), margin, yPosition);
                yPosition += 3;
                
                // Add underline
                pdf.setDrawColor(224, 224, 224);
                pdf.setLineWidth(0.3);
                pdf.line(margin, yPosition, pageWidth - margin, yPosition);
                yPosition += 8;
              }

              // Parse and render formatted text
              const segments = parseFormattedText(section.content);
              yPosition = addFormattedText(
                pdf,
                segments,
                margin,
                yPosition,
                maxWidth,
                {
                  lineHeight: 6.5,
                  fontSize: 10,
                  color: [85, 85, 85],
                  pageHeight,
                }
              );
              yPosition += 8;
            } else {
              // Render as image to preserve complex styling
              if (yPosition > pageHeight - 50) {
                pdf.addPage();
                yPosition = 15;
              }

              // Capture text section as image
              const textCanvas = await html2canvas(sectionRefElement, {
                scale: 2,
                useCORS: true,
                allowTaint: true,
                backgroundColor: '#ffffff',
                logging: false,
              });

              const textImgData = textCanvas.toDataURL('image/png');
              const textWidth = maxWidth;
              const textHeight = (textCanvas.height * textWidth) / textCanvas.width;

              // Check if content fits on current page
              if (yPosition + textHeight > pageHeight - 15) {
                pdf.addPage();
                yPosition = 15;
              }

              pdf.addImage(textImgData, 'PNG', margin, yPosition, textWidth, textHeight);
              yPosition += textHeight + 10;
            }
          } else if (section.type === 'text') {
            // Text section without ref - render as formatted text
            if (yPosition > pageHeight - 30) {
              pdf.addPage();
              yPosition = 15;
            }

            // Add heading if provided
            if (section.heading) {
              pdf.setFontSize(11);
              pdf.setFont(undefined, 'bold');
              pdf.setTextColor(51, 51, 51);
              pdf.text(replaceEmojisForPDF(section.heading), margin, yPosition);
              yPosition += 3;
              
              // Add underline
              pdf.setDrawColor(224, 224, 224);
              pdf.setLineWidth(0.3);
              pdf.line(margin, yPosition, pageWidth - margin, yPosition);
              yPosition += 8;
            }

            // Parse and render formatted text
            const segments = parseFormattedText(section.content);
            yPosition = addFormattedText(
              pdf,
              segments,
              margin,
              yPosition,
              maxWidth,
              {
                lineHeight: 6.5,
                fontSize: 10,
                color: [85, 85, 85],
                pageHeight,
              }
            );
            yPosition += 8;
          } else if (section.type === 'table') {
            // Handle table section - render as native PDF table
            if (yPosition > pageHeight - 100) {
              pdf.addPage();
              yPosition = 15;
            }

            // Add table heading if provided
            if (section.heading) {
              pdf.setFontSize(11);
              pdf.setFont(undefined, 'bold');
              pdf.setTextColor(51, 51, 51);
              pdf.text(replaceEmojisForPDF(section.heading), margin, yPosition);
              yPosition += 3;
              
              // Add underline with brand color
              pdf.setDrawColor(102, 126, 234);
              pdf.setLineWidth(0.5);
              pdf.line(margin, yPosition, pageWidth - margin, yPosition);
              yPosition += 8;
            }

            // Render table using autoTable
            if (section.rows && section.columns) {
              try {
                // Calculate available width for the table
                const availableWidth = pageWidth - (2 * margin);
                
                // Build columnStyles for all columns with auto width + word wrap
                const columnStyles = {};
                section.columns.forEach((col, index) => {
                  columnStyles[index] = {
                    cellWidth: 'auto',  // Auto-size based on content
                    overflow: 'linebreak',  // Wrap if content is too long
                    cellPadding: 2.5
                  };
                });
                
                // Call autoTable as a function (v5.x API) with styling
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
                    overflow: 'linebreak',
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
                    overflow: 'linebreak',  // Key: wrap long content
                    minCellHeight: 8,
                    halign: 'left',
                    fontSize: 7.5
                  },
                  tableWidth: 'auto',  // Auto-size table to fit content
                  horizontalPageBreak: false,
                  horizontalPageBreakRepeat: null,
                  columnStyles: columnStyles
                });
                
                // Get the final Y position after table
                if (pdf.lastAutoTable && pdf.lastAutoTable.finalY) {
                  yPosition = pdf.lastAutoTable.finalY + 12;
                } else {
                  yPosition += 100; // Fallback
                }
              } catch (tableError) {
                console.error('Error rendering table:', tableError);
                yPosition += 50;
              }
            }
          } else if (section.type === 'chart' && sectionRefElement) {
            // Handle chart section - capture as image
            if (yPosition > pageHeight - 100) {
              pdf.addPage();
              yPosition = 15;
            }

            // Add chart heading if provided
            if (section.heading) {
              pdf.setFontSize(11);
              pdf.setFont(undefined, 'bold');
              pdf.setTextColor(51, 51, 51);
              pdf.text(replaceEmojisForPDF(section.heading), margin, yPosition);
              yPosition += 3;
              
              // Add underline
              pdf.setDrawColor(224, 224, 224);
              pdf.setLineWidth(0.3);
              pdf.line(margin, yPosition, pageWidth - margin, yPosition);
              yPosition += 8;
            }

            // Capture chart as image
            try {
              // Extra wait for chart labels to render
              await new Promise(resolve => setTimeout(resolve, 300));
              
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
            } catch (chartError) {
              console.error('Error rendering chart:', chartError);
              yPosition += 50;
            }
          }
        }
      }

      // Add timestamp
      pdf.setFontSize(9);
      pdf.setFont(undefined, 'italic');
      pdf.setTextColor(150);
      pdf.text(`Generated on ${new Date().toLocaleString()}`, margin, pageHeight - 10);

      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      pdf.save(`chat-${responseId}-${timestamp}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      alert(`Failed to generate PDF: ${error.message}`);
    } finally {
      setIsDownloading(false);
    }
  };

  const renderChart = (chartData, chartType) => {
    if (!chartData || chartData.length === 0) {
      return null;
    }

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#8DD1E1'];

    // Line Chart
    if (chartType === 'line') {
      return (
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="value" stroke="#8884d8" strokeWidth={2} label={{ position: 'top', fill: '#8884d8' }} />
            {chartData[0]?.value2 && <Line type="monotone" dataKey="value2" stroke="#82ca9d" strokeWidth={2} label={{ position: 'top', fill: '#82ca9d' }} />}
          </LineChart>
        </ResponsiveContainer>
      );
    }

    // Pie Chart
    if (chartType === 'pie') {
      return (
        <ResponsiveContainer width="100%" height={350}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={true}
              label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(1)}%)`}
              outerRadius={100}
              fill="#8884d8"
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
    }

    // Area Chart
    if (chartType === 'area') {
      return (
        <ResponsiveContainer width="100%" height={350}>
          <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Area type="monotone" dataKey="value" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} label={{ position: 'top', fill: '#8884d8' }} />
            {chartData[0]?.value2 && <Area type="monotone" dataKey="value2" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.6} label={{ position: 'top', fill: '#82ca9d' }} />}
          </AreaChart>
        </ResponsiveContainer>
      );
    }

    // Radar Chart
    if (chartType === 'radar') {
      return (
        <ResponsiveContainer width="100%" height={350}>
          <RadarChart data={chartData}>
            <PolarGrid />
            <PolarAngleAxis dataKey="name" />
            <PolarRadiusAxis />
            <Radar name="Value" dataKey="value" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
            {chartData[0]?.value2 && <Radar name="Value 2" dataKey="value2" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.6} />}
            <Tooltip />
            <Legend />
          </RadarChart>
        </ResponsiveContainer>
      );
    }

    // Scatter Chart
    if (chartType === 'scatter') {
      return (
        <ResponsiveContainer width="100%" height={350}>
          <ScatterChart margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" type="category" />
            <YAxis dataKey="value" />
            <ZAxis range={[100, 1000]} />
            <Tooltip cursor={{ strokeDasharray: '3 3' }} />
            <Legend />
            <Scatter name="Data" data={chartData} fill="#8884d8" />
          </ScatterChart>
        </ResponsiveContainer>
      );
    }

    // Radial Bar Chart
    if (chartType === 'radialBar') {
      return (
        <ResponsiveContainer width="100%" height={350}>
          <RadialBarChart innerRadius="10%" outerRadius="80%" data={chartData} startAngle={180} endAngle={0}>
            <PolarGrid />
            <PolarAngleAxis />
            <PolarRadiusAxis angle={90} domain={[0, 'auto']} />
            <RadialBar minAngle={15} label={{ position: 'insideStart', fill: '#fff' }} background clockWise dataKey="value">
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </RadialBar>
            <Tooltip />
            <Legend />
          </RadialBarChart>
        </ResponsiveContainer>
      );
    }

    // Composed Chart (combines Bar, Line, Area)
    if (chartType === 'composed') {
      return (
        <ResponsiveContainer width="100%" height={350}>
          <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="value" fill="#8884d8" label={{ position: 'top', fill: '#8884d8' }} />
            {chartData[0]?.value2 && <Line type="monotone" dataKey="value2" stroke="#82ca9d" strokeWidth={2} label={{ position: 'top', fill: '#82ca9d' }} />}
            {chartData[0]?.value3 && <Area type="monotone" dataKey="value3" fill="#ffc658" stroke="#ffc658" fillOpacity={0.6} />}
          </ComposedChart>
        </ResponsiveContainer>
      );
    }

    // Default: Bar Chart
    return (
      <ResponsiveContainer width="100%" height={350}>
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="value" fill="#8884d8" label={{ position: 'top', fill: '#333' }} />
          {chartData[0]?.value2 && <Bar dataKey="value2" fill="#82ca9d" label={{ position: 'top', fill: '#333' }} />}
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
                  <div 
                    className="text-section" 
                    ref={(el) => {
                      if (el) sectionRefs.current[section.id] = el;
                    }}
                  >
                    {section.heading && <h3 className="section-heading">{section.heading}</h3>}
                    {section.isFormatted ? (
                      <div className="section-text" dangerouslySetInnerHTML={{ __html: formatTextToHTML(section.content) }} />
                    ) : (
                      <p className="section-text">{section.content}</p>
                    )}
                  </div>
                )}

                {section.type === 'table' && (
                  <div 
                    className="table-section" 
                    ref={(el) => {
                      if (el) sectionRefs.current[section.id] = el;
                    }}
                  >
                    {section.heading && <h3 className="table-title">{section.heading}</h3>}
                    {section.tableHtml && (
                      <div className="table-wrapper" dangerouslySetInnerHTML={{ __html: section.tableHtml }} />
                    )}
                    {section.rows && !section.tableHtml && (
                      <div className="table-wrapper" style={{ overflowX: 'auto', width: '100%' }}>
                        <table className="data-table">
                          <thead>
                            <tr>
                              {section.columns.map((col, idx) => (
                                <th key={idx}>{col}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {section.rows.map((row, rowIdx) => (
                              <tr key={rowIdx}>
                                {row.map((cell, cellIdx) => (
                                  <td key={cellIdx}>{cell}</td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {section.type === 'chart' && (
                  <div className="chart-section">
                    {section.heading && <div className="chart-title">{section.heading}</div>}
                    <div 
                      ref={(el) => {
                        if (el) sectionRefs.current[section.id] = el;
                      }}
                      className="chart-capture-container"
                    >
                      {renderChart(section.data, section.chartType || 'bar')}
                    </div>
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
