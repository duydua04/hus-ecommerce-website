import { useState, useCallback } from "react";
import avatarService from "../api/AvatarService";

const useAvatar = (initialAvatar = null) => {
  const [avatar, setAvatar] = useState(initialAvatar);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const uploadAvatar = useCallback(async (file) => {
    const validateError = avatarService.validateFile(file);
    if (validateError) {
      setError(validateError);
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await avatarService.uploadMyAvatar(file);
      setAvatar(data.public_url);
      return true;
    } catch (err) {
      setError(err.detail);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteAvatar = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      await avatarService.deleteMyAvatar();
      setAvatar(null);
      return true;
    } catch (err) {
      setError(err.detail);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return {
    avatar,
    loading,
    error,
    uploadAvatar,
    deleteAvatar,
    setAvatar,
    clearError,
  };
};

export default useAvatar;
