import { useState, useCallback } from "react";
import productService from "../api/ProductService";

const useProduct = () => {
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Fetch danh sách sản phẩm với search và pagination
   */
  const fetchProducts = useCallback(
    async ({ q = "", active_only = true, limit = 10, offset = 0 } = {}) => {
      setLoading(true);
      setError(null);

      try {
        const res = await productService.listProducts({
          q,
          active_only,
          limit,
          offset,
        });

        if (Array.isArray(res)) {
          setProducts(res);
          setTotal(res.length);
        } else if (res?.data && Array.isArray(res.data)) {
          setProducts(res.data);
          setTotal(res.meta?.total ?? 0);
        } else {
          setProducts([]);
          setTotal(0);
        }
      } catch (err) {
        setError(err.detail || err.message || "Lỗi khi tải danh sách sản phẩm");
        setProducts([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /**
   * Lấy chi tiết sản phẩm
   */
  const fetchProductDetail = useCallback(async (productId) => {
    setLoading(true);
    setError(null);

    try {
      const data = await productService.getProductDetail(productId);
      return data;
    } catch (err) {
      setError(err.detail || err.message || "Lỗi khi tải chi tiết sản phẩm");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Tạo sản phẩm mới
   */
  const createProduct = useCallback(async (productData) => {
    setLoading(true);
    setError(null);

    try {
      const newProduct = await productService.createProduct(productData);
      return newProduct;
    } catch (err) {
      setError(err.detail || err.message || "Lỗi khi tạo sản phẩm");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Cập nhật sản phẩm và tự động update state
   */
  const updateProduct = useCallback(async (productId, productData) => {
    setLoading(true);
    setError(null);

    try {
      const updated = await productService.updateProduct(
        productId,
        productData
      );
      setProducts((prev) =>
        prev.map((p) => (p.product_id === productId ? updated : p))
      );
      return updated;
    } catch (err) {
      setError(err.detail || err.message || "Lỗi khi cập nhật sản phẩm");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Xóa sản phẩm và tự động update state
   */
  const deleteProduct = useCallback(async (productId) => {
    setLoading(true);
    setError(null);

    try {
      const result = await productService.deleteProduct(productId);

      // Nếu soft delete, cập nhật state
      if (result.soft_deleted) {
        setProducts((prev) =>
          prev.map((p) =>
            p.product_id === productId ? { ...p, is_active: false } : p
          )
        );
      } else {
        // Hard delete, xóa khỏi state
        setProducts((prev) => prev.filter((p) => p.product_id !== productId));
      }

      return result;
    } catch (err) {
      setError(err.detail || err.message || "Lỗi khi xóa sản phẩm");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Upload hình ảnh sản phẩm và tự động update state
   */
  const uploadProductImages = useCallback(
    async (productId, files, primaryIndex = null) => {
      setLoading(true);
      setError(null);

      try {
        const images = await productService.uploadImages(
          productId,
          files,
          primaryIndex
        );
        return images;
      } catch (err) {
        setError(err.detail || err.message || "Lỗi khi tải lên hình ảnh");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /**
   * Set hình ảnh chính
   */
  const setPrimaryImage = useCallback(async (productId, imageId) => {
    setLoading(true);
    setError(null);

    try {
      const updated = await productService.setPrimaryImage(productId, imageId);
      return updated;
    } catch (err) {
      setError(err.detail || err.message || "Lỗi khi đặt hình ảnh chính");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Xóa hình ảnh
   */
  const deleteImage = useCallback(async (productId, imageId) => {
    setLoading(true);
    setError(null);

    try {
      const result = await productService.deleteImage(productId, imageId);
      return result;
    } catch (err) {
      setError(err.detail || err.message || "Lỗi khi xóa hình ảnh");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Tạo variant
   */
  const createVariant = useCallback(async (productId, variantData) => {
    setLoading(true);
    setError(null);

    try {
      const variant = await productService.createVariant(
        productId,
        variantData
      );
      return variant;
    } catch (err) {
      setError(err.detail || err.message || "Lỗi khi tạo biến thể");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Cập nhật variant
   */
  const updateVariant = useCallback(
    async (productId, variantId, variantData) => {
      setLoading(true);
      setError(null);

      try {
        const updated = await productService.updateVariant(
          productId,
          variantId,
          variantData
        );
        return updated;
      } catch (err) {
        setError(err.detail || err.message || "Lỗi khi cập nhật biến thể");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /**
   * Xóa variant
   */
  const deleteVariant = useCallback(async (productId, variantId) => {
    setLoading(true);
    setError(null);

    try {
      const result = await productService.deleteVariant(productId, variantId);
      return result;
    } catch (err) {
      setError(err.detail || err.message || "Lỗi khi xóa biến thể");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Lấy danh sách sizes của variant
   */
  const fetchVariantSizes = useCallback(async (productId, variantId) => {
    setLoading(true);
    setError(null);

    try {
      const sizes = await productService.getVariantSizes(productId, variantId);
      return sizes;
    } catch (err) {
      setError(err.detail || err.message || "Lỗi khi tải danh sách size");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Tạo size
   */
  const createSize = useCallback(async (productId, variantId, sizeData) => {
    setLoading(true);
    setError(null);

    try {
      const size = await productService.createSize(
        productId,
        variantId,
        sizeData
      );
      return size;
    } catch (err) {
      setError(err.detail || err.message || "Lỗi khi tạo size");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Cập nhật size
   */
  const updateSize = useCallback(
    async (productId, variantId, sizeId, sizeData) => {
      setLoading(true);
      setError(null);

      try {
        const updated = await productService.updateSize(
          productId,
          variantId,
          sizeId,
          sizeData
        );
        return updated;
      } catch (err) {
        setError(err.detail || err.message || "Lỗi khi cập nhật size");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /**
   * Xóa size
   */
  const deleteSize = useCallback(async (productId, variantId, sizeId) => {
    setLoading(true);
    setError(null);

    try {
      const result = await productService.deleteSize(
        productId,
        variantId,
        sizeId
      );
      return result;
    } catch (err) {
      setError(err.detail || err.message || "Lỗi khi xóa size");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    products,
    total,
    loading,
    error,
    fetchProducts,
    fetchProductDetail,
    createProduct,
    updateProduct,
    deleteProduct,
    uploadProductImages,
    setPrimaryImage,
    deleteImage,
    createVariant,
    updateVariant,
    deleteVariant,
    fetchVariantSizes,
    createSize,
    updateSize,
    deleteSize,
    clearError,
  };
};

export default useProduct;
