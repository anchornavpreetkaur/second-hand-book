import React, { useState } from 'react';
import { Heart, ExternalLink, Book as BookIcon } from 'lucide-react';

function TableImage({ src, title }) {
  const [imgError, setImgError] = useState(false);

  if (!src || imgError) {
    return (
      <div className="table-cover-fallback" title={title || 'Book'}>
        <BookIcon size={16} color="#818cf8" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={title || 'Book cover'}
      className="table-cover-thumb"
      onError={() => setImgError(true)}
      loading="lazy"
    />
  );
}

export default function ComparisonTable({ books = [], wishlist = [], wishlistIds = [], onToggleWishlist }) {
  const safeBooks = Array.isArray(books) ? books.filter(Boolean) : [];
  const safeWishlist = Array.isArray(wishlist) ? wishlist.filter(Boolean) : [];
  const safeWishlistIds = Array.isArray(wishlistIds) ? wishlistIds : [];

  return (
    <div className="table-card-container">
      <table className="books-table">
        <thead>
          <tr>
            <th style={{ width: '60px', textAlign: 'center' }}>SAVE</th>
            <th>BOOK DETAILS</th>
            <th>ISBN / EDITION</th>
            <th>WEBSITE</th>
            <th>CONDITION</th>
            <th>PRICE</th>
            <th>AVAILABILITY</th>
            <th>SOURCE LINK</th>
          </tr>
        </thead>
        <tbody>
          {safeBooks.map((book, index) => {
            if (!book) return null;
            const bId = book.id || book._id || `book-row-${index}`;
            const isSaved = safeWishlistIds.includes(bId) ||
              safeWishlist.some(item => item && ((item.bookId === bId) || (item.title === book.title && item.website === book.website)));
            const isLowest = Boolean(book.isLowest);
            const formattedPrice = typeof book.priceFormatted === 'string'
              ? book.priceFormatted
              : `$${(Number(book.price) || 0).toFixed(2)}`;

            // Safe string values so React child object error can never happen
            const safeTitle = typeof book.title === 'string' ? book.title : 'Book Title';
            const safeAuthor = typeof book.author === 'string' ? book.author : 'Unknown Author';
            const safeIsbn = typeof book.isbn === 'string' ? book.isbn : 'ISBN: -';
            const safeEdition = typeof book.edition === 'string' ? book.edition : 'Standard Edition';
            const safeWebsite = typeof book.website === 'string' ? book.website : 'Store';
            const safeCondition = typeof book.condition === 'string' ? book.condition : 'Used';
            const safeAvailability = typeof book.availability === 'string' ? book.availability : 'In Stock';

            return (
              <tr
                key={bId}
                className={isLowest ? 'row-lowest-match' : ''}
              >
                {/* SAVE */}
                <td style={{ textAlign: 'center' }}>
                  <button
                    className={`save-heart-btn ${isSaved ? 'saved' : ''}`}
                    onClick={() => onToggleWishlist && onToggleWishlist(book)}
                    title={isSaved ? "Remove from Wishlist" : "Save to Wishlist"}
                  >
                    <Heart
                      size={16}
                      fill={isSaved ? "#f43f5e" : "none"}
                      color={isSaved ? "#f43f5e" : "#64748b"}
                    />
                  </button>
                </td>

                {/* BOOK DETAILS */}
                <td>
                  <div className="table-book-info">
                    <TableImage
                      src={book.image || book.coverImage}
                      title={safeTitle}
                    />
                    <div>
                      <div className="table-book-title">{safeTitle}</div>
                      <div className="table-book-author">{safeAuthor}</div>
                    </div>
                  </div>
                </td>

                {/* ISBN / EDITION */}
                <td>
                  <div className="isbn-cell">
                    <span className="isbn-text">{safeIsbn}</span>
                    <span className="edition-text">{safeEdition}</span>
                  </div>
                </td>

                {/* WEBSITE */}
                <td>
                  <span className="badge-website">{safeWebsite}</span>
                </td>

                {/* CONDITION */}
                <td>
                  <span className="badge-condition">
                    {safeCondition}
                  </span>
                </td>

                {/* PRICE */}
                <td>
                  <div className="price-cell">
                    <span className={`price-text ${isLowest ? 'lowest' : ''}`}>
                      {formattedPrice}
                    </span>
                    {isLowest && (
                      <span className="lowest-tag-badge">LOWEST</span>
                    )}
                  </div>
                </td>

                {/* AVAILABILITY */}
                <td>
                  <span className="availability-cell">{safeAvailability}</span>
                </td>

                {/* SOURCE LINK */}
                <td>
                  <a
                    href={typeof book.sourceUrl === 'string' ? book.sourceUrl : '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="view-source-btn"
                  >
                    <span>View Source</span>
                    <ExternalLink size={12} />
                  </a>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
