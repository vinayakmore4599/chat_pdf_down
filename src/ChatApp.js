import React, { useState } from 'react';
import ChatMessage from './components/ChatMessage';
import ChatResponse from './components/ChatResponse';
import './styles/ChatApp.css';

const ChatApp = () => {
  const [messages, setMessages] = useState([
    {
      id: 'msg-1',
      type: 'question',
      content: 'Show me Q1 sales data by region'
    },
    {
      id: 'resp-1',
      type: 'response',
      question: 'Show me Q1 sales data by region',
      answer: 'Here is the Q1 sales breakdown showing strong performance across all regions. North Region led with exceptional results, while Central and South regions also demonstrated solid growth. This positive trend indicates effective market penetration and customer engagement strategies.',
      chartData: [
        { name: 'North', value: 4500 },
        { name: 'Central', value: 3800 },
        { name: 'South', value: 4200 },
        { name: 'East', value: 3200 },
        { name: 'West', value: 4800 }
      ],
      chartType: 'bar'
    },
    {
      id: 'msg-2',
      type: 'question',
      content: 'Compare Q1 with Q2 performance'
    },
    {
      id: 'resp-2',
      type: 'response',
      question: 'Compare Q1 with Q2 performance',
      answer: 'Q2 showed significant improvements over Q1 with an overall growth of 18%. All regions demonstrated positive growth trends. North Region maintained its leadership position while other regions significantly closed the gap. This indicates successful implementation of our expansion strategy.',
      chartData: [
        { name: 'North', value: 5300, value2: 4500 },
        { name: 'Central', value: 4500, value2: 3800 },
        { name: 'South', value: 5100, value2: 4200 },
        { name: 'East', value: 3900, value2: 3200 },
        { name: 'West', value: 5700, value2: 4800 }
      ],
      chartType: 'bar'
    },
    {
      id: 'msg-3',
      type: 'question',
      content: 'What is the revenue trend?'
    },
    {
      id: 'resp-3',
      type: 'response',
      question: 'What is the revenue trend?',
      answer: 'The revenue trend over the past six months shows consistent upward momentum with a slight dip in Month 3 but strong recovery afterward. Month 6 achieved the highest revenue, indicating successful momentum and growing market demand. The trajectory suggests positive outlook for future quarters.',
      chartData: [
        { name: 'Month 1', value: 45000 },
        { name: 'Month 2', value: 52000 },
        { name: 'Month 3', value: 48000 },
        { name: 'Month 4', value: 61000 },
        { name: 'Month 5', value: 67000 },
        { name: 'Month 6', value: 72000 }
      ],
      chartType: 'line'
    },
    {
      id: 'msg-4',
      type: 'question',
      content: 'Top performing products?'
    },
    {
      id: 'resp-4',
      type: 'response',
      question: 'Top performing products?',
      answer: 'Product analysis reveals that Product A maintains market leadership with consistent strong performance. Product B showed impressive growth trajectory, nearly matching Product A in recent months. Products C and D also contribute significantly to the portfolio. Recommendations include increased investment in Products B and C to capitalize on growth momentum.',
      chartData: [
        { name: 'Product A', value: 8500 },
        { name: 'Product B', value: 7800 },
        { name: 'Product C', value: 6200 },
        { name: 'Product D', value: 5900 },
        { name: 'Product E', value: 4100 }
      ],
      chartType: 'bar'
    }
  ]);

  return (
    <div className="chat-app-wrapper">
      <header className="chat-app-header">
        <div className="header-content">
          <h1>📊 Chat Analytics Assistant</h1>
          <p className="header-subtitle">
            Ask questions about your business data. Click "Download as PDF" on any response to save it.
          </p>
        </div>
      </header>

      <main className="chat-app-container">
        <div className="chat-messages-list">
          {messages.map((msg) => (
            <div key={msg.id} className="message-wrapper">
              {msg.type === 'question' && (
                <ChatMessage question={msg.content} />
              )}

              {msg.type === 'response' && (
                <ChatResponse
                  responseId={msg.id}
                  question={msg.question}
                  answer={msg.answer}
                  chartData={msg.chartData}
                  chartType={msg.chartType}
                />
              )}
            </div>
          ))}
        </div>

        <div className="chat-footer">
          <p>💡 Tip: Each AI response can be downloaded as a PDF with its question, answer, and chart.</p>
        </div>
      </main>
    </div>
  );
};

export default ChatApp;
