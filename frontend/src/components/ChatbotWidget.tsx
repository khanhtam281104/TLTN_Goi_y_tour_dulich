import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  tours?: any[];
}

export const ChatbotWidget: React.FC = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: 'Xin chào! Tôi là Trợ lý ảo tư vấn Tour du lịch. Bạn cần tôi hỗ trợ tìm kiếm tour hay lên lịch trình gì không? 🎯',
      sender: 'bot',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const messageEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom
  useEffect(() => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg: Message = {
      id: Date.now(),
      text: input.trim(),
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    const currentInput = input.trim();
    setInput('');

    // Add typing state
    const typingId = Date.now() + 1;
    const typingMsg: Message = {
      id: typingId,
      text: '🤖 Đang phân tích ý định và tìm kiếm tour phù hợp...',
      sender: 'bot',
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, typingMsg]);

    try {
      const response = await fetch('http://localhost:5000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: currentInput }),
      });
      const data = await response.json();
      
      setMessages(prev => 
        prev.map(msg => 
          msg.id === typingId 
            ? {
                id: typingId,
                text: data.response,
                sender: 'bot',
                timestamp: new Date(),
                tours: data.tours,
              }
            : msg
        )
      );
    } catch (err) {
      console.error(err);
      setMessages(prev => 
        prev.map(msg => 
          msg.id === typingId 
            ? {
                id: typingId,
                text: 'Xin lỗi, tôi gặp khó khăn khi kết nối với máy chủ AI. Hãy kiểm tra xem máy chủ Python đã được bật chưa.',
                sender: 'bot',
                timestamp: new Date(),
              }
            : msg
        )
      );
    }
  };

  const handleQuickQuestion = (text: string) => {
    setInput(text);
  };

  return (
    <div className="chatbot-widget-container">
      {/* Floating Chat Bubble */}
      {!isOpen && (
        <button className="chatbot-bubble-btn" onClick={() => setIsOpen(true)} title="Trò chuyện với trợ lý tư vấn">
          💬
          <span className="tooltip-chat">Tư vấn Tour AI</span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="chatbot-window">
          {/* Chat Header */}
          <div className="chatbot-header">
            <div className="bot-info">
              <span className="bot-avatar-icon">🤖</span>
              <div>
                <div className="bot-name">Trợ lý ảo BinTravel</div>
                <div className="bot-status">● Đang hoạt động</div>
              </div>
            </div>
            <button className="btn-close-chat" onClick={() => setIsOpen(false)}>
              &times;
            </button>
          </div>

          {/* Chat Messages */}
          <div className="chatbot-messages">
            {messages.map(msg => (
              <div key={msg.id} className={`chat-bubble-wrapper ${msg.sender}`}>
                <div className={`chat-bubble ${msg.sender}`}>
                  <div className="chat-bubble-text">{msg.text}</div>
                  
                  {msg.sender === 'bot' && msg.tours && msg.tours.length > 0 && (
                    <div className="chat-recommendations-list">
                      {msg.tours.map((tour: any) => (
                        <div 
                          key={tour.id} 
                          className="chat-tour-card"
                          onClick={() => {
                            navigate(`/tour/${tour.id}`);
                            setIsOpen(false);
                          }}
                        >
                          <img src={tour.imageUrl} alt={tour.title} className="chat-tour-img" />
                          <div className="chat-tour-details">
                            <h5 className="chat-tour-title" title={tour.title}>{tour.title}</h5>
                            <span className="chat-tour-loc">📍 {tour.location}</span>
                            <div className="chat-tour-footer">
                              <span className="chat-tour-price">{tour.price.toLocaleString('vi-VN')} đ</span>
                              <span className="chat-tour-duration">⏱️ {tour.duration}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <span className="chat-time">
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
            <div ref={messageEndRef} />
          </div>

          {/* Quick Questions suggestion */}
          <div className="quick-suggestions">
            <button onClick={() => handleQuickQuestion('Tư vấn tour Phú Quốc giá tốt')}>🏝️ Phú Quốc?</button>
            <button onClick={() => handleQuickQuestion('Tôi muốn tìm tour giá rẻ dưới 3 triệu')}>💸 Tour giá rẻ?</button>
            <button onClick={() => handleQuickQuestion('Có tour đi Sapa Tây Bắc không?')}>⛰️ Sapa / Hà Giang?</button>
          </div>

          {/* Chat Input Form */}
          <form onSubmit={handleSend} className="chatbot-input-form">
            <input
              type="text"
              placeholder="Nhập câu hỏi của bạn..."
              value={input}
              onChange={e => setInput(e.target.value)}
            />
            <button type="submit" className="btn-send-chat">
              ➔
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
