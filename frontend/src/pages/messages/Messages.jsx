import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { productsAPI, messagesAPI } from '../../api/api';
import Button from '../../components/common/Button';

const Messages = () => {
  const { sellerId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(sellerId ? parseInt(sellerId) : null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [seller, setSeller] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll to latest message
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]); // Trigger scroll when messages update

  // Fetch conversations and initial data
  const fetchInitialData = useCallback(async () => {
    if (!user) {
      localStorage.setItem('redirectPath', `/messages/${sellerId || ''}`);
      navigate('/login');
      return;
    }

    try {
      setLoading(true);
      const convData = await messagesAPI.getConversations();
      // Filter and deduplicate conversations where the seller is the receiver
      const uniqueConversations = Array.from(
        new Map(
          convData
            .filter((conv) => conv.last_message && conv.last_message.receiver.id === user.id)
            .map((conv) => [conv.other_user.id, conv])
        ).values()
      );
      setConversations(uniqueConversations);

      if (sellerId) {
        try {
          const sellerData = await productsAPI.getSellerDetails(sellerId);
          setSeller(sellerData);
        } catch (err) {
          console.error('Failed to fetch seller details:', err);
          setSeller({ username: 'Người dùng không xác định' });
        }
        const messageData = await messagesAPI.getMessages(sellerId);
        console.log('Fetched messages (raw):', messageData); // Debug API order
        setMessages(messageData); // Preserve API order initially
        messageData
          .filter((msg) => msg.receiver.id === user.id && !msg.is_read && msg.id)
          .forEach((msg) => {
            console.log('Marking message as read:', msg); // Debug invalid id
            messagesAPI.markMessageAsRead(msg.id).catch((err) =>
              console.error('Mark read failed:', err)
            );
          });
      }
    } catch (err) {
      setError(err.message || 'Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  }, [sellerId, user, navigate]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData, sellerId]); // Added sellerId as dependency

  // Polling for new messages
  useEffect(() => {
    if (!activeConversation) return;
    const interval = setInterval(async () => {
      try {
        const messageData = await messagesAPI.getMessages(activeConversation);
        console.log('Polled messages (raw):', messageData); // Debug API order
        setMessages((prevMessages) => {
          const newMessages = messageData.filter(
            (newMsg) => !prevMessages.some((msg) => msg.id === newMsg.id)
          );
          if (newMessages.length > 0) {
            newMessages
              .filter((msg) => msg.receiver.id === user.id && !msg.is_read && msg.id)
              .forEach((msg) => {
                console.log('Polling: Marking message as read:', msg); // Debug
                messagesAPI.markMessageAsRead(msg.id).catch((err) =>
                  console.error('Polling mark read failed:', err)
                );
              });
            return [...prevMessages, ...newMessages]; // Append new messages
          }
          return prevMessages;
        });
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 10000); // Poll every 10 seconds
    return () => clearInterval(interval);
  }, [activeConversation, user.id]);

  // Handle conversation selection
  const handleSelectConversation = async (recipientId) => {
    try {
      setActiveConversation(recipientId);
      setLoading(true);
      setMessages([]); // Clear messages before fetching new ones
      const messageData = await messagesAPI.getMessages(recipientId);
      console.log('Selected messages (raw):', messageData); // Debug API order
      setMessages(messageData);
      try {
        const recipientData = await productsAPI.getSellerDetails(recipientId);
        setSeller(recipientData);
      } catch (err) {
        console.error('Failed to fetch recipient details:', err);
        setSeller({ username: 'Người dùng không xác định' });
      }
      messageData
        .filter((msg) => msg.receiver.id === user.id && !msg.is_read && msg.id)
        .forEach((msg) => {
          console.log('Selecting: Marking message as read:', msg); // Debug
          messagesAPI.markMessageAsRead(msg.id).catch((err) =>
            console.error('Select mark read failed:', err)
          );
        });
      setError('');
      navigate(`/messages/${recipientId}`);
    } catch (err) {
      setError(err.message || 'Không thể tải tin nhắn');
    } finally {
      setLoading(false);
    }
  };

  // Handle sending a new message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) {
      setError('Tin nhắn không được để trống');
      return;
    }
    if (newMessage.length > 1000) {
      setError('Tin nhắn không được vượt quá 1000 ký tự');
      return;
    }
    if (!activeConversation) {
      setError('Vui lòng chọn một hội thoại');
      return;
    }

    try {
      const messageData = {
        receiver_id: activeConversation,
        content: newMessage,
      };
      const response = await messagesAPI.sendMessage(messageData);
      console.log('Sent message response:', response); // Debug new message
      setMessages((prev) => [...prev, response]); // Append new message
      setNewMessage('');
      setError('');
      const convData = await messagesAPI.getConversations();
      const uniqueConversations = Array.from(
        new Map(
          convData
            .filter((conv) => conv.last_message && conv.last_message.receiver.id === user.id)
            .map((conv) => [conv.other_user.id, conv])
        ).values()
      );
      setConversations(uniqueConversations);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Gửi tin nhắn thất bại');
    }
  };

  // Toggle sidebar for mobile
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Render individual messages in reverse order (oldest at top, newest at bottom)
  const individualMessages = useMemo(() => [...messages].reverse(), [messages]);
  console.log('Rendered messages (reversed):', individualMessages); // Debug final order

  if (loading) return <div className="text-center py-6 text-gray-600">Đang tải...</div>;
  if (error) return <div className="text-center py-6 text-red-500">{error}</div>;

  return (
    <div className="container mx-auto p-4 sm:p-6 flex flex-col md:flex-row h-[calc(100vh-80px)]">
      {/* Sidebar for conversations */}
      <div
        className={`fixed md:static inset-y-0 left-0 z-50 w-64 bg-white shadow-md transform ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 transition-transform duration-300 ease-in-out md:w-1/4 md:pr-4 border-r`}
      >
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-semibold">Hội thoại</h2>
          <button
            className="md:hidden text-gray-600 focus:outline-none"
            onClick={toggleSidebar}
          >
            ✕
          </button>
        </div>
        <div className="overflow-y-auto h-[calc(100vh-120px)]">
          {conversations.length === 0 ? (
            <p className="p-4 text-gray-600">Chưa có hội thoại nào.</p>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv.other_user.id}
                className={`p-4 border-b cursor-pointer hover:bg-gray-100 ${
                  activeConversation === conv.other_user.id ? 'bg-blue-50' : ''
                }`}
                onClick={() => handleSelectConversation(conv.other_user.id)}
              >
                <p className="font-medium">{conv.other_user.username}</p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col">
        <div className="p-4 border-b flex items-center">
          <button
            className="md:hidden text-gray-600 focus:outline-none mr-4"
            onClick={toggleSidebar}
          >
            ☰
          </button>
          <h1 className="text-xl font-bold">
            {seller ? `Tin nhắn với ${seller.username}` : 'Chọn một hội thoại'}
          </h1>
        </div>
        {activeConversation ? (
          <>
            <div className="flex-1 overflow-y-auto p-4 bg-white shadow-md rounded-lg mb-4">
              {individualMessages.length === 0 ? (
                <p className="text-gray-600 text-center">Chưa có tin nhắn nào.</p>
              ) : (
                individualMessages.map((msg, index) => (
                  <div
                    key={index} // Using index as fallback; prefer msg.id if unique
                    className={`mb-4 p-3 rounded-lg max-w-[70%] ${
                      msg.sender.id === user.id
                        ? 'ml-auto bg-blue-100 text-right'
                        : 'mr-auto bg-gray-100'
                    }`}
                  >
                    <p className="text-sm text-gray-500">
                      {msg.sender.username} -{' '}
                      {new Date(msg.created_at).toLocaleString('vi-VN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                    <p className="mt-1">{msg.content}</p>
                    {msg.sender.id !== user.id && !msg.is_read && (
                      <span className="text-xs text-blue-500">Chưa đọc</span>
                    )}
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
            <form onSubmit={handleSendMessage} className="flex gap-2 p-4">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Nhập tin nhắn..."
                className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                maxLength={1000}
              />
              <Button type="submit" variant="primary" size="small">
                Gửi
              </Button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-600">
            Vui lòng chọn một hội thoại để bắt đầu trò chuyện
          </div>
        )}
      </div>
    </div>
  );
};

export default Messages;