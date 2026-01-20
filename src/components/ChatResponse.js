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

const ChatResponse = ({ responseId, question, answer, chartData, chartType = 'bar' }) => {
  const messageRef = useRef(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const downloadMessagePDF = async () => {
    if (isDownloading) return;
    setIsDownloading(true);

    try {
      const canvas = await html2canvas(messageRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
      });

      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      const pdf = new jsPDF('p', 'mm', 'a4');
      let position = 0;

      const imgData = canvas.toDataURL('image/png');
      while (heightLeft >= 0) {
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
        if (heightLeft >= 0) {
          pdf.addPage();
          position = heightLeft - imgHeight;
        }
      }

      const timestamp = new Date().toISOString().slice(0, 10);
      pdf.save(`chat-response-${timestamp}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  const renderChart = () => {
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

        {/* Chart Section */}
        {chartData && chartData.length > 0 && (
          <div className="chart-section">
            <div className="chart-title">📊 Data Visualization</div>
            {renderChart()}
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
