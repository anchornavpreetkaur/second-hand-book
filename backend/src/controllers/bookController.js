const { getBookDetails } = require("../services/googleBooksService");
const { getBooksRunOffer } = require("../services/booksRunService");
const { getPangoBooksOffer } = require("../services/pangoBooksService");
const { getGoogleBooksOffer } = require("../services/googleBooksOfferService");

async function compareBooks(req, res) {
  try {
    const query = (req.query.q || "").trim();
    if (!query) {
      return res
        .status(400)
        .json({ success: false, message: "Please provide book name" });
    }

    const book = await getBookDetails(query);
    const booksRun = await getBooksRunOffer(book.isbn, book);
    const pango = await getPangoBooksOffer(book.isbn, book);
    const google = getGoogleBooksOffer(book);
    const listings = [booksRun, pango, google];

    listings.sort((a, b) => a.price - b.price);
    listings[0].isLowest = true;

    return res.json({
      success: true,
      query: query,
      totalOffers: listings.length,
      bestPrice: listings[0].priceFormatted,
      lowestPriceStore: listings[0].website,
      listings: listings,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

async function searchBooks(req, res) {
  const query = (req.query.q || "").trim();
  const book = await getBookDetails(query);
  const listings = [
    await getBooksRunOffer(book.isbn, book),
    await getPangoBooksOffer(book.isbn, book),
    getGoogleBooksOffer(book),
  ];
  return res.json({ success: true, count: listings.length, data: listings });
}

module.exports = { compareBooks, searchBooks };
