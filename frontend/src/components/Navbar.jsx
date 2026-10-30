import React from 'react';
import { Bookmark, Heart, Sun, Moon, LogOut, UserPlus } from 'lucide-react';

export default function Navbar({
  user,
  onOpenLogin,
  onOpenSignup,
  onLogout,
  wishlistCount,
  onOpenWishlist,
  theme,
  onToggleTheme
}) {
  return (
    <header className="navbar">
      <div className="navbar-container">
        {/* Brand */}
        <div className="navbar-brand">
          <div className="brand-icon">
            <Bookmark size={20} color="#ffffff" fill="#ffffff" />
          </div>
          <div className="brand-text">
            <h1 className="brand-title">Second Hand Books</h1>
            <span className="brand-subtitle">Search & PRICE COMPARISON</span>
          </div>
        </div>

        {/* User Account & Actions */}
        <div className="navbar-actions">
          {user ? (
            <>
              <span className="user-name">{user.name}</span>

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
              fill={wishlistCount > 0 ? '#f43f5e' : 'none'}
              color={wishlistCount > 0 ? '#f43f5e' : 'currentColor'}
            />
            <span>Wishlist</span>
            {wishlistCount > 0 && (
              <span className="wishlist-badge">{wishlistCount}</span>
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
