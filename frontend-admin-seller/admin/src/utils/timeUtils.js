export function convertToVietnamTime(utcTime) {
  if (!utcTime) return null;

  const date = new Date(utcTime);
  // Chuyển sang múi giờ Việt Nam (UTC+7)
  return new Date(date.getTime() + 7 * 60 * 60 * 1000);
}

export function formatChatTime(timestamp) {
  if (!timestamp) return "";

  const vnDate = convertToVietnamTime(timestamp);
  const now = new Date();
  const nowVN = convertToVietnamTime(now);

  const diff = nowVN - vnDate;

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Vừa xong";
  if (minutes < 60) return `${minutes} phút trước`;
  if (hours < 24) return `${hours} giờ trước`;
  if (days < 7) return `${days} ngày trước`;

  return vnDate.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatDetailedTime(timestamp) {
  if (!timestamp) return "";

  const vnDate = convertToVietnamTime(timestamp);

  const hours = vnDate.getHours().toString().padStart(2, "0");
  const minutes = vnDate.getMinutes().toString().padStart(2, "0");
  const day = vnDate.getDate().toString().padStart(2, "0");
  const month = (vnDate.getMonth() + 1).toString().padStart(2, "0");
  const year = vnDate.getFullYear();

  return `${hours}:${minutes} ${day}/${month}/${year}`;
}

export function formatTimeOnly(timestamp) {
  if (!timestamp) return "";

  const vnDate = convertToVietnamTime(timestamp);

  const hours = vnDate.getHours().toString().padStart(2, "0");
  const minutes = vnDate.getMinutes().toString().padStart(2, "0");

  return `${hours}:${minutes}`;
}

export function isToday(timestamp) {
  if (!timestamp) return false;

  const vnDate = convertToVietnamTime(timestamp);
  const today = convertToVietnamTime(new Date());

  return (
    vnDate.getDate() === today.getDate() &&
    vnDate.getMonth() === today.getMonth() &&
    vnDate.getFullYear() === today.getFullYear()
  );
}

export function isYesterday(timestamp) {
  if (!timestamp) return false;

  const vnDate = convertToVietnamTime(timestamp);
  const yesterday = convertToVietnamTime(new Date());
  yesterday.setDate(yesterday.getDate() - 1);

  return (
    vnDate.getDate() === yesterday.getDate() &&
    vnDate.getMonth() === yesterday.getMonth() &&
    vnDate.getFullYear() === yesterday.getFullYear()
  );
}

export function formatSmartTime(timestamp) {
  if (!timestamp) return "";

  if (isToday(timestamp)) {
    return formatTimeOnly(timestamp);
  }

  if (isYesterday(timestamp)) {
    return "Hôm qua";
  }

  const vnDate = convertToVietnamTime(timestamp);
  const now = convertToVietnamTime(new Date());
  const daysDiff = Math.floor((now - vnDate) / (1000 * 60 * 60 * 24));

  if (daysDiff < 7) {
    const days = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
    return days[vnDate.getDay()];
  }

  return vnDate.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
  });
}

export function groupMessagesByDate(messages) {
  const grouped = {};

  messages.forEach((msg) => {
    const vnDate = convertToVietnamTime(msg.created_at);
    const dateKey = vnDate.toLocaleDateString("vi-VN");

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

  const vnDate = convertToVietnamTime(timestamp);
  return vnDate.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}
