'use client';

import { useState, useEffect, useRef } from 'react';

// Predefined responses for the chatbot
const botResponses: Record<string, string> = {
  'hello': 'Hello! 👋 Welcome to Bits Photo Mart. How can I help you today?',
  'hi': 'Hi there! 👋 How can I assist you with our photography services?',
  'hey': 'Hey! 👋 What can I help you with today?',
  'buy': 'To purchase photos, browse our gallery at /gallery, add items to cart, and checkout. We accept M-Pesa, Stripe, and PayPal.',
  'purchase': 'To purchase photos, browse our gallery at /gallery, add items to cart, and checkout. We accept M-Pesa, Stripe, and PayPal.',
  'photo': 'We have thousands of high-quality photos! Visit /gallery to browse by category or use our search feature.',
  'photos': 'We have thousands of high-quality photos! Visit /gallery to browse by category or use our search feature.',
  'price': 'Photo prices vary based on license type. Visit any photo detail page to see pricing options.',
  'pricing': 'Photo prices vary based on license type. Visit any photo detail page to see pricing options.',
  'license': 'We offer Personal, Commercial, and Extended licenses. Each has different usage rights and pricing.',
  'sell': 'Photographers can sell on BPM! Register as a photographer at /register/photographer, then upload your photos for review.',
  'upload': 'Photographers can upload photos from their dashboard at /photographer/upload after registering.',
  'photographer': 'To become a photographer, register at /register/photographer. You can then upload photos and earn from sales.',
  'mpesa': 'We accept M-Pesa payments via Lipa Na M-Pesa. Select M-Pesa at checkout and follow the prompts.',
  'payment': 'We accept M-Pesa, Credit Cards (Stripe), and PayPal. Select your preferred method at checkout.',
  'download': 'After purchase, download your photos from /dashboard/orders. Licensed photos are available for download.',
  'refund': 'For refund inquiries, please contact our support team at support@bitsphotomart.com',
  'support': 'You can reach our support team at support@bitsphotomart.com or use the contact form.',
  'contact': 'You can reach our support team at support@bitsphotomart.com or use the contact form.',
  'help': 'I can help with: finding photos, pricing, payments, photographer registration, and order issues. What do you need?',
  'default': "I'm here to help! Ask me about finding photos, pricing, payments, or becoming a photographer. You can also email support@bitsphotomart.com for detailed assistance."
};

interface Message {
  id: number;
  text: string;
  isUser: boolean;
}

function getBotResponse(message: string): string {
  const lowerMessage = message.toLowerCase();
  
  for (const [key, response] of Object.entries(botResponses)) {
    if (lowerMessage.includes(key)) {
      return response;
    }
  }
  
  return botResponses['default'];
}

export default function ChatlingChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: 0, text: "Hello! 👋 I'm your BPM Assistant. How can I help you today?", isUser: false }
  ]);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now(),
      text: inputValue,
      isUser: true
    };

    setMessages(prev => [...prev, userMessage]);
    
    // Simulate bot response
    setTimeout(() => {
      const botResponse: Message = {
        id: Date.now() + 1,
        text: getBotResponse(inputValue),
        isUser: false
      };
      setMessages(prev => [...prev, botResponse]);
    }, 500);

    setInputValue('');
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 9999 }}>
      {/* Chat Window */}
      {isOpen && (
        <div
          style={{ 
            position: 'absolute',
            bottom: '70px', 
            right: '0',
            width: '350px',
            height: '450px',
            backgroundColor: 'white',
            borderRadius: '16px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
            border: '1px solid #e5e7eb',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}
        >
          {/* Header */}
          <div style={{ 
            backgroundColor: '#2563eb', 
            color: 'white', 
            padding: '16px', 
            borderRadius: '16px 16px 0 0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ 
                width: '36px', 
                height: '36px', 
                backgroundColor: 'rgba(255,255,255,0.2)', 
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <p style={{ fontWeight: 600, fontSize: '15px' }}>BPM Assistant</p>
                <p style={{ fontSize: '11px', opacity: 0.9 }}>Online now</p>
              </div>
            </div>
            <button
              onClick={toggleChat}
              style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: '4px' }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div style={{ 
            flex: 1, 
            padding: '16px', 
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            backgroundColor: '#f9fafb'
          }}>
            {messages.map((msg) => (
              <div 
                key={msg.id}
                style={{ 
                  display: 'flex', 
                  justifyContent: msg.isUser ? 'flex-end' : 'flex-start' 
                }}
              >
                <div 
                  style={{ 
                    backgroundColor: msg.isUser ? '#2563eb' : 'white', 
                    color: msg.isUser ? 'white' : '#1f2937',
                    borderRadius: msg.isUser 
                      ? '16px 16px 4px 16px' 
                      : '16px 16px 16px 4px', 
                    padding: '12px 16px', 
                    maxWidth: '80%',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                  }}
                >
                  <p style={{ fontSize: '14px', lineHeight: '1.5' }}>{msg.text}</p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div style={{ 
            padding: '12px', 
            borderTop: '1px solid #e5e7eb',
            backgroundColor: 'white'
          }}>
            <form
              onSubmit={handleSendMessage}
              style={{ display: 'flex', gap: '8px' }}
            >
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Type your message..."
                style={{ 
                  flex: 1, 
                  padding: '12px 14px', 
                  border: '1px solid #d1d5db', 
                  borderRadius: '24px',
                  fontSize: '14px',
                  outline: 'none',
                  backgroundColor: '#f9fafb'
                }}
              />
              <button
                type="submit"
                style={{ 
                  backgroundColor: '#2563eb', 
                  color: 'white', 
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                </svg>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Chat Toggle Button */}
      <button
        onClick={toggleChat}
        style={{ 
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          backgroundColor: isOpen ? '#6b7280' : '#2563eb',
          color: 'white',
          border: 'none',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(37, 99, 235, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s ease'
        }}
      >
        {isOpen ? (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        )}
      </button>
    </div>
  );
}
