export const fetchBooks = async (query = '', page = 1, limit = 10) => {
    const response = await fetch(`https://openlibrary.org/search.json?q=${query}&page=${page}&limit=${limit}`);
    const data = await response.json();
    return data;
  };
  