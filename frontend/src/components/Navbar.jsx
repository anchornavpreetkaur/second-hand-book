import React from 'react';
import { Heart, Sun, Moon, LogOut, UserPlus } from 'lucide-react';

export default function Navbar({
  user,
  onOpenLogin,
  onOpenSignup,
  onLogout,
  wishlistCount = 0,
  onOpenWishlist,
  theme = 'dark',
  onToggleTheme
}) {
  const safeCount = Number(wishlistCount) || 0;

  return (
    <header className="navbar">
      <div className="navbar-container">
        {/* Brand */}
        <div className="navbar-brand">
          <img
            src="/book-exchange-logo.png"
            alt="BookCompare logo"
            className="brand-logo"
          />
          <div className="brand-text">
            <h1 className="brand-title">BookCompare</h1>
            <span className="brand-subtitle">Second-hand book prices</span>
          </div>
        </div>

        {/* User Account & Actions */}
        <div className="navbar-actions">
          {user ? (
            <>
              <span className="user-name">{user.name || 'User'}</span>

              <button className="nav-btn" onClick={onLogout} title="Log out">
                <LogOut size={15} />
                <span>Log out</span>
              </button>
            </>
          ) : (
            <button className="nav-btn nav-btn-primary" onClick={onOpenSignup} title="Sign up">
              <UserPlus size={15} />
              <span>Sign up</span>
            </button>
          )}

          <button className="nav-btn wishlist-nav-btn" onClick={onOpenWishlist} title="Wishlist">
            <Heart
              size={15}
              fill={safeCount > 0 ? '#f43f5e' : 'none'}
              color={safeCount > 0 ? '#f43f5e' : 'currentColor'}
            />
            <span>Wishlist</span>
            {safeCount > 0 && (
              <span className="wishlist-badge">{safeCount}</span>
            )}
          </button>

          <button className="nav-btn" onClick={onToggleTheme} title="Toggle theme">
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
