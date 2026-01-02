let socket = null;
let reconnectTimer = null;
let manuallyClosed = false;

/**
 * listeners theo type:
 * {
 *   notification: Set<callback>,
 *   chat: Set<callback>,
 * }
 */
const listeners = {
  notification: new Set(),
  chat: new Set(),
};

/* CONFIG */

const WS_URL = process.env.REACT_APP_WS_URL || "ws://localhost:8000/websocket/";

const RECONNECT_DELAY = 3000;

/* CORE */

function connect() {
  if (socket || manuallyClosed) return;

  try {
    socket = new WebSocket(WS_URL);

    socket.onopen = () => {
      console.log("🟢 WebSocket connected");
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (!data?.type) {
          console.warn("WS message missing type:", data);
          return;
        }

        const group = listeners[data.type];
        if (!group) return;

        group.forEach((cb) => cb(data));
      } catch (err) {
        console.error("WS message parse error:", err);
      }
    };

    socket.onclose = () => {
      console.warn("🟡 WebSocket closed");
      socket = null;

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

/*PUBLIC API */

export const WebSocketClient = {
  connect,
  disconnect,

  /*
   * Subscribe theo type: "notification" | "chat"
   */
  subscribe(type, callback) {
    if (!listeners[type]) {
      console.warn(`WS subscribe: unknown type "${type}"`);
      return () => {};
    }

    listeners[type].add(callback);

    // cleanup function
    return () => {
      listeners[type].delete(callback);
    };
  },

  /**
   * Gửi message
   */
  send(data) {
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(data));
    }
  },

  isConnected() {
    return socket?.readyState === WebSocket.OPEN;
  },
};
