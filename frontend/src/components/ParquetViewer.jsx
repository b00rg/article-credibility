import React, { useEffect, useState } from "react";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import { useAnalysis } from "../context/AnalysisContext";

const ParquetViewer = () => {
  const { isComplete } = useAnalysis();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    axios.get("http://localhost:8000/api/read_parquet")
      .then(response => {
        setData(response.data);
        setLoading(false);
      })
      .catch(error => {
        console.error("Error fetching data:", error);
        setError("Failed to load data.");
        setLoading(false);
      });
}, [isComplete]);

  const columnNameMap = {
    author_name: "Author Name",
    source_name: "Publisher",
    published_at: "Published",
  };

  const getFriendlyColumnName = (key) => {
    if (key.startsWith("categories_") && key.endsWith("_label")) {
      const number = key.match(/\d+/)[0];
      return `Category ${number}`;
    }
    return columnNameMap[key] || key;
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className="container mt-4">
      <h2 className="text-center">Parquet Data</h2>
      <div className="table-container">
        <table className="table table-striped table-bordered">
          <thead>
            <tr>
              {data.length > 0 &&
                Object.keys(data[0]).map((key, index) => (
                  <th key={index}>{getFriendlyColumnName(key)}</th>
                ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {Object.values(row).map((value, colIndex) => (
                  <td key={colIndex}>{value}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ParquetViewer;
