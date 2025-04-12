import React, { useState } from "react";
import { NavLink } from "react-router-dom";

export default function Sidebar() {
  const [isInsightsOpen, setIsInsightsOpen] = useState(false); // State to handle dropdown toggle

  const toggleInsights = () => setIsInsightsOpen(!isInsightsOpen); // Function to toggle Insights dropdown

  return (
    <div className="sidebar">
      <h1>Dashboard</h1> {/* Keep this as the title */}
      <nav>
        <ul>
          <li>
            <NavLink to="/article-analysis" activeClassName="active-link">
              Article Analysis
            </NavLink>
          </li>

          {/* Dropdown for Insights */}
          <li>
            <div className={`dropdown ${isInsightsOpen ? "open" : ""}`} onClick={toggleInsights}>
              Insights
              {isInsightsOpen && (
                <ul className="dropdown-menu">
                  <li>
                    <NavLink to="/trends" activeClassName="active-link">
                      Trends & Statistics
                    </NavLink>
                  </li>
                  <li>
                    <NavLink to="/publisher-insights" activeClassName="active-link">
                      Publisher Insights
                    </NavLink>
                  </li>
                  <li>
                    <NavLink to="/flagged-articles" activeClassName="active-link">
                      Flagged Articles
                    </NavLink>
                  </li>
                </ul>
              )}
            </div>
          </li>

          {/* Other sidebar links */}
          <li>
            <NavLink to="/llama-analysis" activeClassName="active-link">
              Llama Analysis
            </NavLink>
          </li>
          <li>
            <NavLink to="/faqs" activeClassName="active-link">
              FAQs
            </NavLink>
          </li>
          <li>
            <NavLink to="/parquet-viewer" 
              className={({ isActive }) => (isActive ? "active-link" : "")}>
              Parquet Viewer
            </NavLink>
          </li>
        </ul>
      </nav>
    </div>
  );
}

