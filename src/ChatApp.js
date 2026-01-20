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
    },
    {
      id: 'msg-5',
      type: 'question',
      content: 'Regional and product performance comparison?'
    },
    {
      id: 'resp-5',
      type: 'response',
      question: 'Regional and product performance comparison?',
      answer: 'This comprehensive analysis combines both regional and product performance metrics. The first chart shows regional distribution of sales, demonstrating balanced growth across all regions. The second chart compares product performance, highlighting the top performers. Together, these visualizations provide a complete picture of business performance across dimensions.',
      charts: [
        {
          data: [
            { name: 'North', value: 5300 },
            { name: 'Central', value: 4500 },
            { name: 'South', value: 5100 },
            { name: 'East', value: 3900 },
            { name: 'West', value: 5700 }
          ],
          type: 'bar'
        },
        {
          data: [
            { name: 'Product A', value: 8500 },
            { name: 'Product B', value: 7800 },
            { name: 'Product C', value: 6200 },
            { name: 'Product D', value: 5900 },
            { name: 'Product E', value: 4100 }
          ],
          type: 'bar'
        }
      ]
    },
    {
      id: 'msg-6',
      type: 'question',
      content: 'Give me a comprehensive market analysis with detailed insights?'
    },
    {
      id: 'resp-6',
      type: 'response',
      question: 'Give me a comprehensive market analysis with detailed insights?',
      answer: 'Here is our comprehensive market analysis report with multiple data visualizations and detailed insights.',
      sections: [
        {
          type: 'text',
          id: 'intro-text',
          heading: '📈 Executive Summary',
          content: 'Our market analysis reveals strong growth across all regions with consistent upward momentum. The data demonstrates successful market penetration strategies and effective customer engagement initiatives. Key performance indicators show sustained improvement over the past two quarters with projected continued growth.'
        },
        {
          type: 'chart',
          id: 'regional-chart',
          heading: '🗺️ Regional Performance',
          data: [
            { name: 'North', value: 5300 },
            { name: 'Central', value: 4500 },
            { name: 'South', value: 5100 },
            { name: 'East', value: 3900 },
            { name: 'West', value: 5700 }
          ],
          chartType: 'bar'
        },
        {
          type: 'text',
          id: 'regional-insights',
          heading: '💡 Regional Insights',
          content: 'The West region leads in sales performance with exceptional results, followed closely by North region. Central and South regions show strong growth trajectories, while East region has significant growth potential. Recommended focus areas: increase marketing investment in East region, maintain current strategies in West and North, and explore partnership opportunities in Central region.'
        },
        {
          type: 'chart',
          id: 'product-chart',
          heading: '📊 Product Performance',
          data: [
            { name: 'Product A', value: 8500 },
            { name: 'Product B', value: 7800 },
            { name: 'Product C', value: 6200 },
            { name: 'Product D', value: 5900 },
            { name: 'Product E', value: 4100 }
          ],
          chartType: 'bar'
        },
        {
          type: 'text',
          id: 'product-insights',
          heading: '🎯 Product Strategy',
          content: 'Product A maintains market leadership with consistent strong performance across all regions. Product B demonstrates impressive growth trajectory and is approaching Product A performance levels. Products C and D show solid contribution to revenue. Recommendation: increase investment in Product B development and marketing to capitalize on growth momentum. Consider bundling strategies for Products C and D to boost combined sales.'
        },
        {
          type: 'chart',
          id: 'trend-chart',
          heading: '📉 Revenue Trend Analysis',
          data: [
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
          type: 'text',
          id: 'conclusion',
          heading: '✅ Conclusion',
          content: 'The analysis demonstrates robust business health with positive market indicators across all key metrics. Revenue shows consistent upward trajectory with slight seasonal dips appropriately managed. Based on current performance and market trends, we project continued 15-20% quarterly growth. Strategic recommendations include expanding West region presence, accelerating Product B initiatives, and developing East region market penetration strategies. All regions show positive momentum with strong fundamentals supporting sustained growth outlook.'
        }
      ]
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
                  charts={msg.charts || []}
                  sections={msg.sections || []}
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
