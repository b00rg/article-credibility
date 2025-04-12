from pyspark.sql import SparkSession

def get_spark_session():
    """
    Creates and returns a Spark session.
    
    Returns:
        SparkSession: A configured Spark session.
    """
    return SparkSession.builder \
        .appName("ArticleProcessing") \
        .config("spark.driver.memory", "4g") \
        .getOrCreate()
 