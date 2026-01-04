// src/services/api.js

const API_BASE_URL = 'http://localhost:8000';

const handleResponse = async (response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Network error' }));

    if (response.status === 401) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('userRole');
      localStorage.removeItem('savedBuyerEmail');

      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }

    throw new Error(JSON.stringify(error));
  }
  return response.json();
};

const apiCall = async (endpoint, options = {}) => {
  const token = localStorage.getItem('access_token');
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
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
  getMe: () => apiCall('/auth/me'),
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
    apiCall('/auth/logout', {
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
  // Biến lưu trữ kết nối WebSocket
  socket: null,
  reconnectAttempts: 0,
  maxReconnectAttempts: 5,
  reconnectDelay: 3000,
  messageHandlers: new Map(), // Map để lưu các handler cho từng loại message
  connectionListeners: [], // Listeners cho sự kiện connection

  // Khởi tạo kết nối WebSocket
  initialize: function() {
    const token = localStorage.getItem('access_token');
    if (!token) {
      console.warn('No token available for WebSocket connection');
      return;
    }

    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected');
      return;
    }

    try {
      // Tạo kết nối WebSocket với token
      const wsUrl = `ws://localhost:8000/websocket/?token=${encodeURIComponent(token)}`;
      this.socket = new WebSocket(wsUrl);

      // Sự kiện khi kết nối thành công
      this.socket.onopen = () => {
        console.log('✅ WebSocket connected successfully');
        this.reconnectAttempts = 0;

        // Thông báo cho tất cả connection listeners
        this.connectionListeners.forEach(listener => {
          try {
            listener({ type: 'connected', timestamp: new Date() });
          } catch (err) {
            console.error('Error in connection listener:', err);
          }
        });
      };

      // Sự kiện khi nhận message
      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('📨 WebSocket message received:', data);

          // Xử lý message theo type
          this.handleMessage(data);
        } catch (err) {
          console.error('Error parsing WebSocket message:', err, 'Raw data:', event.data);
        }
      };

      // Sự kiện khi có lỗi
      this.socket.onerror = (error) => {
        console.error('❌ WebSocket error:', error);

        this.connectionListeners.forEach(listener => {
          try {
            listener({ type: 'error', error, timestamp: new Date() });
          } catch (err) {
            console.error('Error in connection listener:', err);
          }
        });
      };

      // Sự kiện khi đóng kết nối
      this.socket.onclose = (event) => {
        console.log(`🔌 WebSocket disconnected. Code: ${event.code}, Reason: ${event.reason}`);

        // Thông báo cho connection listeners
        this.connectionListeners.forEach(listener => {
          try {
            listener({ type: 'disconnected', code: event.code, reason: event.reason, timestamp: new Date() });
          } catch (err) {
            console.error('Error in connection listener:', err);
          }
        });

        // Tự động reconnect nếu không phải do logout
        if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
          setTimeout(() => {
            this.reconnectAttempts++;
            console.log(`🔄 Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
            this.initialize();
          }, this.reconnectDelay);
        }
      };
    } catch (error) {
      console.error('Error initializing WebSocket:', error);
    }
  },

  // Đăng ký handler cho loại message cụ thể
  onMessage: function(messageType, handler) {
    if (!this.messageHandlers.has(messageType)) {
      this.messageHandlers.set(messageType, []);
    }
    this.messageHandlers.get(messageType).push(handler);

    // Trả về hàm để hủy đăng ký
    return () => {
      const handlers = this.messageHandlers.get(messageType);
      if (handlers) {
        const index = handlers.indexOf(handler);
        if (index > -1) {
          handlers.splice(index, 1);
        }
      }
    };
  },

  // Đăng ký listener cho sự kiện connection
  onConnectionChange: function(listener) {
    this.connectionListeners.push(listener);

    // Trả về hàm để hủy đăng ký
    return () => {
      const index = this.connectionListeners.indexOf(listener);
      if (index > -1) {
        this.connectionListeners.splice(index, 1);
      }
    };
  },

  // Xử lý message nhận được
  handleMessage: function(data) {
    const { type, payload } = data;

    // Gọi tất cả handlers cho loại message này
    const handlers = this.messageHandlers.get(type);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(payload);
        } catch (err) {
          console.error('Error in message handler:', err);
        }
      });
    }

    // Gọi handlers cho tất cả message types (wildcard)
    const allHandlers = this.messageHandlers.get('*');
    if (allHandlers) {
      allHandlers.forEach(handler => {
        try {
          handler({ type, payload });
        } catch (err) {
          console.error('Error in wildcard message handler:', err);
        }
      });
    }
  },

  // Gửi message qua WebSocket
  send: function(type, payload) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket is not connected. Cannot send message.');
      return false;
    }

    try {
      const message = JSON.stringify({ type, payload });
      this.socket.send(message);
      console.log('📤 WebSocket message sent:', { type, payload });
      return true;
    } catch (error) {
      console.error('Error sending WebSocket message:', error);
      return false;
    }
  },

  // Đóng kết nối WebSocket
  disconnect: function() {
    if (this.socket) {
      this.socket.close(1000, 'User initiated disconnect');
      this.socket = null;
      this.reconnectAttempts = 0;
      console.log('WebSocket connection closed by user');
    }
  },

  // Kiểm tra trạng thái kết nối
  isConnected: function() {
    return this.socket && this.socket.readyState === WebSocket.OPEN;
  },

  // Ping để giữ kết nối
  ping: function() {
    this.send('ping', { timestamp: Date.now() });
  }
};

// Khởi tạo WebSocket khi có token
const initializeWebSocket = () => {
  const token = localStorage.getItem('access_token');
  if (token && !websocketAPI.socket) {
    console.log('🔌 Initializing WebSocket connection...');
    websocketAPI.initialize();

    // Ping định kỳ để giữ kết nối
    setInterval(() => {
      if (websocketAPI.isConnected()) {
        websocketAPI.ping();
      }
    }, 30000); // Ping mỗi 30 giây
  }
};

// Kiểm tra token và khởi tạo WebSocket
if (localStorage.getItem('access_token')) {
  setTimeout(initializeWebSocket, 1000); // Delay 1 giây để tránh conflict
}

// Lắng nghe thay đổi localStorage để reconnect khi login/logout
window.addEventListener('storage', (event) => {
  if (event.key === 'access_token') {
    if (event.newValue) {
      // Có token mới - khởi tạo WebSocket
      setTimeout(initializeWebSocket, 500);
    } else {
      // Token bị xóa - đóng WebSocket
      websocketAPI.disconnect();
    }
  }
});

// ============================================
// CHAT APIs
// ============================================
export const chatAPI = {
  // GET /chat/conversations - Lấy danh sách cuộc trò chuyện
  getConversations: () => apiCall('/chat/conversations'),

  // GET /chat/{conversation_id}/messages - Lấy tin nhắn
  getMessages: (conversationId, cursor = null, limit = 20) => {
    const params = new URLSearchParams({ limit });
    if (cursor) params.append('cursor', cursor);
    return apiCall(`/chat/${conversationId}/messages?${params}`);
  },

  // POST /chat/send - Gửi tin nhắn
  sendMessage: (payload) =>
    apiCall('/chat/send', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // POST /chat/upload - Upload ảnh
  uploadImages: async (files) => {
    const token = localStorage.getItem('access_token');
    const formData = new FormData();

    files.forEach(file => {
      formData.append('files', file);
    });

    const response = await fetch(`${API_BASE_URL}/chat/upload`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Upload failed' }));
      throw new Error(error.detail || 'Upload failed');
    }

    return response.json();
  },
};

// ============================================
// CATEGORY APIs
// ============================================
export const categoryAPI = {
  getAll: () => apiCall('/common/categories/'),
  getById: (categoryId) => apiCall(`/common/categories/${categoryId}`),
};

// ============================================
// PRODUCT APIs
// ============================================
export const productAPI = {
  getAll: (params = {}) => {
    const queryParams = {
      limit: params.limit || 12,
      offset: params.offset || 0,
    };

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
    apiCall('/buyer/products/product/price', {
      method: 'POST',
      body: JSON.stringify({
        product_id: productId,
        variant_id: variantId,
        size_id: sizeId,
      }),
    }),
  getByCategory: (categoryId, params = {}) => {
    const queryParams = {
      limit: params.limit || 12,
      offset: params.offset || 0,
    };

    // Thêm tất cả các filter params
    if (params.q) queryParams.q = params.q;
    if (params.min_price !== undefined) queryParams.min_price = params.min_price;
    if (params.max_price !== undefined) queryParams.max_price = params.max_price;
    if (params.rating_filter) queryParams.rating_filter = params.rating_filter;
    if (params.sort) queryParams.sort = params.sort;

    const query = new URLSearchParams(queryParams);
    return apiCall(`/buyer/products/categories/${categoryId}?${query}`);
  },
  getVariants: (productId) => apiCall(`/buyer/products/${productId}/variants`),
  getSizes: (productId, variantId) =>
    apiCall(`/buyer/products/${productId}/variants/${variantId}/sizes`),
  search: (searchQuery, params = {}) => {
    return productAPI.getAll({
      q: searchQuery,
      ...params,
    });
  },
};

// ============================================
// NOTIFICATION APIs
// ============================================
export const notificationAPI = {
  getAll: (params = {}) => {
    const queryParams = {
      limit: params.limit || 20,
      ...(params.cursor && { cursor: params.cursor }),
      ...(params.unread_only !== undefined && {
        unread_only: params.unread_only,
      }),
    };

    const query = new URLSearchParams(queryParams);
    return apiCall(`/buyer/notifications?${query}`);
  },
  markAsRead: (notificationId) =>
    apiCall(`/buyer/notifications/${notificationId}/read`, {
      method: 'PUT',
    }),
  markAllAsRead: () =>
    apiCall('/buyer/notifications/read-all', {
      method: 'PUT',
    }),
};

// ============================================
// CART APIs
// ============================================
export const cartAPI = {
  getCart: () => apiCall('/buyer/cart/show'),
  addItem: (productId, variantId, sizeId, quantity = 1) =>
    apiCall('/buyer/cart/add', {
      method: 'POST',
      body: JSON.stringify({
        product_id: productId,
        variant_id: variantId,
        size_id: sizeId,
        quantity,
      }),
    }),
  updateQuantity: (itemId, data) =>
    apiCall(`/buyer/cart/item/quantity/${itemId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  updateVariantSize: (itemId, data) =>
    apiCall(`/buyer/cart/item/variant-size/${itemId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  removeItem: (itemId) =>
    apiCall(`/buyer/cart/product/${itemId}`, {
      method: 'DELETE',
    }),
  calculateSummary: (data) =>
    apiCall('/buyer/cart/summary', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  searchItems: (query, limit = 10) => {
    const params = new URLSearchParams({ q: query, limit });
    return apiCall(`/buyer/cart/cart/search?${params}`);
  },
};

// ============================================
// ORDER APIs
// ============================================
export const orderAPI = {
  // GET /buyer/orders/tracking?tab=
  getOrdersTracking: (tab = null) => {
    const params = tab ? `?tab=${tab}` : '';
    return apiCall(`/buyer/orders/tracking${params}`);
  },

  // GET /buyer/orders?limit=&offset=&status=
  getOrders: (params = {}) => {
    const query = new URLSearchParams({
      limit: params.limit || 10,
      offset: params.offset || 0,
      ...(params.status && { status: params.status }),
    });
    return apiCall(`/buyer/orders?${query}`);
  },

  // GET /buyer/orders/{order_id}
  getById: (orderId) => apiCall(`/buyer/orders/${orderId}`),

  // POST /buyer/orders
  createOrder: (orderData) =>
    apiCall('/buyer/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    }),

  // POST /buyer/orders/selected-items
  getSelectedItems: (cartItemIds) =>
    apiCall('/buyer/orders/selected-items', {
      method: 'POST',
      body: JSON.stringify({
        shopping_cart_item_ids: cartItemIds
      }),
    }),

  // PATCH /buyer/orders/{order_id}/cancel
  cancelOrder: (orderId) =>
    apiCall(`/buyer/orders/${orderId}/cancel`, {
      method: 'PATCH',
    }),

  // PATCH /buyer/orders/{order_id}/confirm
  confirmReceived: (orderId) =>
    apiCall(`/buyer/orders/${orderId}/confirm`, {
      method: 'PATCH',
    }),

  // PATCH /buyer/orders/{order_id}/shipping-address
  updateShippingAddress: (orderId, addressData) =>
    apiCall(`/buyer/orders/${orderId}/shipping-address`, {
      method: 'PATCH',
      body: JSON.stringify(addressData),
    }),
};


// ============================================
// ADDRESSES APIs
// ============================================
export const addressAPI = {
  list: () => apiCall('/buyer/addresses'),
  create: (addressData, isDefault = false, label = null) => {
    const params = new URLSearchParams();
    if (isDefault) params.append('is_default', true);
    if (label) params.append('label', label);

    return apiCall(`/buyer/addresses/create-and-link?${params}`, {
      method: 'POST',
      body: JSON.stringify(addressData),
    });
  },
  updateLink: (buyerAddressId, data) =>
    apiCall(`/buyer/addresses/${buyerAddressId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  updateContent: (buyerAddressId, data) =>
    apiCall(`/buyer/addresses/${buyerAddressId}/address`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  delete: (buyerAddressId) =>
    apiCall(`/buyer/addresses/${buyerAddressId}`, {
      method: 'DELETE',
    }),
  setDefault: (buyerAddressId) =>
    apiCall(`/buyer/addresses/${buyerAddressId}/default`, {
      method: 'PATCH',
    }),
};

// ============================================
// PROFILE APIs
// ============================================
export const profileAPI = {
  getProfile: () => apiCall('/buyer/profile'),
  updateProfile: (profileData) =>
    apiCall('/buyer/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    }),
  updatePassword: (currentPassword, newPassword) =>
    apiCall('/buyer/profile/password', {
      method: 'POST',
      body: JSON.stringify({
        current_password: currentPassword,
        new_password: newPassword,
      }),
    }),
};

// ============================================
// AVATAR APIs
// ============================================
export const avatarAPI = {
  // Upload avatar - trả về object chứa public_url
  upload: async (file) => {
    const token = localStorage.getItem('access_token');
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/avatars/me`, {
      method: 'POST',
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Upload failed' }));
      throw new Error(error.detail || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // Backend trả về: { public_url, object_key, size, content_type, role, email }
    // Frontend cần: { avatar_url }
    return {
      ...data,
      avatar_url: data.public_url
    };
  },

  // Delete avatar
  delete: async () => {
    const token = localStorage.getItem('access_token');

    const response = await fetch(`${API_BASE_URL}/avatars/me`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Delete failed' }));
      throw new Error(error.detail || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  },
};

// ============================================
// REVIEW APIs
// ============================================
export const reviewAPI = {

  // 🔹 Lấy ảnh + video review của tất cả sản phẩm
  getAllMedia: () =>
    apiCall('/buyer/reviews/media'),

  // 🔹 Lấy review theo product
  getByProduct: (productId, params = {}) => {
    const query = new URLSearchParams({
      page: params.page || 1,
      limit: params.limit || 10,
      ...(params.rating && { rating: params.rating }),
    });

    return apiCall(`/buyer/reviews/product/${productId}?${query}`);
  },

  // 🔹 Lấy tất cả review của buyer hiện tại
  getMyReviews: (params = {}) => {
    const query = new URLSearchParams({
      page: params.page || 1,
      limit: params.limit || 10,
    });

    return apiCall(`/buyer/reviews?${query}`);
  },

  // 🔹 Upload ảnh / video review (trả về array URL)
  uploadFiles: async (files = []) => {
    const token = localStorage.getItem('access_token');
    const formData = new FormData();

    files.forEach(file => {
      formData.append('files', file);
    });

    const response = await fetch(
      `${API_BASE_URL}/buyer/reviews/upload`,
      {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Upload failed' }));
      throw new Error(error.detail || 'Upload failed');
    }

    return response.json();
  },

  // 🔹 Tạo review
  create: (data) =>
    apiCall('/buyer/reviews/create', {
      method: 'POST',
      body: JSON.stringify({
        product_id: data.product_id,
        order_id: data.order_id,
        rating: data.rating,
        content: data.content,
        images: data.images || [],
        videos: data.videos || [],
      }),
    }),

  // 🔹 Update review
  update: (productId, orderId, data) =>
    apiCall(`/buyer/reviews/${productId}/${orderId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        rating: data.rating,
        comment: data.comment,
      }),
    }),

  // 🔹 Delete review
  delete: (productId, orderId) =>
    apiCall(`/buyer/reviews/${productId}/${orderId}`, {
      method: 'DELETE',
    }),

  getReplies: (reviewId) => {
    return request.get(`/reviews/${reviewId}/replies`);
  },
};

// ============================================
// CARRIER APIs (Shipping)
// ============================================
export const carrierAPI = {
  // GET /buyer/carriers/
  getAll: () => apiCall('/buyer/carriers/'),

  // POST /buyer/carriers/calculate
  calculateFee: (carrierId, addressId, weight, cartTotal) =>
    apiCall('/buyer/carriers/calculate', {
      method: 'POST',
      body: JSON.stringify({
        carrier_id: carrierId,
        address_id: addressId,  // Thêm address_id từ request schema
        weight: weight,
        cart_total: cartTotal
      }),
    }),

  // POST /buyer/carriers/available
  getAvailable: (addressId, weight, cartTotal) =>
    apiCall('/buyer/carriers/available', {
      method: 'POST',
      body: JSON.stringify({
        address_id: addressId,
        weight: weight,
        cart_total: cartTotal
      }),
    }),

  // GET /buyer/carriers/{carrier_id}
  getById: (carrierId) => apiCall(`/buyer/carriers/${carrierId}`),
};

// ============================================
// DISCOUNT APIs (Vouchers)
// ============================================
export const discountAPI = {
  // GET /buyer/discount/available?cart_total=&q=&limit=&offset=
  getAvailable: (params = {}) => {
    const queryParams = new URLSearchParams();

    if (params.cart_total !== undefined) queryParams.append('cart_total', params.cart_total);
    if (params.q) queryParams.append('q', params.q);
    queryParams.append('limit', params.limit || 10);
    queryParams.append('offset', params.offset || 0);

    return apiCall(`/buyer/discount/available?${queryParams}`);
  },

  // POST /buyer/discount/validate (validate bằng code)
  validateByCode: (code, cartTotal) =>
    apiCall('/buyer/discount/validate', {
      method: 'POST',
      body: JSON.stringify({
        code: code,
        cart_total: cartTotal
      }),
    }),

  // POST /buyer/discount/validate (validate bằng discount_id)
  validateById: (discountId, cartTotal) =>
    apiCall('/buyer/discount/validate', {
      method: 'POST',
      body: JSON.stringify({
        discount_id: discountId,
        cart_total: cartTotal
      }),
    }),

  // GET /buyer/discount/best?cart_total=
  getBest: (cartTotal) => {
    const params = new URLSearchParams({ cart_total: cartTotal });
    return apiCall(`/buyer/discount/best?${params}`);
  },

  // POST /buyer/discount/preview
  preview: (discountId, cartTotal) =>
    apiCall('/buyer/discount/preview', {
      method: 'POST',
      body: JSON.stringify({
        discount_id: discountId,
        cart_total: cartTotal
      }),
    }),

  // GET /buyer/discount/{discount_id}
  getById: (discountId) => apiCall(`/buyer/discount/${discountId}`),

  // GET /buyer/discount/?limit=&offset=
  getAll: (params = {}) => {
    const query = new URLSearchParams({
      limit: params.limit || 10,
      offset: params.offset || 0,
    });
    return apiCall(`/buyer/discount/?${query}`);
  },
};

// ============================================
// EXPORT ALL APIs
// ============================================
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