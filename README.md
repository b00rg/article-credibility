# LLaMA Model
The article credibility scorer focuses on developing an AI model to assess the credibility of articles. It uses transformer-based models, specifically a fine-tuned LLaMA model, to classify articles as credible or non-credible with 99% accuracy on the validation dataset. The project is a collaboration with Quantexa, with plans to integrate the model into a product for evaluating content reliability.

Key features include:
* A publisher scoring system and database to track and assess content reliability.
* Optimizations to reduce model training time by 20% using PEFT (LoRA) and an additional 50% reduction with Mixed Precision Training.
* A database storing credibility scores for articles and aggregated publisher ratings.
* A frontend interface built with React, HTML, CSS, and JavaScript to display credibility metrics in an interactive format.

# Demo

### Reliable Article/Publisher Output
RTÉ is recognised as reliable by the algorithm because it adheres to journalistic standards, offering balanced reporting and comprehensive coverage of news from multiple perspectives.
https://github.com/user-attachments/assets/a3404332-aafa-4c67-a42c-c91042f5fb18


### Unreliable Article/Publisher Output
Jordan Peterson is flagged as unreliable as his views often rely on controversial interpretations of psychology and sociology, with a tendency to blend personal opinion with unverified claims.
https://github.com/user-attachments/assets/2a22b71d-3453-46fb-a59a-d2ac517d0abb

> NOTE: as the model was trained on Quantexa datasets, the weights are not available. Feel free to fine-tune your own model using https://github.com/b00rg/llama-templates as a reference. This model was trained using Kaggle's free GPUs, specifically their T4s. 
