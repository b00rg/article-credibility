import React, { useState, useRef, useEffect } from "react";
import { Doughnut, Bar, Line, Bubble } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend, BarElement, CategoryScale, LinearScale, LineElement, PointElement } from "chart.js";
import "./LlamaAnalysis.css";

ChartJS.register(ArcElement, Tooltip, Legend, BarElement, CategoryScale, LinearScale, LineElement, PointElement);

const ArticleAnalysis = () => {
  const [text, setText] = useState("");
  const [label, setLabel] = useState("--");
  const [score, setScore] = useState(null);
  const [confidenceMessage, setConfidenceMessage] = useState("");
  const [confidencePublisherMessage, setConfidencePublisherMessage] = useState("");
  const [probabilities1, setProbabilities1] = useState([50, 50]);
  const [publisherCredibility, setPublisherCredibility] = useState([50, 50]);
  const [publisher, setPublisher] = useState("");
  const [publisherScore, setPublisherScore] = useState(null);
  const [publisherData, setPublisherData] = useState({ labels: [], scores: [] });
  const [publisherStats, setPublisherStats] = useState({});
  const [publisherTrends, setPublisherTrends] = useState({});
  const [publisherArticleCountsData, setPublisherArticleCountsData] = useState({ labels: [], datasets: [] });
  const [sortOrder, setSortOrder] = useState('asc');
  const [sortedPublisherStats, setSortedPublisherStats] = useState([]);
  const fileInputRef = useRef();
  const [showModal, setShowModal] = useState(false);
  const [selectedPublisher, setSelectedPublisher] = useState(null);
  const [publisherScores, setPublisherScores] = useState({});

  useEffect(() => {
    updatePublisherGraph();
  }, []);
  const colors = [ // colours for line chart - feel free to change as needed
    "#4c00b0", 
    "#b100cd", 
    "#e8bcf0", 
    "#797EF6",
    "#1AA7EC",
    "#36454F",
    "#928E85",
    "#A9A9A9"
  ];
  

  // To store and retrieve publisher credibility scores
  const getPublisherScores = () => {
    try {
      const data = JSON.parse(localStorage.getItem("publisherScores"));
      return data || {};
    } catch (error) {
      return {};
    }
  };


  const PublisherDataButtons = ({ updatePublisherGraph, getPublisherScores }) => {
    const [showClearModal, setShowClearModal] = useState(false); // Modal visibility
    const [publisherScores, setPublisherScores] = useState({}); // Publisher scores state
  
    const handleClearDataClick = () => {
      setShowClearModal(true); // Show the confirmation modal
    };
  
  const handleConfirmClear = () => {
    localStorage.removeItem("publisherScores"); // Clear data from localStorage
    setPublisherScores({}); // Reset the local publisherScores state
    updatePublisherGraph(); // Update the graph after clearing
    setShowClearModal(false); // Close the modal
    alert("Publisher data cleared.");
  };
  
    const handleCancelClear = () => {
      setShowClearModal(false); // Close the modal without clearing data
    };
  
    const handleDownloadData = () => { 
      const publisherScores = getPublisherScores();
      const jsonData = JSON.stringify(publisherScores, null, 2);
  
      const blob = new Blob([jsonData], { type: "application/json" });
      const url = URL.createObjectURL(blob);
  
      const link = document.createElement("a");
      link.href = url;
      link.download = "publisher_data.json";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
  
      alert("Publisher data downloaded.");
    };
  
    const handleUploadData = (event) => {
      const file = event.target.files[0];
      if (file && file.type === "application/json") {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = JSON.parse(e.target.result);
            localStorage.setItem("publisherScores", JSON.stringify(data));
            updatePublisherGraph();
            alert("Publisher data uploaded successfully.");
          } catch (error) {
            alert("Invalid JSON file.");
          }
        };
        reader.readAsText(file);
      } else {
        alert("Please upload a valid JSON file.");
      }
    };
    return (
      <div className="button-container">
        <button className="file-button-llama" onClick={handleClearDataClick}>
          Clear Data
        </button>
        
        {/* Clear Data Confirmation Modal */}
        {showClearModal && (
  <div
    className="modal-overlay"
    onClick={(e) => {
      if (e.target === e.currentTarget) {
        handleCancelClear();
      }
    }}
  >
    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
      <div className="modal-header-llama">
        <h2>Are you sure?</h2>
        <button className="close-btn" onClick={handleCancelClear}>
          X
        </button>
      </div>
      <div className="modal-body">
        <p>
          Are you sure you want to clear publisher scores? All unsaved
          data will be lost.
        </p>
      </div>
      <div className="modal-footer-llama">
        <button className="button-yes" onClick={handleConfirmClear}>
          Yes
        </button>
        <button className="button-no" onClick={handleCancelClear}>
          No
        </button>
      </div>
    </div>
  </div>
)}
  
        <button className="file-button-llama" onClick={handleDownloadData}>
          Download Data
        </button>
        
        <input
          type="file"
          accept=".json"
          id="upload-json"
          style={{ display: "none" }}
          onChange={handleUploadData}
        />
        <label htmlFor="upload-json" className="file-button-llama">
          Upload Data
        </label>
      </div>
    );
  };
  

  
  const savePublisherScores = (publisher, score) => {
    const publisherScores = getPublisherScores();
    if (!publisherScores[publisher]) {
      publisherScores[publisher] = [];
    }
    publisherScores[publisher].push(score);
    localStorage.setItem("publisherScores", JSON.stringify(publisherScores));
  };

  const updatePublisherGraph = () => {
    const publisherScores = getPublisherScores();
    let publisherAverages = [];
    let publisherTrendData = {};
    let publisherStats = {};
    const publisherArticleCounts = getPublisherArticleCounts();
    const bubbleChartData = [];

    let colorIndex = 0;
    for (const pub in publisherScores) {
      const scores = publisherScores[pub];
      
      // Ensure scores is an array before applying reduce
      if (Array.isArray(scores) && scores.length > 0) {
        const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
        const minScore = Math.min(...scores);
        const maxScore = Math.max(...scores);
        const stdDev = Math.sqrt(scores.reduce((a, b) => a + Math.pow(b - avgScore, 2), 0) / scores.length);
        publisherAverages.push({ name: pub, score: avgScore });
        publisherTrendData[pub] = scores;
        publisherStats[pub] = { avgScore, minScore, maxScore, stdDev };
        bubbleChartData.push({
          x: avgScore,
          y: publisherArticleCounts[pub],
          r: Math.sqrt(publisherArticleCounts[pub]) * 5, // Adjust multiplier for bubble size
          label: pub,
        });
      } else {
        console.warn(`Publisher ${pub} has invalid or empty scores:`, scores);
      }
    }
    

    publisherAverages.sort((a, b) => b.score - a.score);
    const topPublishers = publisherAverages.slice(0, 20);

    setPublisherData({
      labels: topPublishers.map((p) => p.name),
      scores: topPublishers.map((p) => Math.round(p.score)),
    });
    setPublisherStats(publisherStats);
    setPublisherTrends(publisherTrendData);
    setPublisherArticleCountsData({
      datasets: [
        {
          label: 'Publisher Article Count vs. Credibility',
          data: bubbleChartData,
          backgroundColor: '#5D3FD3',
          hoverBackgroundColor: '#7851e3',
        },
      ],

    });
  };

  useEffect(() => {
    updatePublisherGraph();
  }, []);

  const handleSort = () => {
    const sortedStats = [...Object.entries(publisherStats)].sort((a, b) => {
      const avgScoreA = a[1].avgScore;
      const avgScoreB = b[1].avgScore;
      
      // Ascending or descending based on sortOrder
      if (sortOrder === 'asc') {
        return avgScoreA - avgScoreB;
      } else {
        return avgScoreB - avgScoreA;
      }
    });
  
    setSortedPublisherStats(sortedStats);
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); // toggle the sort order
  };
  

  const handleAnalyze = async () => {
    if (!text.trim()) {
      alert("Please enter the article text.");
      return;
    }
    if (!publisher.trim()) {
      alert("Please enter the publisher.");
      return;
    }

    try {
      const response = await fetch("http://localhost:8000/api/classify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      const data = await response.json();
      if (data.error) {
        alert(data.error);
        return;
      }

      const { label, probabilities } = data;
      const credible = probabilities[0][1] * 100;
      const uncredible = probabilities[0][0] * 100;

      setLabel(label);
      setScore(Math.round(credible));

      // Separate data for each chart
      setProbabilities1([Math.round(uncredible), Math.round(credible)]);  // First chart

      // Confidence text for article
      let message =
        credible >= 80
          ? "We are highly confident this text is credible."
          : credible >= 60
          ? "This text has a moderate credibility score."
          : credible >= 40
          ? "This text's credibility score is uncertain."
          : "We are highly confident this text is unreliable.";

      setConfidenceMessage(message);

      // Confidence text for publisher
      let publisher_rating =
        credible >= 90
          ? "We are highly confident this publisher is credible."
          : credible >= 70
          ? "This publisher has a moderate credibility score."
          : credible >= 60
          ? "This publisher's credibility is uncertain."
          : "We are highly confident this publisher's credibility is unreliable.";

      setConfidencePublisherMessage(publisher_rating);

      // Save publisher score to the local storage file
      savePublisherScores(publisher, credible);

      // Calculate average score for the publisher
      const publisherScores = getPublisherScores();
      const publisherCredibilityScores = publisherScores[publisher] || [];
      const averageScore =
        publisherCredibilityScores.reduce((acc, score) => acc + score, 0) /
        publisherCredibilityScores.length;

      setPublisherScore(Math.round(averageScore));  // Update the publisher score state

      // Update publisher credibility chart
      const publisherCredibilityData = [
        Math.round(100 - averageScore), // Uncredible Source
        Math.round(averageScore),       // Credible Source
      ];

      setPublisherCredibility(publisherCredibilityData);

      updatePublisherGraph();

    } catch (err) {
      console.error(err);
      alert("Something went wrong during analysis.");
    }
  };
  
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.type === "text/plain") {
      const reader = new FileReader();
      reader.onload = (e) => setText(e.target.result);
      reader.readAsText(file);
    }
  };

  const handleRowClick = (publisher) => {
    const scores = getPublisherScores() 
    setSelectedPublisher(publisher);
    setPublisherScores(scores);
    setShowModal(true);
  };

  

  const getPublisherArticleCounts = () => {
    const publisherScores = getPublisherScores();
    const publisherArticleCounts = {};
    for (const pub in publisherScores) {
      publisherArticleCounts[pub] = publisherScores[pub].length;
    }
    return publisherArticleCounts;
  };

  return (
    <div className="container" style={{ backgroundColor: 'white' }}>
      <div className="left-side">
        <div className="input-container">
          <textarea
            className="text-area"
            placeholder="Paste the article text here..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <div className="file-drop" onClick={() => fileInputRef.current.click()}>
            Drop a text file here or click to upload
          </div>
          <input
            type="file"
            accept=".txt"
            style={{ display: "none" }}
            ref={fileInputRef}
            onChange={handleFileUpload}
          />
          <input
            type="text"
            placeholder="Enter publisher name"
            value={publisher}
            onChange={(e) => setPublisher(e.target.value)}
            className="publisher-input"
          />
          <button className="analyze-btn" onClick={handleAnalyze}>
            Analyze
          </button>
          <div className="input-container">
          {/* Other inputs like textarea, file upload */}
          <PublisherDataButtons 
            updatePublisherGraph={updatePublisherGraph} 
            getPublisherScores={getPublisherScores} 
          />
        </div>
        </div>

        <div className="score-explanation">
          <h3>Key Factors</h3>
          <p>Article score based on bias, exaggeration, style, readability, and grammar.</p>
          <p>Publisher score based on an average of the publisher's article's publication history.</p>
        </div>
        {/* Bar chart for top publisher credibility scores */}
        <div className="chart-bottom">
          <div className="top-publishers">Top Publisher Credibility Scores</div>
          <div className="chart-container">
            <Bar
              data={{
                labels: publisherData.labels,
                datasets: [{
                  label: "Credibility Score (%)",
                  data: publisherData.scores,
                  backgroundColor: "#5D3FD3"
                }]
              }}
              options={{
                responsive: true,
                scales: { y: { beginAtZero: true, max: 100 } }
              }}
            />
          </div>
        </div>
        <div className="chart-bottom">
        <div className="top-publishers">Publisher Article Count</div>
        <div className="chart-container">
        <Bubble
        data={{
          ...publisherArticleCountsData, 
          datasets: publisherArticleCountsData.datasets.map(dataset => {
            const maxRadius = Math.max(...dataset.data.map(d => d.r));
            const maxSize = 15;

            return {
              ...dataset,
              data: dataset.data.map(d => ({
                ...d,
                r: (d.r / maxRadius) * maxSize,
              })),
            };
          }),
        }}
        options={{
          responsive: true,
          scales: {
            x: {
              title: { display: true, text: 'Average Credibility Score (%)' },
              beginAtZero: true,
              max: publisherArticleCountsData.datasets?.[0]?.data?.length
                ? Math.max(...publisherArticleCountsData.datasets[0].data.map(d => d.x)) * 1.2
                : 10, // Default to 10 if data is empty
            },
            y: {
              title: { display: true, text: 'Number of Articles Checked' },
              beginAtZero: true,
              ticks: { stepSize: 1 },
              max: publisherArticleCountsData.datasets?.[0]?.data?.length
                ? Math.max(...publisherArticleCountsData.datasets[0].data.map(d => d.y)) * 1.2
                : 10, // Default to 10 if data is empty
            },
          },
          plugins: {
            tooltip: {
              callbacks: {
                label: (context) => {
                  const dataPoint = context.raw;
                  return `${dataPoint.label}: Avg Score: ${dataPoint.x.toFixed(2)}%, Articles: ${dataPoint.y}`;
                },
              },
            },
          },
        }}
      />


        </div>
      </div>
                  {/* Publisher Credibility Trends */}
                  <div className="chart-container">
        <div className="top-publishers">Publisher Credibility Trends</div>
        <Line
          data={{
            labels: Array.from({ length: 10 }, (_, i) => `T-${10 - i}`),
            datasets: Object.keys(publisherTrends).map((pub, index) => ({
              label: pub,
              data: publisherTrends[pub].slice(-10),
              borderColor: colors[index % colors.length],
              fill: false,
            })),
          }}
          options={{ responsive: true, scales: { y: { beginAtZero: true, max: 100 } } }}
        />
      </div>
      </div>

      <div className="right-side">
        <div className="score-label">
          {score !== null ? `Article Credibility Score: ${score}%` : "Not Analyzed"}
        </div>

        {/* First Doughnut Chart */}
        <div className="chart-container">
          
          <Doughnut
            data={{
              labels: ["Uncredible News", "Credible News"],
              datasets: [
                {
                  data: probabilities1,
                  backgroundColor: ["#b9a3f1", "#5D3FD3"],
                  hoverOffset: 4,
                },
              ],
            }}
            options={{
              cutout: "70%",
              plugins: {
                legend: {
                  position: "top",
                  align: "center",
                  labels: {
                    boxWidth: 20,
                    padding: 15,
                  },
                },
              },
            }}
          />
          <div className="chart-label">{label}</div>
        </div>

        <div className="confidence-message">{confidenceMessage}</div>
        <div className="probability-breakdown">
          <h3>Probability Breakdown</h3>
          <p><strong>{probabilities1[0]}%</strong> Uncredible News</p>
          <p><strong>{probabilities1[1]}%</strong> Credible News</p>
        </div>


        {/* Second Doughnut Chart for Publisher Credibility */}
        <div className="publisher-label">
          {publisherScore !== null && (
            <div className="score-label">
              {score !== null ? `Publisher's Average Credibility Score: ${publisherScore}%` : "Not Analyzed"}
            </div>
          )}

          <div className="chart-container">
            <Doughnut
              data={{
                labels: ["Uncredible Source", "Credible Source"],
                datasets: [
                  {
                    data: publisherCredibility,
                    backgroundColor: ["#b9a3f1", "#5D3FD3"],
                    hoverOffset: 4,
                  },
                ],
              }}
              options={{
                cutout: "70%",
                plugins: {
                  legend: {
                    position: "top",
                    align: "center",
                    labels: {
                      boxWidth: 20,
                      padding: 15,
                    },
                  },
                },
              }}
            />
            <div className="chart-label">{label}</div>
          </div>

          <div className="confidence-publisher-message">{confidencePublisherMessage}</div>

          <div className="probability-breakdown">
            <h3>Probability Breakdown</h3>
            <p><strong>{publisherCredibility[0]}%</strong> Uncredible Source</p>
            <p><strong>{publisherCredibility[1]}%</strong> Credible Source</p>
          </div>


      {/* Publisher Statistics Table */}
      <div className="stats-container">
      <div className="button-container">
        <div className="score-label">Publisher Statistics</div>
        <button onClick={handleSort}>{sortOrder === 'asc' ? '↑' : '↓'}</button></div>
        <table className="stats-table">
          <thead>
            <tr>
              <th>Publisher</th>
              <th>
                Avg Score 
              </th>
              <th>Min Score</th>
              <th>Max Score</th>
              <th>Std Dev</th>
            </tr>
          </thead>
          <tbody>
            {sortedPublisherStats.map(([pub, stats]) => (
              <tr key={pub} onClick={() => handleRowClick(pub)} style={{ cursor: "pointer" }}>
                <td>{pub}</td>
                <td>{stats.avgScore.toFixed(2)}%</td>
                <td>{stats.minScore.toFixed(2)}%</td>
                <td>{stats.maxScore.toFixed(2)}%</td>
                <td>{stats.stdDev.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
     
      {showModal && (
  <div className="modal-overlay" onClick={() => setShowModal(false)}>
    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
      <div className="modal-header-llama">
        <h2>Scores for {selectedPublisher}</h2>
        <button className="close-btn" onClick={() => setShowModal(false)}>
          X
        </button>
      </div>

      {/* Doughnut chart for publisher credibility */}
      <div className="chart-container">
        {publisherScores[selectedPublisher]?.length > 0 && (
          <Doughnut
            data={{
              labels: ["Uncredible Source", "Credible Source"],
              datasets: [
                {
                  data: [
                    100 - Math.round(publisherScores[selectedPublisher].reduce((a, b) => a + b, 0) / publisherScores[selectedPublisher].length),
                    Math.round(publisherScores[selectedPublisher].reduce((a, b) => a + b, 0) / publisherScores[selectedPublisher].length)
                  ],
                  backgroundColor: ["#b9a3f1", "#5D3FD3"],
                  hoverOffset: 4,
                },
              ],
            }}
            options={{
              cutout: "70%",
              plugins: {
                legend: {
                  position: "top",
                  align: "center",
                  labels: {
                    boxWidth: 20,
                    padding: 15,
                  },
                },
              },
            }}
          />
        )}
      </div>

      {/* Publisher Confidence Message */}
      <div className="confidence-publisher-message">
        {publisherScores[selectedPublisher] && publisherScores[selectedPublisher].length > 0 ? (
          <>
            {Math.round(publisherScores[selectedPublisher].reduce((a, b) => a + b, 0) / publisherScores[selectedPublisher].length) >= 90
              ? "We are highly confident this publisher's credibility is reliable."
              : Math.round(publisherScores[selectedPublisher].reduce((a, b) => a + b, 0) / publisherScores[selectedPublisher].length) >= 70
              ? "This publisher has a moderate credibility score."
              : Math.round(publisherScores[selectedPublisher].reduce((a, b) => a + b, 0) / publisherScores[selectedPublisher].length) >= 60
              ? "This publisher's credibility is uncertain."
              : "We are highly confident this publisher's credibility is unreliable."}
          </>
        ) : (
          <p>No confidence message available.</p>
        )}
      </div>

      {/* Probability Breakdown for Publisher */}
      <div className="probability-breakdown">
        <h3>Publisher Probability Breakdown</h3>
        {/* Calculate the average credibility score for the selected publisher */}
        {publisherScores[selectedPublisher] && publisherScores[selectedPublisher].length > 0 ? (
          <>
            <p><strong>{Math.round(100 - Math.round(publisherScores[selectedPublisher].reduce((a, b) => a + b, 0) / publisherScores[selectedPublisher].length))}%</strong> Uncredible Source</p>
            <p><strong>{Math.round(Math.round(publisherScores[selectedPublisher].reduce((a, b) => a + b, 0) / publisherScores[selectedPublisher].length))}%</strong> Credible Source</p>
          </>
        ) : (
          <p>No data available for this publisher.</p>
        )}
      </div>
      <br></br>

      {/* Publisher Score Trend Line */}
      <div className="publisher-trend-container">
        <Line
          data={{
            labels: publisherTrends[selectedPublisher]?.map((_, index) => `T-${index + 1}`) || [],
            datasets: [
              {
                label: `${selectedPublisher} Score`,
                data: publisherTrends[selectedPublisher] || [],
                borderColor: "#5D3FD3",  // Line color
                fill: false,
                tension: 0.1,
              },
            ],
          }}
          options={{
            responsive: true,
            scales: {
              x: {
                title: { display: true, text: 'Time' },
                beginAtZero: true,
              },
              y: {
                title: { display: true, text: 'Credibility Score (%)' },
                beginAtZero: true,
                max: 100,
              },
            },
          }}
        />
      </div>
      <h3>Publisher Score Trend Over Time</h3>

    </div>
  </div>
)}


    </div>

        </div>
        
      </div>
    
  );
};export default ArticleAnalysis;
