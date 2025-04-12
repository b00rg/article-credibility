import React, { useState } from 'react';

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    {
      question: "How do I analyze an article?",
      answer: "To analyze an article, simply upload your file into the input box and click the 'Analyze' button. The system will process the text and provide detailed insights about its quality, readability, and potential issues."
    },
    {
      question: "What metrics are analyzed in the article quality checker?",
      answer: "The article quality checker analyzes several key metrics including: reading level, word count, average sentence length, sentiment analysis, keyword frequency, and potential clickbait indicators. These metrics help evaluate the overall quality and readability of the article."
    },
    {
      question: "How is the reading level calculated?",
      answer: "The reading level is calculated using various linguistic metrics including sentence length, word complexity, and vocabulary usage. A lower score indicates more complex text, while a higher score suggests easier-to-read content."
    },
    {
      question: "What does the sentiment analysis show?",
      answer: "The sentiment analysis evaluates both the title and body of the article separately. It provides scores indicating whether the content is positive, negative, or neutral. This helps identify potential bias or emotional manipulation in the writing."
    },
    {
      question: "What are flagged articles?",
      answer: "Flagged articles are those that have been identified as potential clickbait or low-quality content. The system uses various indicators such as sensationalist language, excessive punctuation, and misleading titles to flag potentially problematic content."
    },
    {
      question: "How can I improve my article's quality score?",
      answer: "To improve your article's quality score, focus on: maintaining a consistent reading level, using clear and concise language, avoiding clickbait tactics, ensuring proper grammar and structure, and providing balanced, well-researched content."
    },
    {
      question: "Can I analyze multiple articles at once?",
      answer: "Yes, you can analyze multiple articles by uploading a file containing multiple articles or by using the batch analysis feature. The system will process each article and provide individual and comparative insights."
    },
    {
      question: "What is the cost and number of articles processed per minute using the LLaMA mode?",
      answer: "0.02€ per minute, for 180 articles"
    },
    {
      question: "Why do we use two separate models?",
      answer: "One model is a LLM finetuned for classification using transformers"
    },
    {
      question: "What models are used for classification?",
      answer: "We use two different models: a rules-based method, that combines multiple NLP techniques to get a comprehensive view of the points that may contribute to an article's credibility rating. \n The second model is a LLaMA LLM that uses a transformer to change the output to classification, and fine-tuned the model on articles based on a dataset scraped using Quantexa data."
    },
    {
      question: "How accurate is the model?",
      answer: "According to the validation set when training the LLM model, we have achieved 99% accuracy in determining credible and uncredible articles.\n Note that further training would be needed, for a more reliable model, as the model is particularly susceptible to false positive, and may not be trained on certain types of unreliable articles, such as fake news. \nWhile it provides reliable insights, it's recommended to use it as a tool to assist human judgment rather than as the sole determinant of article quality."
    }
  ];

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="main-content">
      <h2>Frequently Asked Questions</h2>
      <div className="faq-container">
        {faqs.map((faq, index) => (
          <div key={index} className="faq-item">
            <div 
              className={`faq-question ${openIndex === index ? 'active' : ''}`}
              onClick={() => toggleFAQ(index)}
            >
              <h3>{faq.question}</h3>
              <span className="toggle-icon">{openIndex === index ? '−' : '+'}</span>
            </div>
            <div className={`faq-answer ${openIndex === index ? 'show' : ''}`}>
              <p>{faq.answer}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 