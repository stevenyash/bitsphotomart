'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { theme } from "@/lib/admin-theme";

interface Conversation {
  id: string;
  participant1Id: string;
  participant1Type: string;
  participant2Id: string;
  participant2Type: string;
  lastMessage: string | null;
  lastMessageAt: string | null;
  createdAt: string;
  otherParticipant: {
    id: string;
    name: string | null;
    email: string;
    avatar: string | null;
    role: string;
    photographer?: {
      id: string;
      rating: number;
      status: string;
    };
  };
  unreadCount: number;
}

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderType: string;
  senderName: string | null;
  content: string;
  messageType: string;
  attachmentUrl: string | null;
  attachmentName: string | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}

export default function PhotographerMessagesPage() {
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id);
    }
  }, [selectedConversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchConversations = async () => {
    try {
      const res = await fetch('/api/messages/conversations');
      if (res.ok) {
        const data = await res.json();
        setConversations(data);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    try {
      const res = await fetch(`/api/messages?conversationId=${conversationId}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;

    setSending(true);
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: selectedConversation.id,
          content: newMessage,
        }),
      });

      if (res.ok) {
        const message = await res.json();
        setMessages(prev => [...prev, message]);
        setNewMessage('');
        fetchConversations();
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Messages</h1>
          <p className="text-[var(--muted-foreground)]">Chat with clients and BPM team</p>
        </div>

        <div className={`${theme.card} rounded-xl shadow-lg overflow-hidden`} style={{ height: 'calc(100vh - 200px)', minHeight: '500px' }}>
          <div className="flex h-full">
            {/* Conversations List */}
            <div className="w-1/3 border-r border-[var(--border)] overflow-y-auto">
              <div className="p-4 border-b border-[var(--border)]">
                <h2 className="font-semibold text-[var(--foreground)]">Conversations</h2>
              </div>
              
              {conversations.length === 0 ? (
                <div className="p-8 text-center text-[var(--muted-foreground)]">
                  <p>No conversations yet</p>
                  <p className="text-sm mt-2">Start a conversation by contacting a client</p>
                </div>
              ) : (
                <div className={`divide-y divide-[var(--border)]`}>
                  {conversations.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => setSelectedConversation(conv)}
                      className={`w-full p-4 text-left hover:bg-[var(--muted)] transition-colors ${
                        selectedConversation?.id === conv.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold">
                          {conv.otherParticipant?.name?.charAt(0).toUpperCase() || '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h3 className="font-medium text-[var(--foreground)] truncate">
                              {conv.otherParticipant?.name || 'Unknown User'}
                            </h3>
                            {conv.lastMessageAt && (
                              <span className="text-xs text-[var(--muted-foreground)]">
                                {formatTime(conv.lastMessageAt)}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-[var(--muted-foreground)] truncate">
                            {conv.lastMessage || 'No messages yet'}
                          </p>
                          {conv.unreadCount > 0 && (
                            <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-medium text-white bg-blue-600 rounded-full mt-1">
                              {conv.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col">
              {selectedConversation ? (
                <>
                  {/* Chat Header */}
                  <div className={`p-4 border-b border-[var(--border)] ${theme.secondary}`}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold">
                        {selectedConversation.otherParticipant?.name?.charAt(0).toUpperCase() || '?'}
                      </div>
                      <div>
                        <h3 className="font-semibold text-[var(--foreground)]">
                          {selectedConversation.otherParticipant?.name || 'Unknown User'}
                        </h3>
                        <p className="text-sm text-[var(--muted-foreground)]">
                          {selectedConversation.otherParticipant?.role === 'ADMIN' 
                            ? 'BPM Admin' 
                            : selectedConversation.otherParticipant?.role === 'USER' 
                              ? 'Client' 
                              : 'Photographer'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.senderId !== conversations[0]?.participant2Id ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-lg px-4 py-2 ${
                            msg.senderId !== conversations[0]?.participant2Id
                              ? 'bg-blue-600 text-white'
                              : `${theme.secondary} text-[var(--foreground)]`
                          }`}
                        >
                          <p className="text-sm">{msg.content}</p>
                          <p className={`text-xs mt-1 ${
                            msg.senderId !== conversations[0]?.participant2Id
                              ? 'text-blue-200'
                              : 'text-[var(--muted-foreground)]'
                          }`}>
                            {formatTime(msg.createdAt)}
                            {msg.isRead && msg.senderId === conversations[0]?.participant2Id && ' • Read'}
                          </p>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Message Input */}
                  <form onSubmit={sendMessage} className={`p-4 border-t border-[var(--border)]`}>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type your message..."
                        className={`flex-1 px-4 py-2 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${theme.input}`}
                      />
                      <button
                        type="submit"
                        disabled={sending || !newMessage.trim()}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {sending ? 'Sending...' : 'Send'}
                      </button>
                    </div>
                  </form>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-[var(--muted-foreground)]">
                  <div className="text-center">
                    <div className="text-4xl mb-4">💬</div>
                    <p>Select a conversation to start chatting</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
