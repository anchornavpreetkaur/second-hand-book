const { fetchMatchingBooks, getGoogleBooksOffers, getBookDetails } = require("../services/googleBooksService");
const { getBooksRunOffers, getBooksRunOffer } = require("../services/booksRunService");
const { getPangoBooksOffers, getPangoBooksOffer } = require("../services/pangoBooksService");
const { getGoogleBooksOffer } = require("../services/googleBooksOfferService");

async function compareBooks(req, res) {
  try {
    const query = (req.query.q || "").trim();
    if (!query) {
      return res
        .status(400)
        .json({ success: false, message: "Please provide book name" });
    }

    const matchingBooks = await fetchMatchingBooks(query);

    const [googleBooks, pangoBooks] = await Promise.all([
      getGoogleBooksOffers(query, matchingBooks),
      getPangoBooksOffers(query, matchingBooks),
    ]);
    const booksRunCandidates = [...pangoBooks, ...matchingBooks];
    const booksRunBooks = await getBooksRunOffers(query, booksRunCandidates);

    const listings = [...pangoBooks, ...booksRunBooks, ...googleBooks];

    listings.sort((a, b) => a.price - b.price);
    if (listings.length > 0) {
      listings[0].isLowest = true;
    }

    return res.json({
      success: true,
      query: query,
      totalOffers: listings.length,
      bestPrice: listings[0]?.priceFormatted || "$0.00",
      lowestPriceStore: listings[0]?.website || "",
      listings: listings,
    });
  } catch (error) {
    console.error("compareBooks error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

async function searchBooks(req, res) {
  return compareBooks(req, res);
}

module.exports = {
  compareBooks,
  searchBooks,
  getBookDetails,
  getBooksRunOffer,
  getPangoBooksOffer,
  getGoogleBooksOffer,
};
