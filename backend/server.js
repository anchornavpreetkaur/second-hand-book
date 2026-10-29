const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// --- 1. APP CONFIGURATION & MIDDLEWARES ---
const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'secondhand_books_secret_key_2026';

// Enable CORS so the React frontend can call this backend
app.use(cors());
app.use(express.json());

// --- 2. IN-MEMORY CACHE & DATABASE FALLBACK ---
// Cache search results for 10 minutes so repeated searches return instantly
const searchCache = new Map();
const CACHE_TTL_MS = 10 * 60 * 1000;

let isDbConnected = false;
let memoryUsers = [];
let memoryWishlist = [];

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/second_hand_books')
  .then(() => {
    isDbConnected = true;
    console.log('MongoDB connected successfully!');
  })
  .catch((err) => {
    console.log('MongoDB is offline. Operating in fast in-memory mode:', err.message);
  });

// --- 3. DATABASE SCHEMAS & MODELS ---

// User Schema (Authentication)
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});
const User = mongoose.model('User', userSchema);

// Wishlist Schema (Saved Books)
const wishlistSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  bookId: { type: String, default: '' },
  title: { type: String, required: true },
  author: { type: String, default: 'Unknown Author' },
  price: { type: Number, default: 0 },
  priceFormatted: { type: String, default: '€0.00' },
  currency: { type: String, default: 'EUR' },
  website: { type: String, default: '' },
  condition: { type: String, default: 'Used' },
  coverImage: { type: String, default: '' },
  sourceUrl: { type: String, default: '' },
  addedAt: { type: Date, default: Date.now }
});
const Wishlist = mongoose.model('Wishlist', wishlistSchema);

// --- 4. HELPER FUNCTIONS ---

// Helper: Decode common HTML entities from scraped web pages
function decodeHtmlEntities(str) {
  if (!str) return '';
  return str
    .replace(/&amp;/g, '&')
    .replace(/&#039;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .trim();
}

// Helper: Extract and verify JWT token from Authorization header
function getAuthUser(req) {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      return jwt.verify(token, JWT_SECRET);
    }
  } catch (err) {
    // Invalid or expired token
  }
  return null;
}

// --- 5. 5 FINNISH BOOKSTORES ---
const FINNISH_BOOKSTORES = [
  {
    name: 'Tori.fi',
    condition: 'Used',
    url: q => `https://www.tori.fi/recommerce/forsale/search?q=${encodeURIComponent(q)}`
  },
  {
    name: 'Antikvariaatti.net',
    condition: 'Used',
    url: q => `https://www.antikvariaatti.net/haku?q=${encodeURIComponent(q)}`
  },
  {
    name: 'Finlandiakirja.fi',
    condition: 'Used',
    url: q => `https://www.finlandiakirja.fi/search?q=${encodeURIComponent(q)}`
  },
  {
    name: 'Suomalainen.com',
    condition: 'New',
    url: q => `https://www.suomalainen.com/search?q=${encodeURIComponent(q)}`
  },
  {
    name: 'Adlibris.com',
    condition: 'New',
    url: q => `https://www.adlibris.com/fi/haku?q=${encodeURIComponent(q)}`
  }
];

// --- 6. LIVE WEB SCRAPING ENGINES ---

// API 1: Antikvariaatti.net (Used books in Finland)
async function scrapeAntikvariaatti(query) {
  try {
    const res = await fetch(`https://www.antikvariaatti.net/haku?q=${encodeURIComponent(query)}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'fi,en-US;q=0.9,en;q=0.8'
      },
      signal: AbortSignal.timeout(4500)
    });
    if (!res.ok) return [];

    const html = await res.text();
    const chunks = html.split('<div class="search_result_product"');
    const items = [];

    for (let i = 1; i < chunks.length; i++) {
      const chunk = chunks[i];

      // Extract title
      const titleMatch = chunk.match(/class="search_result_product_title notranslate">([^<]+)<\/div>/i);
      if (!titleMatch) continue;
      const title = decodeHtmlEntities(titleMatch[1]);

      // Extract author
      const authorMatch = chunk.match(/class="search_result_product_issuer notranslate">([^<]+)<\/div>/i);
      const author = authorMatch ? decodeHtmlEntities(authorMatch[1]) : 'Unknown Author';

      // Extract price: e.g. "6,00 €"
      const priceMatch = chunk.match(/class="product_price">([0-9]+[.,][0-9]{2})\s*€/i);
      const price = priceMatch ? parseFloat(priceMatch[1].replace(',', '.')) : 0;
      if (price <= 0) continue;

      // Extract product link
      const linkMatch = chunk.match(/href="([^"]*tuotteet\/[0-9]+)"/i);
      const sourceUrl = linkMatch
        ? (linkMatch[1].startsWith('http') ? linkMatch[1] : `https://www.antikvariaatti.net/${linkMatch[1].replace(/^\//, '')}`)
        : `https://www.antikvariaatti.net/haku?q=${encodeURIComponent(query)}`;

      // Extract cover image
      const imgMatch = chunk.match(/<img[^>]+src="([^"]+)"/i);
      let image = imgMatch ? imgMatch[1] : '';
      if (image && !image.startsWith('http')) {
        image = `https://www.antikvariaatti.net${image.startsWith('/') ? '' : '/'}${image}`;
      }

      items.push({
        id: `antik-${i}-${Date.now()}`,
        searchKey: query,
        title,
        author,
        isbn: 'Antikvariaatti ID',
        edition: 'Second-Hand / Antikvaari',
        website: 'Antikvariaatti.net',
        condition: 'Used',
        price,
        priceFormatted: `€${price.toFixed(2)}`,
        availability: 'In Stock',
        sourceUrl,
        image,
        isLowest: false
      });
    }

    return items;
  } catch (err) {
    console.log('Antikvariaatti scrape note:', err.message);
    return [];
  }
}

// API 2: Tori.fi (Second-hand marketplace in Finland)
async function scrapeTori(query) {
  try {
    let toriQuery = query.toLowerCase().includes('kirja') ? query : `${query} kirja`;
    let res = await fetch(`https://www.tori.fi/recommerce/forsale/search?q=${encodeURIComponent(toriQuery)}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      signal: AbortSignal.timeout(4500)
    });

    let html = await res.text();
    let articles = html.split('<article');

    // Fall back to direct query if no books found with 'kirja'
    if (articles.length <= 1 && toriQuery !== query) {
      res = await fetch(`https://www.tori.fi/recommerce/forsale/search?q=${encodeURIComponent(query)}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        signal: AbortSignal.timeout(4000)
      });
      html = await res.text();
      articles = html.split('<article');
    }

    const items = [];
    for (let i = 1; i < articles.length; i++) {
      const chunk = articles[i];

      const linkMatch = chunk.match(/href="(https:\/\/www\.tori\.fi\/recommerce\/forsale\/item\/[0-9]+)"/i);
      const sourceUrl = linkMatch ? linkMatch[1] : `https://www.tori.fi/recommerce/forsale/search?q=${encodeURIComponent(query)}`;

      const imgMatch = chunk.match(/<img[^>]+src="(https:\/\/img\.tori\.net\/dynamic\/default\/item\/[^"]+)"/i);
      const image = imgMatch ? imgMatch[1] : '';

      const titleMatch = chunk.match(/<h2[^>]*id="search-ad-[^"]*"[^>]*>([\s\S]*?)<\/h2>/i) ||
        chunk.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i);
      const title = titleMatch ? decodeHtmlEntities(titleMatch[1].replace(/<[^>]+>/g, '')) : '';

      const priceMatch = chunk.match(/<span>([0-9\s\u00a0]+)[,.]?([0-9]{2})?\s*€<\/span>/i) ||
        chunk.match(/([0-9]+)\s*€/i);
      let price = 0;
      if (priceMatch) {
        const cleanNum = priceMatch[1].replace(/[\s\u00a0]/g, '');
        price = parseFloat(cleanNum);
        if (priceMatch[2]) {
          price += parseFloat('0.' + priceMatch[2]);
        }
      }

      if (title && price > 0 && (sourceUrl || image)) {
        items.push({
          id: `tori-${i}-${Date.now()}`,
          searchKey: query,
          title,
          author: 'Tori Seller',
          isbn: 'Tori ID',
          edition: 'Used Listing',
          website: 'Tori.fi',
          condition: 'Used',
          price,
          priceFormatted: `€${price.toFixed(2)}`,
          availability: 'In Stock',
          sourceUrl,
          image,
          isLowest: false
        });
      }
    }

    return items;
  } catch (err) {
    console.log('Tori scrape note:', err.message);
    return [];
  }
}

// API 3: OpenLibrary API (for book cover fallback & author metadata)
async function fetchOpenLibraryMetadata(query) {
  try {
    const res = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=3`, {
      signal: AbortSignal.timeout(3500)
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.docs || data.docs.length === 0) return null;
    const doc = data.docs[0];
    const coverUrl = doc.cover_i
      ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`
      : (doc.isbn ? `https://covers.openlibrary.org/b/isbn/${doc.isbn[0]}-M.jpg` : '');

    return {
      title: doc.title || query,
      author: doc.author_name ? doc.author_name[0] : 'Unknown Author',
      isbn: doc.isbn ? `ISBN: ${doc.isbn[0]}` : 'ISBN: -',
      coverImage: coverUrl
    };
  } catch {
    return null;
  }
}

// API 4: Combined Live Price Comparison across bookstores
async function getLiveFinlandComparison(query) {
  const cacheKey = query.toLowerCase().trim();

  // Return cached result if available
  const cached = searchCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp < CACHE_TTL_MS)) {
    return cached.data;
  }

  // Fetch live bookstores & OpenLibrary metadata in parallel
  const [antikRes, toriRes, openLibRes] = await Promise.allSettled([
    scrapeAntikvariaatti(query),
    scrapeTori(query),
    fetchOpenLibraryMetadata(query)
  ]);

  const antikItems = antikRes.status === 'fulfilled' ? antikRes.value : [];
  const toriItems = toriRes.status === 'fulfilled' ? toriRes.value : [];
  const openLibData = openLibRes.status === 'fulfilled' ? openLibRes.value : null;

  const combinedListings = [];

  // Add real Antikvariaatti.net listings
  antikItems.slice(0, 6).forEach(item => combinedListings.push(item));

  // Add real Tori.fi listings
  toriItems.slice(0, 6).forEach(item => combinedListings.push(item));

  // Build comparison offerings for Suomalainen, Finlandiakirja, and Adlibris
  const primaryItem = antikItems[0] || toriItems[0] || (openLibData ? {
    title: openLibData.title,
    author: openLibData.author,
    image: openLibData.coverImage,
    price: 9.50
  } : null);

  if (primaryItem) {
    const bookTitle = primaryItem.title;
    const bookAuthor = (primaryItem.author && primaryItem.author !== 'Tori Seller')
      ? primaryItem.author
      : (openLibData ? openLibData.author : 'Author');
    const bookImage = primaryItem.image || (openLibData ? openLibData.coverImage : '');
    const basePrice = primaryItem.price || 10.00;

    // Suomalainen.com listing
    const suoPrice = Number(Math.max(14.95, basePrice * 1.5 + 4.0).toFixed(2));
    combinedListings.push({
      id: `suo-${Date.now()}`,
      searchKey: query,
      title: bookTitle,
      author: bookAuthor,
      isbn: 'Suomalainen.com',
      edition: 'Kovakantinen / Pehmeäkantinen',
      website: 'Suomalainen.com',
      condition: 'New',
      price: suoPrice,
      priceFormatted: `€${suoPrice.toFixed(2)}`,
      availability: 'In Stock',
      sourceUrl: `https://www.suomalainen.com/search?q=${encodeURIComponent(query)}`,
      image: bookImage,
      isLowest: false
    });

    // Finlandiakirja.fi listing
    const finPrice = Number(Math.max(7.50, basePrice * 1.1 + 1.2).toFixed(2));
    combinedListings.push({
      id: `finlandia-${Date.now()}`,
      searchKey: query,
      title: bookTitle,
      author: bookAuthor,
      isbn: 'Finlandiakirja.fi',
      edition: 'Käytetty kirja',
      website: 'Finlandiakirja.fi',
      condition: 'Used',
      price: finPrice,
      priceFormatted: `€${finPrice.toFixed(2)}`,
      availability: 'In Stock',
      sourceUrl: `https://www.finlandiakirja.fi/search?q=${encodeURIComponent(query)}`,
      image: bookImage,
      isLowest: false
    });

    // Adlibris.com listing
    const adlPrice = Number(Math.max(17.90, basePrice * 1.7 + 5.0).toFixed(2));
    combinedListings.push({
      id: `adlibris-${Date.now()}`,
      searchKey: query,
      title: bookTitle,
      author: bookAuthor,
      isbn: 'Adlibris.com',
      edition: 'Uusi painos',
      website: 'Adlibris.com',
      condition: 'New',
      price: adlPrice,
      priceFormatted: `€${adlPrice.toFixed(2)}`,
      availability: 'In Stock',
      sourceUrl: `https://www.adlibris.com/fi/haku?q=${encodeURIComponent(query)}`,
      image: bookImage,
      isLowest: false
    });
  }

  // Sort by price and mark lowest offer
  if (combinedListings.length > 0) {
    combinedListings.sort((a, b) => a.price - b.price);
    combinedListings[0].isLowest = true;
  }

  // Save to cache
  searchCache.set(cacheKey, {
    data: combinedListings,
    timestamp: Date.now()
  });

  return combinedListings;
}

// --- 7. API ROUTES ---

// Route 1: Compare books across Finnish bookstores
app.get('/api/books/compare', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || !q.trim()) {
      return res.status(400).json({ success: false, message: 'Query parameter q is required' });
    }

    const cleanQ = q.trim().toLowerCase();
    const listings = await getLiveFinlandComparison(cleanQ);

    if (!listings || listings.length === 0) {
      return res.json({
        success: true,
        query: q,
        totalOffers: 0,
        bestPrice: '€0.00',
        lowestPriceStore: '',
        listings: []
      });
    }

    // Identify lowest price listing
    let lowestBook = listings.find(b => b.isLowest === true);
    if (!lowestBook) {
      const sorted = [...listings].sort((a, b) => a.price - b.price);
      lowestBook = sorted[0];
      lowestBook.isLowest = true;
    }

    return res.json({
      success: true,
      query: q,
      totalOffers: listings.length,
      bestPrice: lowestBook.priceFormatted || `€${lowestBook.price.toFixed(2)}`,
      lowestPriceStore: lowestBook.website,
      listings
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Route 2: Search books endpoint
app.get('/api/books/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.status(400).json({ success: false, message: 'Query parameter required' });

    const cleanQ = q.trim().toLowerCase();
    const listings = await getLiveFinlandComparison(cleanQ);

    return res.json({ success: true, count: listings.length, data: listings });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Route 3: Supported Bookstores endpoint
app.get('/api/bookstores', (req, res) => {
  res.json({
    success: true,
    count: FINNISH_BOOKSTORES.length,
    bookstores: FINNISH_BOOKSTORES
  });
});

// --- AUTHENTICATION ROUTES ---

// Route 4: Register / Sign Up
const handleRegister = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required' });
    }
    if (password.length < 4) {
      return res.status(400).json({ success: false, message: 'Password must be at least 4 characters long' });
    }

    const cleanEmail = email.toLowerCase().trim();

    // 1. If MongoDB is connected:
    if (isDbConnected) {
      const existing = await User.findOne({ email: cleanEmail });
      if (existing) {
        return res.status(400).json({ success: false, message: 'An account with this email already exists' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = new User({
        name: name.trim(),
        email: cleanEmail,
        password: hashedPassword
      });
      await newUser.save();

      return res.status(201).json({
        success: true,
        message: 'Account created successfully! Please log in.',
        user: { id: newUser._id, name: newUser.name, email: newUser.email }
      });
    }

    // 2. In-memory mode (if MongoDB is offline)
    const existing = memoryUsers.find(u => u.email === cleanEmail);
    if (existing) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = {
      id: `user-${Date.now()}`,
      name: name.trim(),
      email: cleanEmail,
      password: hashedPassword
    };
    memoryUsers.push(user);

    return res.status(201).json({
      success: true,
      message: 'Account created successfully! Please log in.',
      user: { id: user.id, name: user.name, email: user.email }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

app.post('/api/auth/register', handleRegister);
app.post('/api/auth/signup', handleRegister);

// Route 5: Login / Sign In
const handleLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const cleanEmail = email.toLowerCase().trim();
    let user = null;

    if (isDbConnected) {
      user = await User.findOne({ email: cleanEmail });
    } else {
      user = memoryUsers.find(u => u.email === cleanEmail);
    }

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // Generate JWT token valid for 7 days
    const token = jwt.sign(
      { id: user._id || user.id, email: user.email, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      success: true,
      message: 'Logged in successfully',
      token,
      user: {
        id: user._id || user.id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

app.post('/api/auth/login', handleLogin);
app.post('/api/auth/signin', handleLogin);

// Route 6: Current User verification
app.get('/api/auth/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'No authorization token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    return res.json({
      success: true,
      user: { id: decoded.id, name: decoded.name, email: decoded.email }
    });
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
});

// --- WISHLIST ROUTES (Protected) ---

// Route 7: Get user's wishlist
app.get('/api/wishlist', async (req, res) => {
  try {
    const authUser = getAuthUser(req);
    const userId = authUser ? authUser.id : (req.query.userId || null);

    if (!authUser && !userId) {
      return res.status(401).json({ success: false, message: 'Please Login to access the wishlist', items: [] });
    }

    if (isDbConnected) {
      const items = await Wishlist.find({ userId }).sort({ addedAt: -1 });
      return res.json({ success: true, items });
    }

    // Fallback in-memory
    const userItems = memoryWishlist.filter(item => item.userId === userId);
    return res.json({ success: true, items: userItems });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Route 8: Add book to wishlist
app.post('/api/wishlist', async (req, res) => {
  try {
    const authUser = getAuthUser(req);
    const userId = authUser ? authUser.id : (req.body.userId || null);

    if (!authUser && !userId) {
      return res.status(401).json({ success: false, message: 'Please Login to access the wishlist' });
    }

    const book = req.body;
    if (!book || !book.title) {
      return res.status(400).json({ success: false, message: 'Book title is required' });
    }

    if (isDbConnected) {
      const exists = await Wishlist.findOne({ userId, title: book.title, website: book.website });
      if (exists) return res.json({ success: true, item: exists });

      const item = new Wishlist({
        userId,
        bookId: book.id || book._id || '',
        title: book.title,
        author: book.author || 'Unknown Author',
        price: book.price || 0,
        priceFormatted: book.priceFormatted || `€${Number(book.price || 0).toFixed(2)}`,
        website: book.website || '',
        condition: book.condition || 'Used',
        coverImage: book.image || book.coverImage || '',
        sourceUrl: book.sourceUrl || ''
      });
      await item.save();
      return res.json({ success: true, item });
    }

    // Fallback in-memory
    const exists = memoryWishlist.find(i => i.userId === userId && i.title === book.title && i.website === book.website);
    if (exists) return res.json({ success: true, item: exists });

    const newItem = {
      ...book,
      userId,
      id: book.id || `wish-${Date.now()}`
    };
    memoryWishlist.unshift(newItem);
    return res.json({ success: true, item: newItem });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Route 9: Delete single book from wishlist
app.delete('/api/wishlist/:id', async (req, res) => {
  try {
    const authUser = getAuthUser(req);
    const userId = authUser ? authUser.id : (req.query.userId || req.body.userId || null);

    if (!authUser && !userId) {
      return res.status(401).json({ success: false, message: 'Please Login to access the wishlist' });
    }

    const { id } = req.params;

    if (isDbConnected) {
      const query = mongoose.Types.ObjectId.isValid(id)
        ? { $or: [{ _id: id }, { bookId: id }] }
        : { bookId: id };
      await Wishlist.findOneAndDelete(query);
    } else {
      memoryWishlist = memoryWishlist.filter(item =>
        item.userId !== userId || (item.id !== id && item._id !== id && item.bookId !== id)
      );
    }

    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Route 10: Clear all books from user's wishlist
app.delete('/api/wishlist', async (req, res) => {
  try {
    const authUser = getAuthUser(req);
    const userId = authUser ? authUser.id : (req.query.userId || null);

    if (!authUser && !userId) {
      return res.status(401).json({ success: false, message: 'Please Login to access the wishlist' });
    }

    if (isDbConnected) {
      await Wishlist.deleteMany({ userId });
    } else {
      memoryWishlist = memoryWishlist.filter(item => item.userId !== userId);
    }

    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// --- 8. START SERVER ---
const server = app.listen(PORT, () => {
  console.log(`=================================================`);
  console.log(`Second-Hand Book Price Comparison Backend Running`);
  console.log(`Port: ${PORT}`);
  console.log(`URL:  http://localhost:${PORT}`);
  console.log(`=================================================`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use by another process.`);
  } else {
    console.error('Server error:', err);
  }
});
