# Credibility Analyzer

## Overview
This project is an AI-powered tool designed to assess the credibility of articles based on various factors, including clickbait detection, writing style, tone, bias, advertisement content, readability, complexity, and semantic similarities. 

It uses a fine-tuned LLaMA model trained on credible and uncredible articles to provide an in-depth evaluation of article trustworthiness. The LLaMA model has achieved **99% accuracy** against the validation dataset.

To view, go to: b00rg.github.io/article-credibility/

## Features
- **AI-Powered Analysis**: Utilizes a fine-tuned LLaMA model trained on credible and non-credible sources.
- **Clickbait Detection**: Identifies sensationalist and misleading headlines.
- **Advertisement Identification**: Detects promotional and sponsored content within articles.
- **Readability & Complexity Scoring**: Evaluates how easy or difficult an article is to read.
- **Bias & Tone Analysis**: Assesses whether the article has a biased perspective or a neutral tone.
- **Semantic Similarity Check**: Compares articles against known credible sources to detect misinformation.

## How It Works
1. **Preprocessing**: The article text is tokenized and preprocessed for analysis.
2. **Feature Extraction**: The AI model extracts linguistic, structural, and contextual features.
3. **Scoring & Classification**: The model assigns credibility scores based on trained parameters.
4. **Final Report**: The tool generates a report detailing the credibility, bias, complexity, and other key aspects of the article.

## Storage & Data Processing Strategy

### Data Storage with Apache Spark
- After LLM processing, output data is stored as **Parquet files** locally.
- **Parquet** is optimized for large datasets and supports fast columnar querying without requiring a formal database.

### Querying with PySpark
- **PySpark** is used to query distributed data efficiently.
- Allows **SQL-like queries** on Spark DataFrames for easy retrieval and analysis.
- Query performance is **scaled using Spark’s distributed nature**.

### Batch Processing with Apache Spark
- Articles are processed in **scheduled batches** using Apache Spark.
- **Precomputed scores** are stored in Spark’s distributed storage for quick access.
- Spark’s **parallel processing** enhances efficiency when handling large volumes of data.

## Model Training
- The model was fine-tuned using a transformer-based architecture on a dataset of labeled credible and non-credible articles.
- Supervised learning techniques were used to optimize classification performance.
