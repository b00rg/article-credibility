import React, { useState, useEffect, useMemo, useRef} from "react";
import {   ScatterChart,Scatter,BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { useAnalysis } from "./context/AnalysisContext";


console.log("🟡 FlaggedArticles file started loading");

export default function FlaggedArticles() {
  console.log("🟨 FlaggedArticles component started");
  const { flaggedArticles, isComplete } = useAnalysis();


        // Filter out only "clickbait" articles
        const filteredClickbait = flaggedArticles.filter((article) => article.clickbait_prediction.label === "clickbait");

//  useEffect(() => {

//     if(isComplete && !hasFetchedFlagged) {
//       console.log("🟢 useEffect triggered — isComplete =", isComplete);
//       hasFetchedFlagged = true;
//     // Fetch articles data from backend
//     const fetchData = async () => {
//       console.log("📡 Fetching defualt flagged articles...");
//       axios.get("/api/flagged").then((res) => {
//         setFlaggedArticles(res.data);
//       });
//       try {
//         const response = await fetch("http://127.0.0.1:8000/api/predict_articles");
//         if (!response.ok) {
//           throw new Error("Failed to fetch data");
//         }
//         const data = await response.json();

//         // 🔥 Filter out only "clickbait" articles
//         const filteredClickbait = data.filter((article) => article.clickbait_prediction.label === "clickbait");

//         setArticles(filteredClickbait);
//       } catch (error) {
//         console.error("Error fetching articles:", error);
//         setArticles([]); // Clear articles on error
//       }
//     };

//     fetchData();

//     // Add event listener for storage changes
//     const handleStorageChange = (e) => {
//       if (e.key === "uploadedParquetFile" && !e.newValue) {
//         // If the file was removed (uploadedParquetFile is null)
//         setArticles([]); // Clear the articles state
//       }
//     };

//     window.addEventListener("storage", handleStorageChange);

//     // Cleanup
//     return () => {
//       window.removeEventListener("storage", handleStorageChange);
//     };
//   }
// }, [isComplete]);

  return (
    <div className="main-content">
      <h2>Flagged Articles</h2>
      <p>See the list of articles flagged as potential Clickbait Articles.</p>

      {/* Ensure there is data before rendering */}
      {flaggedArticles.length > 0 ? (
        <BarChart width={700} height={400} data={flaggedArticles.slice(0, 25)}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="title" tick={{ fontSize: 12 }} hide />
          <YAxis domain={[0, 1]} tickFormatter={(value) => `${value * 100}%`} />
          <Tooltip formatter={(value) => `${(value * 100).toFixed(2)}%`} />
          <Legend />
          <Bar dataKey="clickbait_prediction.confidence" fill="#B47DFF" name="Confidence Level" />
        </BarChart>
      ) : (
        <p className="text-muted text-center">No clickbait articles detected.</p>
      )}
      {/* Embed the AllArticleAnalysis component */}
      <hr />
      <AllArticleAnalysis />

      {/* Now display VisualizeMetadata below AllArticleAnalysis */}
      <hr />
      <VisualizeMetadata />
    </div>
  );
}

export function AllArticleAnalysis() {
  const [sortField, setSortField] = useState(null); // field to sort by
  const [sortOrder, setSortOrder] = useState("asc");  // "asc" or "desc"
  const [currentPage, setCurrentPage] = useState(1);
  const { analysis, isComplete } = useAnalysis();
  const articles = analysis;
  const pageSize = 10;

//   useEffect(() => {
//     console.log("🟢 useEffect ran — isComplete =", isComplete);
    

//     if(isComplete && !hasFetchedAnalysis) {
//     // Fetch data from article_analysis endpoint
//     const fetchData = async () => {
//       console.log("📡 Fetching all articles analysis");
//       hasFetchedAnalysis = true;
//       axios.get("/api/analysis").then((res) => {
//         setAnalysis(res.data);
//       });
//       try {
//         const response = await fetch("http://127.0.0.1:8000/api/article_analysis");
//         if (!response.ok) {
//           throw new Error("Failed to fetch article analysis data");
//         }
//         const data = await response.json();
//         setArticles(data);
//       } catch (error) {
//         console.error("Error fetching article analysis data:", error);
//         setArticles([]); // Clear articles on error
//       }
//     };

//     fetchData();

//     // Add event listener for storage changes
//     const handleStorageChange = (e) => {
//       if (e.key === "uploadedParquetFile" && !e.newValue) {
//         setArticles([]); // Clear articles when file is removed
//       }
//     };

//     window.addEventListener("storage", handleStorageChange);

//     // Cleanup
//     return () => {
//       window.removeEventListener("storage", handleStorageChange);
//     };
//   }
// }, [isComplete]);


  // Memoize the sorted articles to avoid unnecessary sorting on each render.
  const sortedArticles = useMemo(() => {
    if (!sortField) return articles;
    return [...articles].sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      // If sorting a string field, compare in lowercase.
      if (typeof aVal === "string") {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }

      if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
  }, [articles, sortField, sortOrder]);

  // **Pagination Logic:**
  const totalPages = Math.ceil(sortedArticles.length / pageSize);
  const paginatedArticles = sortedArticles.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleSort = (field) => {
    if (sortField === field) {
      // Toggle sort order if clicking the same column
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  // New: Aggregate advertisement frequency by publisher
  const adsByPublisher = articles.reduce((acc, article) => {
    // Use source_name if available; otherwise fall back to domain or "Unknown"
    const publisher = article.source_name || article.domain || "Unknown";
    if (!acc[publisher]) {
      acc[publisher] = 0;
    }
    acc[publisher] += Number(article.ad_frequency) || 0;
    return acc;
  }, {});

  // Convert grouped data to an array for Recharts
  const adsData = Object.entries(adsByPublisher).map(([publisher, totalAds]) => ({
    publisher,
    totalAds,
  }))
    .filter(item => item.totalAds > 0);



  return (
    <div className="main-content">
      <h2>All Article Analysis</h2>
      <p>Below are some key metrics from the article analysis. Click Word Count, Reading Level or Domain to sort </p>

      {articles.length > 0 ? (
        <>
          {/* Data Table with sorting */}
          <h3>Articles Summary</h3>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ border: "1px solid #ccc", padding: "8px" }}>Title</th>
                <th
                  style={{ border: "1px solid #ccc", padding: "8px", cursor: "pointer" }}
                  onClick={() => handleSort("word_count")}
                >
                  Word Count {sortField === "word_count" ? (sortOrder === "asc" ? "▲" : "▼") : ""}
                </th>
                <th style={{ border: "1px solid #ccc", padding: "8px" }}>Avg Sentence Length</th>
                <th
                  style={{ border: "1px solid #ccc", padding: "8px", cursor: "pointer" }}
                  onClick={() => handleSort("reading_level")}
                >
                  Reading Level {sortField === "reading_level" ? (sortOrder === "asc" ? "▲" : "▼") : ""}
                </th>
                <th style={{ border: "1px solid #ccc", padding: "8px" }}>Top Keywords</th>
                <th
                  style={{ border: "1px solid #ccc", padding: "8px", cursor: "pointer" }}
                  onClick={() => handleSort("domain")}
                >
                  Domain {sortField === "domain" ? (sortOrder === "asc" ? "▲" : "▼") : ""}
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedArticles.map((article, index) => (
                <tr key={index}>
                  <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                    {article.title}
                  </td>
                  <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                    {article.word_count}
                  </td>
                  <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                    {article.avg_sentence_length
                      ? article.avg_sentence_length.toFixed(2)
                      : "N/A"}
                  </td>
                  <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                    {article.reading_level !== null ? article.reading_level : "N/A"}
                  </td>
                  <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                    {Array.isArray(article.top_keywords)
                      ? article.top_keywords.join(", ")
                      : ""}
                  </td>
                  <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                    {article.domain}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination Controls */}
          <div style={{ marginTop: "1rem", textAlign: "center" }}>
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              style={{ marginRight: "1rem" }}
            >
              Previous
            </button>
            <span>
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              style={{ marginLeft: "1rem" }}
            >
              Next
            </button>
          </div>


          {/* Bar Chart: Word Count Distribution */}
          <h3>Word Count Distribution - Hover over to select </h3>
          <BarChart width={700} height={400} data={articles.slice(0, 25)}>
            <CartesianGrid strokeDasharray="3 3" />
            {/* Here we hide the x-axis label if titles are too long */}
            <XAxis dataKey="title" tick={{ fontSize: 12 }} hide />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="word_count" fill="#8884d8" name="Word Count" />
          </BarChart>

          <h3>Reading Level Distribution - Hover over to select </h3>
          <BarChart width={700} height={400} data={articles.slice(0, 25)}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="title" tick={{ fontSize: 12 }} hide />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="reading_level" fill="#ffbf00" name="Reading Level" />
          </BarChart>

          {/* New Section: Advertisement Metrics */}
          <h3>Advertisements by Domain - Hover over to select </h3>
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
        </>
      ) : (
        <p className="text-muted text-center">No article analysis data available.</p>
      )}
    </div>
  );
}

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const dataPoint = payload[0].payload;
    return (
      <div
        style={{
          backgroundColor: "#fff",
          border: "1px solid #ccc",
          padding: "10px",
        }}
      >
        <p><strong>Keyword:</strong> {dataPoint.keyword}</p>
        <p><strong>Frequency:</strong> {dataPoint.frequency}</p>
        <p>
          <strong>Avg. Reading Level:</strong>{" "}
          {dataPoint.avgReading.toFixed(2)}
        </p>
      </div>
    );
  }
  return null;
};
// Custom tooltip 
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
// Helper function to get a color based on a string (e.g., the article title)
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
  const scaleFactor = 0.7; // Adjust as needed
  const radius = Math.sqrt(payload.word_count) * scaleFactor;
  const fillColor = getColorForArticle(payload.title);
  return <circle cx={cx} cy={cy} r={radius} fill={fillColor} />;
};

export function VisualizeMetadata() {
  console.log("Mounted VisualizeMetadata");
  const [currentPage, setCurrentPage] = useState(1);
  const [bubblePage, setBubblePage] = useState(1);
  const pageSize = 10;
  const { analysis, metadata, isComplete } = useAnalysis();
  const articles = analysis;

//   useEffect(() => {
//     if(isComplete && !hasFetchedMetadata) {
//       console.log("📡 Fetching article metadata");
//       hasFetchedMetadata = true;
//             axios.get("/api/metadata").then((res) => {
//         setMetadata(res.data);
//         console.log("visualizing metadata");
//       });
//     // Fetch data from article_analysis endpoint
//     const fetchData = async () => {
//       try {
//         const response = await fetch("http://127.0.0.1:8000/api/article_analysis");
//         if (!response.ok) {
//           throw new Error("Failed to fetch metadata");
//         }
//         const data = await response.json();
//         setArticles(data);
//       } catch (error) {
//         console.error("Error fetching metadata:", error);
//         setArticles([]); // Clear articles on error
//       }
//     };

//     fetchData();

//     // Add event listener for storage changes
//     const handleStorageChange = (e) => {
//       if (e.key === "uploadedParquetFile" && !e.newValue) {
//         setArticles([]); // Clear articles when file is removed
//       }
//     };

//     window.addEventListener("storage", handleStorageChange);

//     // Cleanup
//     return () => {
//       window.removeEventListener("storage", handleStorageChange);
//     };
//   }
// }, [isComplete]);

    // Transform the articles into a format suitable for the bubble plot.
  // Each point will have avg_sentence_length (x), reading_level (y), and word_count (used as bubble size).
  const bubbleData = useMemo(() => {
    return articles
      .filter(
        (article) =>
          article.avg_sentence_length != null &&
          article.reading_level != null &&
          article.word_count != null
      )
      .map((article) => ({
        title: article.title,
        avg_sentence_length: article.avg_sentence_length,
        reading_level: article.reading_level,
        word_count: article.word_count,
        // Optionally, you can adjust the scaling of the bubble size here if needed.
        size: article.word_count,
      }));
  }, [articles]);

  // Paginate bubble data
  const totalBubblePages = Math.ceil(bubbleData.length / pageSize);
  const bubblePaginatedData = useMemo(() => {
    const startIndex = (bubblePage - 1) * pageSize;
    return bubbleData.slice(startIndex, startIndex + pageSize);
  }, [bubbleData, bubblePage, pageSize]);

 

  // Aggregate keyword frequency and calculate average reading level per keyword
  const scatterData = useMemo(() => {
    const keywordStats = {};
    articles.forEach((article) => {
      if (Array.isArray(article.top_keywords)) {
        article.top_keywords.forEach((keyword) => {
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

  // First, map all articles to sentiment data
  const allSentimentData = useMemo(() => {
    return articles.map((article, index) => ({
      // Use a shortened title or index as identifier
      title: article.title ? article.title.slice(0, 30) + "..." : `Article ${index + 1}`,
      TitleSentiment: article.sentiment_title_score ? Number(article.sentiment_title_score) : 0,
      BodySentiment: article.sentiment_body_score ? Number(article.sentiment_body_score) : 0,
    }));
  }, [articles]);

  // Calculate pagination details
  const totalPages = Math.ceil(allSentimentData.length / pageSize);
  const paginatedSentimentData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return allSentimentData.slice(startIndex, startIndex + pageSize);
  }, [allSentimentData, currentPage, pageSize]);



  // Prepare sentiment data.
  // Here we limit to the first 10 articles (to keep the x-axis readable).
  // If an article doesn't have a sentiment score, we default to 0.
  const sentimentData = useMemo(() => {
    return articles.slice(0, 10).map((article, index) => ({
      // You could also use a shortened title here if desired.
      title: article.title || `Article ${index + 1}`,
      TitleSentiment: article.sentiment_title_score
        ? Number(article.sentiment_title_score)
        : 0,
      BodySentiment: article.sentiment_body_score
        ? Number(article.sentiment_body_score)
        : 0,
    }));
  }, [articles]);


  // Group articles by category (using the first category label) and calculate the average reading level
  const readingData = useMemo(() => {
    const group = {};
    articles.forEach((article) => {
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

  return (
    <div className="main-content">
      <h2>Categories vs. Reading Level - Hover over to select </h2>
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

      <h2>Sentiment Comparison - Hover over to select </h2>
      <p>Comparing sentiment scores for article titles versus bodies.</p>

      {sentimentData.length > 0 ? (
        <>
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
          {/* Pagination Controls */}
          <div style={{ marginTop: "1rem", textAlign: "center" }}>
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              style={{ marginRight: "1rem" }}
            >
              Previous
            </button>
            <span>
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              style={{ marginLeft: "1rem" }}
            >
              Next
            </button>
          </div>
        </>
      ) : (
        <p className="text-muted text-center">No sentiment data available.</p>
      )}
      <h2>Keyword Frequency vs. Reading Level - Hover over to select </h2>
      <p>
        Each data point represents a top keyword from all articles. The x‑axis shows the number of times the keyword appears (its frequency), and the y‑axis shows the average reading level in articles mentioning that keyword (a lower score is harder to read).
      </p>
      {scatterData.length > 0 ? (
        <ResponsiveContainer width="100%" height={400}>
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              type="number"
              dataKey="frequency"
              name="Frequency"
              label={{
                value: "Frequency",
                position: "insideBottomRight",
                offset: 0,
              }}
            />
            <YAxis
              type="number"
              dataKey="avgReading"
              name="Average Reading Level"
              label={{
                value: "Avg. Reading Level",
                angle: -90,
                position: "insideLeft",
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Scatter name="Keywords" data={scatterData.slice(0, 50)} fill="#8884d8" />
          </ScatterChart>
        </ResponsiveContainer>
      ) : (
        <p className="text-muted text-center">No keyword data available.</p>
      )}
         <h2>Reading Metrics Bubble Plot - Hover over to select </h2>
    <p>
      Each bubble represents an article. The x‑axis shows average sentence length, the y‑axis shows reading level, and the bubble size indicates word count.
    </p>
    {bubblePaginatedData.length > 0 ? (
      <>
        <ResponsiveContainer width="100%" height={400}>
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              type="number"
              dataKey="avg_sentence_length"
              name="Avg Sentence Length"
              label={{ value: "Average Sentence Length", position: "insideBottomRight", offset: 0 }}
            />
            <YAxis
              type="number"
              dataKey="reading_level"
              name="Reading Level"
              label={{ value: "Reading Level", angle: -90, position: "insideLeft" }}
            />
            <Tooltip content={<BubbleCustomTooltip />} />
            <Legend />
            <Scatter 
              name="Articles" 
              data={bubblePaginatedData} 
              shape={renderCustomBubble} 
            />
          </ScatterChart>
        </ResponsiveContainer>
        {/* Pagination Controls */}
        <div style={{ marginTop: "1rem", textAlign: "center" }}>
          <button onClick={() => setBubblePage((prev) => Math.max(prev - 1, 1))}
                  disabled={bubblePage  === 1}
                  style={{ marginRight: "1rem" }}>
            Previous
          </button>
          <span>
            Page {bubblePage } of {totalBubblePages}
          </span>
          <button  onClick={() => setBubblePage((prev) => Math.min(prev + 1, totalBubblePages))}
                  disabled={bubblePage  === totalBubblePages}
                  style={{ marginLeft: "1rem" }}>
            Next
          </button>
        </div>
      </>
    ) : (
      <p className="text-muted text-center">
        No article data available for bubble plot.
      </p>
    )}
    </div>
  );
}
