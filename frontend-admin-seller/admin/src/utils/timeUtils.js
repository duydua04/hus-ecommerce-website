export function parseUTCTime(timestamp) {
  if (!timestamp) return null;

  // Nếu timestamp không có 'Z' ở cuối, thêm vào để đảm bảo parse đúng UTC
  const timeStr =
    typeof timestamp === "string"
      ? timestamp.endsWith("Z")
        ? timestamp
        : timestamp + "Z"
      : timestamp;

  return new Date(timeStr);
}

export function formatChatTime(timestamp) {
  if (!timestamp) return "";

  const date = parseUTCTime(timestamp);
  const now = new Date();

  const diff = now - date;

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Vừa xong";
  if (minutes < 60) return `${minutes} phút trước`;
  if (hours < 24) return `${hours} giờ trước`;
  if (days < 7) return `${days} ngày trước`;

  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Asia/Ho_Chi_Minh",
  });
}

export function formatDetailedTime(timestamp) {
  if (!timestamp) return "";

  const date = parseUTCTime(timestamp);

  return date.toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Asia/Ho_Chi_Minh",
    hour12: false,
  });
}

export function formatTimeOnly(timestamp) {
  if (!timestamp) return "";

  const date = parseUTCTime(timestamp);

  return date.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Ho_Chi_Minh",
    hour12: false,
  });
}

export function isToday(timestamp) {
  if (!timestamp) return false;

  const date = parseUTCTime(timestamp);
  const today = new Date();

  const dateStr = date.toLocaleDateString("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
  });
  const todayStr = today.toLocaleDateString("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
  });

  return dateStr === todayStr;
}

export function isYesterday(timestamp) {
  if (!timestamp) return false;

  const date = parseUTCTime(timestamp);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  const dateStr = date.toLocaleDateString("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
  });
  const yesterdayStr = yesterday.toLocaleDateString("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
  });

  return dateStr === yesterdayStr;
}

export function formatSmartTime(timestamp) {
  if (!timestamp) return "";

  if (isToday(timestamp)) {
    return formatTimeOnly(timestamp);
  }

  if (isYesterday(timestamp)) {
    return "Hôm qua";
  }

  const date = parseUTCTime(timestamp);
  const now = new Date();
  const daysDiff = Math.floor((now - date) / (1000 * 60 * 60 * 24));

  if (daysDiff < 7) {
    const days = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
    const dayOfWeek = date.getDay();
    return days[dayOfWeek];
  }

  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "Asia/Ho_Chi_Minh",
  });
}

export function groupMessagesByDate(messages) {
  const grouped = {};

  messages.forEach((msg) => {
    const date = parseUTCTime(msg.created_at);
    const dateKey = date.toLocaleDateString("vi-VN", {
      timeZone: "Asia/Ho_Chi_Minh",
    });

    if (!grouped[dateKey]) {
      grouped[dateKey] = [];
    }
    grouped[dateKey].push(msg);
  });

  return grouped;
}

export function getDateLabel(timestamp) {
  if (!timestamp) return "";

  if (isToday(timestamp)) {
    return "Hôm nay";
  }

  if (isYesterday(timestamp)) {
    return "Hôm qua";
  }

  const date = parseUTCTime(timestamp);
  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Asia/Ho_Chi_Minh",
  });
}
