  import React, { useState, useEffect, useCallback, useRef } from 'react';
  import { useParams, useNavigate } from 'react-router-dom';
  import { useAuth } from '../../context/AuthContext';
  import { messagesAPI, productsAPI } from '../../api/api';
  import Button from '../../components/common/Button';
  import './messages.css'; // Assuming you have some styles for the messages page
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
    const scrollToBottom = useCallback(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    useEffect(() => {
      scrollToBottom();
    }, [messages, scrollToBottom]);

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
        const uniqueConversations = Array.from(
          new Map(convData.map((conv) => [conv.other_user.id, conv])).values()
        );
        setConversations(uniqueConversations);

        if (sellerId) {
          const sellerData = await productsAPI.getSellerDetails(sellerId).catch(() => ({
            username: 'Người dùng không xác định',
          }));
          setSeller(sellerData);
          const messageData = await messagesAPI.getMessages(sellerId);
          setMessages(messageData);
          // Mark unread messages as read
          const unreadMessages = messageData.filter(
            (msg) => msg.receiver.id === user.id && !msg.is_read && msg.id
          );
          for (const msg of unreadMessages) {
            await messagesAPI.markMessageAsRead(msg.id).catch((err) =>
              console.error(`Failed to mark message ${msg.id} as read:`, err)
            );
          }
        }
      } catch (err) {
        setError(err.message || 'Không thể tải dữ liệu');
      } finally {
        setLoading(false);
      }
    }, [sellerId, user, navigate]);

    useEffect(() => {
      fetchInitialData();
    }, [fetchInitialData]);

    // Polling for new messages
    useEffect(() => {
      if (!activeConversation) return;
      const interval = setInterval(async () => {
        try {
          const messageData = await messagesAPI.getMessages(activeConversation);
          setMessages((prevMessages) => {
            const newMessages = messageData.filter(
              (newMsg) => !prevMessages.some((msg) => msg.id === newMsg.id)
            );
            if (newMessages.length > 0) {
              newMessages
                .filter((msg) => msg.receiver.id === user.id && !msg.is_read && msg.id)
                .forEach((msg) =>
                  messagesAPI.markMessageAsRead(msg.id).catch((err) =>
                    console.error(`Polling mark read failed for message ${msg.id}:`, err)
                  )
                );
              return [...prevMessages, ...newMessages];
            }
            return prevMessages;
          });
        } catch (err) {
          console.error('Polling error:', err);
        }
      }, 5000); // Poll every 5 seconds
      return () => clearInterval(interval);
    }, [activeConversation, user.id]);

    // Handle conversation selection
    const handleSelectConversation = async (recipientId) => {
      try {
        setActiveConversation(recipientId);
        setLoading(true);
        setMessages([]);
        const messageData = await messagesAPI.getMessages(recipientId);
        setMessages(messageData);
        const recipientData = await productsAPI.getSellerDetails(recipientId).catch(() => ({
          username: 'Người dùng không xác định',
        }));
        setSeller(recipientData);
        // Mark unread messages as read
        const unreadMessages = messageData.filter(
          (msg) => msg.receiver.id === user.id && !msg.is_read && msg.id
        );
        for (const msg of unreadMessages) {
          await messagesAPI.markMessageAsRead(msg.id).catch((err) =>
            console.error(`Select mark read failed for message ${msg.id}:`, err)
          );
        }
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
        setMessages((prev) => [...prev, response]);
        setNewMessage('');
        setError('');
        await fetchInitialData(); // Refresh conversations
      } catch (err) {
        setError(err.response?.data?.detail || 'Gửi tin nhắn thất bại');
      }
    };

    // Toggle sidebar for mobile
    const toggleSidebar = () => {
      setSidebarOpen(!sidebarOpen);
    };

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
                  <p className="text-sm text-gray-500 truncate">
                    {conv.last_message?.content || 'Chưa có tin nhắn'}
                  </p>
                  {conv.unread_count > 0 && (
                    <span className="inline-block bg-blue-500 text-white text-xs rounded-full px-2 py-1">
                      {conv.unread_count}
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Main chat area */}
        <div className="flex-1 flex flex-col bg-gray-50">
          <div className="p-4 border-b flex items-center bg-white">
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
                {messages.length === 0 ? (
                  <p className="text-gray-600 text-center">Chưa có tin nhắn nào.</p>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`mb-4 p-3 rounded-lg max-w-[70%] ${
                        msg.sender.id === user.id
                          ? 'ml-auto bg-blue-300 text-white'
                          : 'mr-auto bg-gray-200 text-black'
                      }`}
                    >
                      <p className="text-sm">
                        {msg.content}
                      </p>
                      <p className="text-xs mt-1">
                        {new Date(msg.created_at).toLocaleString('vi-VN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>
              <form onSubmit={handleSendMessage} className="flex gap-2 p-4 bg-white">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Nhập tin nhắn..."
                  className="flex-1 p-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                  maxLength={1000}
                />
                <Button type="submit" className="bg-blue-500 text-white rounded-full px-4 py-2">
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