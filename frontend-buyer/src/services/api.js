const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const handleResponse = async (response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Network error' }));

    if (response.status === 401) {
      // Token trong Cookie hết hạn hoặc không hợp lệ
      // Xóa thông tin User Role ở Client để UI cập nhật
      localStorage.removeItem('userRole');
      localStorage.removeItem('savedBuyerEmail');

      // Chỉ redirect nếu không phải đang ở trang login/register
      if (!window.location.pathname.startsWith('/login') &&
          !window.location.pathname.startsWith('/register')) {
        window.location.href = '/login';
      }
    }

    throw new Error(JSON.stringify(error));
  }
  return response.json();
};

const apiCall = async (endpoint, options = {}) => {
  // ✅ [CHANGE] QUAN TRỌNG: credentials: 'include' để trình duyệt gửi Cookie
  const config = {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      // ❌ ĐÃ XÓA: Authorization Bearer
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    return await handleResponse(response);
  } catch (error) {
    console.error(`API Error (${endpoint}):`, error);
    throw error;
  }
};

// ============================================
// AUTHENTICATION APIs
// ============================================
export const authAPI = {
  getMe: (role = 'buyer') => apiCall(`/auth/me?role=${role}`),
  loginBuyer: (email, password) =>
    apiCall('/auth/login/buyer', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  registerBuyer: (userData) =>
    apiCall('/auth/register/buyer', {
      method: 'POST',
      body: JSON.stringify(userData),
    }),
  logout: () =>
    apiCall('/auth/logout?role=buyer', {
      method: 'POST',
    }),
  refreshToken: () =>
    apiCall('/auth/refresh', {
      method: 'POST',
    }),
};

// ============================================
// WEBSOCKET APIs (Realtime)
// ============================================
export const websocketAPI = {
  socket: null,
  reconnectAttempts: 0,
  maxReconnectAttempts: 5,
  reconnectDelay: 3000,
  messageHandlers: new Map(),
  connectionListeners: [],

  initialize: function() {
    // ✅ [CHANGE] Kiểm tra userRole thay vì access_token
    if (!localStorage.getItem('userRole')) {
      console.warn('User not logged in, skipping WebSocket');
      return;
    }

    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected');
      return;
    }

    try {
      // ✅ [CHANGE] Bỏ query param ?token=...
      // Cookie sẽ tự động được trình duyệt gửi đi khi handshake WS (cùng domain/localhost)
      let wsBaseUrl = API_BASE_URL.replace('http://', 'ws://').replace('https://', 'wss://');
      if (wsBaseUrl.endsWith('/')) {
        wsBaseUrl = wsBaseUrl.slice(0, -1);
      }

      const wsUrl = `${wsBaseUrl}/websocket/?role=buyer`;
      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        console.log('✅ WebSocket connected successfully');
        this.reconnectAttempts = 0;
        this.connectionListeners.forEach(listener => {
          try { listener({ type: 'connected', timestamp: new Date() }); } catch (err) {}
        });
      };

      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
        }
      };

      this.socket.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        this.connectionListeners.forEach(listener => {
            try { listener({ type: 'error', error, timestamp: new Date() }); } catch (err) {}
        });
      };

      this.socket.onclose = (event) => {
        console.log(`🔌 WebSocket disconnected. Code: ${event.code}`);
        this.connectionListeners.forEach(listener => {
            try { listener({ type: 'disconnected', code: event.code, timestamp: new Date() }); } catch (err) {}
        });

        if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
          setTimeout(() => {
            this.reconnectAttempts++;
            this.initialize();
          }, this.reconnectDelay);
        }
      };
    } catch (error) {
      console.error('Error initializing WebSocket:', error);
    }
  },

  onMessage: function(messageType, handler) {
    if (!this.messageHandlers.has(messageType)) this.messageHandlers.set(messageType, []);
    this.messageHandlers.get(messageType).push(handler);
    return () => {
      const handlers = this.messageHandlers.get(messageType);
      if (handlers) {
        const index = handlers.indexOf(handler);
        if (index > -1) handlers.splice(index, 1);
      }
    };
  },

  onConnectionChange: function(listener) {
    this.connectionListeners.push(listener);
    return () => {
      const index = this.connectionListeners.indexOf(listener);
      if (index > -1) this.connectionListeners.splice(index, 1);
    };
  },

  handleMessage: function(data) {
    // ✅ [FIX] Gom payload bằng Rest Operator để khớp với backend structure
    const { type, ...payload } = data;

    const handlers = this.messageHandlers.get(type);
    if (handlers) handlers.forEach(handler => handler(payload));

    const allHandlers = this.messageHandlers.get('*');
    if (allHandlers) allHandlers.forEach(handler => handler({ type, payload }));
  },

  send: function(type, payload) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return false;
    try {
      this.socket.send(JSON.stringify({ type, payload }));
      return true;
    } catch (error) { return false; }
  },

  disconnect: function() {
    if (this.socket) {
      this.socket.close(1000, 'User initiated disconnect');
      this.socket = null;
      this.reconnectAttempts = 0;
    }
  },

  isConnected: function() {
    return this.socket && this.socket.readyState === WebSocket.OPEN;
  },

  ping: function() {
    this.send('ping', { timestamp: Date.now() });
  }
};

const initializeWebSocket = () => {
  if (localStorage.getItem('userRole') && !websocketAPI.socket) {
    websocketAPI.initialize();
    setInterval(() => {
      if (websocketAPI.isConnected()) websocketAPI.ping();
    }, 30000);
  }
};

setTimeout(initializeWebSocket, 1000);

window.addEventListener('storage', (event) => {
  if (event.key === 'userRole') {
    if (event.newValue) setTimeout(initializeWebSocket, 500);
    else websocketAPI.disconnect();
  }
});

// ============================================
// CHAT APIs (Sửa upload ảnh dùng credentials)
// ============================================
export const chatAPI = {
  getConversations: () => apiCall('/chat/conversations'),
  getMessages: (conversationId, cursor = null, limit = 20) => {
    const params = new URLSearchParams({ limit });
    if (cursor) params.append('cursor', cursor);
    return apiCall(`/chat/${conversationId}/messages?${params}`);
  },
  sendMessage: (payload) => apiCall('/chat/send', { method: 'POST', body: JSON.stringify(payload) }),

  uploadImages: async (files) => {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));

    // ✅ [CHANGE] credentials: 'include'
    const response = await fetch(`${API_BASE_URL}/chat/upload`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });
    if (!response.ok) throw new Error('Upload failed');
    return response.json();
  },

  markAsRead: (conversationId) => apiCall(`/chat/${conversationId}/read`, { method: 'PATCH' }),
};

// ============================================
// AVATAR APIs
// ============================================
export const avatarAPI = {
  upload: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch(`${API_BASE_URL}/avatars/me`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });
    if (!response.ok) throw new Error('Upload failed');
    const data = await response.json();
    return { ...data, avt_url: data.public_url };
  },
  delete: async () => {
    const response = await fetch(`${API_BASE_URL}/avatars/me`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!response.ok) throw new Error('Delete failed');
    return response.json();
  },
};

// ============================================
// REVIEW APIs (Sửa upload dùng credentials)
// ============================================
export const reviewAPI = {
  getAllMedia: () => apiCall('/buyer/reviews/media'),
  getByProduct: (productId, params = {}) => {
    const query = new URLSearchParams({
      page: params.page || 1,
      limit: params.limit || 10,
      ...(params.rating && { rating: params.rating }),
    });
    return apiCall(`/buyer/reviews/product/${productId}?${query}`);
  },
  getMyReviews: (params = {}) => {
    const query = new URLSearchParams({ page: params.page || 1, limit: params.limit || 10 });
    return apiCall(`/buyer/reviews?${query}`);
  },
  getReviewedOrderIds: () =>
    apiCall('/buyer/reviews/reviewed-orders'),
  uploadFiles: async (files = []) => {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    const response = await fetch(`${API_BASE_URL}/buyer/reviews/upload`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });
    if (!response.ok) throw new Error('Upload failed');
    return response.json();
  },
  create: (data) => apiCall('/buyer/reviews/create', { method: 'POST', body: JSON.stringify(data) }),
  update: (productId, orderId, data) => apiCall(`/buyer/reviews/${productId}/${orderId}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (productId, orderId) => apiCall(`/buyer/reviews/${productId}/${orderId}`, { method: 'DELETE' }),
  getReplies: (reviewId) => apiCall(`/reviews/${reviewId}/replies`),
};

// ============================================
// CÁC SERVICE KHÁC GIỮ NGUYÊN (VÌ DÙNG apiCall)
// ============================================
export const categoryAPI = {
  getAll: () => apiCall('/common/categories'),
  getById: (categoryId) => apiCall(`/common/categories/${categoryId}`),
};

export const productAPI = {
  getAll: (params = {}) => {
    const queryParams = { limit: params.limit || 12, offset: params.offset || 0 };
    if (params.q) queryParams.q = params.q;
    if (params.min_price !== undefined) queryParams.min_price = params.min_price;
    if (params.max_price !== undefined) queryParams.max_price = params.max_price;
    if (params.rating_filter) queryParams.rating_filter = params.rating_filter;
    if (params.sort) queryParams.sort = params.sort;
    const query = new URLSearchParams(queryParams);
    return apiCall(`/buyer/products/products?${query}`);
  },
  getById: (productId) => apiCall(`/buyer/products/${productId}`),
  getShopInfo: (productId) => apiCall(`/buyer/products/products/${productId}/shop`),
  getPrice: (productId, variantId, sizeId) =>
    apiCall('/buyer/products/product/price', { method: 'POST', body: JSON.stringify({ product_id: productId, variant_id: variantId, size_id: sizeId }) }),
  getByCategory: (categoryId, params = {}) => {
    const queryParams = { limit: params.limit || 12, offset: params.offset || 0 };
    if (params.q) queryParams.q = params.q;
    if (params.min_price !== undefined) queryParams.min_price = params.min_price;
    if (params.max_price !== undefined) queryParams.max_price = params.max_price;
    if (params.rating_filter) queryParams.rating_filter = params.rating_filter;
    if (params.sort) queryParams.sort = params.sort;
    const query = new URLSearchParams(queryParams);
    return apiCall(`/buyer/products/categories/${categoryId}?${query}`);
  },
  getVariants: (productId) => apiCall(`/buyer/products/${productId}/variants`),
  getSizes: (productId, variantId) => apiCall(`/buyer/products/${productId}/variants/${variantId}/sizes`),
  search: (searchQuery, params = {}) => productAPI.getAll({ q: searchQuery, ...params }),
};

export const notificationAPI = {
  getAll: (params = {}) => {
    const queryParams = { limit: params.limit || 20 };
    if (params.cursor) queryParams.cursor = params.cursor;
    if (params.unread_only !== undefined) queryParams.unread_only = params.unread_only;
    const query = new URLSearchParams(queryParams);
    return apiCall(`/buyer/notifications?${query}`);
  },
  markAsRead: (notificationId) => apiCall(`/buyer/notifications/${notificationId}/read`, { method: 'PUT' }),
  markAllAsRead: () => apiCall('/buyer/notifications/read-all', { method: 'PUT' }),
};

export const cartAPI = {
  getCart: () => apiCall('/buyer/cart/show'),
  addItem: (productId, variantId, sizeId, quantity = 1) =>
    apiCall('/buyer/cart/add', { method: 'POST', body: JSON.stringify({ product_id: productId, variant_id: variantId, size_id: sizeId, quantity }) }),
  updateQuantity: (itemId, data) => apiCall(`/buyer/cart/item/quantity/${itemId}`, { method: 'PATCH', body: JSON.stringify(data) }),
  updateVariantSize: (itemId, data) => apiCall(`/buyer/cart/item/variant-size/${itemId}`, { method: 'PATCH', body: JSON.stringify(data) }),
  removeItem: (itemId) => apiCall(`/buyer/cart/product/${itemId}`, { method: 'DELETE' }),
  calculateSummary: (data) => apiCall('/buyer/cart/summary', { method: 'POST', body: JSON.stringify(data) }),
  searchItems: (query, limit = 10) => {
    const params = new URLSearchParams({ q: query, limit });
    return apiCall(`/buyer/cart/cart/search?${params}`);
  },
};

export const orderAPI = {
  getOrdersTracking: (tab = null) => {
    const params = tab ? `?tab=${tab}` : '';
    return apiCall(`/buyer/orders/tracking${params}`);
  },
  getOrders: (params = {}) => {
    const query = new URLSearchParams({ limit: params.limit || 10, offset: params.offset || 0, ...(params.status && { status: params.status }) });
    return apiCall(`/buyer/orders?${query}`);
  },
  getById: (orderId) => apiCall(`/buyer/orders/${orderId}`),
  createOrder: (orderData) => apiCall('/buyer/orders', { method: 'POST', body: JSON.stringify(orderData) }),
  getSelectedItems: (cartItemIds) => apiCall('/buyer/orders/selected-items', { method: 'POST', body: JSON.stringify({ shopping_cart_item_ids: cartItemIds }) }),
  cancelOrder: (orderId) => apiCall(`/buyer/orders/${orderId}/cancel`, { method: 'PATCH' }),
  confirmReceived: (orderId) => apiCall(`/buyer/orders/${orderId}/confirm`, { method: 'PATCH' }),
  updateShippingAddress: (orderId, addressData) => apiCall(`/buyer/orders/${orderId}/shipping-address`, { method: 'PATCH', body: JSON.stringify(addressData) }),
};

export const addressAPI = {
  list: () => apiCall('/buyer/addresses'),
  create: (addressData, isDefault = false, label = null) => {
    const params = new URLSearchParams();
    if (isDefault) params.append('is_default', true);
    if (label) params.append('label', label);
    return apiCall(`/buyer/addresses/create-and-link?${params}`, { method: 'POST', body: JSON.stringify(addressData) });
  },
  updateLink: (buyerAddressId, data) => apiCall(`/buyer/addresses/${buyerAddressId}`, { method: 'PATCH', body: JSON.stringify(data) }),
  updateContent: (buyerAddressId, data) => apiCall(`/buyer/addresses/${buyerAddressId}/address`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (buyerAddressId) => apiCall(`/buyer/addresses/${buyerAddressId}`, { method: 'DELETE' }),
  setDefault: (buyerAddressId) => apiCall(`/buyer/addresses/${buyerAddressId}/default`, { method: 'PATCH' }),
};

export const profileAPI = {
  getProfile: () => apiCall('/buyer/profile'),
  updateProfile: (profileData) => apiCall('/buyer/profile', { method: 'PUT', body: JSON.stringify(profileData) }),
  updatePassword: (currentPassword, newPassword) => apiCall('/buyer/profile/password', { method: 'POST', body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }) }),
};

export const carrierAPI = {
  getAll: () => apiCall('/buyer/carriers/'),
  calculateFee: (carrierId, addressId, weight, cartTotal) => apiCall('/buyer/carriers/calculate', { method: 'POST', body: JSON.stringify({ carrier_id: carrierId, address_id: addressId, weight: weight, cart_total: cartTotal }) }),
  getAvailable: (addressId, weight, cartTotal) => apiCall('/buyer/carriers/available', { method: 'POST', body: JSON.stringify({ address_id: addressId, weight: weight, cart_total: cartTotal }) }),
  getById: (carrierId) => apiCall(`/buyer/carriers/${carrierId}`),
};

export const discountAPI = {
  getAvailable: (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.cart_total !== undefined) queryParams.append('cart_total', params.cart_total);
    if (params.q) queryParams.append('q', params.q);
    queryParams.append('limit', params.limit || 10);
    queryParams.append('offset', params.offset || 0);
    return apiCall(`/buyer/discount/available?${queryParams}`);
  },
  validateByCode: (code, cartTotal) => apiCall('/buyer/discount/validate', { method: 'POST', body: JSON.stringify({ code: code, cart_total: cartTotal }) }),
  validateById: (discountId, cartTotal) => apiCall('/buyer/discount/validate', { method: 'POST', body: JSON.stringify({ discount_id: discountId, cart_total: cartTotal }) }),
  getBest: (cartTotal) => {
    const params = new URLSearchParams({ cart_total: cartTotal });
    return apiCall(`/buyer/discount/best?${params}`);
  },
  preview: (discountId, cartTotal) => apiCall('/buyer/discount/preview', { method: 'POST', body: JSON.stringify({ discount_id: discountId, cart_total: cartTotal }) }),
  getById: (discountId) => apiCall(`/buyer/discount/${discountId}`),
  getAll: (params = {}) => {
    const query = new URLSearchParams({ limit: params.limit || 10, offset: params.offset || 0 });
    return apiCall(`/buyer/discount/?${query}`);
  },
};

export default {
  auth: authAPI,
  websocket: websocketAPI,
  chat: chatAPI,
  category: categoryAPI,
  product: productAPI,
  notification: notificationAPI,
  cart: cartAPI,
  order: orderAPI,
  address: addressAPI,
  profile: profileAPI,
  avatar: avatarAPI,
  review: reviewAPI,
  carrier: carrierAPI,
  discount: discountAPI,
};