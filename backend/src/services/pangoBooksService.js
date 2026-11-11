function formatSecondHandCondition(rawCondition) {
  if (!rawCondition) return "Used - Good";
  const str = String(rawCondition).toLowerCase().trim();

  if (str.includes("like new")) return "Used - Like New";
  if (str.includes("very good")) return "Used - Very Good";
  if (str.includes("good")) return "Used - Good";
  if (str.includes("acceptable") || str.includes("fair") || str.includes("poor")) return "Used - Acceptable";
  if (str.includes("new")) return "Used - Like New";
  return "Used - Good";
}

async function getPangoBooksOffers(query, candidateBooks = []) {
  const cleanQuery = (query || "").trim();
  const offers = [];

  try {
    const res = await fetch(
      `https://pangobooks.com/api/public/search?q=${encodeURIComponent(cleanQuery)}&type=books&limit=12`
    );
    if (res.ok) {
      const data = await res.json();
      const hits = data.data?.hits || [];
      for (const hit of hits) {
        const price = Number(hit.price_usd);
        if (!price || price <= 0) continue;

        const rawIsbn = (hit.isbn || "").replace(/[^0-9X]/gi, "");
        const buyUrl = hit.urls?.book || `https://pangobooks.com/search?q=${encodeURIComponent(hit.title || cleanQuery)}`;

        let coverImg = "";
        if (hit.cover_url) {
          coverImg = hit.cover_url.startsWith("http")
            ? hit.cover_url
            : `https://images2.pangobooks.com/${hit.cover_url}`;
        }

        offers.push({
          id: `pangobooks-${hit.id || rawIsbn}`,
          title: hit.title || cleanQuery,
          author: Array.isArray(hit.authors) ? hit.authors.join(", ") : (hit.authors || "Various Authors"),
          isbn: rawIsbn ? `ISBN: ${rawIsbn}` : "",
          website: "PangoBooks",
          condition: formatSecondHandCondition(hit.condition),
          edition: "Second-Hand Community Offer",
          price: price,
          priceFormatted: `$${price.toFixed(2)}`,
          availability: "In Stock (Community Seller)",
          sourceUrl: buyUrl,
          image: coverImg,
          isLowest: false,
        });
      }
    }
  } catch (err) {
    console.error("PangoBooks search error:", err.message);
  }

  if (offers.length === 0 && candidateBooks.length > 0) {
    try {
      for (const book of candidateBooks.slice(0, 3)) {
        const searchTerm = (book.isbn || book.title || "").trim();
        if (!searchTerm) continue;
        const res = await fetch(
          `https://pangobooks.com/api/public/search?q=${encodeURIComponent(searchTerm)}&type=books&limit=2`
        );
        if (!res.ok) continue;
        const data = await res.json();
        const hits = data.data?.hits || [];
        for (const hit of hits) {
          const price = Number(hit.price_usd);
          if (!price || price <= 0) continue;
          const rawIsbn = (hit.isbn || "").replace(/[^0-9X]/gi, "");
          const buyUrl = hit.urls?.book || `https://pangobooks.com/search?q=${encodeURIComponent(hit.title)}`;

          let coverImg = "";
          if (hit.cover_url) {
            coverImg = hit.cover_url.startsWith("http")
              ? hit.cover_url
              : `https://images2.pangobooks.com/${hit.cover_url}`;
          }

          offers.push({
            id: `pangobooks-${hit.id || rawIsbn}`,
            title: hit.title || book.title,
            author: Array.isArray(hit.authors) ? hit.authors.join(", ") : (book.author || "Various Authors"),
            isbn: rawIsbn ? `ISBN: ${rawIsbn}` : (book.isbn ? `ISBN: ${book.isbn}` : ""),
            website: "PangoBooks",
            condition: formatSecondHandCondition(hit.condition),
            edition: "Second-Hand Community Offer",
            price: price,
            priceFormatted: `$${price.toFixed(2)}`,
            availability: "In Stock (Community Seller)",
            sourceUrl: buyUrl,
            image: coverImg || book.image || "",
            isLowest: false,
          });
        }
      }
    } catch (err) {
      console.error("PangoBooks candidate resolution error:", err.message);
    }
  }

  return offers;
}

async function getPangoBooksOffer(isbn, book) {
  const offers = await getPangoBooksOffers(isbn || book.title, [book]);
  return offers[0] || null;
}

module.exports = { formatSecondHandCondition, getPangoBooksOffers, getPangoBooksOffer };
