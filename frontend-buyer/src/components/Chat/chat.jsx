// src/components/Chat/Chat.jsx
import React, { useState, useEffect, useRef, useImperativeHandle, forwardRef, useCallback } from 'react';
import { chatAPI, websocketAPI } from '../../services/api';
import './chat.css';
import useTime from "../../context/useTime";

const Chat = forwardRef((props, ref) => {
  const [isOpen, setIsOpen] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [uploadingImages, setUploadingImages] = useState(false);
  const [previewImages, setPreviewImages] = useState([]);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [messageCursor, setMessageCursor] = useState(null);
  const [viewedConversations, setViewedConversations] = useState(new Set());
  const { formatRelativeTime, formatShortTime } = useTime();
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);
  const messagesContainerRef = useRef(null);

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    openWithSeller: async (sellerId, sellerName, sellerAvatar) => {
      setIsOpen(true);
      await loadConversations();

      const existingConv = conversations.find(c => c.partner.id === sellerId);

      if (existingConv) {
        setSelectedConversation(existingConv);
        setViewedConversations(prev => new Set([...prev, existingConv.conversation_id]));
      } else {
        setSelectedConversation({
          conversation_id: null,
          partner: {
            id: sellerId,
            name: sellerName,
            avatar: sellerAvatar
          },
          unread_counts: { buyer: 0 }
        });
      }
    }
  }));

  // Load conversations
  const loadConversations = useCallback(async () => {
    try {
      setLoading(true);
      const data = await chatAPI.getConversations();
      setConversations(data || []);
      return data || [];
    } catch (error) {
      console.error('Load conversations error:', error);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Load messages
  const loadMessages = async (conversationId, cursor = null) => {
    if (!conversationId) {
      setMessages([]);
      setHasMoreMessages(false);
      setMessageCursor(null);
      return;
    }

    try {
      const data = await chatAPI.getMessages(conversationId, cursor);

      if (cursor) {
        setMessages(prev => [...data.messages, ...prev]);
      } else {
        setMessages(data.messages || []);
        setTimeout(scrollToBottom, 100);
      }

      setHasMoreMessages(!!data.next_cursor);
      setMessageCursor(data.next_cursor || null);

      if (!cursor && conversationId) {
        setViewedConversations(prev => new Set([...prev, conversationId]));
      }
    } catch (error) {
      console.error('Load messages error:', error);
      setMessages([]);
      setHasMoreMessages(false);
      setMessageCursor(null);
    }
  };

  // Load more messages
  const loadMoreMessages = async () => {
    if (selectedConversation?.conversation_id && messageCursor && hasMoreMessages) {
      await loadMessages(selectedConversation.conversation_id, messageCursor);
    }
  };

  // Send message
  const handleSendMessage = async () => {
    if (!messageInput.trim() && previewImages.length === 0) return;
    if (!selectedConversation) return;

    try {
      setSending(true);

      const payload = {
        recipient_id: selectedConversation.partner.id,
        content: messageInput.trim() || null,
        image_urls: previewImages,
        conversation_id: selectedConversation.conversation_id
      };

      const newMessage = await chatAPI.sendMessage(payload);

      if (!selectedConversation.conversation_id && newMessage.conversation_id) {
        setSelectedConversation(prev => ({
          ...prev,
          conversation_id: newMessage.conversation_id
        }));
      }

      setMessages(prev => [...prev, newMessage]);
      setMessageInput('');
      setPreviewImages([]);

      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }

      setTimeout(scrollToBottom, 100);
      loadConversations();
    } catch (error) {
      console.error('Send message error:', error);
      alert('Không thể gửi tin nhắn');
    } finally {
      setSending(false);
    }
  };

  // Upload images
  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    if (files.length > 5) {
      alert('Chỉ có thể upload tối đa 5 ảnh');
      return;
    }

    try {
      setUploadingImages(true);
      const response = await chatAPI.uploadImages(files);
      setPreviewImages(prev => [...prev, ...response.urls]);
    } catch (error) {
      console.error('Upload error:', error);
      alert('Không thể upload ảnh');
    } finally {
      setUploadingImages(false);
    }
  };

  const removePreviewImage = (index) => {
    setPreviewImages(prev => prev.filter((_, i) => i !== index));
  };

  // WebSocket listener
  useEffect(() => {
    if (!isOpen) return;

    const unsubscribe = websocketAPI.onMessage('CHAT', (payload) => {
      console.log('📨 New chat message:', payload);

      if (selectedConversation?.conversation_id === payload.conversation_id) {
        const newMsg = {
          _id: Date.now().toString(),
          conversation_id: payload.conversation_id,
          sender: payload.sender,
          content: payload.content,
          images: payload.images || [],
          is_read: false,
          created_at: payload.created_at
        };
        setMessages(prev => [...prev, newMsg]);
        setTimeout(scrollToBottom, 100);

        if (payload.sender === 'seller') {
          setViewedConversations(prev => new Set([...prev, payload.conversation_id]));
        }
      }

      loadConversations();
    });

    return () => unsubscribe();
  }, [isOpen, selectedConversation, loadConversations]);

  // Load conversations when open
  useEffect(() => {
    if (isOpen) {
      loadConversations();
    }
  }, [isOpen, loadConversations]);

  // Load messages when select conversation
  useEffect(() => {
    if (selectedConversation?.conversation_id) {
      loadMessages(selectedConversation.conversation_id);
    } else if (selectedConversation && !selectedConversation.conversation_id) {
      setMessages([]);
      setHasMoreMessages(false);
      setMessageCursor(null);
    }
  }, [selectedConversation]);

  // Auto resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const newHeight = Math.min(textareaRef.current.scrollHeight, 120);
      textareaRef.current.style.height = `${newHeight}px`;
    }
  }, [messageInput]);

  // Handle scroll for loading more messages
  const handleScroll = useCallback(() => {
    if (!messagesContainerRef.current) return;

    const { scrollTop } = messagesContainerRef.current;
    if (scrollTop < 100 && hasMoreMessages && !loading) {
      loadMoreMessages();
    }
  }, [hasMoreMessages, loading, loadMoreMessages]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Calculate unread count
  const getUnreadCount = (conversation) => {
    const serverUnread = conversation.unread_counts?.buyer || 0;
    if (viewedConversations.has(conversation.conversation_id)) {
      return 0;
    }
    return serverUnread;
  };

  // Filter conversations
  const filteredConversations = conversations.filter(conv => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (!conv.partner.name.toLowerCase().includes(query)) {
        return false;
      }
    }

    const unreadCount = getUnreadCount(conv);

    if (activeTab === 'unread') {
      return unreadCount > 0;
    } else if (activeTab === 'read') {
      return unreadCount === 0;
    }

    return true;
  });

  const formatTime = (dateString) => {
    if (!dateString) return '';
    return formatRelativeTime(dateString);
  };


  const formatTimeShort = (dateString) => {
    if (!dateString) return '';
    return formatShortTime(dateString);
  };

  const totalUnread = conversations.reduce((sum, conv) => {
    return sum + getUnreadCount(conv);
  }, 0);

  // Quick replies
  const quickReplies = [
    "Xin chào! Tôi muốn hỏi về sản phẩm này",
    "Sản phẩm còn hàng không?",
    "Khi nào có hàng?",
  ];

  // Get tab counts
  const getTabCount = (tab) => {
    if (tab === 'all') return conversations.length;
    if (tab === 'unread') return conversations.filter(conv => getUnreadCount(conv) > 0).length;
    if (tab === 'read') return conversations.filter(conv => getUnreadCount(conv) === 0).length;
    return 0;
  };

  return (
    <>
      {/* Chat Button */}
      <button
        className={`chat-button ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M12 2C6.48 2 2 6.48 2 12c0 1.54.36 3 .97 4.29L2 22l5.71-.97C9 21.64 10.46 22 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm0 18c-1.34 0-2.61-.35-3.71-.96l-.27-.16-2.86.49.49-2.86-.16-.27C4.35 14.61 4 13.34 4 12c0-4.41 3.59-8 8-8s8 3.59 8 8-3.59 8-8 8z" fill="currentColor"/>
        </svg>
        {totalUnread > 0 && (
          <span className="chat-badge">{totalUnread > 99 ? '99+' : totalUnread}</span>
        )}
      </button>

      {/* Chat Window - ALWAYS SHOW 2 COLUMNS */}
      {isOpen && (
        <div className="chat-window">
          {/* Left Column - Conversation List (ALWAYS VISIBLE) */}
          <div className="chat-sidebar">
            <div className="sidebar-header">
              <h2 className="sidebar-title">Tin nhắn</h2>
              <button className="close-btn" onClick={() => setIsOpen(false)}>✕</button>
            </div>

            <div className="sidebar-search">
              <input
                type="text"
                placeholder="Tìm kiếm cuộc trò chuyện..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="sidebar-tabs">
              <button
                className={`tab-button ${activeTab === 'all' ? 'active' : ''}`}
                onClick={() => setActiveTab('all')}
              >
                Tất cả ({getTabCount('all')})
              </button>
              <button
                className={`tab-button ${activeTab === 'unread' ? 'active' : ''}`}
                onClick={() => setActiveTab('unread')}
              >
                Chưa đọc ({getTabCount('unread')})
              </button>
              <button
                className={`tab-button ${activeTab === 'read' ? 'active' : ''}`}
                onClick={() => setActiveTab('read')}
              >
                Đã đọc ({getTabCount('read')})
              </button>
            </div>

            <div className="conversation-list">
              {loading ? (
                <div className="empty-state">
                  <div className="spinner"></div>
                  <p>Đang tải...</p>
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">💬</div>
                  <p>Chưa có cuộc trò chuyện nào</p>
                </div>
              ) : (
                filteredConversations.map(conv => {
                  const unreadCount = getUnreadCount(conv);
                  const isSelected = selectedConversation?.conversation_id === conv.conversation_id;

                  return (
                    <div
                      key={conv.conversation_id}
                      className={`conversation-item ${isSelected ? 'selected' : ''} ${unreadCount > 0 ? 'unread' : ''}`}
                      onClick={() => {
                        setSelectedConversation(conv);
                        setViewedConversations(prev => new Set([...prev, conv.conversation_id]));
                      }}
                    >
                      <div className="conv-avatar">
                        {conv.partner.avatar ? (
                          <img src={conv.partner.avatar} alt={conv.partner.name} />
                        ) : (
                          <div className="avatar-fallback">
                            {conv.partner.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="conv-info">
                        <div className="conv-name-row">
                          <span className="conv-name">{conv.partner.name}</span>
                          <span className="conv-time">{formatTime(conv.last_message_at)}</span>
                        </div>
                        <div className="conv-message-preview">{conv.last_message}</div>
                      </div>
                      {unreadCount > 0 && (
                        <span className="unread-badge">{unreadCount}</span>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column - Messages (ALWAYS VISIBLE, shows empty state if no conversation selected) */}
          <div className="chat-content">
            {selectedConversation ? (
              <>
                <div className="content-header">
                  <div className="partner-info">
                    <div className="partner-avatar">
                      {selectedConversation.partner.avatar ? (
                        <img src={selectedConversation.partner.avatar} alt="" />
                      ) : (
                        <div className="avatar-fallback">
                          {selectedConversation.partner.name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="partner-details">
                      <div className="partner-name">{selectedConversation.partner.name}</div>
                      <div className="partner-status">
                        <span className="status-dot"></span>
                        <span className="status-text">Online</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="messages-container" ref={messagesContainerRef}>
                  {hasMoreMessages && (
                    <div className="load-more-indicator">
                      <button onClick={loadMoreMessages} className="load-more-btn">
                        {loading ? 'Đang tải...' : 'Tải thêm tin nhắn cũ'}
                      </button>
                    </div>
                  )}

                  {/* Quick Replies - Show only for new conversations */}
                  {messages.length === 0 && !selectedConversation.conversation_id && (
                    <div className="quick-replies-section">
                      <p className="quick-replies-title">Câu hỏi gợi ý:</p>
                      <div className="quick-replies-buttons">
                        {quickReplies.map((reply, i) => (
                          <button
                            key={i}
                            onClick={() => setMessageInput(reply)}
                            className="quick-reply-btn"
                          >
                            {reply}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="messages-timeline">
                    {messages.map((msg, index) => {
                      const isOwn = msg.sender === 'buyer';
                      const showTime = index === 0 ||
                        new Date(msg.created_at).getTime() - new Date(messages[index-1].created_at).getTime() > 5 * 60 * 1000;

                      return (
                        <React.Fragment key={msg._id}>
                          {showTime && (
                            <div className="message-date">
                              {new Date(msg.created_at).toLocaleDateString('vi-VN', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </div>
                          )}
                          <div className={`message ${isOwn ? 'sent' : 'received'}`}>
                            {msg.content && (
                              <div className="message-bubble">{msg.content}</div>
                            )}
                            {msg.images?.length > 0 && (
                              <div className="message-images">
                                {msg.images.map((img, idx) => (
                                  <img key={idx} src={img} alt="" onClick={() => window.open(img, '_blank')} />
                                ))}
                              </div>
                            )}
                            <div className="message-time">{formatTimeShort(msg.created_at)}</div>
                          </div>
                        </React.Fragment>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                </div>

                <div className="messages-input">
                  {previewImages.length > 0 && (
                    <div className="preview-images">
                      {previewImages.map((url, idx) => (
                        <div key={idx} className="preview-image">
                          <img src={url} alt="" />
                          <button className="remove-preview" onClick={() => removePreviewImage(idx)}>✕</button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="input-area">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      style={{ display: 'none' }}
                    />
                    <button
                      className="input-action attachment-btn"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingImages}
                      title="Đính kèm ảnh"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
                    </svg>
                    </button>

                    <textarea
                      ref={textareaRef}
                      placeholder="Nhập nội dung chat"
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      disabled={sending}
                      rows={1}
                    />

                    <button
                      className="input-action send-btn"
                      onClick={handleSendMessage}
                      disabled={sending || (!messageInput.trim() && previewImages.length === 0)}
                      title="Gửi"
                    >
                      {sending ? (
                        <span className="sending-spinner"></span>
                      ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="22" y1="2" x2="11" y2="13"></line>
                          <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              // Empty state when no conversation is selected
              <div className="empty-content">
                <div className="empty-content-icon">💬</div>
                <h3 className="empty-content-title">Chọn một cuộc trò chuyện</h3>
                <p className="empty-content-description">
                  Chọn một cuộc trò chuyện từ danh sách bên trái để bắt đầu nhắn tin
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
});

Chat.displayName = 'Chat';

export default Chat;