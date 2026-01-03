/**
 * Quản lý kết nối WebSocket với auto-reconnect
 * Auto reconnect khi mất kết nối
 * Subscribe/unsubscribe events theo type
 * Tự động gửi HttpOnly Cookie để authenticate
 */

let socket = null;
let reconnectTimer = null;
let manuallyClosed = false;

const listeners = {
  notification: new Set(),
  chat: new Set(),
};

const WS_URL = process.env.REACT_APP_WS_URL || "ws://localhost:8000/websocket/";
const RECONNECT_DELAY = 3000;

function connect() {
  manuallyClosed = false;

  // Tránh tạo socket trùng lặp
  if (socket) {
    if (
      socket.readyState === WebSocket.OPEN ||
      socket.readyState === WebSocket.CONNECTING
    ) {
      return;
    }
    socket.close();
    socket = null;
  }

  try {
    // Browser tự động gửi HttpOnly Cookie khi connect
    socket = new WebSocket(WS_URL);

    socket.onopen = () => {
      console.log("🟢 WebSocket connected");
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        // Backend gửi format: { type: "notification", ...data }
        if (!data?.type) return;

        const type = data.type.toLowerCase();
        const group = listeners[type];

        if (group) {
          group.forEach((callback) => callback(data));
        }
      } catch (err) {
        console.error("WS parse error:", err);
      }
    };

    socket.onclose = (e) => {
      console.warn(`🟡 WebSocket closed (Code: ${e.code})`);
      socket = null;

      // Auto reconnect nếu không phải đóng thủ công
      if (!manuallyClosed) {
        reconnectTimer = setTimeout(connect, RECONNECT_DELAY);
      }
    };

    socket.onerror = (err) => {
      console.error("🔴 WebSocket error:", err);
    };
  } catch (err) {
    console.error("WS init error:", err);
  }
}

function disconnect() {
  manuallyClosed = true;

  if (socket) {
    socket.close();
    socket = null;
  }

  clearTimeout(reconnectTimer);
  Object.values(listeners).forEach((set) => set.clear());
}

export const WebSocketClient = {
  connect,
  disconnect,

  /**
   * Subscribe to WebSocket events
   */
  subscribe(type, callback) {
    const normalizedType = type.toLowerCase();

    if (!listeners[normalizedType]) {
      listeners[normalizedType] = new Set();
    }

    listeners[normalizedType].add(callback);

    // Return cleanup function
    return () => listeners[normalizedType].delete(callback);
  },

  /**
   * Send data to WebSocket server
   */
  send(data) {
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(data));
    }
  },

  /**
   * Check if WebSocket is connected
   */
  isConnected() {
    return socket?.readyState === WebSocket.OPEN;
  },
};
