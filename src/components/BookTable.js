import React, { useState, useEffect } from 'react';
import { fetchBooks } from '../api';
import Pagination from './Pagination';
import SearchBar from './SearchBar';
import CSVDownloader from './CSVDownloader'; // Import CSVDownloader component

const BookTable = () => {
  const [books, setBooks] = useState([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [query, setQuery] = useState('');
  const [sortField, setSortField] = useState('');
  const [sortOrder, setSortOrder] = useState('asc');

  useEffect(() => {
    const getBooks = async () => {
      const data = await fetchBooks(query, page, limit);
      setBooks(data.docs);
    };
    getBooks();
  }, [page, limit, query, sortField, sortOrder]);

  const handleSort = (field) => {
    const order = sortOrder === 'asc' ? 'desc' : 'asc';
    setSortField(field);
    setSortOrder(order);
    setBooks([...books].sort((a, b) => {
      if (a[field] < b[field]) return order === 'asc' ? -1 : 1;
      if (a[field] > b[field]) return order === 'asc' ? 1 : -1;
      return 0;
    }));
  };

  return (
    <div>
      <SearchBar query={query} setQuery={setQuery} />
      <CSVDownloader books={books} /> {/* Render CSVDownloader component */}
      <table>
        <thead>
          <tr>
            <th onClick={() => handleSort('ratings_average')}>Ratings Average</th>
            <th onClick={() => handleSort('author_name')}>Author Name</th>
            <th onClick={() => handleSort('title')}>Title</th>
            <th onClick={() => handleSort('first_publish_year')}>First Publish Year</th>
            <th onClick={() => handleSort('subject')}>Subject</th>
            <th onClick={() => handleSort('author_birth_date')}>Author Birth Date</th>
            <th onClick={() => handleSort('author_top_work')}>Author Top Work</th>
          </tr>
        </thead>
        <tbody>
          {books.map((book, index) => (
            <tr key={index}>
              <td>{book.ratings_average}</td>
              <td>{book.author_name}</td>
              <td>{book.title}</td>
              <td>{book.first_publish_year}</td>
              <td>{book.subject}</td>
              <td>{book.author_birth_date}</td>
              <td>{book.author_top_work}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <Pagination page={page} setPage={setPage} limit={limit} setLimit={setLimit} />
    </div>
  );
};

export default BookTable;
