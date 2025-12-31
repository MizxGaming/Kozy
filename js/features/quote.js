import { elements } from '../core/dom.js';

const quotes = [
    { q: "The way to get started is to quit talking and begin doing.", a: "Walt Disney" },
    { q: "Your time is limited, don't waste it living someone else's life.", a: "Steve Jobs" },
    { q: "Focus on being productive instead of busy.", a: "Tim Ferriss" }
];

export function initQuotes() {
    fetchQuote();
    elements.newQuoteBtn.addEventListener('click', fetchQuote);
}

export function fetchQuote() {
    const random = quotes[Math.floor(Math.random() * quotes.length)];
    elements.quoteText.innerText = `"${random.q}"`;
    elements.quoteAuthor.innerText = `- ${random.a}`;
}
