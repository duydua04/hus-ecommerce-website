import { useState, useCallback } from "react";
import categoryService from "../api/CategoryService";

const useCategory = () => {
  const [categories, setCategories] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch danh sách categories với search và pagination
  const fetchCategories = useCallback(
    async ({ q = "", limit = 10, offset = 0 } = {}) => {
      setLoading(true);
      setError(null);

      try {
        const res = await categoryService.listCategories({ q, limit, offset });
        // Kiểm tra cấu trúc response
        if (res && typeof res === "object" && "data" in res) {
          setCategories(Array.isArray(res.data) ? res.data : []);
          const totalCount = res.meta?.total ?? res.total ?? 0;
          setTotal(totalCount);
        } else if (Array.isArray(res)) {
          setCategories(res);
          setTotal(res.length);
        } else {
          setCategories([]);
          setTotal(0);
        }
      } catch (err) {
        setError(err.detail || err.message || "Lỗi khi tải danh sách danh mục");
        setCategories([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Lấy chi tiết category
  const getCategoryById = useCallback(async (categoryId) => {
    setLoading(true);
    setError(null);

    try {
      const category = await categoryService.getCategoryDetail(categoryId);
      return category;
    } catch (err) {
      const errorMsg = err.detail || "Không thể tải thông tin danh mục";
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Tạo category mới
  const createCategory = useCallback(async (categoryData) => {
    setLoading(true);
    try {
      await categoryService.createCategory(categoryData);
    } finally {
      setLoading(false);
    }
  }, []);

  // Cập nhật category và tự động update state
  const updateCategory = useCallback(async (categoryId, categoryData) => {
    setLoading(true);
    try {
      const updated = await categoryService.updateCategory(
        categoryId,
        categoryData
      );
      setCategories((prev) =>
        prev.map((c) => (c.category_id === categoryId ? updated : c))
      );
      return updated;
    } finally {
      setLoading(false);
    }
  }, []);

  // Xóa category và tự động update state
  const deleteCategory = useCallback(async (categoryId) => {
    setLoading(true);
    try {
      await categoryService.deleteCategory(categoryId);
      setCategories((prev) => prev.filter((c) => c.category_id !== categoryId));
    } finally {
      setLoading(false);
    }
  }, []);

  // Upload image cho category
  const uploadCategoryImage = useCallback(async (categoryId, file) => {
    setLoading(true);
    setError(null);

    try {
      const updated = await categoryService.uploadCategoryImage(
        categoryId,
        file
      );
      // Tự động update state với category mới có image_url
      setCategories((prev) =>
        prev.map((c) => (c.category_id === categoryId ? updated : c))
      );
      return updated;
    } catch (err) {
      const errorMsg = err.detail || "Không thể upload ảnh";
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    categories,
    total,
    loading,
    error,
    fetchCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory,
    uploadCategoryImage, // Export thêm function mới
    clearError: () => setError(null),
  };
};

export default useCategory;
