# Credibility Classifier
* A credibility classifier built using a fine-tuned LLaMA model and Hugging Face Transformers, achieving 99% accuracy for labelling credible vs. non-credible articles. 
* Article Scores are accumulated for an overall publisher average credibility rating.

> Created in collaboration with Quantexa as a foundation for an upcoming content credibility product. Please note that as the model weights were trained on Quantexa datasets [https://www.quantexa.com/], these are unavailable for display. Feel free to train your own model weights using the `finetuning` folder code. 

## Model Optimization
LoRA (Low-Rank Adaptation) and Mixed Precision Training reduce training time by 70% without impacting accuracy.

## Publisher Scoring System:
* Designed a scoring mechanism to evaluate the overall credibility of news publishers based on historical content analysis in local storage.
* Quick download/upload/clear buttons for ease of use.

## Interactive Frontend:
React-based dashboard to visualize credibility scores, trends, metrics, and publisher tables for the UI.

### Reliable Article/Publisher

https://github.com/user-attachments/assets/423f1037-f3e7-4278-abb1-d0886022959b


### Unreliable Article/Publisher

https://github.com/user-attachments/assets/68cbd93b-6182-48df-85ab-31a9410b35e3
