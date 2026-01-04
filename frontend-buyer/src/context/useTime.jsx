// src/context/useTime.js
import { useCallback } from 'react';

const useTime = () => {
  // Hàm chuyển đổi thời gian từ UTC sang Asia/HoChiMinh (GMT+7)
  const convertToHoChiMinhTime = useCallback((utcDateString) => {
    if (!utcDateString || utcDateString === 'null' || utcDateString === 'undefined') {
      console.warn('Invalid date string:', utcDateString);
      return new Date();
    }

    try {
      const date = new Date(utcDateString);
      if (isNaN(date.getTime())) {
        console.warn('Invalid date:', utcDateString);
        return new Date();
      }

      // Chuyển từ UTC sang GMT+7 (Asia/HoChiMinh)
      return new Date(date.getTime() + 7 * 60 * 60 * 1000);
    } catch (error) {
      console.error('Error converting time:', error);
      return new Date();
    }
  }, []);

  // Hàm format thời gian theo định dạng Việt Nam
  const formatVietnameseDateTime = useCallback((date) => {
    try {
      if (!date) return '';

      // Nếu là string, chuyển đổi trước
      const dateObj = typeof date === 'string' ? convertToHoChiMinhTime(date) : date;

      if (isNaN(dateObj.getTime())) {
        return '';
      }

      // Format theo kiểu Việt Nam
      const day = dateObj.getDate().toString().padStart(2, '0');
      const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
      const year = dateObj.getFullYear();
      const hour = dateObj.getHours().toString().padStart(2, '0');
      const minute = dateObj.getMinutes().toString().padStart(2, '0');
      const second = dateObj.getSeconds().toString().padStart(2, '0');

      return `${day}/${month}/${year} ${hour}:${minute}:${second}`;
    } catch (error) {
      console.error('Error formatting date:', error);
      return '';
    }
  }, [convertToHoChiMinhTime]);

  // Hàm format thời gian ngắn gọn (relative time)
  const formatRelativeTime = useCallback((date) => {
    try {
      if (!date) return '';

      // Nếu là string, chuyển đổi trước
      const dateObj = typeof date === 'string' ? convertToHoChiMinhTime(date) : date;

      if (isNaN(dateObj.getTime())) {
        return '';
      }

      const now = new Date();
      const hoChiMinhNow = convertToHoChiMinhTime(now.toISOString());
      const diffMs = hoChiMinhNow.getTime() - dateObj.getTime();

      // Nếu thời gian trong tương lai
      if (diffMs < 0) {
        return "Vừa xong";
      }

      const diffSec = Math.floor(diffMs / 1000);
      const diffMin = Math.floor(diffMs / (1000 * 60));
      const diffHour = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDay = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffSec < 60) return "Vừa xong";
      if (diffMin < 60) return `${diffMin} phút trước`;
      if (diffHour < 24) return `${diffHour} giờ trước`;
      if (diffDay < 7) return `${diffDay} ngày trước`;

      // Nếu hơn 7 ngày, hiển thị ngày tháng
      const day = dateObj.getDate().toString().padStart(2, '0');
      const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
      const year = dateObj.getFullYear();
      return `${day}/${month}/${year}`;
    } catch (error) {
      console.error('Error formatting relative time:', error);
      return '';
    }
  }, [convertToHoChiMinhTime]);

  // Hàm format thời gian ngắn (chỉ giờ:phút)
  const formatShortTime = useCallback((date) => {
    try {
      if (!date) return '';

      const dateObj = typeof date === 'string' ? convertToHoChiMinhTime(date) : date;

      if (isNaN(dateObj.getTime())) {
        return '';
      }

      const hour = dateObj.getHours().toString().padStart(2, '0');
      const minute = dateObj.getMinutes().toString().padStart(2, '0');
      return `${hour}:${minute}`;
    } catch (error) {
      console.error('Error formatting short time:', error);
      return '';
    }
  }, [convertToHoChiMinhTime]);

  // Hàm sắp xếp mảng theo thời gian mới nhất lên đầu
  const sortByNewest = useCallback((array, dateField = 'created_at') => {
    try {
      if (!Array.isArray(array)) return [];

      return [...array].sort((a, b) => {
        try {
          const timeA = a[dateField] ? convertToHoChiMinhTime(a[dateField]).getTime() : 0;
          const timeB = b[dateField] ? convertToHoChiMinhTime(b[dateField]).getTime() : 0;
          return timeB - timeA; // Giảm dần (mới nhất lên đầu)
        } catch (error) {
          console.error('Error sorting:', error);
          return 0;
        }
      });
    } catch (error) {
      console.error('Error in sortByNewest:', error);
      return array || [];
    }
  }, [convertToHoChiMinhTime]);

  // Hàm lấy thông tin thời gian đầy đủ
  const getTimeInfo = useCallback((utcDateString) => {
    try {
      const localDate = convertToHoChiMinhTime(utcDateString);

      if (isNaN(localDate.getTime())) {
        return {
          localDate: new Date(),
          formatted: '',
          relative: '',
          shortTime: '',
          timestamp: 0
        };
      }

      return {
        localDate,
        formatted: formatVietnameseDateTime(localDate),
        relative: formatRelativeTime(localDate),
        shortTime: formatShortTime(localDate),
        timestamp: localDate.getTime()
      };
    } catch (error) {
      console.error('Error getting time info:', error);
      return {
        localDate: new Date(),
        formatted: '',
        relative: '',
        shortTime: '',
        timestamp: 0
      };
    }
  }, [convertToHoChiMinhTime, formatVietnameseDateTime, formatRelativeTime, formatShortTime]);

  return {
    convertToHoChiMinhTime,
    formatVietnameseDateTime,
    formatRelativeTime,
    formatShortTime,
    sortByNewest,
    getTimeInfo
  };
};

export default useTime;