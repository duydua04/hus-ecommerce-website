import { useCallback } from 'react';

const useTime = () => {
  /**
   * Chuyển đổi chuỗi thời gian sang Date Object chuẩn.
   * Tự động xử lý trường hợp thiếu múi giờ (UTC) từ Backend.
   */
  const toLocalTime = useCallback((dateInput) => {
    if (!dateInput) return new Date();

    if (dateInput instanceof Date) return dateInput;

    let dateString = dateInput;

    if (typeof dateString === 'string') {
      if (!dateString.endsWith('Z') && !dateString.includes('+')) {
         dateString += 'Z';
      }
    }

    const date = new Date(dateString);

    // Fallback nếu date không hợp lệ
    if (isNaN(date.getTime())) {
      console.warn('Invalid date input:', dateInput);
      return new Date();
    }

    return date;
  }, []);

  // --- Hàm format thời gian theo định dạng Việt Nam ---
  const formatVietnameseDateTime = useCallback((date) => {
    try {
      const dateObj = toLocalTime(date);
      if (isNaN(dateObj.getTime())) return '';


      return new Intl.DateTimeFormat('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false // Dùng định dạng 24h
      }).format(dateObj);
    } catch (error) {
      return '';
    }
  }, [toLocalTime]);


  const formatRelativeTime = useCallback((date) => {
    try {
      const dateObj = toLocalTime(date);
      if (isNaN(dateObj.getTime())) return '';

      const now = new Date();
      const diffMs = now.getTime() - dateObj.getTime();

      if (diffMs < 0 && diffMs > -60000) return "Vừa xong";
      if (diffMs < 0) return formatVietnameseDateTime(dateObj);

      const diffSec = Math.floor(diffMs / 1000);
      const diffMin = Math.floor(diffMs / (1000 * 60));
      const diffHour = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDay = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffSec < 60) return "Vừa xong";
      if (diffMin < 60) return `${diffMin} phút trước`;
      if (diffHour < 24) return `${diffHour} giờ trước`;
      if (diffDay < 7) return `${diffDay} ngày trước`;

      // Nếu quá 7 ngày, hiển thị ngày/tháng/năm
      return new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }).format(dateObj);

    } catch (error) {
      return '';
    }
  }, [toLocalTime, formatVietnameseDateTime]);

  // --- Hàm format thời gian ngắn (chỉ giờ:phút) ---
  const formatShortTime = useCallback((date) => {
    try {
      const dateObj = toLocalTime(date);
      if (isNaN(dateObj.getTime())) return '';

      return new Intl.DateTimeFormat('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }).format(dateObj);
    } catch (error) {
      return '';
    }
  }, [toLocalTime]);

  const sortByNewest = useCallback((array, dateField = 'created_at') => {
    if (!Array.isArray(array)) return [];
    return [...array].sort((a, b) => {
      const timeA = toLocalTime(a[dateField]).getTime();
      const timeB = toLocalTime(b[dateField]).getTime();
      return timeB - timeA;
    });
  }, [toLocalTime]);

  const getTimeInfo = useCallback((dateInput) => {
    const localDate = toLocalTime(dateInput);

    if (isNaN(localDate.getTime())) {
      return { localDate: new Date(), formatted: '', relative: '', shortTime: '', timestamp: 0 };
    }

    return {
      localDate,
      formatted: formatVietnameseDateTime(localDate),
      relative: formatRelativeTime(localDate),
      shortTime: formatShortTime(localDate),
      timestamp: localDate.getTime()
    };
  }, [toLocalTime, formatVietnameseDateTime, formatRelativeTime, formatShortTime]);

  return {
    toLocalTime,
    convertToHoChiMinhTime: toLocalTime,
    formatVietnameseDateTime,
    formatRelativeTime,
    formatShortTime,
    sortByNewest,
    getTimeInfo
  };
};

export default useTime;