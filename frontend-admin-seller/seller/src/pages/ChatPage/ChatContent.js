import React, { useState, useRef, useEffect } from "react";
import { Search, Send, Image, X } from "lucide-react";
import useChat from "../../hooks/useChat";
import {
  formatSmartTime,
  formatTimeOnly,
  formatDateSeparator,
} from "../../utils/timeUtils";
import "./Chat.scss";

export default function ChatContent() {
  const {
    conversations,
    activeConversation,
    messages,
    sending,
    selectConversation,
    sendTextMessage,
    sendImageMessage,
    loadMoreMessages,
    hasMoreMessages,
  } = useChat({ role: "seller" });

  // States
  const [messageInput, setMessageInput] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Refs
  const messagesEndRef = useRef(null);
  const messageContainerRef = useRef(null);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);

  // Auto scroll to bottom khi có tin nhắn mới
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const newHeight = Math.min(textareaRef.current.scrollHeight, 120);
      textareaRef.current.style.height = `${newHeight}px`;
    }
  }, [messageInput]);

  // Filter conversations
  const filteredConversations = conversations.filter((conv) => {
    // Filter by status
    let statusMatch = true;
    if (filterStatus === "unread") statusMatch = conv.unread_count > 0;
    if (filterStatus === "read") statusMatch = conv.unread_count === 0;

    // Filter by search
    const searchMatch =
      !searchQuery ||
      conv.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.last_message?.toLowerCase().includes(searchQuery.toLowerCase());

    return statusMatch && searchMatch;
  });

  // Hàm kiểm tra xem có cần hiển thị date separator không
  const shouldShowDateSeparator = (currentMsg, previousMsg) => {
    if (!previousMsg) return true;

    // So sánh date separator string của 2 tin nhắn
    const currentLabel = formatDateSeparator(currentMsg.created_at);
    const previousLabel = formatDateSeparator(previousMsg.created_at);

    return currentLabel !== previousLabel;
  };

  // Hàm hiển thị avatar
  const renderAvatar = (conversation, type = "list") => {
    if (conversation.customer_avatar) {
      return (
        <img
          src={conversation.customer_avatar}
          alt={conversation.customer_name || "Khách hàng"}
          className={`chat-avatar ${type}`}
        />
      );
    } else {
      const initial = conversation.customer_name?.[0]?.toUpperCase() || "U";
      return <div className={`chat-avatar-fallback ${type}`}>{initial}</div>;
    }
  };

  // Send message handler
  const handleSend = async () => {
    if (!messageInput.trim() || !activeConversation || sending) return;

    await sendTextMessage(activeConversation.id, messageInput);
    setMessageInput("");

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  // Image upload handler
  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0 && activeConversation) {
      await sendImageMessage(activeConversation.id, files);
      e.target.value = "";
    }
  };

  // Handle scroll to load more
  const handleScroll = (e) => {
    if (e.target.scrollTop === 0 && hasMoreMessages && !sending) {
      loadMoreMessages();
    }
  };

  return (
    <main className="main">
      <div className="toolbar chat-container">
        {/* LEFT SIDEBAR - Conversations List */}
        <aside className="chat-sidebar">
          {/* Header */}
          <div className="chat-sidebar-header">
            <h2 className="chat-sidebar-title">Tin nhắn khách hàng</h2>

            {/* Search */}
            <div className="chat-search">
              <Search className="chat-search-icon" />
              <input
                type="text"
                placeholder="Tìm kiếm cuộc trò chuyện..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="chat-search-input"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="chat-search-clear"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Filters */}
            <div className="chat-filters">
              {[
                {
                  key: "all",
                  label: "Tất cả",
                  count: conversations.length,
                },
                {
                  key: "unread",
                  label: "Chưa đọc",
                  count: conversations.filter((c) => c.unread_count > 0).length,
                },
                {
                  key: "read",
                  label: "Đã đọc",
                  count: conversations.filter((c) => c.unread_count === 0)
                    .length,
                },
              ].map(({ key, label, count }) => (
                <button
                  key={key}
                  onClick={() => setFilterStatus(key)}
                  className={`chat-filter-btn ${
                    filterStatus === key ? "active" : ""
                  }`}
                >
                  {label} {count > 0 && `(${count})`}
                </button>
              ))}
            </div>
          </div>

          {/* Conversations List */}
          <div className="chat-conversations">
            {filteredConversations.map((conv) => (
              <div
                key={conv.id}
                onClick={() => selectConversation(conv.id)}
                className={`chat-conversation-item ${
                  activeConversation?.id === conv.id ? "active" : ""
                }`}
              >
                {/* Avatar */}
                {renderAvatar(conv, "list")}

                <div className="chat-conversation-content">
                  <div className="chat-conversation-header">
                    <h3 className="chat-conversation-name">
                      {conv.customer_name || "Khách hàng"}
                    </h3>
                    <span className="chat-conversation-time">
                      {formatSmartTime(conv.last_message_time)}
                    </span>
                  </div>

                  <div className="chat-conversation-footer">
                    <p className="chat-conversation-message">
                      {conv.last_message || "Chưa có tin nhắn"}
                    </p>
                    {conv.unread_count > 0 && (
                      <span className="chat-conversation-badge">
                        {conv.unread_count}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {filteredConversations.length === 0 && (
              <div className="chat-empty-state">
                <Search className="chat-empty-icon" />
                <p className="chat-empty-text">
                  {searchQuery
                    ? "Không tìm thấy cuộc trò chuyện nào"
                    : "Chưa có cuộc trò chuyện nào"}
                </p>
              </div>
            )}
          </div>
        </aside>

        {/* CENTER - Chat Messages */}
        <main className="chat-main">
          {activeConversation ? (
            <>
              {/* Chat Header */}
              <div className="chat-header">
                <div className="chat-header-info">
                  {/* Avatar trong header */}
                  {renderAvatar(activeConversation, "header")}
                  <div>
                    <h3 className="chat-header-name">
                      {activeConversation.customer_name || "Khách hàng"}
                    </h3>
                    <p className="chat-header-status">
                      <span className="status-dot online"></span>
                      Online
                    </p>
                  </div>
                </div>
              </div>

              {/* Messages Area */}
              <div
                className="chat-messages"
                ref={messageContainerRef}
                onScroll={handleScroll}
              >
                {hasMoreMessages && (
                  <div className="chat-load-more">
                    <button
                      onClick={loadMoreMessages}
                      className="chat-load-more-btn"
                    >
                      Tải tin nhắn cũ hơn
                    </button>
                  </div>
                )}

                <div className="chat-messages-list">
                  {messages.map((msg, index) => {
                    const isOwn = msg.sender_role === "seller";
                    const showAvatar =
                      index === 0 ||
                      messages[index - 1].sender_role !== msg.sender_role;

                    // Kiểm tra xem có cần hiển thị date separator không
                    const showDateSeparator = shouldShowDateSeparator(
                      msg,
                      messages[index - 1]
                    );

                    return (
                      <React.Fragment key={msg.id}>
                        {/* Date Separator */}
                        {showDateSeparator && (
                          <div className="chat-date-separator">
                            <span>{formatDateSeparator(msg.created_at)}</span>
                          </div>
                        )}

                        {/* Message */}
                        <div
                          className={`chat-message ${isOwn ? "own" : "other"}`}
                        >
                          {/* Avatar cho tin nhắn */}
                          <div className="chat-message-avatar">
                            {showAvatar && !isOwn && (
                              <div className="avatar">
                                {renderAvatar(activeConversation, "message")}
                              </div>
                            )}
                          </div>

                          {/* Message Content */}
                          <div className="chat-message-content">
                            {msg.content && (
                              <div className="chat-message-bubble">
                                <p className="chat-message-text">
                                  {msg.content}
                                </p>
                              </div>
                            )}

                            {msg.image_urls && msg.image_urls.length > 0 && (
                              <div
                                className={`chat-message-images ${
                                  msg.image_urls.length === 1
                                    ? "single"
                                    : msg.image_urls.length === 2
                                    ? "double"
                                    : "grid"
                                }`}
                              >
                                {msg.image_urls.map((url, i) => (
                                  <img
                                    key={i}
                                    src={url}
                                    alt={`Attachment ${i + 1}`}
                                    className="chat-message-image"
                                    onClick={() => window.open(url, "_blank")}
                                  />
                                ))}
                              </div>
                            )}

                            <span className="chat-message-time">
                              {formatTimeOnly(msg.created_at)}
                              {isOwn && msg.is_read && (
                                <span className="read-indicator"> ✓✓</span>
                              )}
                            </span>
                          </div>
                        </div>
                      </React.Fragment>
                    );
                  })}

                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* Input Area */}
              <div className="chat-input-area">
                {/* Input Box */}
                <div className="chat-input-box">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    accept="image/*"
                    multiple
                    className="chat-file-input"
                  />

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="chat-input-action"
                    disabled={sending}
                    title="Gửi ảnh"
                  >
                    <Image className="w-5 h-5" />
                  </button>

                  <div className="chat-input-wrapper">
                    <textarea
                      ref={textareaRef}
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSend();
                        }
                      }}
                      placeholder="Aa"
                      className="chat-input-field"
                      disabled={sending}
                      rows={1}
                    />
                  </div>

                  <button
                    onClick={handleSend}
                    disabled={!messageInput.trim() || sending}
                    className="chat-send-btn"
                    title="Gửi"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="chat-empty-conversation">
              <div className="chat-empty-icon-wrapper">
                <Search className="chat-empty-icon" />
              </div>
              <h3 className="chat-empty-title">Chọn một cuộc trò chuyện</h3>
              <p className="chat-empty-description">
                Chọn một khách hàng từ danh sách bên trái để bắt đầu chat
              </p>
            </div>
          )}
        </main>
      </div>
    </main>
  );
}
