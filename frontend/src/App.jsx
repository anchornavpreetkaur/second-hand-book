import React, { useState, useEffect } from 'react';
import { Search, X, Sparkles, Filter, Table, LayoutGrid, AlertCircle } from 'lucide-react';
import Navbar from './components/Navbar';
import BookCard from './components/BookCard';
import ComparisonTable from './components/ComparisonTable';
import ComparisonBanner from './components/ComparisonBanner';
import WishlistModal from './components/WishlistModal';
import AuthModal from './components/AuthModal';

// --- CONFIGURATION & CONSTANTS ---
const API_BASE_URL = 'http://localhost:5000/api';

const SUGGESTIONS = [
  "Harry Potter",
  "The Great Gatsby",
  "1984",
  "To Kill a Mockingbird",
  "Pride and Prejudice",
  "The Hobbit"
];

const POPULAR_FINLAND = [
  "Harry Potter",
  "The Great Gatsby",
  "1984",
  "The Hobbit"
];

const WEBSITES_LIST = [
  "All Websites (5)",
  "Tori.fi",
  "Antikvariaatti.net",
  "Suomalainen.com",
  "Finlandiakirja.fi",
  "Adlibris.com"
];

const CONDITIONS_LIST = [
  "All Conditions",
  "Used",
  "New"
];

const SORT_OPTIONS = [
  "Lowest Price",
  "Highest Price",
  "Title (A-Z)"
];

export default function App() {
  // --- 1. SEARCH & BOOK LISTINGS STATE ---
  const [searchTerm, setSearchTerm] = useState('');
  const [activeQuery, setActiveQuery] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [books, setBooks] = useState([]);
  const [viewMode, setViewMode] = useState('grid'); // 'table' or 'grid'

  // --- 2. FILTER & SORT STATE ---
  const [selectedWebsite, setSelectedWebsite] = useState('All Websites (5)');
  const [selectedCondition, setSelectedCondition] = useState('All Conditions');
  const [sortBy, setSortBy] = useState('Lowest Price');

  // --- 3. AUTHENTICATION & USER STATE ---
  // Retrieve saved user from browser's sessionStorage
  const [user, setUser] = useState(() => {
    try {
      const savedUser = sessionStorage.getItem('book_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'signup'
  const [authNotice, setAuthNotice] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  // --- 4. WISHLIST STATE ---
  const [wishlist, setWishlist] = useState([]);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);

  // --- 5. THEME STATE (Default: dark mode) ---
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('app_theme') || 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('app_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'dark' ? 'light' : 'dark'));
  };

  // Helper to show temporary notification toasts
  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage('');
    }, 4000);
  };

  // --- 6. API CALLS: WISHLIST & SESSION ---

  // Load wishlist from MongoDB for the currently logged-in user
  const loadWishlistFromDB = async () => {
    const token = sessionStorage.getItem('book_token');
    if (!token) {
      setWishlist([]);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/wishlist`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();

      if (data.success && data.items) {
        setWishlist(data.items);
      } else {
        setWishlist([]);
      }
    } catch (error) {
      console.log('Error loading wishlist from database:', error);
    }
  };

  // Reload wishlist whenever logged-in user changes
  useEffect(() => {
    if (user) {
      loadWishlistFromDB();
    } else {
      setWishlist([]);
    }
  }, [user]);

  // Verify JWT session token with backend when app starts
  useEffect(() => {
    const verifyUserSession = async () => {
      const token = sessionStorage.getItem('book_token');
      if (!token) {
        setUser(null);
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await response.json();

        if (data.success && data.user) {
          setUser(data.user);
          sessionStorage.setItem('book_user', JSON.stringify(data.user));
        } else {
          // Token is invalid or expired
          handleLogout();
        }
      } catch (error) {
        console.log('Session verification error:', error);
      }
    };

    verifyUserSession();
  }, []);

  // --- 7. AUTHENTICATION HANDLERS ---

  const handleOpenLogin = (notice = '') => {
    setAuthNotice(notice);
    setAuthMode('login');
    setIsAuthModalOpen(true);
  };

  const handleOpenSignup = () => {
    setAuthNotice('');
    setAuthMode('signup');
    setIsAuthModalOpen(true);
  };

  const handleLogout = () => {
    setUser(null);
    setWishlist([]);
    setAuthNotice('');
    sessionStorage.removeItem('book_user');
    sessionStorage.removeItem('book_token');
  };

  const handleAuthSuccess = (userData, token) => {
    setUser(userData);
    setAuthNotice('');
    sessionStorage.setItem('book_user', JSON.stringify(userData));
    if (token) {
      sessionStorage.setItem('book_token', token);
    }
    setIsAuthModalOpen(false);
    loadWishlistFromDB();
  };

  // Helper: prompt user to log in if wishlist is accessed without logging in
  const requireLoginForWishlist = () => {
    const message = 'Please Login to access the wishlist';
    showToast(message);
    handleOpenLogin(message);
  };

  // --- 8. SEARCH HANDLERS ---

  // Perform search & fetch price comparisons from backend
  const handleSearch = async (queryToSearch) => {
    const query = (queryToSearch !== undefined ? queryToSearch : searchTerm).trim();

    if (!query) {
      handleClearSearch();
      return;
    }

    setSearchTerm(query);
    setActiveQuery(query);
    setHasSearched(true);
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/books/compare?q=${encodeURIComponent(query)}`);
      const data = await response.json();

      if (data.success && data.listings) {
        setBooks(data.listings);
      } else {
        setBooks([]);
      }
    } catch (error) {
      console.log('Search error:', error);
      setBooks([]);
    } finally {
      setLoading(false);
    }
  };

  // Clear search input and restore default state
  const handleClearSearch = () => {
    setSearchTerm('');
    setActiveQuery('');
    setHasSearched(false);
    setBooks([]);
    setSelectedWebsite('All Websites (5)');
    setSelectedCondition('All Conditions');
    setSortBy('Lowest Price');
  };

  // --- 9. WISHLIST ACTIONS ---

  // Helper: Check if a book is already in the wishlist
  const isBookWishlisted = (book) => {
    const bookId = book.id || book._id;
    return wishlist.some(item =>
      (item.bookId && item.bookId === bookId) ||
      (item.id && item.id === bookId) ||
      (item._id && item._id === bookId) ||
      (item.title === book.title && item.website === book.website)
    );
  };

  // Toggle book in wishlist (Add if not saved, Remove if already saved)
  const handleToggleWishlist = async (book) => {
    if (!user) {
      requireLoginForWishlist();
      return;
    }

    const token = sessionStorage.getItem('book_token');
    const bookId = book.id || book._id;

    // Check if item is already in wishlist
    const existing = wishlist.find(item =>
      (item.bookId && item.bookId === bookId) ||
      (item.id && item.id === bookId) ||
      (item._id && item._id === bookId) ||
      (item.title === book.title && item.website === book.website)
    );

    if (existing) {
      // 1. Remove from wishlist
      try {
        const idToDelete = existing._id || existing.bookId || existing.id || bookId;
        await fetch(`${API_BASE_URL}/wishlist/${idToDelete}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });

        setWishlist(prevList =>
          prevList.filter(item =>
            (item._id || item.id) !== (existing._id || existing.id) &&
            item.title !== existing.title
          )
        );
      } catch (error) {
        console.log('Error deleting wishlist item:', error);
      }
    } else {
      // 2. Add to wishlist
      try {
        const response = await fetch(`${API_BASE_URL}/wishlist`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ ...book, userId: user.id || user._id })
        });
        const data = await response.json();

        if (data.success && data.item) {
          setWishlist(prevList => [data.item, ...prevList]);
        }
      } catch (error) {
        console.log('Error saving to wishlist:', error);
      }
    }
  };

  // Remove a single book from wishlist modal
  const handleRemoveWishlistItem = async (itemToRemove) => {
    if (!user) {
      requireLoginForWishlist();
      return;
    }

    try {
      const token = sessionStorage.getItem('book_token');
      const id = itemToRemove._id || itemToRemove.bookId || itemToRemove.id;

      await fetch(`${API_BASE_URL}/wishlist/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      setWishlist(prevList =>
        prevList.filter(item =>
          (item._id || item.id) !== (itemToRemove._id || itemToRemove.id) &&
          item.title !== itemToRemove.title
        )
      );
    } catch (error) {
      console.log('Error removing wishlist item:', error);
    }
  };

  // Clear all books from wishlist
  const handleClearWishlist = async () => {
    if (!user) {
      requireLoginForWishlist();
      return;
    }

    try {
      const token = sessionStorage.getItem('book_token');
      await fetch(`${API_BASE_URL}/wishlist`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      setWishlist([]);
    } catch (error) {
      console.log('Error clearing wishlist:', error);
    }
  };

  // Open wishlist modal (requires login)
  const handleWishlistClick = () => {
    if (!user) {
      requireLoginForWishlist();
      return;
    }
    setIsWishlistOpen(true);
  };

  // --- 10. FILTER AND SORT COMPUTATIONS ---
  const filteredBooks = books
    .filter(book => {
      // Filter by Bookstore Website
      if (selectedWebsite !== 'All Websites (5)' && selectedWebsite !== 'All Websites (3)') {
        if (book.website !== selectedWebsite) return false;
      }
      // Filter by Book Condition (Used vs New)
      if (selectedCondition !== 'All Conditions') {
        if (book.condition.toLowerCase() !== selectedCondition.toLowerCase()) return false;
      }
      return true;
    })
    .sort((a, b) => {
      // Sort Options
      if (sortBy === 'Lowest Price') return a.price - b.price;
      if (sortBy === 'Highest Price') return b.price - a.price;
      if (sortBy === 'Title (A-Z)') return a.title.localeCompare(b.title);
      return 0;
    });

  // Calculate lowest price and best bookstore for the Summary Banner
  let lowestBook = books.find(b => b.isLowest === true);
  if (!lowestBook && books.length > 0) {
    const sortedByPrice = [...books].sort((a, b) => a.price - b.price);
    lowestBook = sortedByPrice[0];
  }

  const bestPriceText = lowestBook
    ? (lowestBook.priceFormatted || `€${Number(lowestBook.price).toFixed(2)}`)
    : '€0.00';
  const lowestStoreName = lowestBook ? lowestBook.website : 'Antikvariaatti.net';

  const wishlistIds = wishlist.map(item => item.id || item._id);

  // --- 11. USER INTERFACE (RENDER) ---
  return (
    <div className="app-container">
      {/* 1. Header Navigation */}
      <Navbar
        user={user}
        onOpenLogin={handleOpenLogin}
        onOpenSignup={handleOpenSignup}
        onLogout={handleLogout}
        wishlistCount={user ? wishlist.length : 0}
        onOpenWishlist={handleWishlistClick}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {/* 2. Main Page Content */}
      <main className="main-content">
        {/* Hero Section */}
        <section className="hero-section">
          <h2 className="hero-title">Second-Hand Book Price Comparison</h2>
          <p className="hero-subtitle">
            Search and compare real-time second-hand book prices, conditions, and editions aggregated across multiple bookstores.
          </p>

          {/* Search Box */}
          <div className="search-bar-wrapper">
            <form
              className="search-input-box"
              onSubmit={(e) => {
                e.preventDefault();
                handleSearch();
              }}
            >
              <Search size={18} className="search-icon" />
              <input
                type="text"
                className="search-input"
                placeholder="Search by book title, author, or ISBN (e.g., Harry Potter)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  type="button"
                  className="clear-search-btn"
                  onClick={handleClearSearch}
                  title="Clear Search"
                >
                  <X size={16} />
                </button>
              )}
              <button type="submit" className="search-submit-btn">
                Search
              </button>
            </form>
          </div>

          {/* Quick Suggestion Pills */}
          <div className="try-searching-row">
            <span className="sparkle-label">
              <Sparkles size={14} />
              <span>Try searching:</span>
            </span>
            <div className="pills-wrap">
              {SUGGESTIONS.map((tag) => (
                <button
                  key={tag}
                  className="suggestion-pill"
                  onClick={() => handleSearch(tag)}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Popular in Finland Section (Shown before searching) */}
          {!hasSearched && (
            <div className="popular-finland-container">
              <div className="popular-divider"></div>
              <div className="popular-title">
                <Sparkles size={14} color="#a5b4fc" />
                <span>Popular in Finland</span>
              </div>
              <div className="popular-pills">
                {POPULAR_FINLAND.map((tag) => (
                  <button
                    key={tag}
                    className="suggestion-pill"
                    onClick={() => handleSearch(tag)}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Search Results Area */}
        {hasSearched && (
          <div className="results-container">
            {/* 4-Column Summary Banner */}
            <ComparisonBanner
              searchQuery={activeQuery || searchTerm}
              totalListings={books.length}
              bestPrice={bestPriceText}
              lowestPriceStore={lowestStoreName}
            />

            {/* Filter & View Mode Toolbar */}
            <div className="filter-toolbar">
              <div className="filter-left-group">
                <span className="filter-icon-label">
                  <Filter size={14} />
                  <span>Filters:</span>
                </span>

                {/* Filter by Bookstore */}
                <select
                  className="filter-select"
                  value={selectedWebsite}
                  onChange={(e) => setSelectedWebsite(e.target.value)}
                >
                  {WEBSITES_LIST.map((site) => (
                    <option key={site} value={site}>
                      {site}
                    </option>
                  ))}
                </select>

                {/* Filter by Condition */}
                <select
                  className="filter-select"
                  value={selectedCondition}
                  onChange={(e) => setSelectedCondition(e.target.value)}
                >
                  {CONDITIONS_LIST.map((condition) => (
                    <option key={condition} value={condition}>
                      {condition}
                    </option>
                  ))}
                </select>

                {/* Sort Option */}
                <select
                  className="filter-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  {SORT_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      Sort: {option}
                    </option>
                  ))}
                </select>

                <span className="listings-count">{filteredBooks.length} listings</span>
              </div>

              {/* View Toggle: Table vs Grid */}
              <div className="view-toggle-group">
                <button
                  className={`toggle-view-btn ${viewMode === 'table' ? 'active' : ''}`}
                  onClick={() => setViewMode('table')}
                  title="Table View"
                >
                  <Table size={14} />
                  <span>Table</span>
                </button>

                <button
                  className={`toggle-view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                  onClick={() => setViewMode('grid')}
                  title="Grid View"
                >
                  <LayoutGrid size={14} />
                  <span>Grid</span>
                </button>
              </div>
            </div>

            {/* Results Display */}
            {loading ? (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Searching Finnish bookstores and comparing prices...</p>
              </div>
            ) : filteredBooks.length === 0 ? (
              <div className="empty-state">
                <h3>No books found matching your filter criteria.</h3>
                <p>Try selecting "All Websites" or "All Conditions".</p>
              </div>
            ) : viewMode === 'table' ? (
              /* Table View */
              <ComparisonTable
                books={filteredBooks}
                wishlist={wishlist}
                wishlistIds={wishlistIds}
                onToggleWishlist={handleToggleWishlist}
              />
            ) : (
              /* Grid View */
              <div className="books-grid">
                {filteredBooks.map((book) => (
                  <BookCard
                    key={book.id || book._id}
                    book={book}
                    isWishlisted={isBookWishlisted(book)}
                    onToggleWishlist={handleToggleWishlist}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* 3. Wishlist Modal */}
      <WishlistModal
        isOpen={isWishlistOpen}
        onClose={() => setIsWishlistOpen(false)}
        wishlist={wishlist}
        onRemoveItem={handleRemoveWishlistItem}
        onClearAll={handleClearWishlist}
        user={user}
      />

      {/* 4. Authentication Modal (Login / Sign Up) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        initialMode={authMode}
        noticeMsg={authNotice}
        onClose={() => {
          setIsAuthModalOpen(false);
          setAuthNotice('');
        }}
        onAuthSuccess={handleAuthSuccess}
      />

      {/* 5. Toast Notification Alert */}
      {toastMessage && (
        <div className="toast-notification">
          <AlertCircle size={18} color="#fbbf24" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 6. Footer */}
      <footer className="footer">
        <p>&copy; 2026 Second-Hand Book Store &bull; Price Comparison Platform</p>
      </footer>
    </div>
  );
}
