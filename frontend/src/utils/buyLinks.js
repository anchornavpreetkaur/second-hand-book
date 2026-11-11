export function getDirectBuyUrl(book) {
  if (!book) return '#';

  const title = book.title || '';
  const website = String(book.website || '').toLowerCase();
  const cleanIsbn = String(book.isbn || '').replace(/[^0-9X]/gi, '');

  if (website.includes('booksrun')) {
    const slug = title
      .toLowerCase()
      .replace(/['’]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    if (cleanIsbn) {
      return slug
        ? `https://booksrun.com/${cleanIsbn}-${slug}`
        : `https://booksrun.com/${cleanIsbn}`;
    }

    if (book.sourceUrl && !book.sourceUrl.includes('/cart/')) {
      return book.sourceUrl;
    }

    return `https://booksrun.com/search?query=${encodeURIComponent(title)}`;
  }

  if (website.includes('pango')) {
    if (book.sourceUrl && book.sourceUrl.includes('pangobooks.com/books/')) {
      return book.sourceUrl;
    }
    return `https://pangobooks.com/search?q=${encodeURIComponent(title)}`;
  }

  if (website.includes('google')) {
    let url = book.sourceUrl || '';
    if (url && url.startsWith('http')) {
      if (url.includes('play.google.com/store/books/details') && !url.includes('gl=US')) {
        const sep = url.includes('?') ? '&' : '?';
        return `${url}${sep}gl=US&hl=en`;
      }
      return url;
    }
    return `https://play.google.com/store/search?q=${encodeURIComponent(title)}&c=books&gl=US&hl=en`;
  }

  return book.sourceUrl || '#';
}
