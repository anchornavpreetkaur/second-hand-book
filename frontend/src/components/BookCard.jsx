import React, { useState } from 'react';
import { Heart, ExternalLink, Book as BookIcon } from 'lucide-react';

export default function BookCard({ book, isWishlisted, onToggleWishlist }) {
  const [imgError, setImgError] = useState(false);
  const isLowest = book.isLowest;
  const rawImage = book.image || book.coverImage;
  const showImage = Boolean(rawImage && !imgError);

  return (
    <div className={`grid-book-card ${isLowest ? 'card-is-lowest' : ''}`}>

      <div className="card-top-bar">
        <span className="store-pill">{book.website}</span>

        <div className="card-top-right">
          {isLowest && <span className="lowest-pill">Lowest Price</span>}
          <button
            className={`card-heart-btn ${isWishlisted ? 'saved' : ''}`}
            onClick={() => onToggleWishlist(book)}
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
            alt={book.title}
            className="card-book-img"
            onError={() => setImgError(true)}
            loading="lazy"
          />
        ) : (
          <div className="placeholder-box">
            <BookIcon size={34} color="#818cf8" />
            <span className="placeholder-title" title={book.title}>
              {book.title}
            </span>
          </div>
        )}
      </div>

      {/* Book Info */}
      <div className="card-info">
        <h3 className="card-title" title={book.title}>
          {book.title}
        </h3>
        <p className="card-author">{book.author || 'Unknown Author'}</p>

        {/* Condition & Stock */}
        <div className="card-status-row">
          <span className="condition-pill">{book.condition || 'Used'}</span>
          <span className="stock-label">&bull; {book.availability || 'In Stock'}</span>
        </div>

        {/* Price & Action */}
        <div className="card-bottom-row">
          <span className={`card-price ${isLowest ? 'lowest-price-text' : ''}`}>
            {book.priceFormatted || `€${Number(book.price).toFixed(2)}`}
          </span>

          <a
            href={book.sourceUrl || '#'}
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
