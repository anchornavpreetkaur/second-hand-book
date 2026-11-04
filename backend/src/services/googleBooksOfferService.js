function getGoogleBooksOffer(book) {
  const price = Number(book.apiPrice.toFixed(2));

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
    sourceUrl: `https://books.google.com/books?q=${encodeURIComponent(book.title)}`,
    image: book.image,
    isLowest: false,
  };
}

module.exports = { getGoogleBooksOffer };
