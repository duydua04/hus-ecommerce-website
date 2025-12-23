import React from 'react';
import "./header.css";

const Header = () => {
  return (
    <header className="header">
        <div className="header__inner">
          <div className="header__left">
            <div className="brand">
              <a href="/" className="brand__link">
                <div className="brand__logo">🐳</div>
                <span className="brand__name">BrandName</span>
              </a>
            </div>
          </div>

          <div className="header__center">
            <form className="search" action="/search">
              <input
                className="search__input"
                type="search"
                placeholder="Tìm kiếm sản phẩm"
              />
              <button className="search__button" type="submit" aria-label="search">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="11" cy="11" r="8"/>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
              </button>
            </form>
          </div>

          <div className="header__right">
            <div className="icon-group">
              <div className="icon-group__button" data-tooltip="My Order">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20.198 3H3.802C3.05147 3 2.6762 3 2.41637 3.17726C2.28768 3.26505 2.18133 3.38109 2.10567 3.51627C1.9529 3.78921 1.99024 4.15793 2.06493 4.89537C2.18958 6.12624 2.2519 6.74168 2.57823 7.18168C2.74084 7.40095 2.94701 7.58519 3.18414 7.72315C3.65999 8 4.28635 8 5.53908 8H18.4609C19.7136 8 20.34 8 20.8159 7.72315C21.053 7.58519 21.2592 7.40095 21.4218 7.18168C21.7481 6.74168 21.8104 6.12624 21.9351 4.89537C22.0098 4.15793 22.0471 3.78921 21.8943 3.51627C21.8187 3.38109 21.7123 3.26505 21.5836 3.17726C21.3238 3 20.9485 3 20.198 3Z" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path>
                    <path d="M3 8L3 13.0408C3 16.7928 3 18.6688 4.17157 19.8344C5.34315 21 7.22876 21 11 21H13C16.7712 21 18.6569 21 19.8284 19.8344C21 18.6688 21 16.7928 21 13.0408V8" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path>
                    <path d="M10 11H14" stroke-width="1.5" stroke-linecap="round"></path>
                </svg>
              </div>
              <div className="icon-group__button" data-tooltip="My Cart">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M8 16L16.7201 15.2733C19.4486 15.046 20.0611 14.45 20.3635 11.7289L21 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"></path>
                    <path d="M6 6H22" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"></path>
                    <circle cx="6" cy="20" r="2" stroke="currentColor" stroke-width="1.5"></circle>
                    <circle cx="17" cy="20" r="2" stroke="currentColor" stroke-width="1.5"></circle>
                    <path d="M8 20L15 20" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"></path>
                    <path d="M2 2H2.966C3.91068 2 4.73414 2.62459 4.96326 3.51493L7.93852 15.0765C8.08887 15.6608 7.9602 16.2797 7.58824 16.7616L6.63213 18" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"></path>
                </svg>
              </div>
              <div className="icon-group__button" data-tooltip="Sign In">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" stroke="currentColor" stroke-width="1.5" />
                    <path d="M15 10C15 11.6569 13.6569 13 12 13C10.3431 13 9 11.6569 9 10C9 8.34315 10.3431 7 12 7C13.6569 7 15 8.34315 15 10Z" stroke="currentColor" stroke-width="1.5" />
                    <path d="M5.49994 19.0001L6.06034 18.0194C6.95055 16.4616 8.60727 15.5001 10.4016 15.5001H13.5983C15.3926 15.5001 17.0493 16.4616 17.9395 18.0194L18.4999 19.0001" stroke="currentColor" stroke-width="1.5" stroke-linecap="square" stroke-linejoin="round" />
                </svg>
              </div>
            </div>
          </div>
         </div>
    </header>
  );
};

export default Header;