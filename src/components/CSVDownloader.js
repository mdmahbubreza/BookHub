import React from 'react';
import { CSVLink } from 'react-csv';
import '../styles.css'; // Import CSS to apply styles

const CSVDownloader = ({ books }) => {
  const headers = [
    { label: "Ratings Average", key: "ratings_average" },
    { label: "Author Name", key: "author_name" },
    { label: "Title", key: "title" },
    { label: "First Publish Year", key: "first_publish_year" },
    { label: "Subject", key: "subject" },
    { label: "Author Birth Date", key: "author_birth_date" },
    { label: "Author Top Work", key: "author_top_work" },
  ];

  return (
    <div className="CSV-download"> {/* Corrected class name here */}
      <CSVLink data={books} headers={headers} filename={"books.csv"}>
        Download CSV
      </CSVLink>
    </div>
  );
};

export default CSVDownloader;
