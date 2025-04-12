from pyspark.sql import SparkSession

def load_jsonl_to_spark(file_path):
    """
    Loads a JSONL file into a Spark DataFrame.
    """
    spark = SparkSession.builder.appName("ArticleProcessing").getOrCreate()
    return spark.read.json(file_path)
