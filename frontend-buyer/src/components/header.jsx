// src/components/header.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useUser } from "../context/UserContext";
import './header.css';

const Header = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const { user, setUser } = useUser();
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Fetch user info on mount nếu chưa có user trong context
  useEffect(() => {
    const token = localStorage.getItem("userRole");
    if (!token || user) return; // Nếu đã có user thì không load lại

    const loadUser = async () => {
      try {
        const userData = await api.auth.getMe();
        setUser(userData);
      } catch (err) {
        console.error("Load user error:", err);
      }
    };

    loadUser();
  }, [user, setUser]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const handleLogout = async () => {
    try {
      await api.auth.logout();
    } catch (err) {
      console.warn('Logout API failed:', err);
    }

    // Xóa token và thông tin user
    localStorage.removeItem('access_token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('savedBuyerEmail');

    // Clear user context
    setUser(null);

    // Quay về trang login
    navigate('/login', { replace: true });
  };

  // Lấy tên hiển thị từ UserContext
  const getDisplayName = () => {
    if (!user) return 'Tài khoản';

    // Ưu tiên fname + lname
    if (user.fname || user.lname) {
      return `${user.lname || ''} ${user.fname || ''}`.trim();
    }

    return user.email?.split('@')[0] || 'Tài khoản';
  };

  // Lấy avatar URL từ UserContext - ƯU TIÊN avt_url từ /auth/me
  const getAvatarUrl = () => {
    return user?.avt_url || null;
  };

  return (
    <header className="header">
      <div className="header__inner">
        <div className="header__left">
          <div className="brand">
            <Link to="/" className="brand__link">
              <img
                  src="src/assets/Logo/Logo.png"
                  alt="FastBuy"
                  className="brand__logo"
                  style={{
                    height: '40px',
                    width: 'auto'
                  }}
                />
              <span className="brand__name">Fastbuy</span>
            </Link>
          </div>
        </div>

        <div className="header__center">
          <form className="search" onSubmit={handleSearch}>
            <input
              className="search__input"
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm sản phẩm..."
              aria-label="Tìm kiếm sản phẩm"
            />
            <button className="search__button" type="submit" aria-label="Tìm kiếm">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </button>
          </form>
        </div>

        <div className="header__right">
          <div className="icon-group">
            <Link
              to="/tracking"
              className="icon-group__button"
              data-tooltip="Đơn hàng của tôi"
              aria-label="Đơn hàng của tôi"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20.198 3H3.802C3.05147 3 2.6762 3 2.41637 3.17726C2.28768 3.26505 2.18133 3.38109 2.10567 3.51627C1.9529 3.78921 1.99024 4.15793 2.06493 4.89537C2.18958 6.12624 2.2519 6.74168 2.57823 7.18168C2.74084 7.40095 2.94701 7.58519 3.18414 7.72315C3.65999 8 4.28635 8 5.53908 8H18.4609C19.7136 8 20.34 8 20.8159 7.72315C21.053 7.58519 21.2592 7.40095 21.4218 7.18168C21.7481 6.74168 21.8104 6.12624 21.9351 4.89537C22.0098 4.15793 22.0471 3.78921 21.8943 3.51627C21.8187 3.38109 21.7123 3.26505 21.5836 3.17726C21.3238 3 20.9485 3 20.198 3Z" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
                <path d="M3 8L3 13.0408C3 16.7928 3 18.6688 4.17157 19.8344C5.34315 21 7.22876 21 11 21H13C16.7712 21 18.6569 21 19.8284 19.8344C21 18.6688 21 16.7928 21 13.0408V8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
                <path d="M10 11H14" strokeWidth="1.5" strokeLinecap="round"></path>
              </svg>
            </Link>

            <Link
              to="/cart"
              className="icon-group__button"
              data-tooltip="Giỏ hàng"
              aria-label="Giỏ hàng"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M8 16L16.7201 15.2733C19.4486 15.046 20.0611 14.45 20.3635 11.7289L21 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"></path>
                <path d="M6 6H22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"></path>
                <circle cx="6" cy="20" r="2" stroke="currentColor" strokeWidth="1.5"></circle>
                <circle cx="17" cy="20" r="2" stroke="currentColor" strokeWidth="1.5"></circle>
                <path d="M8 20L15 20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"></path>
                <path d="M2 2H2.966C3.91068 2 4.73414 2.62459 4.96326 3.51493L7.93852 15.0765C8.08887 15.6608 7.9602 16.2797 7.58824 16.7616L6.63213 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"></path>
              </svg>
            </Link>

            <div className="user-menu">
              <button
                className="icon-group__button"
                data-tooltip={getDisplayName()}
                aria-label="Tài khoản"
                onClick={() => setShowUserMenu(!showUserMenu)}
              >
                {getAvatarUrl() ? (
                  <img
                    src={getAvatarUrl()}
                    alt="avatar"
                    className="header-avatar"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.style.display = 'none';
                      e.target.parentElement.innerHTML = '<div class="header-avatar header-avatar--fallback">👤</div>';
                    }}
                  />
                ) : (
                  <div className="header-avatar header-avatar--fallback">
                    👤
                  </div>
                )}
              </button>

              {showUserMenu && (
                <div className="user-menu__dropdown">
                  {user && (
                    <>
                      <div className="user-menu__header">
                        <div className="user-menu__avatar">
                          {getAvatarUrl() ? (
                            <img
                              src={getAvatarUrl()}
                              alt="avatar"
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                objectPosition: 'center',
                                borderRadius: '50%'
                              }}
                              onError={(e) => {
                                console.error('Header avatar load error');
                                e.target.style.display = 'none';
                                e.target.parentElement.innerHTML = '<div style="font-size: 24px; display: flex; align-items: center; justify-content: center; width: 100%; height: 100%;">👤</div>';
                              }}
                            />
                          ) : (
                            <div style={{
                              fontSize: '24px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: '100%',
                              height: '100%'
                            }}>
                              👤
                            </div>
                          )}
                        </div>

                        <div className="user-menu__info">
                          <div className="user-menu__name">
                            {getDisplayName()}
                          </div>
                          <div className="user-menu__email">
                            {user.email}
                          </div>
                        </div>
                      </div>

                      <div className="user-menu__divider"></div>
                    </>
                  )}

                  <Link to="/profile" className="user-menu__item" onClick={() => setShowUserMenu(false)}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                    <span>Tài khoản của tôi</span>
                  </Link>

                  <Link to="/tracking" className="user-menu__item" onClick={() => setShowUserMenu(false)}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
                      <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
                    </svg>
                    <span>Đơn hàng của tôi</span>
                  </Link>

                  <div className="user-menu__divider"></div>

                  <button className="user-menu__item user-menu__item--logout" onClick={handleLogout}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                      <polyline points="16 17 21 12 16 7"></polyline>
                      <line x1="21" y1="12" x2="9" y2="12"></line>
                    </svg>
                    <span>Đăng xuất</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {showUserMenu && (
          <div className="user-menu__backdrop" onClick={() => setShowUserMenu(false)} />
        )}
      </div>
    </header>
  );
};

export default Header;