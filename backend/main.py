from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pyspark.sql import SparkSession
from backend.api import app as api_app  # Import the new Parquet API


app = FastAPI()

# Allow frontend to make requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Change this to your frontend URL in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Spark Session
spark = SparkSession.builder \
    .master("local[*]") \
    .appName("ArticleAnalysis") \
    .config("spark.driver.memory", "2g") \
    .config("spark.executor.memory", "2g") \
    .config("spark.driver.extraJavaOptions", "-Djava.security.manager=allow") \
    .getOrCreate()

# Mount the Parquet data API at "/api"
app.mount("/api", api_app)

# Define the request model
class ArticleRequest(BaseModel):
    text: str

@app.post("/analyze/")
def analyze_article(request: ArticleRequest):
    """
    Receives text from the frontend, processes it with Spark, and returns an analysis.
    """
    try:
        # Create Spark DataFrame
        df = spark.createDataFrame([(request.text,)], ["article"])
        
        # Example processing: Convert text to uppercase
        processed_df = df.withColumn("processed_text", df.article)
        processed_text = processed_df.collect()[0]["processed_text"]

        return {"processed_text": processed_text}
    except Exception as e:
        return {"error": str(e)}

# Run the backend server
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
