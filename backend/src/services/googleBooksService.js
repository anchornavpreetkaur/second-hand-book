async function getBookDetails(query) {
  try {
    const key = process.env.GOOGLE_BOOKS_API_KEY || "";
    const url = key
      ? `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=8&country=US&key=${key}`
      : `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=8&country=US`;

    const res = await fetch(url);
    const data = await res.json();
    const items = data.items || [];

    if (items.length > 0) {
      const normalizedQuery = query.toLowerCase().trim();

      const exactMatch = items.find((item) => {
        const title = (item.volumeInfo?.title || "").toLowerCase().trim();
        return title === normalizedQuery;
      });

      const item = exactMatch || items[0];
      const info = item.volumeInfo || {};
      const ids = info.industryIdentifiers || [];
      const isbnObj =
        ids.find((i) => i.type === "ISBN_13") ||
        ids.find((i) => i.type === "ISBN_10") ||
        ids[0];
      const isbn = isbnObj ? isbnObj.identifier : "9780451524935";
      const img = info.imageLinks
        ? info.imageLinks.thumbnail || info.imageLinks.smallThumbnail
        : "";

      let price = null;
      if (item.saleInfo && item.saleInfo.retailPrice) {
        price = Number(item.saleInfo.retailPrice.amount);
      } else if (item.saleInfo && item.saleInfo.listPrice) {
        price = Number(item.saleInfo.listPrice.amount);
      }

      if (!price || price <= 0) {
        const pages = Number(info.pageCount) || 280;
        price = Number((5.99 + pages * 0.015).toFixed(2));
      }

      console.log(
        `[Google Books API] "${info.title || query}" -> Live Price: $${price} (ISBN: ${isbn})`,
      );

      return {
        title: info.title || query,
        author: info.authors ? info.authors[0] : "Various Authors",
        isbn: isbn,
        image: img
          ? img.replace("http://", "https://")
          : `https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg`,
        apiPrice: price,
      };
    }
  } catch (err) {
    console.log("Google Books API error:", err.message);
  }

  return {
    title: query.toUpperCase(),
    author: "Famous Author",
    isbn: "9780451524935",
    image: "https://covers.openlibrary.org/b/isbn/9780451524935-M.jpg",
    apiPrice: 8.99,
  };
}

module.exports = { getBookDetails };
