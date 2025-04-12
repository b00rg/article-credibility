import pytest
from fastapi.testclient import TestClient
from backend.main import app
import pandas as pd
import os
from pathlib import Path

# Create a test client
client = TestClient(app)

# Mock data for testing
MOCK_PARQUET_DATA = pd.DataFrame({
    "title": ["Test Article 1", "Test Article 2"],
    "body": ["This is a test article body.", "Another test article body."],
    "source_name": ["test.com", "example.com"],
    "links_permalink": ["https://test.com/article1", "https://example.com/article2"]
})

# Create a temporary parquet file for testing
@pytest.fixture
def mock_parquet_file(tmp_path):
    # Create a temporary parquet file
    parquet_path = tmp_path / "test_data.parquet"
    MOCK_PARQUET_DATA.to_parquet(parquet_path)
    return parquet_path

# Test the /analyze/ endpoint
def test_analyze_endpoint():
    response = client.post(
        "/analyze/",
        json={"text": "This is a test article for analysis."}
    )
    assert response.status_code == 200
    assert "processed_text" in response.json()

# Test the /api/data endpoint
def test_get_data_endpoint(mock_parquet_file, monkeypatch):
    # Mock the load_parquet function to return our test data
    def mock_load_parquet():
        return MOCK_PARQUET_DATA
    
    # Apply the mock
    from backend.api import load_parquet
    monkeypatch.setattr("backend.api.load_parquet", mock_load_parquet)
    
    response = client.get("/api/data")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    assert data[0]["title"] == "Test Article 1"

# Test the /api/predict_clickbait endpoint
def test_predict_clickbait_endpoint(monkeypatch):
    # Mock the predict_clickbait function
    def mock_predict_clickbait(text):
        return {"label": "not_clickbait", "confidence": 0.8}
    
    # Apply the mock
    from backend.api import predict_clickbait
    monkeypatch.setattr("backend.api.predict_clickbait", mock_predict_clickbait)
    
    response = client.get("/api/predict_clickbait?text=This is a normal article title")
    assert response.status_code == 200
    result = response.json()
    assert result["label"] == "not_clickbait"
    assert result["confidence"] == 0.8

# Test the /api/publisher_scores endpoint
def test_publisher_scores_endpoint(mock_parquet_file, monkeypatch):
    # Mock the load_parquet function
    def mock_load_parquet():
        return MOCK_PARQUET_DATA
    
    # Apply the mock
    from backend.api import load_parquet
    monkeypatch.setattr("backend.api.load_parquet", mock_load_parquet)
    
    # Mock the predict_clickbait function
    def mock_predict_clickbait(text):
        return {"label": "not_clickbait", "confidence": 0.8}
    
    # Apply the mock
    from backend.api import predict_clickbait
    monkeypatch.setattr("backend.api.predict_clickbait", mock_predict_clickbait)
    
    response = client.get("/api/publisher_scores")
    assert response.status_code == 200
    data = response.json()
    assert len(data) > 0
    assert "publisher" in data[0]
    assert "credibility_score" in data[0]
