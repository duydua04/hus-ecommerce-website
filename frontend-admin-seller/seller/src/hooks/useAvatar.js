import { useState, useCallback } from "react";
import avatarService from "../api/AvatarService";

const useAvatar = (initialAvatar = null) => {
  const [avatar, setAvatar] = useState(initialAvatar);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  /**
   * Upload avatar
   */
  const uploadAvatar = useCallback(async (file) => {
    // Validate file
    const validation = avatarService.validateFile(file);
    if (!validation.valid) {
      setError(validation.error);
      return { success: false, error: validation.error };
    }

    setLoading(true);
    setError(null);
    setUploadProgress(0);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      const data = await avatarService.uploadMyAvatar(file);

      clearInterval(progressInterval);
      setUploadProgress(100);

      setAvatar(data.public_url);
      setTimeout(() => setUploadProgress(0), 1000);

      return { success: true, data };
    } catch (err) {
      const errorMessage = err.detail || "Upload thất bại";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Delete avatar
   */
  const deleteAvatar = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await avatarService.deleteMyAvatar();
      setAvatar(null);
      return { success: true, data };
    } catch (err) {
      const errorMessage = err.detail || "Xóa avatar thất bại";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Preview ảnh trước khi upload
   */
  const previewFile = useCallback(async (file) => {
    try {
      const previewUrl = await avatarService.previewImage(file);
      return { success: true, url: previewUrl };
    } catch (err) {
      return { success: false, error: "Không thể preview ảnh" };
    }
  }, []);

  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Set avatar manually
   */
  const setAvatarUrl = useCallback((url) => {
    setAvatar(url);
  }, []);

  return {
    avatar,
    loading,
    error,
    uploadProgress,
    uploadAvatar,
    deleteAvatar,
    previewFile,
    clearError,
    setAvatarUrl,
  };
};

export default useAvatar;
