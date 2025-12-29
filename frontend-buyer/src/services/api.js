// src/services/api.js

const API_BASE_URL = 'http://localhost:8000';

const handleResponse = async (response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Network error' }));
    throw new Error(error.detail || `HTTP error! status: ${response.status}`);
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
  // Get current user info
  getMe: () => apiCall('/auth/me'),

  // Login as buyer
  loginBuyer: (email, password) =>
    apiCall('/auth/login/buyer', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  // Register as buyer
  registerBuyer: (userData) =>
    apiCall('/auth/register/buyer', {
      method: 'POST',
      body: JSON.stringify(userData),
    }),

  // Logout
  logout: () =>
    apiCall('/auth/logout', {
      method: 'POST',
    }),

  // Refresh token
  refreshToken: () =>
    apiCall('/auth/refresh', {
      method: 'POST',
    }),
};

// ============================================
// CATEGORY APIs
// ============================================
export const categoryAPI = {
  // Get all categories (from common endpoint)
  getAll: () => apiCall('/common/categories/'),

  // Get category by ID
  getById: (categoryId) => apiCall(`/common/categories/${categoryId}`),
};

// ============================================
// PRODUCT APIs
// ============================================
export const productAPI = {
  // Get products list with filters
  getAll: (params = {}) => {
    const queryParams = {
      limit: params.limit || 12,
      offset: params.offset || 0,
    };

    // Add optional parameters
    if (params.q) queryParams.q = params.q;
    if (params.min_price !== undefined) queryParams.min_price = params.min_price;
    if (params.max_price !== undefined) queryParams.max_price = params.max_price;
    if (params.rating_filter) queryParams.rating_filter = params.rating_filter;
    if (params.sort) queryParams.sort = params.sort;

    const query = new URLSearchParams(queryParams);
    return apiCall(`/buyer/products/products?${query}`);
  },

  // Get product details
  getById: (productId) => apiCall(`/buyer/products/${productId}`),

  // Get shop info for a product
  getShopInfo: (productId) => apiCall(`/buyer/products/products/${productId}/shop`),

  // Get product price details
  getPrice: (productId, variantId, sizeId) =>
    apiCall('/buyer/products/product/price', {
      method: 'POST',
      body: JSON.stringify({
        product_id: productId,
        variant_id: variantId,
        size_id: sizeId,
      }),
    }),

  // Get products by category
  getByCategory: (categoryId, params = {}) => {
    const queryParams = {
      limit: params.limit || 10,
      offset: params.offset || 0,
    };

    if (params.q) queryParams.q = params.q;

    const query = new URLSearchParams(queryParams);
    return apiCall(`/buyer/products/categories/${categoryId}?${query}`);
  },

  // Get product variants
  getVariants: (productId) => apiCall(`/buyer/products/${productId}/variants`),

  // Get variant sizes
  getSizes: (productId, variantId) =>
    apiCall(`/buyer/products/${productId}/variants/${variantId}/sizes`),

  // Search products (alias for getAll with search query)
  search: (searchQuery, params = {}) => {
    return productAPI.getAll({
      q: searchQuery,
      ...params,
    });
  },
};

// ============================================
// CART APIs
// ============================================
export const cartAPI = {
  // Get current cart
  getCart: () => apiCall('/buyer/cart'),

  // Add item to cart
  addItem: (productId, variantId, sizeId, quantity = 1) =>
    apiCall('/buyer/cart/items', {
      method: 'POST',
      body: JSON.stringify({
        product_id: productId,
        variant_id: variantId,
        size_id: sizeId,
        quantity,
      }),
    }),

  // Update cart item quantity
  updateItem: (itemId, quantity) =>
    apiCall(`/buyer/cart/items/${itemId}`, {
      method: 'PATCH',
      body: JSON.stringify({ quantity }),
    }),

  // Remove item from cart
  removeItem: (itemId) =>
    apiCall(`/buyer/cart/items/${itemId}`, {
      method: 'DELETE',
    }),

  // Clear cart
  clearCart: () =>
    apiCall('/buyer/cart', {
      method: 'DELETE',
    }),
};

// ============================================
// ORDER APIs
// ============================================
export const orderAPI = {
  // Get buyer's orders
  getOrders: (params = {}) => {
    const query = new URLSearchParams({
      limit: params.limit || 10,
      offset: params.offset || 0,
      ...(params.status && { status: params.status }),
    });
    return apiCall(`/buyer/orders?${query}`);
  },

  // Get order details
  getById: (orderId) => apiCall(`/buyer/orders/${orderId}`),

  // Create order from cart
  createOrder: (orderData) =>
    apiCall('/buyer/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    }),

  // Cancel order
  cancelOrder: (orderId) =>
    apiCall(`/buyer/orders/${orderId}/cancel`, {
      method: 'POST',
    }),
};

// ============================================
// ADDRESS APIs
// ============================================
export const addressAPI = {
  // Get all buyer addresses
  getAll: () => apiCall('/buyer/addresses'),

  // Create and link new address
  createAndLink: (addressData, isDefault = false, label = null) =>
    apiCall('/buyer/addresses/create-and-link', {
      method: 'POST',
      body: JSON.stringify(addressData),
      headers: {
        'Content-Type': 'application/json',
      },
    }).then(res => res).catch(err => {
      // Handle query params for this endpoint
      const query = new URLSearchParams({
        is_default: isDefault,
        ...(label && { label }),
      });
      return apiCall(`/buyer/addresses/create-and-link?${query}`, {
        method: 'POST',
        body: JSON.stringify(addressData),
      });
    }),

  // Update address link (is_default, label)
  updateLink: (buyerAddressId, data) =>
    apiCall(`/buyer/addresses/${buyerAddressId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  // Update address fields
  updateAddress: (buyerAddressId, addressData) =>
    apiCall(`/buyer/addresses/${buyerAddressId}/address`, {
      method: 'PATCH',
      body: JSON.stringify(addressData),
    }),

  // Set default address
  setDefault: (buyerAddressId) =>
    apiCall(`/buyer/addresses/${buyerAddressId}/default`, {
      method: 'PATCH',
    }),

  // Delete address
  delete: (buyerAddressId) =>
    apiCall(`/buyer/addresses/${buyerAddressId}`, {
      method: 'DELETE',
    }),
};

// ============================================
// PROFILE APIs
// ============================================
export const profileAPI = {
  // Get buyer profile
  getProfile: () => apiCall('/buyer/profile'),

  // Update buyer profile
  updateProfile: (profileData) =>
    apiCall('/buyer/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    }),

  // Update password
  updatePassword: (currentPassword, newPassword) =>
    apiCall('/buyer/profile/password', {
      method: 'POST',
      body: JSON.stringify({
        current_password: currentPassword,
        new_password: newPassword,
      }),
    }),

  // Upload avatar
  uploadAvatar: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiCall('/avatar/upload', {
      method: 'POST',
      body: formData,
      headers: {},
    });
  },
};

// ============================================
// REVIEW APIs
// ============================================
export const reviewAPI = {
  // Get product reviews
  getByProduct: (productId, params = {}) => {
    const query = new URLSearchParams({
      limit: params.limit || 10,
      offset: params.offset || 0,
    });
    return apiCall(`/products/${productId}/reviews?${query}`);
  },

  // Create review
  create: (reviewData) =>
    apiCall('/buyer/reviews', {
      method: 'POST',
      body: JSON.stringify(reviewData),
    }),

  // Upload review images
  uploadImages: (reviewId, files) => {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    return apiCall(`/buyer/reviews/${reviewId}/images`, {
      method: 'POST',
      body: formData,
      headers: {},
    });
  },
};

// ============================================
// CARRIER APIs (Shipping)
// ============================================
export const carrierAPI = {
  // Get available carriers
  getAll: () => apiCall('/carriers'),

  // Calculate shipping fee
  calculateFee: (carrierId, addressId, weight) =>
    apiCall('/carriers/calculate-fee', {
      method: 'POST',
      body: JSON.stringify({
        carrier_id: carrierId,
        address_id: addressId,
        weight,
      }),
    }),
};

// ============================================
// DISCOUNT APIs (Vouchers)
// ============================================
export const discountAPI = {
  // Get available discounts
  getAvailable: () => apiCall('/buyer/discounts/available'),

  // Apply discount code
  applyCode: (code, cartTotal) =>
    apiCall('/buyer/discounts/apply', {
      method: 'POST',
      body: JSON.stringify({
        code,
        cart_total: cartTotal,
      }),
    }),

  // Validate discount
  validate: (discountId, cartTotal) =>
    apiCall(`/buyer/discounts/${discountId}/validate`, {
      method: 'POST',
      body: JSON.stringify({ cart_total: cartTotal }),
    }),
};

// ============================================
// EXPORT ALL APIs
// ============================================
export default {
  auth: authAPI,
  category: categoryAPI,
  product: productAPI,
  cart: cartAPI,
  order: orderAPI,
  address: addressAPI,
  profile: profileAPI,
  review: reviewAPI,
  carrier: carrierAPI,
  discount: discountAPI,
};