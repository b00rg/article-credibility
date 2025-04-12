import React, { createContext, useContext, useState } from "react";

const AnalysisContext = createContext();

export const AnalysisProvider = ({ children }) => {
  const [isComplete, setIsComplete] = useState(false);
  const [flaggedArticles, setFlaggedArticles] = useState([]);
  const [analysis, setAnalysis] = useState([]);
  const [metadata, setMetadata] = useState(null);
  const [publisherSummary, setPublisherSummary] = useState([]);
  const [publisherScores, setPublisherScores] = useState([]);
  const [trendsData, setTrendsData] = useState([]);
  const [isLoading, setLoading] = useState(false);

  const preloadFlaggedData = async () => {
    try {
      const response = await fetch("http://127.0.0.1:8000/api/article_analysis");
      if (!response.ok) throw new Error("❌ Failed to fetch article_analysis");
      const data = await response.json();
      setAnalysis(data);
      setIsComplete(true);
      console.log("✅ Preloaded article analysis data");
    } catch (err) {
      console.error("❌ Failed preloading article analysis", err);
    }
  };
  
  const preloadPublisherData = async () => {
    try {
      setLoading(true);
      const [summaryRes, scoresRes] = await Promise.all([
        fetch("http://127.0.0.1:8000/api/publisher_summary"),
        fetch("http://127.0.0.1:8000/api/publisher_scores"),
      ]);

      if (!summaryRes.ok || !scoresRes.ok) throw new Error("Publisher API failed");

      const summaryData = await summaryRes.json();
      const scoreData = await scoresRes.json();

      setPublisherSummary(summaryData);
      setPublisherScores(scoreData);
      console.log("✅ Preloaded publisher data");
    } catch (err) {
      console.error("❌ Failed to fetch publisher data", err);
    } finally {
      setLoading(false);
    }
  };

  const preloadTrendsData = async () => {
    console.log("📡 PRELOAD: /api/trends request fired");
    try {
      const response = await fetch("http://127.0.0.1:8000/api/trends"); // your custom endpoint if it exists
      if (!response.ok) throw new Error("Failed to fetch trends");
      const data = await response.json();
      setTrendsData(data);
      console.log("✅ Preloaded trends data");
    } catch (err) {
      console.error("❌ Failed to fetch trends data", err);
    }
  };

  

  return (
    <AnalysisContext.Provider
      value={{
        isComplete,
        setIsComplete,
        flaggedArticles,
        setFlaggedArticles,
        analysis,
        setAnalysis,
        metadata,
        setMetadata,
        isLoading,
        publisherSummary,
        publisherScores,
        preloadFlaggedData,
        preloadPublisherData,
        trendsData,
        preloadTrendsData,
      }}
    >
      {children}
    </AnalysisContext.Provider>
  );
};

export const useAnalysis = () => useContext(AnalysisContext);
