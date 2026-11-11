const { GOOGLE_BOOKS_API_KEY } = require("../config/environment");

async function fetchMatchingBooks(query) {
  const cleanQuery = (query || "").trim();
  const isIsbn = /^[0-9X-]{10,17}$/i.test(cleanQuery);

  let rawList = [];

  try {
    const searchParam = isIsbn ? `isbn:${cleanQuery.replace(/[^0-9X]/gi, "")}` : cleanQuery;
    const keyParam = GOOGLE_BOOKS_API_KEY ? `&key=${GOOGLE_BOOKS_API_KEY}` : "";
    const mainUrl = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(searchParam)}&country=US&maxResults=10${keyParam}`;
    const paidUrl = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(searchParam)}&filter=ebooks&country=US&maxResults=5${keyParam}`;

    const [mainRes, paidRes] = await Promise.all([
      fetch(mainUrl),
      isIsbn ? Promise.resolve(null) : fetch(paidUrl),
    ]);

    const mainData = mainRes && mainRes.ok ? await mainRes.json() : null;
    const paidData = paidRes && paidRes.ok ? await paidRes.json() : null;

    const combinedItems = [
      ...(paidData?.items || []),
      ...(mainData?.items || []),
    ];

    if (combinedItems.length > 0) {
      rawList = combinedItems.map((item, idx) => {
        const info = item.volumeInfo || {};
        const ids = info.industryIdentifiers || [];
        const isbnObj =
          ids.find((id) => id.type === "ISBN_13") ||
          ids.find((id) => id.type === "ISBN_10") ||
          ids[0];
        const isbn = isbnObj ? isbnObj.identifier : "";
        const cleanIsbn = (isbn || "").replace(/[^0-9X]/gi, "");

        let price = null;
        if (item.saleInfo?.retailPrice?.amount) {
          price = Number(item.saleInfo.retailPrice.amount);
        } else if (item.saleInfo?.listPrice?.amount) {
          price = Number(item.saleInfo.listPrice.amount);
        }

        const img = info.imageLinks?.thumbnail || info.imageLinks?.smallThumbnail || "";
        return {
          title: info.title || cleanQuery,
          author: info.authors ? info.authors.join(", ") : "Various Authors",
          isbn: cleanIsbn,
          image: img
            ? img.replace("http://", "https://")
            : (cleanIsbn ? `https://covers.openlibrary.org/b/isbn/${cleanIsbn}-M.jpg` : ""),
          price: price,
          year: info.publishedDate ? info.publishedDate.slice(0, 4) : "",
          googleBuyLink: item.saleInfo?.buyLink || null,
          infoLink: info.infoLink || null,
        };
      });
    }
  } catch (err) {
    console.error("Google Books search error:", err.message);
  }

  if (rawList.length === 0) {
    try {
      let url = "";
      if (isIsbn) {
        const clean = cleanQuery.replace(/[^0-9X]/gi, "");
        url = `https://openlibrary.org/search.json?isbn=${clean}&fields=title,author_name,cover_i,isbn,first_publish_year&limit=10`;
      } else {
        url = `https://openlibrary.org/search.json?title=${encodeURIComponent(cleanQuery)}&fields=title,author_name,cover_i,isbn,first_publish_year&limit=10`;
      }

      const res = await fetch(url);
      const data = res.ok ? await res.json() : null;
      const docs = data?.docs || [];

      rawList = docs.map((doc, idx) => {
        const isbns = Array.isArray(doc.isbn) ? doc.isbn : [];
        const validIsbn =
          isbns.find((i) => i.length === 13) ||
          isbns.find((i) => i.length === 10) ||
          isbns[0] ||
          "";
        const cleanIsbn = validIsbn.replace(/[^0-9X]/gi, "");
        const coverImg = doc.cover_i
          ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`
          : (cleanIsbn ? `https://covers.openlibrary.org/b/isbn/${cleanIsbn}-M.jpg` : "");

        return {
          title: doc.title || cleanQuery,
          author: doc.author_name ? doc.author_name.join(", ") : "Various Authors",
          isbn: cleanIsbn,
          image: coverImg,
          price: null,
          year: doc.first_publish_year ? String(doc.first_publish_year) : "",
          googleBuyLink: null,
          infoLink: cleanIsbn ? `https://play.google.com/store/search?q=${encodeURIComponent(doc.title || cleanQuery)}&c=books` : null,
        };
      });
    } catch (err) {
      console.error("OpenLibrary search error:", err.message);
    }
  }

  const seenTitles = new Set();
  const distinctBooks = [];

  for (const item of rawList) {
    const key = (item.title || "").toLowerCase().replace(/[^a-z0-9]/g, "").trim();
    if (key && !seenTitles.has(key)) {
      seenTitles.add(key);
      distinctBooks.push(item);
    }
  }

  return distinctBooks.slice(0, 10);
}

async function getGoogleBooksOffers(query, matchingBooks = []) {
  const cleanQuery = (query || "").trim();
  const isIsbn = /^[0-9X-]{10,17}$/i.test(cleanQuery);
  const searchParam = isIsbn ? `isbn:${cleanQuery.replace(/[^0-9X]/gi, "")}` : cleanQuery;
  const keyParam = GOOGLE_BOOKS_API_KEY ? `&key=${GOOGLE_BOOKS_API_KEY}` : "";

  const offers = [];

  try {
    const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(searchParam)}&filter=ebooks&country=US&maxResults=10${keyParam}`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      const items = data.items || [];

      for (let idx = 0; idx < items.length; idx++) {
        const it = items[idx];
        const sale = it.saleInfo || {};
        const vol = it.volumeInfo || {};

        let rawPrice = Number(sale.retailPrice?.amount || sale.listPrice?.amount);
        const currency = sale.retailPrice?.currencyCode || sale.listPrice?.currencyCode || "USD";

        let price = rawPrice;
        if (currency === "INR" && price > 0) {
          price = Number((price / 86).toFixed(2));
        }

        let buyUrl = it.id
          ? `https://play.google.com/store/books/details?id=${it.id}&gl=US&hl=en`
          : (sale.buyLink || "");
        if (buyUrl && !buyUrl.includes("gl=US")) {
          const sep = buyUrl.includes("?") ? "&" : "?";
          buyUrl = `${buyUrl}${sep}gl=US&hl=en`;
        }

        if (!price || price <= 0 || !buyUrl) {
          continue;
        }

        const ids = vol.industryIdentifiers || [];
        const isbnObj =
          ids.find((id) => id.type === "ISBN_13") ||
          ids.find((id) => id.type === "ISBN_10") ||
          ids[0];
        const cleanIsbn = isbnObj ? isbnObj.identifier.replace(/[^0-9X]/gi, "") : "";

        const img = vol.imageLinks?.thumbnail || vol.imageLinks?.smallThumbnail || "";

        offers.push({
          id: `google-${it.id || cleanIsbn || idx}`,
          title: vol.title || cleanQuery,
          author: vol.authors ? vol.authors.join(", ") : "Various Authors",
          isbn: cleanIsbn ? `ISBN: ${cleanIsbn}` : "",
          website: "Google Books",
          condition: "New",
          edition: vol.publishedDate ? `Published ${vol.publishedDate.slice(0, 4)}` : "Google Play Edition",
          price: price,
          priceFormatted: `$${price.toFixed(2)}`,
          availability: "In Stock (Google Play Store)",
          sourceUrl: buyUrl,
          image: img.replace("http://", "https://"),
          isLowest: false,
        });
      }
    }
  } catch (err) {
    console.error("getGoogleBooksOffers error:", err.message);
  }

  if (offers.length === 0 && matchingBooks.length > 0) {
    for (let idx = 0; idx < matchingBooks.length; idx++) {
      const book = matchingBooks[idx];
      const price = Number(book.price);
      if (price > 0 && book.googleBuyLink) {
        offers.push({
          id: `google-${book.isbn || idx}-${idx}`,
          title: book.title,
          author: book.author,
          isbn: book.isbn ? `ISBN: ${book.isbn}` : "",
          website: "Google Books",
          condition: "New",
          edition: book.year ? `Published ${book.year}` : "Google Play Edition",
          price: price,
          priceFormatted: `$${price.toFixed(2)}`,
          availability: "In Stock (Google Play Store)",
          sourceUrl: book.googleBuyLink,
          image: book.image,
          isLowest: false,
        });
      }
    }
  }

  return offers;
}

async function getBookDetails(query) {
  const all = await fetchMatchingBooks(query);
  const first = all[0] || {
    title: query,
    author: "Various Authors",
    isbn: "9780439708180",
    image: "",
    price: 9.99,
  };
  return {
    title: first.title,
    author: first.author,
    isbn: (first.isbn || "").replace(/[^0-9X]/gi, "") || "9780439708180",
    image: first.image,
    apiPrice: first.price || 9.99,
    googleBuyLink: first.googleBuyLink,
    googleInfoLink: first.infoLink || first.googleBuyLink,
  };
}

module.exports = { fetchMatchingBooks, getGoogleBooksOffers, getBookDetails };
