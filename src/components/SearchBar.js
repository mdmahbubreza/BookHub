import React, { useState } from 'react';

const SearchBar = ({ query, setQuery }) => {
  const [searchTerm, setSearchTerm] = useState(query);

  const handleSearch = () => {
    setQuery(searchTerm);
  };

  return (
    <div className="search-bar">
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Search by author"
      />
      <button onClick={handleSearch}>Search</button>
    </div>
  );
};

export default SearchBar;
