import React, { useState } from 'react';
import { Heart, ExternalLink, Book as BookIcon } from 'lucide-react';

function TableImage({ src, title }) {
  const [imgError, setImgError] = useState(false);

  if (!src || imgError) {
    return (
      <div className="table-cover-fallback" title={title}>
        <BookIcon size={16} color="#818cf8" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={title}
      className="table-cover-thumb"
      onError={() => setImgError(true)}
      loading="lazy"
    />
  );
}

export default function ComparisonTable({ books, wishlist = [], wishlistIds = [], onToggleWishlist }) {
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
          {books.map((book, index) => {
            const bId = book.id || book._id;
            const isSaved = wishlistIds.includes(bId) ||
              wishlist.some(item => (item.bookId === bId) || (item.title === book.title && item.website === book.website));
            const isLowest = book.isLowest;

            return (
              <tr
                key={book.id || book._id || index}
                className={isLowest ? 'row-lowest-match' : ''}
              >
                {/* SAVE */}
                <td style={{ textAlign: 'center' }}>
                  <button
                    className={`save-heart-btn ${isSaved ? 'saved' : ''}`}
                    onClick={() => onToggleWishlist(book)}
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
                      title={book.title}
                    />
                    <div>
                      <div className="table-book-title">{book.title}</div>
                      <div className="table-book-author">{book.author || 'Unknown Author'}</div>
                    </div>
                  </div>
                </td>

                {/* ISBN / EDITION */}
                <td>
                  <div className="isbn-cell">
                    <span className="isbn-text">{book.isbn || 'ISBN: -'}</span>
                    <span className="edition-text">{book.edition || 'Standard Edition'}</span>
                  </div>
                </td>

                {/* WEBSITE */}
                <td>
                  <span className="badge-website">{book.website}</span>
                </td>

                {/* CONDITION */}
                <td>
                  <span className="badge-condition">
                    {book.condition || 'Used'}
                  </span>
                </td>

                {/* PRICE */}
                <td>
                  <div className="price-cell">
                    <span className={`price-text ${isLowest ? 'lowest' : ''}`}>
                      {book.priceFormatted || `€${Number(book.price).toFixed(2)}`}
                    </span>
                    {isLowest && (
                      <span className="lowest-tag-badge">LOWEST</span>
                    )}
                  </div>
                </td>

                {/* AVAILABILITY */}
                <td>
                  <span className="availability-cell">{book.availability || 'In Stock'}</span>
                </td>

                {/* SOURCE LINK */}
                <td>
                  <a
                    href={book.sourceUrl || '#'}
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
