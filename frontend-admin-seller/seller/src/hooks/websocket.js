let socket = null;
let reconnectTimer = null;
let manuallyClosed = false;

/**
 * listeners theo type:
 * {
 *   notification: Set<callback>,
 *   chat: Set<callback>,
 *   CHAT: Set<callback>,  // Support cả uppercase
 * }
 */
const listeners = {
  notification: new Set(),
  chat: new Set(),
  CHAT: new Set(),
};

/* CONFIG */
const WS_URL = process.env.REACT_APP_WS_URL || "ws://localhost:8000/websocket/";
const RECONNECT_DELAY = 3000;

/* CORE */
function connect() {
  if (socket || manuallyClosed) {
    console.log("WebSocket already connected or manually closed");
    return;
  }

  const token = localStorage.getItem("token");
  if (!token) {
    console.error("No token found for WebSocket");
    return;
  }

  try {
    const url = `${WS_URL}?token=${token}`;
    console.log("Connecting to WebSocket:", WS_URL);

    socket = new WebSocket(url);

    socket.onopen = () => {
      console.log("WebSocket connected successfully");
    };

    socket.onmessage = (event) => {
      console.log("Raw WebSocket message:", event.data);

      try {
        const data = JSON.parse(event.data);
        console.log("Parsed WebSocket data:", data);

        if (!data?.type) {
          console.warn("WS message missing type field:", data);
          return;
        }

        // Support cả uppercase và lowercase
        const messageType = data.type;
        const normalizedType = messageType.toLowerCase();

        // Broadcast đến listeners của cả 2 versions
        [messageType, normalizedType].forEach((type) => {
          const group = listeners[type];
          if (group && group.size > 0) {
            console.log(
              `Broadcasting to ${group.size} listener(s) for type: ${type}`
            );
            group.forEach((cb) => {
              try {
                cb(data);
              } catch (err) {
                console.error("Error in listener callback:", err);
              }
            });
          }
        });
      } catch (err) {
        console.error("WS message parse error:", err);
      }
    };

    socket.onclose = (event) => {
      console.warn("WebSocket closed:", event.code, event.reason);
      socket = null;

      if (!manuallyClosed) {
        console.log(`Reconnecting in ${RECONNECT_DELAY}ms...`);
        reconnectTimer = setTimeout(connect, RECONNECT_DELAY);
      }
    };

    socket.onerror = (err) => {
      console.error("WebSocket error:", err);
    };
  } catch (err) {
    console.error("WS init error:", err);
  }
}

function disconnect() {
  console.log("Disconnecting WebSocket");
  manuallyClosed = true;

  if (socket) {
    socket.close();
    socket = null;
  }

  clearTimeout(reconnectTimer);
  Object.values(listeners).forEach((set) => set.clear());
}

/* PUBLIC API */
export const WebSocketClient = {
  connect,
  disconnect,

  /**
   * Subscribe theo type: "notification" | "chat"
   * Support cả uppercase và lowercase
   */
  subscribe(type, callback) {
    const normalizedType = type.toLowerCase();

    if (!listeners[normalizedType]) {
      listeners[normalizedType] = new Set();
    }

    listeners[normalizedType].add(callback);
    console.log(`Subscribed to "${normalizedType}"`);

    // Return unsubscribe function
    return () => {
      listeners[normalizedType]?.delete(callback);
      console.log(`Unsubscribed from "${normalizedType}"`);
    };
  },

  send(data) {
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(data));
      console.log("Sent WebSocket message:", data);
    } else {
      console.warn("WebSocket not connected, cannot send");
    }
  },

  isConnected() {
    return socket?.readyState === WebSocket.OPEN;
  },

  getStatus() {
    if (!socket) return "CLOSED";
    switch (socket.readyState) {
      case WebSocket.CONNECTING:
        return "CONNECTING";
      case WebSocket.OPEN:
        return "OPEN";
      case WebSocket.CLOSING:
        return "CLOSING";
      case WebSocket.CLOSED:
        return "CLOSED";
      default:
        return "UNKNOWN";
    }
  },
};
