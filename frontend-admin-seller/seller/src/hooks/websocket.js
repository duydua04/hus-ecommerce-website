/**
 * WebSocket Client with auto-reconnect
 * - Auto reconnect on disconnect
 * - Channel-based subscription system
 * - HttpOnly Cookie authentication
 */

const WS_URL = process.env.REACT_APP_WS_URL || "ws://localhost:8000/websocket/";
const RECONNECT_DELAY = 3000;

// Message type mapping: backend type => channel name
const MESSAGE_TYPE_MAP = {
  notification: "notification",
  dashboard_updated: "dashboard",
  chat: "chat",
};

class WebSocketManager {
  constructor() {
    this.socket = null;
    this.reconnectTimer = null;
    this.manuallyClosed = false;
    this.listeners = new Map(
      Object.values(MESSAGE_TYPE_MAP).map((channel) => [channel, new Set()])
    );
  }

  connect() {
    if (this.isConnecting() || this.isConnected()) return;

    this.manuallyClosed = false;
    this.closeSocket();

    try {
      this.socket = new WebSocket(WS_URL);
      this.socket.onopen = () => this.handleOpen();
      this.socket.onmessage = (e) => this.handleMessage(e);
      this.socket.onclose = (e) => this.handleClose(e);
      this.socket.onerror = (e) => this.handleError(e);
    } catch (err) {
      console.error("WS init error:", err);
    }
  }

  disconnect() {
    this.manuallyClosed = true;
    this.closeSocket();
    clearTimeout(this.reconnectTimer);
    this.listeners.forEach((set) => set.clear());
  }

  subscribe(channel, callback) {
    const normalized = channel.toLowerCase();

    if (!this.listeners.has(normalized)) {
      console.warn(`⚠️ Unknown channel: ${channel}`);
      this.listeners.set(normalized, new Set());
    }

    this.listeners.get(normalized).add(callback);

    return () => this.listeners.get(normalized)?.delete(callback);
  }

  send(data) {
    if (this.isConnected()) {
      this.socket.send(JSON.stringify(data));
    } else {
      console.warn("⚠️ WebSocket not connected");
    }
  }

  isConnected() {
    return this.socket?.readyState === WebSocket.OPEN;
  }

  isConnecting() {
    return this.socket?.readyState === WebSocket.CONNECTING;
  }

  // Private methods

  closeSocket() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  handleOpen() {
    console.log("🟢 WebSocket connected");
  }

  handleMessage(event) {
    try {
      const data = JSON.parse(event.data);
      if (!data?.type) return;

      const channel = MESSAGE_TYPE_MAP[data.type.toLowerCase()];

      if (channel && this.listeners.has(channel)) {
        this.listeners.get(channel).forEach((callback) => callback(data));
      }
    } catch (err) {
      console.error("WS parse error:", err);
    }
  }

  handleClose(event) {
    console.warn(`🟡 WebSocket closed (Code: ${event.code})`);
    this.socket = null;

    if (!this.manuallyClosed) {
      this.reconnectTimer = setTimeout(() => this.connect(), RECONNECT_DELAY);
    }
  }

  handleError(error) {
    console.error("🔴 WebSocket error:", error);
  }
}

export const WebSocketClient = new WebSocketManager();
