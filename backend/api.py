from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.responses import JSONResponse, HTMLResponse
import pandas as pd
from pathlib import Path
import fasttext
import shutil
import os
from bs4 import BeautifulSoup
import tldextract
import nltk
from nltk.corpus import stopwords
import textstat
import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification
from peft import PeftModel

from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from urllib.parse import urlparse


app = FastAPI()

# Paths
BASE_DIR = Path(__file__).resolve().parent
DATASETS_DIR = BASE_DIR.parent / "datasets"
UPLOADS_DIR = DATASETS_DIR / "uploads"  # Directory for user-uploaded Parquet files
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)  # Ensure uploads directory exists

DEFAULT_PARQUET_PATH = DATASETS_DIR / "input/sample_data.parquet"
MODEL_PATH = BASE_DIR / "app/models/clickbait_model.bin"

print(f"Looking for Parquet file at: {DEFAULT_PARQUET_PATH}")

# Load FastText Model
try:
    clickbait_model = fasttext.load_model(str(MODEL_PATH))
    print(f"✅ FastText model loaded from {MODEL_PATH}")
except Exception as e:
    clickbait_model = None
    print(f"🚨 Error loading FastText model: {e}")


# Function to get the latest uploaded Parquet file
def get_latest_parquet():
    uploaded_files = list(UPLOADS_DIR.glob("*.parquet"))
    if uploaded_files:
        latest_file = max(uploaded_files, key=lambda f: f.stat().st_mtime)  # Get the most recent file
        print(f"📂 Using uploaded Parquet file: {latest_file}")
        return latest_file
    else:
        print(f"📂 Using default Parquet file: {DEFAULT_PARQUET_PATH}")
        return DEFAULT_PARQUET_PATH


# Function to load the most recent Parquet file
def load_parquet():
    file_path = get_latest_parquet()
    
    if not file_path.exists():
        print(f"🚨 ERROR: Parquet file not found at {file_path}")
        return None  

    try:
        print(f"🔄 Loading Parquet file from {file_path}")
        df = pd.read_parquet(file_path, engine="fastparquet")

        if df.empty:
            print("⚠️ WARNING: Parquet file is empty!")
        else:
            print(f"✅ Parquet file loaded successfully: {df.shape[0]} rows, {df.shape[1]} columns")

        return df
    except Exception as e:
        print(f"🚨 ERROR: Failed to load Parquet file. Exception: {e}")
        return None


# API Endpoint: Upload a new Parquet file
@app.post("/upload_parquet")
async def upload_parquet(file: UploadFile = File(...)):
    if not file.filename.endswith(".parquet"):
        raise HTTPException(status_code=400, detail="Only .parquet files are allowed.")

    file_location = UPLOADS_DIR / file.filename

    try:
        with file_location.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        print(f"✅ File uploaded successfully: {file.filename}")
        return {"message": "File uploaded successfully", "filename": file.filename}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")

@app.get("/data")
def get_data():
    df = load_parquet()
    
    if df is None:
        raise HTTPException(status_code=500, detail="Parquet file not loaded")

    return JSONResponse(content=df.to_dict(orient="records"))

# Clickbait prediction function
def predict_clickbait(text):
    if clickbait_model is None:
        return {"error": "Model not loaded"}

    label, confidence = clickbait_model.predict(text)
    return {"label": label[0].replace("__label__", ""), "confidence": round(confidence[0], 2)}


# API Endpoint: Predict clickbait for a single text input
@app.get("/predict_clickbait")
def predict_clickbait_text(text: str):
    return predict_clickbait(text)


# API Endpoint: Predict clickbait for all articles in Parquet
@app.get("/predict_articles")
def classify_articles():
    df = load_parquet()

    if df is None:
        raise HTTPException(status_code=500, detail="Parquet file not loaded")

    if "title" not in df.columns:
        raise HTTPException(status_code=400, detail="No 'title' column found in dataset")

    df["clickbait_prediction"] = df["title"].apply(lambda x: predict_clickbait(str(x)))

    return df[["title", "clickbait_prediction"]].to_dict(orient="records")


# API Endpoint: Save predictions to a new Parquet file
@app.get("/predict_articles/save")
def classify_and_save():
    df = load_parquet()

    if df is None:
        raise HTTPException(status_code=500, detail="Parquet file not loaded")

    if "title" not in df.columns:
        raise HTTPException(status_code=400, detail="No 'title' column found in dataset")

    df["clickbait_label"] = df["title"].apply(lambda x: predict_clickbait(str(x))["label"])
    df["clickbait_confidence"] = df["title"].apply(lambda x: predict_clickbait(str(x))["confidence"])

    output_path = UPLOADS_DIR / "predictions.parquet"
    df.to_parquet(output_path, index=False)

    return {"message": f"Predictions saved to {output_path}"}

@app.get("/read_parquet")
async def read_parquet():
    df = load_parquet()

    if df is None:
        raise HTTPException(status_code=500, detail="Parquet file not loaded")

    return df.to_dict(orient="records")

## displayed in trends and statistics tab on webpage

@app.get("/article_word_length")
async def get_article_word_length():
    df = load_parquet()

    if df is None:
        raise HTTPException(status_code=500, detail="Parquet file not loaded")

    if "body" not in df.columns:
        raise HTTPException(status_code=400, detail="No 'body' column found in dataset")

    df["word_count"] = df["body"].apply(lambda x: len(str(x).split()) if pd.notnull(x) else 0)
    df["flesch_reading_ease"] = df["body"].apply(lambda x: textstat.flesch_reading_ease(str(x)) if pd.notnull(x) else None)

    return {
        "average_length": round(df["word_count"].mean(), 2),
        "article_lengths": df["word_count"].tolist(),
        "average_redeability": round(df["flesch_reading_ease"].mean(), 2)
    }
#Kilian 19-03-2025
@app.get("/article_analysis")
async def article_analysis():
    df = load_parquet()
    nltk.download('punkt')
    nltk.download('stopwords')
    nltk.download('punkt_tab')
    if df is None:
        raise HTTPException(status_code=500, detail="Parquet file not loaded")

    if "body" not in df.columns:
        raise HTTPException(status_code=400, detail="No 'body' column found in dataset")
    
    # Step 1: Clean HTML content using BeautifulSoup (basic clean for word count) -- working under clean text heading
    df["clean_text"] = df["body"].apply(
        lambda x: BeautifulSoup(x, 'html.parser').get_text() if pd.notnull(x) else ""
    )
    
    # Step 2: Calculate word count -- working
    df["word_count"] = df["clean_text"].apply(lambda x: len(x.split()))
    
    # # Step 3: Extract domain information from the 'url' column using tldextract -- only getting the source_DOMAIN FOR SOME REASON
    # if "links_permalink" in df.columns:
    #     df["domain"] = df["links_permalink"].apply(
    #         lambda x: f"{tldextract.extract(x).domain}.{tldextract.extract(x).suffix}" if pd.notnull(x) else "Unknown"
    #     )
    # else:
    #     df["domain"] = "Unknown"
    
    #Better links finder 
    
    def get_domain(url):
        if pd.notnull(url):
            ext = tldextract.extract(url)
            return f"{ext.domain}.{ext.suffix}"
        return "Unknown"



    if "links_permalink" in df.columns:
        df["domain"] = df["links_permalink"].apply(get_domain)
        df["article_permalink"] = df["links_permalink"]
    else:
        df["domain"] = "Unknown"
        df["article_permalink"] = "Unknown"

    # Step 4: Aggregate statistics (for summary use)
    overall_avg = round(df["word_count"].mean(), 2)
    domain_stats = (
        df.groupby("domain")["word_count"]
          .agg(["mean", "count"])
          .reset_index()
          .rename(columns={"mean": "avg_word_count", "count": "article_count"})
    )
    domain_stats_list = domain_stats.to_dict(orient="records")
    
    # --- Additional Analysis ---
    # Define helper to clean HTML with BeautifulSoup 
    def parse_and_clean(html_content):
        if pd.isnull(html_content):
            return "", None
        soup = BeautifulSoup(html_content, "html.parser")
        text = soup.get_text(separator=" ")
        return text, soup

    # Apply the parse_and_clean function and store clean text -- working
    df["clean_text"], df["_soup_obj"] = zip(*df["body"].apply(parse_and_clean))

    # Average Sentence Length using NLTK -- working
    def average_sentence_length(text):
        if not text:
            return 0
        sentences = nltk.sent_tokenize(text)
        if len(sentences) == 0:
            return 0
        word_counts = [len(sentence.split()) for sentence in sentences]
        return sum(word_counts) / len(sentences)
    
    df["avg_sentence_length"] = df["clean_text"].apply(average_sentence_length)
    
    # Reading Level using textstat -- working higher score = easier to read
    def reading_level(text):
        if not text:
            return None
        return round(textstat.flesch_reading_ease(text), 2)
    
    df["reading_level"] = df["clean_text"].apply(reading_level)
    
    # Topic Frequency: Get top keywords (simple approach for now) -- working
    nltk.download('stopwords')
    stop_words = set(stopwords.words('english'))
    
    def get_top_keywords(text, top_n=3):
        if not text:
            return []
        words = [w.lower() for w in text.split() if w.lower() not in stop_words and w.isalpha()]
        freq_dist = nltk.FreqDist(words)
        most_common = freq_dist.most_common(top_n)
        return [word for word, freq in most_common]
    
    df["top_keywords"] = df["clean_text"].apply(get_top_keywords)
    
    # Author Extraction: Using meta tag or byline element -- working
    if "author_name" in df.columns:
        df["author"] = df["author_name"]
    else:
        def extract_author(soup):
            if not soup:
                return None
            author_meta = soup.find("meta", attrs={"name": "author"})
            if author_meta and author_meta.get("content"):
                return author_meta["content"]
            byline = soup.find("span", class_="byline-author")
            if byline:
                return byline.get_text(strip=True)
            return None
    
        df["author"] = df["_soup_obj"].apply(extract_author)
    
    # Ad Frequency: Count occurrences of 'sponsored' or 'advertisement' -- this is working as far as i can tell/. most ahve no ads but in our test data i'm findinig 1 - 3 in some articles
    def count_ads(soup):
        if not soup:
            return 0
        text = soup.get_text().lower()
        keywords = ["sponsored", "advertisement"]
        count = 0
        for kw in keywords:
            count += text.count(kw)
        return count
    
    df["ad_frequency"] = df["_soup_obj"].apply(count_ads)
    
    # # Link Analysis: Count internal vs external links --it is working but i don't think any of our articles have any hyperlinks 
    # def link_analysis(soup, article_domain):
    #     if not soup:
    #         return {"internal_links": 0, "external_links": 0}
    #     links = soup.find_all("a", href=True)
    #     internal = 0
    #     external = 0
    #     for link in links:
    #         extracted = tldextract.extract(link["href"])
    #         link_domain = f"{extracted.domain}.{extracted.suffix}"
    #         if link_domain == article_domain:
    #             internal += 1
    #         else:
    #             external += 1
    #     return {"internal_links": internal, "external_links": external}
    
    # df["link_stats"] = df.apply(
    #     lambda row: link_analysis(row["_soup_obj"], row["domain"]), axis=1
    # )
    # df["internal_links"] = df["link_stats"].apply(lambda x: x["internal_links"])
    # df["external_links"] = df["link_stats"].apply(lambda x: x["external_links"])
    
    # # Drop temporary column used for processing
    # df.drop(columns=["_soup_obj", "link_stats"], inplace=True)
    
    # all results are aggregated into the DataFrame 'df'
    # returning complete dataframe (here as JSON)
    df.drop(columns=["_soup_obj"], inplace=True)
    return df.to_dict(orient="records")

@app.get("/article_readability")
async def get_article_readability():
    df = load_parquet()

    if df is None:
        raise HTTPException(status_code=500, detail="Parquet file not loaded")

    if "body" not in df.columns:
        raise HTTPException(status_code=400, detail="No 'body' column found in dataset")

    df["domain"] = df["source_name"].apply(
        lambda x: f"{tldextract.extract(x).domain}.{tldextract.extract(x).suffix}" if pd.notnull(x) else "Unknown"
    )

    df["flesch_reading_ease"] = df["body"].apply(lambda x: textstat.flesch_reading_ease(str(x)) if pd.notnull(x) else None) # Measures readability (higher = easier to read)
    df["flesch_kincaid_grade"] = df["body"].apply(lambda x: textstat.flesch_kincaid_grade(str(x)) if pd.notnull(x) else None) # Estimates U.S. grade level needed to read
    df["gunning_fog_index"] = df["body"].apply(lambda x: textstat.gunning_fog(str(x)) if pd.notnull(x) else None) # Measures complexity based on difficult words
    df["sentence_count"] = df["body"].apply(lambda x: textstat.sentence_count(str(x)) if pd.notnull(x) else None) # Number of sentences
    df["unique_word_count"] = df["body"].apply(lambda x: len(set(str(x).split())) if pd.notnull(x) else None)

    grouped = (
        df.groupby("domain")[["flesch_reading_ease", "flesch_kincaid_grade", "gunning_fog_index", "sentence_count", "unique_word_count"]]
        .mean()
        .reset_index()
        .round(2)
    )

    return grouped.to_dict(orient="records")

@app.delete("/delete_parquet")
async def delete_parquet():
    try:
        # Get the latest parquet file
        file_path = get_latest_parquet()
        
        # Only delete if it's in the uploads directory (protect default file)
        if UPLOADS_DIR in file_path.parents:
            os.remove(file_path)
            return {"message": "File deleted successfully"}
        else:
            raise HTTPException(
                status_code=400, 
                detail="Cannot delete default Parquet file"
            )
            
    except FileNotFoundError:
        raise HTTPException(
            status_code=404, 
            detail="No Parquet file found to delete"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to delete file: {str(e)}"
        )


# === CONFIGURATION ===
base_model_name = "meta-llama/Llama-3.2-1B"
# adapter_path = "./checkpoint-400"
ADAPTER_PATH = BASE_DIR / "checkpoint-400"
device = "cuda" if torch.cuda.is_available() else "cpu"

# === Load Hugging Face Token from Env ===
hf_token = os.getenv("HF_TOKEN")
if not hf_token:
    raise ValueError("Hugging Face token not found! Set HF_TOKEN as an environment variable.")

# === Load Model and Tokenizer ===
def load_lora_model(base_model_name, adapter_path, hf_token):
    tokenizer = AutoTokenizer.from_pretrained(base_model_name, token=hf_token)
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token

    model = AutoModelForSequenceClassification.from_pretrained(base_model_name, token=hf_token)
    model = PeftModel.from_pretrained(model, adapter_path, token=hf_token)
    return model.to(device), tokenizer

# model, tokenizer = load_lora_model(base_model_name, adapter_path, hf_token)
model, tokenizer = load_lora_model(base_model_name, str(ADAPTER_PATH), hf_token)
model.eval()


# === Request body model ===
class ArticleRequest(BaseModel):
    text: str

# === Endpoint ===
@app.post("/classify")
async def classify_article(data: ArticleRequest):
    text = data.text.strip()
    if not text:
        raise HTTPException(status_code=400, detail="No text provided")

    inputs = tokenizer(text, return_tensors="pt", truncation=True, padding="max_length", max_length=512).to(device)

    with torch.no_grad():
        outputs = model(**inputs)

    probabilities = torch.nn.functional.softmax(outputs.logits, dim=-1)
    predicted_label = torch.argmax(probabilities, dim=-1).item()

    label_mapping = {0: "Uncredible", 1: "Credible"}

    return {
        "label": label_mapping[predicted_label],
        "probabilities": probabilities.tolist()
    }

def evaluate_article_credibility(article_row):
    score = 0
    # Use existing values or defaults if missing
    reading = article_row.get("reading_ease", 0)
    clickbait_confidence = article_row.get("clickbait_confidence", 0)
    
    # Simple formula (can be refined later)
    score = (reading / 100) * 0.5 + (1 - clickbait_confidence) * 0.5
    return round(score, 3)


@app.get("/publisher_scores")
def get_publisher_scores():
    df = load_parquet()
    if df is None:
        raise HTTPException(status_code=500, detail="Parquet file not loaded")

    df["publisher"] = df["source_name"].apply(
        lambda x: f"{tldextract.extract(x).domain}.{tldextract.extract(x).suffix}" if pd.notnull(x) else "Unknown"
    )

        # ✅ Compute missing readability score if not present
    if "reading_ease" not in df.columns:
        df["clean_text"] = df["body"].apply(lambda x: BeautifulSoup(str(x), "html.parser").get_text() if pd.notnull(x) else "")
        df["reading_ease"] = df["clean_text"].apply(lambda x: textstat.flesch_reading_ease(x) if x else 0)

    # ✅ Compute missing clickbait confidence
    if "clickbait_confidence" not in df.columns:
        df["clickbait_confidence"] = df["title"].apply(lambda x: predict_clickbait(str(x))["confidence"] if pd.notnull(x) else 0)

    # ✅ Evaluate credibility score per article
    df["credibility_score"] = df.apply(evaluate_article_credibility, axis=1)

    # ✅ Group by publisher and get mean credibility
    publisher_scores = (
        df.groupby("publisher")["credibility_score"]
        .mean()
        .round(2)
        .reset_index()
    )

    return publisher_scores.to_dict(orient="records")


@app.get("/average_publisher_score")
def get_average_publisher_score():
    # df = load_parquet()
    # if df is None:
    #     raise HTTPException(status_code=500, detail="Parquet file not loaded")

    # if "publisher" not in df.columns:
    #     # Add publisher column if not already present
    #     df["publisher"] = df["source_name"].apply(
    #         lambda x: f"{tldextract.extract(x).domain}.{tldextract.extract(x).suffix}" if pd.notnull(x) else "Unknown"
    #     )
    
    df = load_parquet()
    if df is None:
        raise HTTPException(status_code=500, detail="Parquet file not loaded")

    df["publisher"] = df["source_name"].apply(
        lambda x: f"{tldextract.extract(x).domain}.{tldextract.extract(x).suffix}" if pd.notnull(x) else "Unknown"
    )

        # ✅ Compute missing readability score if not present
    if "reading_ease" not in df.columns:
        df["clean_text"] = df["body"].apply(lambda x: BeautifulSoup(str(x), "html.parser").get_text() if pd.notnull(x) else "")
        df["reading_ease"] = df["clean_text"].apply(lambda x: textstat.flesch_reading_ease(x) if x else 0)

    # ✅ Compute missing clickbait confidence
    if "clickbait_confidence" not in df.columns:
        df["clickbait_confidence"] = df["title"].apply(lambda x: predict_clickbait(str(x))["confidence"] if pd.notnull(x) else 0)

    # Evaluate credibility
    df["credibility_score"] = df.apply(evaluate_article_credibility, axis=1)

    # Group by publisher and get average
    publisher_scores = df.groupby("publisher")["credibility_score"].mean().reset_index()

    # Calculate overall average across all publishers
    avg_score = round(publisher_scores["credibility_score"].mean() * 100, 2)

    return {"average_score": avg_score}


@app.get("/publisher_summary")
def get_publisher_summary():
    df = load_parquet()
    if df is None:
        raise HTTPException(status_code=500, detail="Parquet file not loaded")

    df["publisher"] = df["source_name"].apply(
        lambda x: f"{tldextract.extract(x).domain}.{tldextract.extract(x).suffix}" if pd.notnull(x) else "Unknown"
    )

        # ✅ Compute missing readability score if not present
    if "reading_ease" not in df.columns:
        df["clean_text"] = df["body"].apply(lambda x: BeautifulSoup(str(x), "html.parser").get_text() if pd.notnull(x) else "")
        df["reading_ease"] = df["clean_text"].apply(lambda x: textstat.flesch_reading_ease(x) if x else 0)

    # ✅ Compute missing clickbait confidence
    if "clickbait_confidence" not in df.columns:
        df["clickbait_confidence"] = df["title"].apply(lambda x: predict_clickbait(str(x))["confidence"] if pd.notnull(x) else 0)

    # Evaluate credibility
    df["credibility_score"] = df.apply(evaluate_article_credibility, axis=1)

    # Group by publisher
    grouped = df.groupby("publisher")["credibility_score"].mean().reset_index()

    # Total number of publishers
    total_publishers = grouped.shape[0]

    # Average credibility score
    average_score = grouped["credibility_score"].mean()

    # Flagged publishers (score < 0.3)
    flagged_publishers = grouped[grouped["credibility_score"] < 0.3].shape[0]

    # Top 5 publishers by score
    top_publishers = grouped.sort_values(by="credibility_score", ascending=False).head(5)

    # Return formatted
    return {
        "total_publishers": total_publishers,
        "average_score": round(average_score, 2),
        "flagged_publishers": flagged_publishers,
        "top_publishers": [
            {
                "publisher": row["publisher"],
                "credibility_score": round(row["credibility_score"], 2),
            }
            for _, row in top_publishers.iterrows()
        ],
    }
@app.get("/trends")
def get_trends_data():
    df = load_parquet()

    if df is None:
        raise HTTPException(status_code=500, detail="Parquet file not loaded")

    if "body" not in df.columns:
        raise HTTPException(status_code=400, detail="No 'body' column found in dataset")

    # Sample trends aggregation — customize this as needed
    trends_summary = {
        "average_word_count": round(df["body"].apply(lambda x: len(str(x).split()) if pd.notnull(x) else 0).mean(), 2),
        "article_count": len(df),
        "top_domains": df["source_name"].value_counts().head(5).to_dict() if "source_name" in df.columns else {},
    }

    return trends_summary
