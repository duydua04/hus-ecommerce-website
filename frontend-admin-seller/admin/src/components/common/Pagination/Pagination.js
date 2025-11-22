import React from "react";
import "./Pagination.scss";

const Pagination = ({
  currentPage = 1,
  totalPages = 10,
  onPageChange,
  maxVisiblePages = 5,
}) => {
  const handlePrevious = () => {
    if (currentPage > 1) onPageChange(currentPage - 1);
  };

  const handleNext = () => {
    if (currentPage < totalPages) onPageChange(currentPage + 1);
  };

  const getPageNumbers = () => {
    const pages = [];
    const halfVisible = Math.floor(maxVisiblePages / 2);

    let start = Math.max(1, currentPage - halfVisible);
    let end = Math.min(totalPages, start + maxVisiblePages - 1);

    if (end - start + 1 < maxVisiblePages) {
      start = Math.max(1, end - maxVisiblePages + 1);
    }

    if (start > 1) pages.push(1);
    if (start > 2) pages.push("...");

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (end < totalPages - 1) pages.push("...");
    if (end < totalPages) pages.push(totalPages);

    return pages;
  };

  return (
    <div className="toolbar__pagination pagination">
      <button
        className="pagination__btn"
        onClick={handlePrevious}
        disabled={currentPage === 1}
      >
        <i className="bx bx-chevron-left pagination__icon"></i>
      </button>

      {getPageNumbers().map((page, index) =>
        page === "..." ? (
          <span
            key={index}
            className="pagination__dots pagination__dots--hide-mobile"
          >
            {page}
          </span>
        ) : (
          <button
            key={index}
            className={`pagination__btn ${
              page === currentPage ? "pagination__btn--active" : ""
            } 
              ${page > 3 ? "pagination__btn--hide-mobile" : ""}`}
            onClick={() => onPageChange(page)}
          >
            {page}
          </button>
        )
      )}

      <button
        className="pagination__btn"
        onClick={handleNext}
        disabled={currentPage === totalPages}
      >
        <i className="bx bx-chevron-right pagination__icon"></i>
      </button>
    </div>
  );
};

export default Pagination;
