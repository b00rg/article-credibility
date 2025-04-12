from pyspark.sql import SparkSession
from pyspark.sql.functions import col, regexp_replace, trim
import os

# Reduce excessive logs and avoid large debug messages
os.environ["PYSPARK_SUBMIT_ARGS"] = "--conf spark.sql.debug.maxToStringFields=50 pyspark-shell"
os.environ["SPARK_LOCAL_IP"] = "127.0.0.1"

# Initialize Spark Session with optimizations
spark = SparkSession.builder \
    .appName("ParquetArticleProcessing") \
    .config("spark.master", "local[*]") \
    .config("spark.sql.autoBroadcastJoinThreshold", -1) \
    .getOrCreate()

def preprocess_parquet(input_parquet, output_parquet):
    """
    Loads, cleans, and saves a Parquet dataset containing articles.
    """
    print(f"Loading data from {input_parquet}...")
    df = spark.read.parquet(input_parquet).limit(5000)  # Process a smaller batch for debugging
    print(f"Initial row count: {df.count()}")

    # Debugging: Show schema and first few rows
    print(f"Dataframe Schema: {df.schema}")
    df.show(5)

    # Remove duplicates
    df = df.dropDuplicates()
    print(f"After dropping duplicates: {df.count()}")

    # Remove rows where 'body' is missing
    df = df.dropna(subset=["body"])
    print(f"After dropping missing values: {df.count()}")

    # Normalize whitespace and character filtering
    df = df.withColumn("body", regexp_replace(col("body"), r"[^\w\s.,!?&$%'“”‘’\-—()<>]+", " "))  
    df = df.withColumn("body", regexp_replace(col("body"), r"\s+", " "))  
    df = df.withColumn("body", trim(col("body")))  

    print(f"Final row count: {df.count()}")

    df = df.cache()

    # Save cleaned dataset back to Parquet
    df.write.mode("overwrite").parquet(output_parquet)
    print(f"Preprocessed data saved to {output_parquet}")

# Example usage
if __name__ == "__main__":
    input_path = "dataset.parquet"  # Adjust the input filename
    output_path = "cleaned_articles"
    preprocess_parquet(input_path, output_path)
