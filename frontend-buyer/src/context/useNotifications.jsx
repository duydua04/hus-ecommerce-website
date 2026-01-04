// src/context/useNotifications.js
import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

// Shared state giữa các component
let sharedUnreadCount = 0;
const listeners = new Set();

// Notify all listeners khi count thay đổi
const notifyListeners = (count) => {
  sharedUnreadCount = count;
  listeners.forEach(listener => listener(count));
};

export const useNotifications = () => {
  const [unreadCount, setUnreadCount] = useState(sharedUnreadCount);

  // Load unread count từ API
  const loadUnreadCount = useCallback(async () => {
    try {
      // Load nhiều items hơn để đếm chính xác
      const res = await api.notification.getAll({
        limit: 100, // Load nhiều để đếm đúng, hoặc dùng total từ backend
        unread_only: true
      });

      // Ưu tiên dùng total từ backend nếu có
      let count = 0;

      if (res.total !== undefined) {
        // Backend trả về total count
        count = res.total;
      } else if (res.total_unread !== undefined) {
        count = res.total_unread;
      } else if (res.items) {
        // Đếm từ items
        count = res.items.filter(n => !n.is_read).length;
      }

      notifyListeners(count);
    } catch (err) {
      console.error('Load unread count error:', err);
    }
  }, []);

  // Subscribe to shared state
  useEffect(() => {
    const listener = (count) => setUnreadCount(count);
    listeners.add(listener);

    // Load count khi component mount
    loadUnreadCount();

    return () => {
      listeners.delete(listener);
    };
  }, [loadUnreadCount]);

  // Listen to WebSocket notifications
  useEffect(() => {
    const unsubscribe = api.websocket.onMessage('NOTIFICATION', () => {
      // Tăng count khi có notification mới
      notifyListeners(sharedUnreadCount + 1);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Helper functions
  const incrementUnread = useCallback(() => {
    notifyListeners(sharedUnreadCount + 1);
  }, []);

  const decrementUnread = useCallback(() => {
    notifyListeners(Math.max(sharedUnreadCount - 1, 0));
  }, []);

  const resetUnread = useCallback(() => {
    notifyListeners(0);
  }, []);

  return {
    unreadCount,
    loadUnreadCount,
    incrementUnread,
    decrementUnread,
    resetUnread
  };
};