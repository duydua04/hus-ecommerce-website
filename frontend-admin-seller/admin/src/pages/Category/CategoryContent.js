import React, { useState, useEffect } from "react";
import { X, Check } from "lucide-react";
import PageHeader from "../../components/common/PageHeader/PageHeader";
import Table from "../../components/common/Table/Table";
import Pagination from "../../components/common/Pagination/Pagination";
import Button from "../../components/common/Button/Button";
import SearchBox from "../../components/common/SearchBox/SearchBox";
import CategoryModal from "./AddCategory/AddCategory";
import ConfirmModal from "../../components/common/ConfirmModal/ConfirmModal";
import useCategory from "../../hooks/useCategory";
import "./Category.scss";

export default function CategoryContent() {
  const {
    categories,
    total,
    loading,
    error,
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    clearError,
  } = useCategory();

  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);

  const [successMessage, setSuccessMessage] = useState("");

  const itemsPerPage = 10;

  /* FETCH DATA */
  useEffect(() => {
    fetchCategories({
      q: "",
      limit: itemsPerPage,
      offset: 0,
    });
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCategories({
        q: searchQuery,
        limit: itemsPerPage,
        offset: (currentPage - 1) * itemsPerPage,
      });
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, currentPage]);

  const totalPages = Math.ceil(total / itemsPerPage);

  /* HANDLERS */
  const handleAddCategory = () => {
    clearError();
    setSuccessMessage("");
    setSelectedCategory(null);
    setIsModalOpen(true);
  };

  const handleEditCategory = (category) => {
    clearError();
    setSuccessMessage("");
    setSelectedCategory(category);
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (formData) => {
    try {
      if (selectedCategory) {
        await updateCategory(selectedCategory.category_id, formData);
        setSuccessMessage("Cập nhật danh mục thành công");
      } else {
        await createCategory(formData);
        setSuccessMessage("Thêm danh mục thành công");
      }

      setIsModalOpen(false);
      setSelectedCategory(null);

      setTimeout(() => setSuccessMessage(""), 3000);

      fetchCategories({
        q: searchQuery,
        limit: itemsPerPage,
        offset: (currentPage - 1) * itemsPerPage,
      });
    } catch (err) {
      console.error("Error submit form:", err);
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    setCategoryToDelete(categoryId);
    setIsConfirmModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!categoryToDelete) return;

    try {
      await deleteCategory(categoryToDelete);
      setSuccessMessage("Xóa danh mục thành công");

      setTimeout(() => setSuccessMessage(""), 3000);

      fetchCategories({
        q: searchQuery,
        limit: itemsPerPage,
        offset: (currentPage - 1) * itemsPerPage,
      });
    } catch (err) {
      console.error("Error delete category:", err);
    } finally {
      setIsConfirmModalOpen(false);
      setCategoryToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setIsConfirmModalOpen(false);
    setCategoryToDelete(null);
  };

  /* TABLE */
  const columns = [
    {
      key: "category_id",
      label: "ID",
      className: "table__cell--id",
    },
    {
      key: "category_name",
      label: "Tên danh mục",
      className: "table__cell--name",
    },
    {
      key: "created_at",
      label: "Ngày tạo",
      className: "table__cell--date",
      render: (value) => {
        if (!value) return "-";
        return new Date(value).toLocaleDateString("vi-VN", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        });
      },
    },
  ];

  const actions = [
    {
      label: "Sửa",
      icon: "bx bx-edit-alt",
      onClick: handleEditCategory,
      className: "action-btn action-btn--edit",
    },
    {
      label: "Xóa",
      icon: "bx bx-trash",
      onClick: (c) => handleDeleteCategory(c.category_id),
      className: "action-btn action-btn--delete",
    },
  ];

  /* RENDER */
  return (
    <main className="main">
      <PageHeader
        title="Danh mục"
        breadcrumbs={[
          { label: "Trang chủ", path: "/dashboard" },
          { label: "Danh mục", path: "/categories" },
        ]}
      />

      <div className="toolbar">
        <div className="toolbar__header">
          <div className="toolbar__title">
            <h3 className="toolbar__title-text">Quản lý danh mục</h3>
            <p className="toolbar__title-desc">
              Quản lý và theo dõi các danh mục sản phẩm
            </p>
          </div>
          <Button
            text="Thêm danh mục"
            icon="bx bx-plus"
            variant="primary"
            onClick={handleAddCategory}
          />
        </div>

        <div className="toolbar__actions">
          <div className="toolbar__search">
            <SearchBox
              placeholder="Tìm kiếm danh mục..."
              onSearch={(value) => {
                setSearchQuery(value);
                setCurrentPage(1);
              }}
            />
          </div>
          <button className="toolbar__filter btn btn--secondary">
            <i className="bx bx-filter btn__icon"></i>
            <span className="btn__text">Lọc</span>
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
          <Table columns={columns} data={categories} actions={actions} />
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

      {/* MODALS */}
      <CategoryModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedCategory(null);
        }}
        onSubmit={handleFormSubmit}
        category={selectedCategory}
      />

      <ConfirmModal
        isOpen={isConfirmModalOpen}
        title="Thông báo"
        message="Bạn chắc chắn muốn xóa danh mục này?"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </main>
  );
}
