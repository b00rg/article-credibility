import React from "react";
import Sidebar from "./Sidebar"

export default function Dashboard() {
  return (
    <div className="App">
        <Sidebar /> {/* Sidebar Component */}


      {/* Main Content - Dashboard Overview */}
      <div className="main-content">
        <h2>News Analysis Overview</h2>
        <div className="grid-layout">
          {/* Statistics Cards */}
          <div className="card">
            <h3>Articles Analyzed</h3>
            <p>1,250</p>
          </div>
          <div className="card">
            <h3>Avg Credibility Score</h3>
            <p>78%</p>
          </div>
          <div className="card">
            <h3>Fake News Detected</h3>
            <p>320</p>
          </div>
          <div className="card">
            <h3>Sentiment Analysis</h3>
            <p>Positive</p>
          </div>
        </div>
      </div>
    </div>
  );
}
