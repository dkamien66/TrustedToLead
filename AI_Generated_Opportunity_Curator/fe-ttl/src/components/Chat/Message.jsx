// src/components/Chat/Message.jsx
import React from 'react';
import { Card } from 'react-bootstrap';
import { FaUser, FaRobot, FaExclamationTriangle } from 'react-icons/fa';
import './Chat.css';

const Message = ({ role, content }) => {
  return (
    <div className={`message ${role}`}>
      <div className="message-avatar">
        {role === 'user' ? (
          <FaUser className="user-avatar" />
        ) : role === 'error' ? (
          <FaExclamationTriangle className="error-avatar" />
        ) : (
          <FaRobot className="bot-avatar" />
        )}
      </div>
      <Card className={`message-card ${role}`}>
        <Card.Body>
          <Card.Text>{content}</Card.Text>
        </Card.Body>
      </Card>
    </div>
  );
};

export default Message;
