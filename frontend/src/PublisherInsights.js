import React, { useEffect, useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { useAnalysis } from "./context/AnalysisContext"; // adjust the path if needed


export default function PublisherInsights() {
  const {
    publisherScores,
    publisherSummary,
    isLoading,
    preloadPublisherData
  } = useAnalysis();

  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 20;
  
  useEffect(() => {
    if (!publisherSummary || publisherScores.length === 0) {
      console.log("running preload publisher data again");
      preloadPublisherData();
    }
  }, []);


  // useEffect(() => {
  //   const fetchSummary = async () => {
  //     try {
  //       const [summaryRes, scoresRes] = await Promise.all([
  //         fetch("http://127.0.0.1:8000/api/publisher_summary"),
  //         fetch("http://127.0.0.1:8000/api/publisher_scores"),
  //       ]);

  //       const summaryData = await summaryRes.json();
  //       const scoreData = await scoresRes.json();

  //       setSummary(summaryData);
  //       setScores(scoreData);
  //     } catch (err) {
  //       console.error("Failed to fetch data", err);
  //     } finally {
  //       setLoading(false);
  //     }
  //   };

  //   fetchSummary();
  // }, []);

    // ✅ This makes sure data loads when the component mounts (even offscreen)
    useEffect(() => {
      if (!publisherSummary || publisherScores.length === 0) {
        preloadPublisherData();
      }
    }, []);

  const paginatedScores = useMemo(() => {
    return publisherScores.slice(
      currentPage * itemsPerPage,
      (currentPage + 1) * itemsPerPage
    ).map((item) => ({
      name: item.publisher.length > 20 ? item.publisher.slice(0, 20) + "…" : item.publisher,
      score: Math.round(item.credibility_score * 100),
    }));
  }, [publisherScores, currentPage]);

  if (isLoading) return <p>Loading...</p>;
  if (!publisherSummary) return <p>Unable to load summary.</p>;

  return (
    <div className="main-content">
      <h2>Publisher Insights</h2>

      {/* Summary Cards */}
      <div className="grid-layout">
        <div className="card">
          <h3>Total Publishers Analysed</h3>
          <p>{publisherSummary.total_publishers}</p>
        </div>
        <div className="card">
          <h3>Average Credibility Score</h3>
          <p>{Math.round(publisherSummary.average_score * 100)}%</p>
        </div>
        <div className="card">
          <h3>Flagged Publishers</h3>
          <p>{publisherSummary.flagged_publishers}</p>
        </div>
      </div>

      {/* Top 5 Table */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Rank</th>
              <th>Publisher</th>
              <th>Credibility Score</th>
              <th>Fake News Warnings</th>
            </tr>
          </thead>
          <tbody>
            {publisherSummary.top_publishers.map((item, index) => (
              <tr key={index}>
                <td>{index + 1}</td>
                <td>{item.publisher}</td>
                <td>{Math.round(item.credibility_score * 100)}%</td>
                <td>{item.credibility_score < 0.3 ? Math.floor((1 - item.credibility_score) * 30) : 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 📊 Bar Chart: Publisher Scores */}
      <div style={{ marginTop: "30px", height: 400 }}>
        <h3 style={{ marginLeft: "75px", marginBottom: "10px" }}>
          Average Publisher Credibility Scores
        </h3>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={paginatedScores}
            margin={{ top: 10, right: 30, left: 30, bottom: 40 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" angle={-45} textAnchor="end" interval={0} />
            <YAxis domain={[0, 100]} tickFormatter={(val) => `${val}%`} />
            <Tooltip formatter={(value) => `${value}%`} />
            <Bar dataKey="score" fill="#5D3FD3" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>

        {/* Pagination Controls */}
        <div style={{ display: "flex", justifyContent: "center", marginTop: 20 }}>
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 0))}
            disabled={currentPage === 0}
            className="pagination-button"
          >
            Previous
          </button>
          <span style={{ padding: "0 1rem" }}>Page {currentPage + 1} of {Math.ceil(publisherScores.length / itemsPerPage)}</span>
          <button 
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, Math.ceil(publisherScores.length / itemsPerPage) - 1))}
            disabled={currentPage >= Math.ceil(publisherScores.length / itemsPerPage) - 1}
            className="pagination-button"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
