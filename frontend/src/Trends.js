import React, { useState, useEffect, useMemo } from "react";
import { PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, ScatterChart, Scatter, ResponsiveContainer } from "recharts";
import ArticleWordLengthChart from "./components/ArticleWordLengthChart";
import { useAnalysis } from "./context/AnalysisContext";
console.log("trends has started loading");

// Sentiment Analysis Data (Pie Chart)
const sentimentData = [
  { name: "Positive", value: 400 },
  { name: "Neutral", value: 300 },
  { name: "Negative", value: 150 },
];

const COLORS = ["#5D3FD3", "#60A5FA", "#A78BFA"];

// Fake News Topics Data (Bar Chart)
const fakeNewsTopics = [
  { topic: "Politics", count: 120 },
  { topic: "Health", count: 95 },
  { topic: "Technology", count: 75 },
  { topic: "Finance", count: 65 },
  { topic: "Entertainment", count: 50 },
];

// Custom tooltip for keyword frequency vs reading level
const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const dataPoint = payload[0].payload;
    return (
      <div style={{ backgroundColor: "#fff", border: "1px solid #ccc", padding: "10px" }}>
        <p><strong>Keyword:</strong> {dataPoint.keyword}</p>
        <p><strong>Frequency:</strong> {dataPoint.frequency}</p>
        <p><strong>Avg. Reading Level:</strong> {dataPoint.avgReading.toFixed(2)}</p>
      </div>
    );
  }
  return null;
};

// Custom tooltip for bubble plot
const BubbleCustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip">
        <p><strong>Avg Sentence Length:</strong> {payload[0].payload.avg_sentence_length}</p>
        <p><strong>Reading Level:</strong> {payload[0].payload.reading_level}</p>
        <p><strong>Word Count:</strong> {payload[0].payload.word_count}</p>
        <p><strong>Title:</strong> {payload[0].payload.title}</p>
      </div>
    );
  }
  return null;
};

// Helper function to get a color based on a string
const getColorForArticle = (title) => {
  const colors = ["#8884d8", "#82ca9d", "#ffc658", "#ff7300", "#0088FE", "#00C49F"];
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = title.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
};

const renderCustomBubble = (props) => {
  const { cx, cy, payload } = props;
  const scaleFactor = 0.7;
  const radius = Math.sqrt(payload.word_count) * scaleFactor;
  const fillColor = getColorForArticle(payload.title);
  return <circle cx={cx} cy={cy} r={radius} fill={fillColor} />;
};

export default function Trends() {
  const [activeIndex, setActiveIndex] = useState(null);
  const { analysis: articles } = useAnalysis(); // use preloaded raw articles 
  const [currentPage, setCurrentPage] = useState(1);
  const [bubblePage, setBubblePage] = useState(1);
  const [keywordPage, setKeywordPage] = useState(1);
  
  const pageSize = 10;

  console.log("trends is rendering graphs");

  // useEffect(() => {
  //   if (trendsData.length === 0) {
  //     console.log("🔁 trendsData is empty, triggering preloadTrendsData");
  //     preloadTrendsData();
  //   } else {
  //     console.log("✅ Using preloaded trendsData from context");
  //   }
  // }, []);

  // useEffect(() => {
  //   const fetchData = async () => {
  //     try {
  //       const response = await fetch("http://127.0.0.1:8000/api/article_analysis");
  //       if (!response.ok) {
  //         throw new Error("Failed to fetch data");
  //       }
  //       const data = await response.json();
  //       setArticles(data);
  //     } catch (error) {
  //       console.error("Error fetching data:", error);
  //       setArticles([]);
  //     }
  //   };

  //   fetchData();

  //   const handleStorageChange = (e) => {
  //     if (e.key === "uploadedParquetFile" && !e.newValue) {
  //       setArticles([]);
  //     }
  //   };

  //   window.addEventListener("storage", handleStorageChange);
  //   return () => window.removeEventListener("storage", handleStorageChange);
  // }, []);

  const onPieEnter = (_, index) => {
    setActiveIndex(index);
  };

  const onPieLeave = () => {
    setActiveIndex(null);
  };

  // Transform data for bubble plot
  const bubbleData = useMemo(() => {
    return articles
      .filter(article => article.avg_sentence_length != null && article.reading_level != null && article.word_count != null)
      .map(article => ({
        title: article.title,
        avg_sentence_length: article.avg_sentence_length,
        reading_level: article.reading_level,
        word_count: article.word_count,
        size: article.word_count,
      }));
  }, [articles]);

  // Paginate bubble data
  const totalBubblePages = Math.ceil(bubbleData.length / pageSize);
  const bubblePaginatedData = useMemo(() => {
    const startIndex = (bubblePage - 1) * pageSize;
    return bubbleData.slice(startIndex, startIndex + pageSize);
  }, [bubbleData, bubblePage, pageSize]);

  // Aggregate keyword frequency and reading level
  const scatterData = useMemo(() => {
    const keywordStats = {};
    articles.forEach(article => {
      if (Array.isArray(article.top_keywords)) {
        article.top_keywords.forEach(keyword => {
          if (!keywordStats[keyword]) {
            keywordStats[keyword] = { frequency: 0, totalReading: 0, count: 0 };
          }
          keywordStats[keyword].frequency += 1;
          if (article.reading_level !== null && !isNaN(article.reading_level)) {
            keywordStats[keyword].totalReading += article.reading_level;
            keywordStats[keyword].count += 1;
          }
        });
      }
    });
    return Object.entries(keywordStats).map(([keyword, stats]) => ({
      keyword,
      frequency: stats.frequency,
      avgReading: stats.count > 0 ? stats.totalReading / stats.count : 0,
    }));
  }, [articles]);

  // Paginate keyword data
  const totalKeywordPages = Math.ceil(scatterData.length / pageSize);
  const paginatedScatterData = useMemo(() => {
    const startIndex = (keywordPage - 1) * pageSize;
    return scatterData.slice(startIndex, startIndex + pageSize);
  }, [scatterData, keywordPage, pageSize]);

  // Prepare sentiment data
  const sentimentData = useMemo(() => {
    return articles.slice(0, 10).map((article, index) => ({
      title: article.title || `Article ${index + 1}`,
      TitleSentiment: article.sentiment_title_score ? Number(article.sentiment_title_score) : 0,
      BodySentiment: article.sentiment_body_score ? Number(article.sentiment_body_score) : 0,
    }));
  }, [articles]);

  // Prepare word length distribution data
  const wordLengthData = useMemo(() => {
    const wordLengths = articles.map(article => article.word_count || 0);
    const maxLength = Math.max(...wordLengths);
    const binSize = Math.ceil(maxLength / 10); // Create 10 bins
    const bins = {};
    
    wordLengths.forEach(length => {
      const bin = Math.floor(length / binSize) * binSize;
      bins[bin] = (bins[bin] || 0) + 1;
    });

    return Object.entries(bins)
      .map(([wordLength, count]) => ({
        wordLength: `${wordLength}-${Number(wordLength) + binSize}`,
        count
      }))
      .sort((a, b) => Number(a.wordLength.split('-')[0]) - Number(b.wordLength.split('-')[0]));
  }, [articles]);

  // Prepare reading level distribution data
  const readingLevelData = useMemo(() => {
    const readingLevels = articles
      .map(article => article.reading_level)
      .filter(level => level !== null && !isNaN(level));
    
    const maxLevel = Math.max(...readingLevels);
    const binSize = Math.ceil(maxLevel / 10); // Create 10 bins
    const bins = {};
    
    readingLevels.forEach(level => {
      const bin = Math.floor(level / binSize) * binSize;
      bins[bin] = (bins[bin] || 0) + 1;
    });

    return Object.entries(bins)
      .map(([readingLevel, count]) => ({
        readingLevel: `${readingLevel}-${Number(readingLevel) + binSize}`,
        count
      }))
      .sort((a, b) => Number(a.readingLevel.split('-')[0]) - Number(b.readingLevel.split('-')[0]));
  }, [articles]);

  // Group articles by category and calculate average reading level
  const readingData = useMemo(() => {
    const group = {};
    articles.forEach(article => {
      const category = article.categories_0_label || "Unknown";
      if (!group[category]) {
        group[category] = { totalReading: 0, count: 0 };
      }
      if (article.reading_level !== null && !isNaN(article.reading_level)) {
        group[category].totalReading += article.reading_level;
        group[category].count += 1;
      }
    });
    return Object.entries(group).map(([category, { totalReading, count }]) => ({
      category,
      avgReadingLevel: count > 0 ? totalReading / count : 0,
    }));
  }, [articles]);

  // Aggregate advertisement frequency by publisher
  const adsData = useMemo(() => {
    const adsByPublisher = articles.reduce((acc, article) => {
      const publisher = article.source_name || article.domain || "Unknown";
      if (!acc[publisher]) {
        acc[publisher] = 0;
      }
      acc[publisher] += Number(article.ad_frequency) || 0;
      return acc;
    }, {});
    return Object.entries(adsByPublisher)
      .map(([publisher, totalAds]) => ({ publisher, totalAds }))
      .filter(item => item.totalAds > 0);
  }, [articles]);

  return (
    <div className="main-content">
      <h2>Trends & Statistics</h2>

      {/* Articles Summary Table */}
      <div style={{ marginBottom: "40px" }}>
        <h3>Articles Summary</h3>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ border: "1px solid #ccc", padding: "8px" }}>Title</th>
              <th style={{ border: "1px solid #ccc", padding: "8px" }}>Word Count</th>
              <th style={{ border: "1px solid #ccc", padding: "8px" }}>Avg Sentence Length</th>
              <th style={{ border: "1px solid #ccc", padding: "8px" }}>Reading Level</th>
              <th style={{ border: "1px solid #ccc", padding: "8px" }}>Top Keywords</th>
              <th style={{ border: "1px solid #ccc", padding: "8px" }}>Domain</th>
            </tr>
          </thead>
          <tbody>
            {articles.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((article, index) => (
              <tr key={index}>
                <td style={{ border: "1px solid #ccc", padding: "8px" }}>{article.title}</td>
                <td style={{ border: "1px solid #ccc", padding: "8px" }}>{article.word_count}</td>
                <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                  {article.avg_sentence_length ? article.avg_sentence_length.toFixed(2) : "N/A"}
                </td>
                <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                  {article.reading_level !== null ? article.reading_level : "N/A"}
                </td>
                <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                  {Array.isArray(article.top_keywords) ? article.top_keywords.join(", ") : ""}
                </td>
                <td style={{ border: "1px solid #ccc", padding: "8px" }}>{article.domain}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {/* Pagination Controls for Articles Summary */}
        <div style={{ marginTop: "1rem", textAlign: "center" }}>
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            style={{ marginRight: "1rem" }}
          >
            Previous
          </button>
          <span>
            Page {currentPage} of {Math.ceil(articles.length / pageSize)}
          </span>
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(articles.length / pageSize)))}
            disabled={currentPage === Math.ceil(articles.length / pageSize)}
            style={{ marginLeft: "1rem" }}
          >
            Next
          </button>
        </div>
      </div>

      {/* Word Length and Reading Level Distribution */}
      <div className="charts-row">
        <div className="chart-container distribution-chart">
          <h3>Word Count Distribution</h3>
          <BarChart width={700} height={400} data={articles}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="title" tick={{ fontSize: 12 }} hide />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="word_count" fill="#8884d8" name="Word Count" />
          </BarChart>
        </div>

        <div className="chart-container distribution-chart">
          <h3>Reading Level Distribution</h3>
          <BarChart width={700} height={400} data={articles}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="title" tick={{ fontSize: 12 }} hide />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="reading_level" fill="#ffbf00" name="Reading Level" />
          </BarChart>
        </div>
      </div>

      {/* Advertisements by Domain and Categories vs. Reading Level */}
      <div className="charts-row">
        <div className="chart-container domain-chart">
          <h3>Advertisements by Domain</h3>
          {adsData.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={adsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="publisher" angle={-45} textAnchor="end" interval={0} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="totalAds" fill="#82ca9d" name="Total Ads" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-muted text-center">No advertisement data available.</p>
          )}
        </div>

        <div className="chart-container domain-chart">
          <h3>Categories vs. Reading Level</h3>
          {readingData.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={readingData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" angle={-45} textAnchor="end" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="avgReadingLevel" fill="#8884d8" name="Average Reading Level" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-muted text-center">No metadata available.</p>
          )}
        </div>
      </div>

      {/* Sentiment Comparison */}
      <div style={{ marginBottom: "40px" }}>
        <h3>Sentiment Comparison</h3>
        <p>Comparing sentiment scores for article titles versus bodies.</p>
        {sentimentData.length > 0 ? (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={sentimentData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="title" angle={-45} textAnchor="end" interval={0} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="TitleSentiment" fill="#8884d8" name="Title Sentiment" />
              <Bar dataKey="BodySentiment" fill="#82ca9d" name="Body Sentiment" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-muted text-center">No sentiment data available.</p>
        )}
      </div>

      {/* Keyword Frequency vs. Reading Level and Reading Metrics Bubble Plot */}
      <div className="charts-row">
        <div className="chart-container">
          <h3>Keyword Frequency vs. Reading Level</h3>
          <p>Each data point represents a top keyword from all articles. The x‑axis shows the number of times the keyword appears (its frequency), and the y‑axis shows the average reading level in articles mentioning that keyword (a lower score is harder to read).</p>
          {paginatedScatterData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={400}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    type="number" 
                    dataKey="frequency" 
                    name="Frequency" 
                    label={{ value: "Frequency", position: "insideBottomRight", offset: 0 }}
                  />
                  <YAxis 
                    type="number" 
                    dataKey="avgReading" 
                    name="Average Reading Level" 
                    label={{ value: "Avg. Reading Level", angle: -90, position: "insideLeft" }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Scatter name="Keywords" data={paginatedScatterData} fill="#8884d8" />
                </ScatterChart>
              </ResponsiveContainer>
              <div style={{ marginTop: "1rem", textAlign: "center" }}>
                <button
                  onClick={() => setKeywordPage(prev => Math.max(prev - 1, 1))}
                  disabled={keywordPage === 1}
                  style={{ marginRight: "1rem" }}
                >
                  Previous
                </button>
                <span>
                  Page {keywordPage} of {totalKeywordPages}
                </span>
                <button
                  onClick={() => setKeywordPage(prev => Math.min(prev + 1, totalKeywordPages))}
                  disabled={keywordPage === totalKeywordPages}
                  style={{ marginLeft: "1rem" }}
                >
                  Next
                </button>
              </div>
            </>
          ) : (
            <p className="text-muted text-center">No keyword data available.</p>
          )}
        </div>

        <div className="chart-container">
          <h3>Reading Metrics Bubble Plot</h3>
          <p>Each bubble represents an article. The x‑axis shows average sentence length, the y‑axis shows reading level, and the bubble size indicates word count.</p>
          {bubblePaginatedData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={400}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" dataKey="avg_sentence_length" name="Avg Sentence Length" label={{ value: "Average Sentence Length", position: "insideBottomRight", offset: 0 }} />
                  <YAxis type="number" dataKey="reading_level" name="Reading Level" label={{ value: "Reading Level", angle: -90, position: "insideLeft" }} />
                  <Tooltip content={<BubbleCustomTooltip />} />
                  <Legend />
                  <Scatter name="Articles" data={bubblePaginatedData} shape={renderCustomBubble} />
                </ScatterChart>
              </ResponsiveContainer>
              <div style={{ marginTop: "1rem", textAlign: "center" }}>
                <button onClick={() => setBubblePage(prev => Math.max(prev - 1, 1))} disabled={bubblePage === 1} style={{ marginRight: "1rem" }}>
                  Previous
                </button>
                <span>Page {bubblePage} of {totalBubblePages}</span>
                <button onClick={() => setBubblePage(prev => Math.min(prev + 1, totalBubblePages))} disabled={bubblePage === totalBubblePages} style={{ marginLeft: "1rem" }}>
                  Next
                </button>
              </div>
            </>
          ) : (
            <p className="text-muted text-center">No article data available for bubble plot.</p>
          )}
        </div>
      </div>

      {/* Article Word Length Chart */}
      <div style={{ marginTop: "40px" }}>
        <h3 style={{ textAlign: "center", fontSize: "18px", fontWeight: "bold" }}>
          Article Word Count Distribution
        </h3>
        <ArticleWordLengthChart />
      </div>
    </div>
  );
}
