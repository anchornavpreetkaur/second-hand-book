import React, { useState } from 'react';
import { X, Trash2, ExternalLink, Heart } from 'lucide-react';

function WishlistThumb({ src, title }) {
  const [imgError, setImgError] = useState(false);
  if (!src || imgError) {
    return <div className="wishlist-no-thumb">Book</div>;
  }
  return (
    <img
      src={src}
      alt={title}
      className="wishlist-entry-img"
      onError={() => setImgError(true)}
      loading="lazy"
    />
  );
}

export default function WishlistModal({ isOpen, onClose, wishlist, onRemoveItem, onClearAll, user }) {
  if (!isOpen || !user) return null;

  // Calculate total in Euros
  const totalPrice = wishlist.reduce((sum, item) => sum + (Number(item.price) || 0), 0);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="wishlist-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="wishlist-modal-header">
          <div className="wishlist-header-left">
            <div className="wishlist-header-icon">
              <Heart size={20} color="#ffffff" fill="#ffffff" />
            </div>
            <div>
              <h2 className="wishlist-modal-title">My Wishlist</h2>
              <span className="wishlist-modal-subtitle">{wishlist.length} {wishlist.length === 1 ? 'book' : 'books'} saved</span>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} title="Close">
            <X size={20} />
          </button>
        </div>

        {/* Total Estimated Value Banner */}
        <div className="wishlist-value-strip">
          <div className="total-val-text">
            <span>Total Estimated Value: </span>
            <strong>€{totalPrice.toFixed(2)}</strong>
          </div>
          {wishlist.length > 0 && (
            <button className="clear-all-btn" onClick={onClearAll} title="Clear all items">
              <Trash2 size={15} />
              <span>Clear All</span>
            </button>
          )}
        </div>

        {/* Wishlist Items List */}
        <div className="wishlist-items-container">
          {wishlist.length === 0 ? (
            <div className="wishlist-empty-msg">
              <p>Your wishlist is empty.</p>
              <span>Click the heart icon on any book to save it to your wishlist.</span>
            </div>
          ) : (
            wishlist.map((item, index) => (
              <div key={item.id || item._id || index} className="wishlist-entry-card">
                {/* Book Thumbnail */}
                <div className="wishlist-thumb-box">
                  <WishlistThumb
                    src={item.image || item.coverImage}
                    title={item.title}
                  />
                </div>

                {/* Info */}
                <div className="wishlist-entry-info">
                  <h4 className="wishlist-entry-title">{item.title}</h4>
                  <p className="wishlist-entry-author">{item.author || 'Unknown Author'}</p>
                  <div className="wishlist-badges-row">
                    <span className="badge-website">{item.website}</span>
                    <span className="badge-condition">{item.condition || 'Used'}</span>
                  </div>
                </div>

                {/* Price and Actions */}
                <div className="wishlist-entry-right">
                  <div className="wishlist-entry-price">
                    {item.priceFormatted || `€${Number(item.price).toFixed(2)}`}
                  </div>
                  <div className="wishlist-entry-actions">
                    <a
                      href={item.sourceUrl || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="wishlist-view-btn"
                    >
                      <span>View</span>
                      <ExternalLink size={12} />
                    </a>
                    <button
                      className="wishlist-delete-btn"
                      onClick={() => onRemoveItem(item)}
                      title="Remove"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
