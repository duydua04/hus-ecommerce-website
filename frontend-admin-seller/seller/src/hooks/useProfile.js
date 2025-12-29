import { useState, useCallback } from "react";
import profileService from "../api/ProfileService";

const useProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /* Lấy thông tin hồ sơ Seller */
  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await profileService.getProfile();
      setProfile(data);
      return data;
    } catch (err) {
      setError(err.detail || err.message || "Lỗi khi tải thông tin hồ sơ");
      setProfile(null);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /* Cập nhật thông tin hồ sơ Seller và tự động update state */
  const updateProfile = useCallback(async (profileData) => {
    setLoading(true);
    setError(null);

    try {
      const updated = await profileService.updateProfile(profileData);
      setProfile(updated);
      return updated;
    } catch (err) {
      setError(err.detail || err.message || "Lỗi khi cập nhật hồ sơ");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /* Clear error */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /* Clear profile (dùng khi logout) */
  const clearProfile = useCallback(() => {
    setProfile(null);
    setError(null);
  }, []);

  return {
    profile,
    loading,
    error,
    fetchProfile,
    updateProfile,
    clearError,
    clearProfile,
  };
};

export default useProfile;
