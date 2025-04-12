// import React from 'react';
// import Dashboard from './Dashboard';
// import ArticleQualityChecker from './components/ArticleQualityChecker';
// import './App.css';

// function App() {
//   return (
//     <div className="App">
//       {/* Left side: Dashboard or sidebar */}
//       <Dashboard />

//       {/* Right or below: Article Quality Checker */}
//       <ArticleQualityChecker />
//     </div>
//   );
// }

// export default App;

import React, { useState } from "react";
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import Sidebar from "./Sidebar"; // Import the Sidebar component
import ArticleAnalysis from "./ArticleAnalysis"; // Placeholder for the article analysis page
import PublisherInsights from "./PublisherInsights"; // Placeholder for publisher ratings
import Trends from "./Trends"; // Placeholder for trends page
import FlaggedArticles from "./FlaggedArticles"; // Placeholder for flagged articles
import ParquetViewer from "./components/ParquetViewer"; // Placeholder for Parquet Viewer
import LlamaAnalysis from "./LlamaAnalysis"; // Import the Llama Analysis component
import FAQ from "./FAQ"; // Import the FAQ component
import "./App.css";
import { useAnalysis } from "./context/AnalysisContext";

function App() {
  const [analysisComplete, setAnalysisComplete] = useState(false);

  const {
    preloadPublisherData,
    preloadFlaggedData,
    preloadTrendsData,
  } = useAnalysis();

  const NotFound = () => (
    <div style={{ padding: "2rem", textAlign: "center" }}>
      <h2>404 — Page Not Found</h2>
      <p>The page you are looking for doesn't exist.</p>
    </div>
  );

  React.useEffect(() => {
    if (analysisComplete) {
      console.log("🚀 Preloading all dashboard data...");
      preloadPublisherData();
      preloadFlaggedData();
      preloadTrendsData();
    }
  }, [analysisComplete]);
  

  return (
      <div className="App">
        <Sidebar />

        <div className="main-content">
          <Routes>
            <Route path="/" element={<Navigate replace to="/article-analysis" />} />

            <Route
              path="/article-analysis"
              element={<ArticleAnalysis onComplete={() => setAnalysisComplete(true)} />}
            />
            <Route path="/trends" element={<Trends />} />
            <Route path="/publisher-insights" element={<PublisherInsights />} />
            <Route path="/flagged-articles" element={<FlaggedArticles />} />
            <Route path="/parquet-viewer" element={<ParquetViewer />} />
            <Route path="/faqs" element={<FAQ />} />
            <Route path="/llama-analysis" element={<LlamaAnalysis />} />
            <Route path="*" element={<NotFound />} /> {/* Catch-all route */}
          </Routes>

          {/* 🔁 Preload (hidden) all components after analysis  */}
           {/* {analysisComplete && (
            <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
              <PublisherInsights />
              <Trends />
              <FlaggedArticles />
              <ParquetViewer />
            </div>
          )} */}
        </div>
      </div>
  );
}

export default App;
