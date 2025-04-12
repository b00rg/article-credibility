from transformers import AutoTokenizer
from datasets import load_from_disk

# Load dataset
dataset_path = "../sweng25_group03_quantexa/datasets/arrow"
dataset = load_from_disk(dataset_path)

# Load LLaMA tokenizer
tokenizer = AutoTokenizer.from_pretrained("meta-llama/Llama-3.1-8B", use_fast=True)

# Ensure tokenizer is properly set up for LLaMA
tokenizer.pad_token = tokenizer.eos_token

def tokenize_function(examples):
    return tokenizer(
        examples["body"],
        padding="longest",
        truncation=True,
        max_length=2048,
        return_tensors=None
    )

# Apply tokenization
tokenized_dataset = dataset.map(tokenize_function, batched=True, remove_columns=["body"])

# Save final dataset
tokenized_dataset.save_to_disk("../sweng25_group03_quantexa/datasets/tokenized")

print(f"✅ Tokenized dataset saved for LLaMA training.")

