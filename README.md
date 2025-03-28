# Basic Article Credibility Classifier using LLaMA
> NOTE: this branch contains the necessary code to use LLaMA for single article classification. For a more comprehensive classification using a rules-based method, see main.

This branch deploys an **article credibility classifier** using a **Flask** backend and a **frontend** to allow users to input articles and classify them as either "Credible" or "Uncredible". The classification is powered by a **Llama 3.2 model** fine-tuned with **PEFT** (Parameter Efficient Fine-Tuning) for sequence classification tasks.

The model is hosted on **Hugging Face** and deployed using **Flask** for the API and **GitHub Pages** for the frontend.

## Features
- **Frontend**: A web page where users can input article text and receive classification results (Credible/Uncredible).
- **Backend**: A Flask-based API that takes the article text, processes it, and returns the classification.
- **Model**: Uses a fine-tuned model from Hugging Face for sequence classification.
- **CORS**: Allows cross-origin requests for accessing the API from the frontend.

## Requirements
- Python 3.9 or above
- Flask
- Hugging Face Transformers
- Torch
- PEFT
- Flask-CORS
- Gunicorn (for deployment)
- Hugging Face Token for model access

## Setup and Installation

### 1. Clone the Repository
Clone the repository to your local machine:

```bash
git clone https://github.com/your-username/article-credibility-classifier.git
cd article-credibility-classifier
```
### 2. Install Dependencies
Create and activate a virtual environment (optional but recommended):

```bash
python3 -m venv venv
source venv/bin/activate   # For Mac/Linux
venv\Scripts\activate      # For Windows
```
Install the required dependencies:

```bash
pip install -r requirements.txt
```

### 3. Set Environment Variables
You will need a Hugging Face token to load the model. Set the HF_TOKEN environment variable:

```bash
export HF_TOKEN="your_hugging_face_token"
```
Alternatively, you can set the environment variable in your .env file.

### 4. Run the Flask App Locally
To start the Flask app locally, run:

```bash
python app.py
```
This will start the API server at http://localhost:5001.

### Model Details
The model used in this project is based on Llama 3.2 from Hugging Face, fine-tuned with PEFT for sequence classification. The model predicts whether an article is credible or uncredible based on the content provided.

### Acknowledgments
- Hugging Face for providing pre-trained models and tokenizers.

- PEFT for efficient fine-tuning of large models.

- Flask for creating the web application backend.
