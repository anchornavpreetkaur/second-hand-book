async function getBooksRunOffer(isbn, book) {
  const apiKey = process.env.BOOKSRUN_API_KEY;
  const cleanIsbn = (isbn || "").replace(/[^0-9]/g, "");

  let price = Number((book.apiPrice * 0.5).toFixed(2));
  let stock = "In Stock (Used Offer)";
  let isLive = false;

  if (apiKey && cleanIsbn) {
    try {
      const res = await fetch(
        `https://booksrun.com/api/price/sell/${cleanIsbn}?key=${apiKey}`,
      );
      if (res.ok) {
        const data = await res.json();
        if (data && data.result) {
          if (data.result.price > 0) {
            price = Number(data.result.price);
            stock = "Live BooksRun Quote";
            isLive = true;
          } else if (data.result.text && typeof data.result.text === "object") {
            const live = Number(
              data.result.text.Good || data.result.text.Average,
            );
            if (live > 0) {
              price = live;
              stock = "Live BooksRun Quote";
              isLive = true;
            }
          }
        }
      }
    } catch (e) {}
  }

  console.log(
    `[BooksRun API] "${book.title}" -> Price: $${price.toFixed(2)} (${isLive ? "Live Quote" : "Used Store Offer"})`,
  );

  return {
    id: `booksrun-${isbn}`,
    title: book.title,
    author: book.author,
    isbn: `ISBN: ${isbn}`,
    website: "BooksRun",
    condition: "Used",
    edition: isLive ? "BooksRun Live API Quote" : "Used Bookstore Offer",
    price: price,
    priceFormatted: `$${price.toFixed(2)}`,
    availability: stock,
    sourceUrl: `https://booksrun.com/search?query=${encodeURIComponent(cleanIsbn || book.title)}`,
    image: book.image,
    isLowest: false,
  };
}

module.exports = { getBooksRunOffer };
