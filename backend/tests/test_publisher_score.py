import pytest
import pandas as pd
from backend.app.scripts.publisher_score import compute_credibility, clean_text, extract_domain

# Test the clean_text function
def test_clean_text():
    html_text = "<p>This is a <b>test</b> article with <a href='http://example.com'>HTML</a> tags.</p>"
    clean_result = clean_text(html_text)
    assert "<p>" not in clean_result
    assert "<b>" not in clean_result
    assert "<a" not in clean_result
    assert "This is a test article with HTML tags." in clean_result

# Test the extract_domain function
def test_extract_domain():
    url = "https://www.example.com/article/123"
    domain = extract_domain(url)
    assert domain == "example.com"
    
    # Test with None value
    assert extract_domain(None) == "Unknown"

# Test the compute_credibility function
def test_compute_credibility():
    # Create a test DataFrame
    test_data = {
        "title": ["Normal Title", "Clickbait Title"],
        "body": ["This is a test article.", "This is another test article."],
        "url": ["https://example.com/article1", "https://test.com/article2"]
    }
    df = pd.DataFrame(test_data)
    
    # Mock the predict_clickbait function
    def mock_predict_clickbait(text, model):
        if "Clickbait" in text:
            return {"label": "clickbait", "confidence": 0.9}
        else:
            return {"label": "not_clickbait", "confidence": 0.2}
    
    # Apply the mock
    import backend.app.scripts.publisher_score as ps
    ps.predict_clickbait = mock_predict_clickbait
    
    # Compute credibility
    result = compute_credibility(df, None)
    
    # Check the results
    assert len(result) == 2
    assert "credibility_score" in result.columns
    
    # The clickbait title should have a lower credibility score
    clickbait_score = result[result["title"] == "Clickbait Title"]["credibility_score"].iloc[0]
    normal_score = result[result["title"] == "Normal Title"]["credibility_score"].iloc[0]
    assert clickbait_score < normal_score 