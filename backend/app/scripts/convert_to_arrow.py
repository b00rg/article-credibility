from datasets import load_dataset, DatasetDict
import os

input_dir = "../sweng25_group03_quantexa/datasets/preprocessed"
output_path = "../sweng25_group03_quantexa/datasets/arrow"

# Load JSONL files into Hugging Face dataset
dataset = load_dataset("json", data_files=[os.path.join(input_dir, f) for f in os.listdir(input_dir) if f.endswith(".json")])

# Save as `.arrow` format
dataset.save_to_disk(output_path)

print(f"✅ Dataset saved in {output_path}")
