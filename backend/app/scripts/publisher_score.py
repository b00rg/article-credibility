import pandas as pd
import fasttext
from bs4 import BeautifulSoup
import tldextract
from pathlib import Path
from io import StringIO


# Load FastText Model
def load_model(model_path):
    try:
        model = fasttext.load_model(str(model_path))
        print(f"✅ FastText model loaded from {model_path}")
        return model
    except Exception as e:
        print(f"🚨 Error loading FastText model: {e}")
        return None

# Function to clean article text
def clean_text(html_text):
    return BeautifulSoup(html_text, 'html.parser').get_text() if pd.notnull(html_text) else ""

# Function to extract domain from URL
def extract_domain(url):
    return f"{tldextract.extract(url).domain}.{tldextract.extract(url).suffix}" if pd.notnull(url) else "Unknown"

# Function to predict clickbait
def predict_clickbait(text, model):
    if model is None:
        return {"error": "Model not loaded"}
    label, confidence = model.predict(text)
    return {"label": label[0].replace("__label__", ""), "confidence": round(confidence[0], 2)}

# Function to compute credibility score
"""def compute_credibility(df, model):
    df["clean_text"] = df["body"].apply(clean_text)
    df["word_count"] = df["clean_text"].apply(lambda x: len(x.split()))
    df["domain"] = df["url"].apply(extract_domain)
    df["clickbait"] = df["title"].apply(lambda x: predict_clickbait(str(x), model))
    df["clickbait_confidence"] = df["clickbait"].apply(lambda x: x["confidence"] if "confidence" in x else 0)
    df["credibility_score"] = 100 - (df["clickbait_confidence"] * 100)
    return df[["title", "domain", "word_count", "credibility_score"]] """

# Load dataset
def load_parquet(file_path):
    try:
        df = pd.read_parquet(file_path, engine="fastparquet")
        return df
    except Exception as e:
        print(f"🚨 ERROR: Failed to load Parquet file. Exception: {e}")
        return None


# Function to compute general credibility score
def compute_credibility(df, model):
    df["clean_text"] = df["body"].apply(clean_text)
    df["word_count"] = df["clean_text"].apply(lambda x: len(x.split()))
    df["domain"] = df["url"].apply(extract_domain)
    df["clickbait"] = df["title"].apply(lambda x: predict_clickbait(str(x), model))
    df["clickbait_confidence"] = df["clickbait"].apply(lambda x: x["confidence"] if "confidence" in x else 0)

    # Normalize word count for consistency (adjust as needed for your dataset)
    max_word_count = df["word_count"].max()
    df["normalized_word_count"] = df["word_count"] / max_word_count  # Normalize word count to a 0-1 scale

    # Assign credibility based on domain (can be customized)
    trusted_domains = ["bbc.com", "nytimes.com", "reuters.com"]  # Example trusted domains
    df["domain_credibility"] = df["domain"].apply(lambda x: 1 if x in trusted_domains else 0)

    # Calculate the general credibility score by weighing each factor
    clickbait_weight = 0.5
    word_count_weight = 0.3
    domain_weight = 0.2

    # General credibility score: lower clickbait confidence and higher word count/domain credibility increase score
    df["credibility_score"] = (
        (1 - df["clickbait_confidence"]) * clickbait_weight + 
        df["normalized_word_count"] * word_count_weight + 
        df["domain_credibility"] * domain_weight
    ) * 100  # Scale to 0-100

    return df[["title", "domain", "word_count", "credibility_score"]]


def compute_credibility_from_csv(file, model):
    # Read CSV file
    df = pd.read_csv(file)
    
    # Ensure required columns exist
    if "publisher" not in df.columns or "body of text" not in df.columns:
        raise ValueError("CSV file must contain 'publisher' and 'body of text' columns.")
    
    df["clean_text"] = df["body of text"].apply(clean_text)
    df["word_count"] = df["clean_text"].apply(lambda x: len(x.split()))
    df["clickbait"] = df["publisher"].apply(lambda x: predict_clickbait(str(x), model))
    df["clickbait_confidence"] = df["clickbait"].apply(lambda x: x["confidence"] if "confidence" in x else 0)

    # Normalize word count
    max_word_count = df["word_count"].max()
    df["normalized_word_count"] = df["word_count"] / max_word_count if max_word_count else 0
    
    # Assign credibility based on publisher (can be customized)
    trusted_publishers = ["BBC", "New York Times", "Reuters"]  # Example trusted publishers
    df["publisher_credibility"] = df["publisher"].apply(lambda x: 1 if x in trusted_publishers else 0)
    
    # Weigh factors
    clickbait_weight = 0.5
    word_count_weight = 0.3
    publisher_weight = 0.2
    
    # Compute credibility score
    df["credibility_score"] = (
        (1 - df["clickbait_confidence"]) * clickbait_weight +
        df["normalized_word_count"] * word_count_weight +
        df["publisher_credibility"] * publisher_weight
    ) * 100  # Scale to 0-100

    return df[["publisher", "word_count", "credibility_score"]]

# Example Usage
if __name__ == "__main__":
    MODEL_PATH = Path("app/models/clickbait_model.bin")
    DATA_PATH = Path("datasets/input/sample_data.parquet")
    
    model = load_model(MODEL_PATH)
    df = load_parquet(DATA_PATH)
    
    if df is not None:
        result_df = compute_credibility(df, model)
        print(result_df.head())
