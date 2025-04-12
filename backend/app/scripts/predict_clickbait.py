import fasttext
from pathlib import Path

# Load model
BASE_DIR = Path(__file__).resolve().parent.parent
MODEL_PATH = BASE_DIR / "models" / "clickbait_model.bin"
model = fasttext.load_model(str(MODEL_PATH))

def predict_clickbait(text):
    label, confidence = model.predict(text)
    return {"label": label[0].replace("__label__", ""), "confidence": confidence[0]}

# Example usage
if __name__ == "__main__":
    test_text = "You will not believe what happened next!"
    result = predict_clickbait(test_text)
    print(f"Prediction: {result}")
