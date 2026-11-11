const { BOOKSRUN_API_KEY } = require("../config/environment");
const { formatSecondHandCondition } = require("./pangoBooksService");

async function fetchBooksRunPrice(cleanIsbn) {
  if (!cleanIsbn || !BOOKSRUN_API_KEY) return null;

  try {
    const url = `https://booksrun.com/api/v3/price/buy/${cleanIsbn}?key=${BOOKSRUN_API_KEY}`;
    const res = await fetch(url);
    if (!res.ok) return null;

    const data = await res.json();
    if (data.result?.status !== "success") return null;

    const offers = data.result?.offers;
    const used = offers?.booksrun?.used;
    const mp = Array.isArray(offers?.marketplace) ? offers.marketplace : [];
    const bestMp = mp.find((m) => m.used && typeof m.used.price === "number");
    const newOffer = offers?.booksrun?.new;

    if (used && typeof used.price === "number") {
      return {
        price: Number(used.price),
        cartUrl: used.cart_url || null,
        condition: "Used - Good",
      };
    }

    if (bestMp) {
      return {
        price: Number(bestMp.used.price),
        cartUrl: bestMp.used.cart_url || null,
        condition: formatSecondHandCondition(bestMp.used.condition),
      };
    }

    if (newOffer && typeof newOffer.price === "number") {
      return {
        price: Number(newOffer.price),
        cartUrl: newOffer.cart_url || null,
        condition: "New",
      };
    }
  } catch (err) {
    console.error(`BooksRun pricing error for ${cleanIsbn}:`, err.message);
  }

  return null;
}

async function getBooksRunOffers(query, candidateBooks = []) {
  const cleanQuery = (query || "").trim();
  const isDirectIsbn = /^[0-9X-]{10,17}$/i.test(cleanQuery);
  const directCleanIsbn = isDirectIsbn ? cleanQuery.replace(/[^0-9X]/gi, "") : "";

  const booksToCheck = [...candidateBooks];
  if (directCleanIsbn && !booksToCheck.some((b) => (b.isbn || "").includes(directCleanIsbn))) {
    booksToCheck.unshift({
      title: cleanQuery,
      author: "Various Authors",
      isbn: directCleanIsbn,
      image: `https://covers.openlibrary.org/b/isbn/${directCleanIsbn}-M.jpg`,
    });
  }

  const seenIsbns = new Set();
  const uniqueCandidates = [];
  for (const item of booksToCheck) {
    const cleanIsbn = (item.isbn || "").replace(/[^0-9X]/gi, "");
    if (cleanIsbn && cleanIsbn.length >= 10 && !seenIsbns.has(cleanIsbn)) {
      seenIsbns.add(cleanIsbn);
      uniqueCandidates.push({ ...item, cleanIsbn });
    }
  }

  const results = await Promise.all(
    uniqueCandidates.slice(0, 8).map(async (item, idx) => {
      const priceData = await fetchBooksRunPrice(item.cleanIsbn);
      if (!priceData || !priceData.price || priceData.price <= 0) {
        return null;
      }

      const slug = (item.title || "")
        .toLowerCase()
        .replace(/['’]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

      const directUrl = slug
        ? `https://booksrun.com/${item.cleanIsbn}-${slug}`
        : `https://booksrun.com/${item.cleanIsbn}`;

      return {
        id: `booksrun-${item.cleanIsbn}-${idx}`,
        title: item.title,
        author: item.author || "Various Authors",
        isbn: `ISBN: ${item.cleanIsbn}`,
        website: "BooksRun",
        condition: priceData.condition,
        edition: "Used Bookstore Offer",
        price: priceData.price,
        priceFormatted: `$${priceData.price.toFixed(2)}`,
        availability: "In Stock (Used Offer)",
        sourceUrl: directUrl,
        image: item.image,
        isLowest: false,
      };
    })
  );

  return results.filter(Boolean);
}

async function getBooksRunOffer(isbn, book) {
  const cleanIsbn = (isbn || book.isbn || "").replace(/[^0-9X]/gi, "");
  const offers = await getBooksRunOffers(cleanIsbn, [book]);
  return offers[0] || null;
}

module.exports = { getBooksRunOffers, getBooksRunOffer };
