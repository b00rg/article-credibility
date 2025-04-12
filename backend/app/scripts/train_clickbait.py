import fasttext
from pathlib import Path

# Define paths
BASE_DIR = Path(__file__).resolve().parent.parent  # backend/app/
DATA_PATH = BASE_DIR / "training" / "clickbait_dataset.txt"
MODEL_PATH = BASE_DIR / "models" / "clickbait_model.bin"

# Ensure models directory exists
MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)

# Train FastText model
print("Training Clickbait Detection Model...")
model = fasttext.train_supervised(input=str(DATA_PATH), epoch=25, lr=0.5, wordNgrams=2)

# Save the trained model
model.save_model(str(MODEL_PATH))
print(f"✅ Model trained and saved at {MODEL_PATH}")
