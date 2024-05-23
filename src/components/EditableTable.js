import React, { useState, useEffect } from 'react';
import { fetchBooks } from '../api';
import Pagination from './Pagination';
import SearchBar from './SearchBar';
import CSVDownloader from './CSVDownloader';

const EditableTable = () => {
  const [books, setBooks] = useState([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [query, setQuery] = useState('');
  const [editIdx, setEditIdx] = useState(-1);
  const [editedBook, setEditedBook] = useState(null);

  useEffect(() => {
    const getBooks = async () => {
      const data = await fetchBooks(query, page, limit);
      setBooks(data.docs);
    };
    getBooks();
  }, [page, limit, query]);

  const handleEdit = (index) => {
    setEditIdx(index);
    setEditedBook(books[index]);
  };

  const handleSave = () => {
    const updatedBooks = [...books];
    updatedBooks[editIdx] = editedBook;
    setBooks(updatedBooks);
    setEditIdx(-1);
  };

  const handleChange = (e) => {
    setEditedBook({
      ...editedBook,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div>
      <div className="search-container">
        <CSVDownloader books={books} />
        <SearchBar query={query} setQuery={setQuery} />
      </div>
      <table>
        <thead>
          <tr>
            <th>Ratings Average</th>
            <th>Author Name</th>
            <th>Title</th>
            <th>First Publish Year</th>
            <th>Subject</th>
            <th>Author Birth Date</th>
            <th>Author Top Work</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {books.map((book, index) => (
            <tr key={index}>
              {editIdx === index ? (
                <>
                  <td><input name="ratings_average" value={editedBook.ratings_average} onChange={handleChange} /></td>
                  <td><input name="author_name" value={editedBook.author_name} onChange={handleChange} /></td>
                  <td><input name="title" value={editedBook.title} onChange={handleChange} /></td>
                  <td><input name="first_publish_year" value={editedBook.first_publish_year} onChange={handleChange} /></td>
                  <td><input name="subject" value={editedBook.subject} onChange={handleChange} /></td>
                  <td><input name="author_birth_date" value={editedBook.author_birth_date} onChange={handleChange} /></td>
                  <td><input name="author_top_work" value={editedBook.author_top_work} onChange={handleChange} /></td>
                  <td><button onClick={handleSave}>Save</button></td>
                </>
              ) : (
                <>
                  <td>{book.ratings_average}</td>
                  <td>{book.author_name}</td>
                  <td>{book.title}</td>
                  <td>{book.first_publish_year}</td>
                  <td>{book.subject}</td>
                  <td>{book.author_birth_date}</td>
                  <td>{book.author_top_work}</td>
                  <td><button onClick={() => handleEdit(index)}>Edit</button></td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      <Pagination page={page} setPage={setPage} limit={limit} setLimit={setLimit} />
    </div>
  );
};

export default EditableTable;
