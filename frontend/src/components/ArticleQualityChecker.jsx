import React, { useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { useAnalysis } from "../context/AnalysisContext";

// Chart colors
const COLORS = ["#5D3FD3", "#E2D8F8"];

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ 
        backgroundColor: 'white', 
        padding: '10px', 
        border: '1px solid #ccc',
        borderRadius: '4px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <p style={{ margin: 0, color: '#2A0A5E' }}>
          {payload[0].name}: {payload[0].value}%
        </p>
      </div>
    );
  }
  return null;
};

const renderColorfulLegendText = (value, entry) => {
  return <span style={{ color: '#2A0A5E', fontSize: '0.9rem' }}>{value}</span>;
};

export default function ArticleQualityChecker({ onAnalysisComplete }) {
  const { setIsComplete } = useAnalysis();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [showAnalyze, setShowAnalyze] = useState(true);
  const [averagePublisherScore, setAveragePublisherScore] = useState(null);

  // Load file & upload state from session storage
  useEffect(() => {
    console.log("📦 useEffect: Checking sessionStorage for uploaded file...");
    const savedFileName = sessionStorage.getItem("uploadedParquetFile");
    const savedSuccessMessage = sessionStorage.getItem("uploadSuccess");

    if (savedFileName) {
      setFile({ name: savedFileName });
    }
    if (savedSuccessMessage === "true") {
      setUploadSuccess(true);
      setIsComplete(true); // ✅ triggers preloading in all components
      onAnalysisComplete?.(); // local state trigger
      console.log("✅ Upload successful — calling setIsComplete + onAnalysisComplete");
    }
  }, []);

  const handleDrop = (acceptedFiles) => {
    setError("");
    if (!acceptedFiles.length) {
      setError("No file selected. Please upload a valid file.");
      return;
    }

    const selectedFile = acceptedFiles[0];
    if (!selectedFile.name.endsWith(".parquet")) {
      setError("Only .parquet files are allowed.");
      return;
    }

    setFile(selectedFile);
    sessionStorage.setItem("uploadedParquetFile", selectedFile.name);
    setUploadSuccess(false);
  };

  const handleAnalyze = async () => {
    if (!file) {
      setError("Please select a .parquet file first.");
      return;
    }

    setLoading(true);
    setError("");
    setShowAnalyze(false);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("http://127.0.0.1:8000/api/upload_parquet", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("File upload failed. Ensure it's a valid .parquet file.");
      }

      setUploadSuccess(true);
      setIsComplete(true); // ✅ triggers preloading in all components
      onAnalysisComplete?.(); // local state trigger
      console.log("✅ Upload successful — calling setIsComplete + onAnalysisComplete");
      sessionStorage.setItem("uploadSuccess", "true"); 
      await new Promise(resolve => setTimeout(resolve, 800));

      // ✅ Fetch average publisher credibility score
      const avgResponse = await fetch("http://127.0.0.1:8000/api/average_publisher_score");
      const avgData = await avgResponse.json();
      setAveragePublisherScore(avgData.average_score);

    } catch (err) {
      setError(err.message);
      setShowAnalyze(true);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFile = async () => {
    try {
      const response = await fetch("http://127.0.0.1:8000/api/delete_parquet", {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete file");
      }

      setFile(null);
      setUploadSuccess(false);
      setAveragePublisherScore(null);
      setShowAnalyze(true);
      sessionStorage.removeItem("uploadedParquetFile");
      sessionStorage.removeItem("uploadSuccess");
    } catch (err) {
      setError("Failed to delete file: " + err.message);
    }
  };

  const publisherRatingData = averagePublisherScore !== null
    ? [
        { name: "Publisher Rating", value: averagePublisherScore },
        { name: "Potential Improvement", value: 100 - averagePublisherScore }
      ]
    : [];

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleDrop,
    multiple: false,
    accept: ".parquet",
  });

  return (
    <div className="aqc-container">
      <h1 className="aqc-heading">Article Quality Checker</h1>
      <p className="aqc-subheading">Upload your Parquet file and analyze its credibility.</p>

      <div
        {...getRootProps()}
        className={`aqc-dropzone ${isDragActive ? "aqc-dropzone-active" : ""}`}
      >
        <input {...getInputProps()} />
        {file ? (
          <div className="aqc-dropzone-file">
            <span className="aqc-file-name">{file.name}</span>
            <button onClick={handleRemoveFile} className="aqc-file-remove">
              ❌ Remove
            </button>
          </div>
        ) : (
          <>
            <div className="aqc-dropzone-icon">📂</div>
            <p className="aqc-dropzone-prompt">
              {isDragActive ? "Drop your file here..." : "Drag & drop a .parquet file, or click to select one"}
            </p>
          </>
        )}
      </div>

      {error && <p className="aqc-error">{error}</p>}

      {(showAnalyze || loading) && (
        <button
          onClick={handleAnalyze}
          disabled={loading || !file}
          className={`aqc-analyze-button ${
            loading || !file ? "aqc-button-disabled" : "aqc-button-primary"
          }`}
        >
          {loading ? (
            <div className="spinner"></div>
          ) : (
            "Analyze File"
          )}
        </button>
      )}

      {uploadSuccess && (
        <>
          <div className="aqc-success-message">
            ✅ Your file <strong>{file.name}</strong> has been successfully uploaded.
            Explore the dashboard to learn new insights!
          </div>

          {/* Publisher Rating Chart */}
          <div className="publisher-rating-container">
            <div className="publisher-rating-chart">
              <h3>Overall Publisher Rating Score</h3>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={publisherRatingData}
                      cx="50%"
                      cy="50%"
                      innerRadius={80}
                      outerRadius={100}
                      fill="#8884d8"
                      paddingAngle={0}
                      dataKey="value"
                      startAngle={90}
                      endAngle={-270}
                    >
                      {publisherRatingData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend 
                      formatter={renderColorfulLegendText}
                      iconType="circle"
                      layout="horizontal"
                      verticalAlign="bottom"
                      align="center"
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="chart-center-text">
                  {averagePublisherScore !== null ? `${averagePublisherScore}%` : "--"}
                </div>
              </div>
              <p className="confidence-text">
                The average Credibility Score of every Publisher in the file.
              </p>
              <div className="probability-breakdown">
                <h4>Rating Breakdown</h4>
                <div className="probability-item">
                  <span>{averagePublisherScore ?? "--"}% Publisher Rating</span>
                </div>
                <div className="probability-item">
                  <span>{averagePublisherScore !== null ? 100 - averagePublisherScore : "--"}% Potential Improvement</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
