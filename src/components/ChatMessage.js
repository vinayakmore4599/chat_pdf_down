import React from 'react';
import '../styles/ChatMessage.css';

const ChatMessage = ({ question }) => {
  return (
    <div className="chat-message-container">
      <div className="user-message-content">
        <p>{question}</p>
      </div>
    </div>
  );
};

export default ChatMessage;

