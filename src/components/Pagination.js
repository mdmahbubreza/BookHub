import React from 'react';

const Pagination = ({ page, setPage, limit, setLimit }) => {
  const handlePageChange = (newPage) => {
    if (newPage >= 1) {
      setPage(newPage);
    }
  };

  return (
    <div className="pagination">
      <button onClick={() => handlePageChange(page - 1)} disabled={page === 1}>Previous</button>
      <button onClick={() => handlePageChange(page + 1)}>Next</button>
      <select onChange={(e) => setLimit(Number(e.target.value))} value={limit}>
        <option value={10}>10</option>
        <option value={50}>50</option>
        <option value={100}>100</option>
      </select>
    </div>
  );
};

export default Pagination;
