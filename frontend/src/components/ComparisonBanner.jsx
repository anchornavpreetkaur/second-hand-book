import React from 'react';

export default function ComparisonBanner({ searchQuery, totalListings, bestPrice, lowestPriceStore }) {
  return (
    <div className="summary-banner-card">
      {/* 1. Search Query */}
      <div className="banner-col">
        <span className="banner-label">SEARCH QUERY</span>
        <div className="banner-val-query">"{searchQuery}"</div>
      </div>

      {/* 2. Listings Found */}
      <div className="banner-col">
        <span className="banner-label">LISTINGS FOUND</span>
        <div className="banner-val-bold">{totalListings} Offers</div>
      </div>

      {/* 3. Best Price (Same Book) */}
      <div className="banner-col">
        <span className="banner-label">BEST PRICE (SAME BOOK)</span>
        <div className="banner-val-price">{bestPrice}</div>
      </div>

      {/* 4. Lowest Price Store */}
      <div className="banner-col">
        <span className="banner-label">LOWEST PRICE STORE (SAME BOOK)</span>
        <div className="banner-val-store">{lowestPriceStore}</div>
      </div>
    </div>
  );
}
