import React, { useState } from "react";
import "./SearchBox.scss";

const SearchBox = ({ placeholder = "Tìm kiếm...", onSearch }) => {
  const [value, setValue] = useState("");

  const handleSearch = (e) => {
    setValue(e.target.value);
    onSearch && onSearch(e.target.value);
  };

  return (
    <div className="search-box">
      <i className="bx bx-search search-box__icon"></i>
      <input
        type="text"
        className="search-box__input"
        placeholder={placeholder}
        value={value}
        onChange={handleSearch}
      />
    </div>
  );
};

export default SearchBox;
