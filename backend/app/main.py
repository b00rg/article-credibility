from app.data.preprocessing import preprocess_data
from app.data.ingestion import load_jsonl_to_spark
from pyspark.sql import SparkSession
import os

# Initialize Spark session
spark = SparkSession.builder.appName("ArticleProcessing").getOrCreate()

if __name__ == "__main__":
    input_path = "../sweng25_group03_quantexa/datasets/input/two_article_test.jsonl"
    output_dir = "../sweng25_group03_quantexa/datasets/preprocessed"  # Directory for multiple JSONL files

    df = load_jsonl_to_spark(input_path)

    if "body" in df.columns:
        df = preprocess_data(df)

        # Save each partition as JSON (equivalent to JSONL)
        df.write.mode("overwrite").json(output_dir)

        print(f"✅ Preprocessed dataset saved in {output_dir}")
    else:
        raise ValueError("❌ Column 'body' not found in dataset!")
