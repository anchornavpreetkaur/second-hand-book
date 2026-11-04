async function getPangoBooksOffer(isbn, book) {
  const cleanIsbn = (isbn || "").replace(/[^0-9]/g, "");

  let price = Number((book.apiPrice * 0.65).toFixed(2));
  let stock = "Community Listed";
  let isLive = false;

  if (cleanIsbn) {
    try {
      const res = await fetch(
        `https://pangobooks.com/api/public/pricing?isbn=${cleanIsbn}`,
      );
      if (res.ok) {
        const data = await res.json();
        if (data) {
          const market = data.market_data || data;
          const live = Number(
            market.lowest_current_price ||
              market.average_sold_price ||
              (data.comps && data.comps[0] && data.comps[0].price),
          );

          if (live > 0) {
            price = live;
            stock = "Verified Community Sales";
            isLive = true;
          }
        }
      }
    } catch (e) {}
  }

  console.log(
    `[PangoBooks API] "${book.title}" -> Price: $${price.toFixed(2)} (${isLive ? "Live Quote" : "Community Offer"})`,
  );

  return {
    id: `pangobooks-${isbn}`,
    title: book.title,
    author: book.author,
    isbn: `ISBN: ${isbn}`,
    website: "PangoBooks",
    condition: "Used",
    edition: isLive ? "PangoBooks Live Marketplace" : "Community Seller Offer",
    price: price,
    priceFormatted: `$${price.toFixed(2)}`,
    availability: stock,
    sourceUrl: `https://pangobooks.com/search?q=${encodeURIComponent(book.title)}`,
    image: book.image,
    isLowest: false,
  };
}

module.exports = { getPangoBooksOffer };
