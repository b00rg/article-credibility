import React, { useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";
import { useAnalysis } from "../context/AnalysisContext";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";


ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const ArticleWordLengthChart = () => {
  const { isComplete } = useAnalysis();
  const [averageLength, setAverageLength] = useState(0);
  const [articleLengths, setArticleLengths] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if(isComplete){
    const fetchData = async () => {
      try {
        const response = await fetch("http://127.0.0.1:8000/api/article_word_length");
        if (!response.ok) {
          throw new Error("Failed to fetch data");
        }
        const data = await response.json();
        console.log("Fetched Word Length Data:", data);

        setAverageLength(data.average_length || 0);
        setArticleLengths(data.article_lengths || []);
      } catch (error) {
        console.error("Error fetching article length data:", error);
        setError("No data available. Please upload a file.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Cleanup function to destroy the chart when component unmounts
    return () => {
      const chart = ChartJS.getChart("wordLengthChart");
      if (chart) {
        chart.destroy();
      }
    };
  }
}, [isComplete]);

  if (loading) {
    return <p className="text-center">Loading...</p>;
  }

  if (error) {
    return <p className="text-center text-muted">{error}</p>;
  }

  const chartData = {
    labels: articleLengths.length > 0 ? articleLengths.map((_, index) => `Article ${index + 1}`) : ["No Data"],
    datasets: [
      {
        label: "Word Count per Article",
        data: articleLengths.length > 0 ? articleLengths : [0],
        backgroundColor: "rgba(54, 162, 235, 0.6)",
        borderColor: "rgba(54, 162, 235, 1)",
        borderWidth: 1,
      },
    ],
  };

  return (
    <div style={{ width: "80%", margin: "0 auto" }}>
      <p className="text-center">
        <strong>Average Article Length:</strong> {averageLength} words
      </p>
      <Bar id="wordLengthChart" data={chartData} options={{ responsive: true }} />
    </div>
  );
};

export default ArticleWordLengthChart;