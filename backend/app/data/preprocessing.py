from pyspark.sql import SparkSession
from pyspark.sql.functions import col, regexp_replace, trim

# Initialize Spark Session
spark = SparkSession.builder.appName("ArticleProcessing").getOrCreate()

def preprocess_data(df):
    """
    Cleans and formats article text while preserving sentence structures, named entities, and symbols.
    """
    # Remove duplicates
    df = df.dropDuplicates()

    # Remove rows where 'body' is missing
    df = df.dropna(subset=["body"])

    # Normalize whitespace
    df = df.withColumn("body", trim(col("body")))  # Trim leading/trailing spaces
    df = df.withColumn("body", regexp_replace(col("body"), r"\s+", " "))  # Replace multiple spaces with single

    # Preserve punctuation, named entities, and symbols
    allowed_characters = r"[^a-zA-Z0-9\s.,!?&$%''\"“”‘’\-—()<>]"
    df = df.withColumn("body", regexp_replace(col("body"), allowed_characters, ""))

    return df
