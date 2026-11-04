import React, { useState } from 'react';
import { Heart, ExternalLink, Book as BookIcon } from 'lucide-react';

export default function BookCard({ book, isWishlisted, onToggleWishlist }) {
  if (!book) return null;

  const [imgError, setImgError] = useState(false);
  const isLowest = Boolean(book.isLowest);
  const rawImage = book.image || book.coverImage;
  const showImage = Boolean(rawImage && !imgError);
  const formattedPrice = typeof book.priceFormatted === 'string'
    ? book.priceFormatted
    : `$${(Number(book.price) || 0).toFixed(2)}`;

  // Safe string values so React child object error can never happen
  const safeCondition = (typeof book.condition === 'string' && book.condition.trim())
    ? book.condition
    : 'Used';

  const safeAvailability = (typeof book.availability === 'string' && book.availability.trim())
    ? book.availability
    : 'In Stock';

  const safeTitle = typeof book.title === 'string' ? book.title : 'Book Title';
  const safeAuthor = typeof book.author === 'string' ? book.author : 'Unknown Author';
  const safeWebsite = typeof book.website === 'string' ? book.website : 'Bookstore';

  return (
    <div className={`grid-book-card ${isLowest ? 'card-is-lowest' : ''}`}>

      <div className="card-top-bar">
        <span className="store-pill">{safeWebsite}</span>

        <div className="card-top-right">
          {isLowest && <span className="lowest-pill">Lowest Price</span>}
          <button
            className={`card-heart-btn ${isWishlisted ? 'saved' : ''}`}
            onClick={() => onToggleWishlist && onToggleWishlist(book)}
            title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
          >
            <Heart
              size={16}
              fill={isWishlisted ? '#f43f5e' : 'none'}
              color={isWishlisted ? '#f43f5e' : '#64748b'}
            />
          </button>
        </div>
      </div>

      {/* Book Cover Image */}
      <div className="card-image-wrap">
        {showImage ? (
          <img
            src={rawImage}
            alt={safeTitle}
            className="card-book-img"
            onError={() => setImgError(true)}
            loading="lazy"
          />
        ) : (
          <div className="placeholder-box">
            <BookIcon size={34} color="#818cf8" />
            <span className="placeholder-title" title={safeTitle}>
              {safeTitle}
            </span>
          </div>
        )}
      </div>

      {/* Book Info */}
      <div className="card-info">
        <h3 className="card-title" title={safeTitle}>
          {safeTitle}
        </h3>
        <p className="card-author">{safeAuthor}</p>

        {/* Condition & Stock */}
        <div className="card-status-row">
          <span className="condition-pill">{safeCondition}</span>
          <span className="stock-label">&bull; {safeAvailability}</span>
        </div>

        {/* Price & Action */}
        <div className="card-bottom-row">
          <span className={`card-price ${isLowest ? 'lowest-price-text' : ''}`}>
            {formattedPrice}
          </span>

          <a
            href={typeof book.sourceUrl === 'string' ? book.sourceUrl : '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="view-source-btn"
          >
            <span>View Source</span>
            <ExternalLink size={12} />
          </a>
        </div>
      </div>
    </div>
  );
}
