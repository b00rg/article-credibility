from flask import Flask, request, jsonify, render_template
import torch
from transformers import AutoModelForSequenceClassification, AutoTokenizer
from peft import PeftModel
from flask_cors import CORS  # Allow frontend to access API
import os

# === CONFIGURATION ===
base_model_name = "meta-llama/Llama-3.2-1B"
adapter_path = "./checkpoint-400"
device = "cuda" if torch.cuda.is_available() else "cpu"

# Load Hugging Face Token from Environment Variable
hf_token = os.getenv("HF_TOKEN")  # Run `export HF_TOKEN="your_token_here"` before running the script

if not hf_token:
    raise ValueError("Hugging Face token not found! Set HF_TOKEN as an environment variable.")

# === LOAD MODEL & TOKENIZER ===
def load_lora_model(base_model_name, adapter_path, hf_token):
    tokenizer = AutoTokenizer.from_pretrained(base_model_name, token=hf_token)
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token

    model = AutoModelForSequenceClassification.from_pretrained(base_model_name, token=hf_token).to(device)
    model = PeftModel.from_pretrained(model, adapter_path, token=hf_token)

    return model, tokenizer

model, tokenizer = load_lora_model(base_model_name, adapter_path, hf_token)

# === SETUP FLASK APP ===
app = Flask(__name__)
CORS(app)  # Allow frontend access

@app.route('/')
def home():
    return render_template('classification-pi.html')  # This will render the HTML page
@app.route('/classify', methods=['POST'])
def classify_article():
    data = request.get_json()
    text = data.get("text", "")

    if not text:
        return jsonify({"error": "No text provided"}), 400

    inputs = tokenizer(text, return_tensors="pt", truncation=True, padding="max_length", max_length=512).to(device)

    with torch.no_grad():
        outputs = model(**inputs)

    probabilities = torch.nn.functional.softmax(outputs.logits, dim=-1)
    predicted_label = torch.argmax(probabilities, dim=-1).item()

    # Map the predicted labels to Credible/Uncredible
    label_mapping = {0: "Uncredible", 1: "Credible"}

    return jsonify({
        "label": label_mapping[predicted_label],
        "probabilities": probabilities.tolist()
    })

if __name__ == '__main__':
    app.run(host="0.0.0.0", port=5001, debug=True)
