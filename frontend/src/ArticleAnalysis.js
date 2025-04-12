import React from "react";
import ArticleQualityChecker from "./components/ArticleQualityChecker"; // Import the component
import { useAnalysis } from "./context/AnalysisContext";

export default function ArticleAnalysis({ onComplete }) {
  const { preloadFlaggedData, preloadPublisherData, preloadTrendsData } = useAnalysis();



  return (
    <div className="main-content">
      <ArticleQualityChecker
        onAnalysisComplete={async () => {
          await preloadFlaggedData();
          await preloadPublisherData();
          await preloadTrendsData();
          onComplete(); // ✅ this triggers setAnalysisComplete in App.js
          console.log("preloading completed");
        }}
        />
    </div>
  );
}