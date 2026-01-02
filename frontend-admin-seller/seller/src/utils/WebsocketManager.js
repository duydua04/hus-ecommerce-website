class WebSocketManager {
  constructor() {
    this.ws = null;
    this.token = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.listeners = {
      message: [],
      notification: [],
      dashboard: [],
    };
  }

  connect(token) {
    this.token = token;
    const wsUrl = `${import.meta.env.VITE_WS_URL}/websocket/?token=${token}`;

    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log("WebSocket connected");
      this.reconnectAttempts = 0;
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.routeMessage(data);
      } catch (error) {
        console.error("Failed to parse message:", error);
      }
    };

    this.ws.onclose = () => {
      console.log("WebSocket closed");
      this.handleReconnect();
    };

    this.ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };
  }

  routeMessage(data) {
    // Backend gửi message với type khác nhau
    const messageType = data.type || "message";

    switch (messageType) {
      case "new_message":
      case "message_sent":
        this.notifyListeners("message", data);
        break;
      case "notification":
        this.notifyListeners("notification", data);
        break;
      case "dashboard_update":
        this.notifyListeners("dashboard", data);
        break;
      default:
        console.log("Unknown message type:", data);
    }
  }

  notifyListeners(channel, data) {
    if (this.listeners[channel]) {
      this.listeners[channel].forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in ${channel} listener:`, error);
        }
      });
    }
  }

  subscribe(channel, callback) {
    if (!this.listeners[channel]) {
      this.listeners[channel] = [];
    }
    this.listeners[channel].push(callback);

    // Return unsubscribe function
    return () => {
      this.listeners[channel] = this.listeners[channel].filter(
        (cb) => cb !== callback
      );
    };
  }

  handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);

      console.log(
        `Reconnecting in ${delay}ms... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`
      );

      setTimeout(() => {
        if (this.token) {
          this.connect(this.token);
        }
      }, delay);
    } else {
      console.error("Max reconnect attempts reached");
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  getStatus() {
    if (!this.ws) return "disconnected";

    switch (this.ws.readyState) {
      case WebSocket.CONNECTING:
        return "connecting";
      case WebSocket.OPEN:
        return "connected";
      case WebSocket.CLOSING:
        return "closing";
      case WebSocket.CLOSED:
        return "disconnected";
      default:
        return "unknown";
    }
  }
}

export default new WebSocketManager();
