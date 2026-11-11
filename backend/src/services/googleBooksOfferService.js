function getGoogleBooksOffer(book) {
  const price = Number(book.apiPrice.toFixed(2));
  const cleanIsbn = (book.isbn || "").replace(/[^0-9]/g, "");

  let directBuyUrl = book.googleBuyLink || book.googleInfoLink;
  if (!directBuyUrl) {
    directBuyUrl = cleanIsbn
      ? `https://books.google.com/books?vid=ISBN${cleanIsbn}`
      : `https://play.google.com/store/search?q=${encodeURIComponent(book.title)}&c=books`;
  }

  return {
    id: `google-${book.isbn}`,
    title: book.title,
    author: book.author,
    isbn: `ISBN: ${book.isbn}`,
    website: "Google Books",
    condition: "New",
    edition: "Google Books Edition",
    price: price,
    priceFormatted: `$${price.toFixed(2)}`,
    availability: "In Stock (Google Store)",
    sourceUrl: directBuyUrl,
    image: book.image,
    isLowest: false,
  };
}

module.exports = { getGoogleBooksOffer };
