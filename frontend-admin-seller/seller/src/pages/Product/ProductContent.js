import React, { useState, useEffect } from "react";
import { X, Check, Eye } from "lucide-react";
import PageHeader from "../../components/common/PageHeader/PageHeader";
import Table from "../../components/common/Table/Table";
import Pagination from "../../components/common/Pagination/Pagination";
import Button from "../../components/common/Button/Button";
import SearchBox from "../../components/common/SearchBox/SearchBox";
import ProductModal from "./AddProduct/AddProduct";
import ProductDetailModal from "./ProductDetail/ProductDetail";
import ImageUploadModal from "../../components/common/ImageUpload/ImageUpload";
import ConfirmModal from "../../components/common/ConfirmModal/ConfirmModal";
import useProduct from "../../hooks/useProduct";
import "../../assets/styles/page.scss";
import "./Product.scss";

// Avatar mặc định
import defaultImage from "../../assets/images/product-default-image.png";
const DEFAULT_IMAGE = defaultImage;

export default function ProductContent() {
  const {
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
    clearError,
  } = useProduct();

  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [activeOnly, setActiveOnly] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [detailProduct, setDetailProduct] = useState(null);

  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState(null);

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);

  const [successMessage, setSuccessMessage] = useState("");

  const itemsPerPage = 10;

  /* FETCH DATA */
  useEffect(() => {
    fetchProducts({
      q: "",
      active_only: activeOnly,
      limit: itemsPerPage,
      offset: 0,
    });
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts({
        q: searchQuery,
        active_only: activeOnly,
        limit: itemsPerPage,
        offset: (currentPage - 1) * itemsPerPage,
      });
    }, 500); // Debounce 500ms

    return () => clearTimeout(timer);
  }, [searchQuery, currentPage, activeOnly]);

  const totalPages = Math.ceil(total / itemsPerPage);

  /* HANDLERS */
  const handleAddProduct = () => {
    clearError();
    setSuccessMessage("");
    setSelectedProduct(null);
    setIsModalOpen(true);
  };

  const handleEditProduct = (product) => {
    clearError();
    setSuccessMessage("");
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const handleViewDetail = async (product) => {
    try {
      // Gọi API để lấy chi tiết sản phẩm
      const productDetail = await fetchProductDetail(product.product_id);
      // Set product detail và mở modal
      setDetailProduct(productDetail);
      setIsDetailModalOpen(true);
    } catch (err) {
      console.error("Không tải được chi tiết sản phẩm:", err);
    }
  };

  const handleFormSubmit = async (formData) => {
    try {
      if (selectedProduct) {
        await updateProduct(selectedProduct.product_id, formData);
        setSuccessMessage("Cập nhật sản phẩm thành công");
      } else {
        await createProduct(formData);
        setSuccessMessage("Thêm sản phẩm thành công");
      }

      setIsModalOpen(false);
      setSelectedProduct(null);

      setTimeout(() => setSuccessMessage(""), 3000);

      fetchProducts({
        q: searchQuery,
        active_only: activeOnly,
        limit: itemsPerPage,
        offset: (currentPage - 1) * itemsPerPage,
      });
    } catch (err) {
      console.error("Error submit form:", err);
    }
  };

  const handleDeleteProduct = async (productId) => {
    setProductToDelete(productId);
    setIsConfirmModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!productToDelete) return;

    try {
      const result = await deleteProduct(productToDelete);

      if (result.soft_deleted) {
        setSuccessMessage("Sản phẩm đã được ngừng hoạt động");
      } else {
        setSuccessMessage("Xóa sản phẩm thành công");
      }

      setTimeout(() => setSuccessMessage(""), 3000);

      fetchProducts({
        q: searchQuery,
        active_only: activeOnly,
        limit: itemsPerPage,
        offset: (currentPage - 1) * itemsPerPage,
      });
    } catch (err) {
      console.error("Error delete product:", err);
    } finally {
      setIsConfirmModalOpen(false);
      setProductToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setIsConfirmModalOpen(false);
    setProductToDelete(null);
  };

  // Callback chỉ nhận file, logic xử lý productId nằm ở đây
  const handleImageUpload = async (files, primaryIndex) => {
    try {
      // selectedProductId đã được set trước đó khi click vào ảnh
      await uploadProductImages(selectedProductId, files, primaryIndex);

      setIsImageModalOpen(false);
      setSelectedProductId(null);

      setSuccessMessage("Tải lên hình ảnh thành công");
      setTimeout(() => setSuccessMessage(""), 3000);

      fetchProducts({
        q: searchQuery,
        active_only: activeOnly,
        limit: itemsPerPage,
        offset: (currentPage - 1) * itemsPerPage,
      });
    } catch (err) {
      console.error("Error upload images:", err);
      throw err; // Để ImageUploadModal có thể catch và hiển thị lỗi
    }
  };

  const handleToggleActiveFilter = () => {
    setActiveOnly(!activeOnly);
    setCurrentPage(1);
  };

  /* TABLE  */
  const columns = [
    {
      key: "public_primary_image_url",
      label: "Hình ảnh",
      className: "table__cell--avatar",
      render: (value, row) => (
        <div
          className="table__img-wrapper"
          onClick={() => {
            setSelectedProductId(row.product_id);
            setIsImageModalOpen(true);
          }}
        >
          <img
            src={value || DEFAULT_IMAGE}
            alt="Product"
            className="table__img"
            onError={(e) => {
              e.target.src = DEFAULT_IMAGE;
            }}
          />
          <div className="table__img-overlay">
            <i className="bx bx-camera"></i>
            <span>Thêm ảnh</span>
          </div>
        </div>
      ),
    },
    {
      key: "name",
      label: "Tên sản phẩm",
      className: "table__cell--name",
    },
    {
      key: "category_name",
      label: "Danh mục",
      className: "table__cell--category",
      render: (v) => v || "Chưa phân loại",
    },
    {
      key: "base_price",
      label: "Giá gốc",
      className: "table__cell--price",
      render: (v) => `${Number(v).toLocaleString("vi-VN")} ₫`,
    },
    {
      key: "discount_percent",
      label: "Giảm giá",
      className: "table__cell--discount",
      render: (v) => (v ? `${v}%` : "0%"),
    },
    {
      key: "is_active",
      label: "Trạng thái",
      className: "table__cell--status",
      render: (v) => (
        <span
          className={`status-badge ${
            v ? "status-badge--active" : "status-badge--inactive"
          }`}
        >
          {v ? "Hoạt động" : "Ngừng bán"}
        </span>
      ),
    },
  ];

  const actions = [
    {
      label: "Xem chi tiết",
      icon: "bx bx-show",
      onClick: handleViewDetail,
      className: "action-btn action-btn--view",
    },
    {
      label: "Sửa",
      icon: "bx bx-edit-alt",
      onClick: handleEditProduct,
      className: "action-btn action-btn--edit",
    },
    {
      label: "Xóa",
      icon: "bx bx-trash",
      onClick: (p) => handleDeleteProduct(p.product_id),
      className: "action-btn action-btn--delete",
    },
  ];

  /* RENDER */
  return (
    <main className="main">
      <PageHeader
        title="Sản phẩm"
        breadcrumbs={[
          { label: "Trang chủ", path: "/dashboard" },
          { label: "Sản phẩm", path: "/products" },
        ]}
      />

      <div className="toolbar">
        <div className="toolbar__header">
          <div className="toolbar__title">
            <h3 className="toolbar__title-text">Quản lý sản phẩm</h3>
            <p className="toolbar__title-desc">
              Quản lý và theo dõi các sản phẩm của bạn
            </p>
          </div>
          <Button
            text="Thêm sản phẩm"
            icon="bx bx-plus"
            variant="primary"
            onClick={handleAddProduct}
          />
        </div>

        <div className="toolbar__actions">
          <div className="toolbar__search">
            <SearchBox
              placeholder="Tìm kiếm sản phẩm..."
              onSearch={(value) => {
                setSearchQuery(value);
                setCurrentPage(1);
              }}
            />
          </div>
          <button
            className={`toolbar__filter btn ${
              activeOnly ? "btn--primary" : "btn--secondary"
            }`}
            onClick={handleToggleActiveFilter}
          >
            <i className="bx bx-filter btn__icon"></i>
            <span className="btn__text">
              {activeOnly ? "Đang hoạt động" : "Tất cả"}
            </span>
          </button>
        </div>

        {error && (
          <div className="toolbar__alert alert alert-error">
            <span>{error}</span>
            <button onClick={clearError} className="alert-close">
              <X size={18} />
            </button>
          </div>
        )}

        {successMessage && (
          <div className="toolbar__alert alert alert-success">
            <Check size={18} />
            <span>{successMessage}</span>
          </div>
        )}

        {loading && <div className="toolbar__loading">Đang tải...</div>}

        <div className="toolbar__table">
          <Table columns={columns} data={products} actions={actions} />
        </div>

        {totalPages > 1 && (
          <div className="toolbar__pagination">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>

      {/*  MODALS  */}
      <ProductModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedProduct(null);
        }}
        onSubmit={handleFormSubmit}
        product={selectedProduct}
      />

      <ProductDetailModal
        isOpen={isDetailModalOpen}
        product={detailProduct}
        onClose={() => {
          setIsDetailModalOpen(false);
          setDetailProduct(null);
        }}
      />

      {/* Upload ảnh*/}
      <ImageUploadModal
        isOpen={isImageModalOpen}
        onUpload={handleImageUpload}
        onClose={() => {
          setIsImageModalOpen(false);
          setSelectedProductId(null);
        }}
        multiple={true}
        title="Cập nhật hình ảnh sản phẩm"
        maxSizeMB={5}
      />

      <ConfirmModal
        isOpen={isConfirmModalOpen}
        title="Xác nhận xóa"
        message="Bạn chắc chắn muốn xóa sản phẩm này?"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </main>
  );
}
