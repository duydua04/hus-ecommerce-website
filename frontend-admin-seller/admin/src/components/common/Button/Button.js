import React from "react";
import "./Button.scss";

const Button = ({
  variant = "primary",
  icon = "",
  text = "",
  onClick,
  className = "",
}) => {
  return (
    <button className={`btn btn--${variant} ${className}`} onClick={onClick}>
      {icon && <i className={`${icon} btn__icon`}></i>}
      {text && <span className="btn__text">{text}</span>}
    </button>
  );
};

export default Button;
