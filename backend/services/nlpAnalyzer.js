const natural = require('natural');
const nlp = require('compromise');

const tokenizer = new natural.WordTokenizer();
const sentenceTokenizer = new natural.SentenceTokenizer();
const TfIdf = natural.TfIdf;
const Analyzer = natural.SentimentAnalyzer;
const stemmer = natural.PorterStemmer;
const analyzer = new Analyzer('English', stemmer, 'afinn');

/**
 * Calculate word statistics
 */
const getStatistics = (text) => {
  if (!text || !text.trim()) {
    return { wordCount: 0, charCount: 0, sentenceCount: 0, paragraphCount: 0, readingTime: 0, avgWordLength: 0, uniqueWords: 0 };
  }

  const words = tokenizer.tokenize(text) || [];
  const sentences = sentenceTokenizer.tokenize(text) || [];
  const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 0);
  const uniqueWords = new Set(words.map(w => w.toLowerCase())).size;
  const avgWordLength = words.length > 0
    ? words.reduce((sum, w) => sum + w.length, 0) / words.length
    : 0;
  const readingTime = Math.ceil(words.length / 200); // avg 200 wpm

  return {
    wordCount: words.length,
    charCount: text.length,
    sentenceCount: sentences.length,
    paragraphCount: paragraphs.length,
    readingTime,
    avgWordLength: parseFloat(avgWordLength.toFixed(2)),
    uniqueWords
  };
};

/**
 * Extract keywords using TF-IDF
 */
const extractKeywords = (text, topN = 20) => {
  if (!text || !text.trim()) return [];

  const tfidf = new TfIdf();
  tfidf.addDocument(text);

  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been',
    'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
    'could', 'should', 'may', 'might', 'shall', 'can', 'this', 'that',
    'these', 'those', 'it', 'its', 'as', 'if', 'then', 'than', 'so',
    'not', 'no', 'nor', 'yet', 'both', 'either', 'neither', 'each',
    'few', 'more', 'most', 'other', 'some', 'such', 'into', 'through',
    'during', 'before', 'after', 'above', 'below', 'between', 'out',
    'about', 'up', 'down', 'also', 'just', 'only', 'very', 'too', 'i',
    'me', 'my', 'we', 'our', 'you', 'your', 'he', 'she', 'they', 'their'
  ]);

  const words = tokenizer.tokenize(text.toLowerCase()) || [];
  const wordFreq = {};
  words.forEach(word => {
    if (word.length > 2 && !stopWords.has(word) && /^[a-z]+$/.test(word)) {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    }
  });

  const keywords = [];
  tfidf.listTerms(0).forEach(item => {
    if (item.term.length > 2 && !stopWords.has(item.term) && /^[a-z]+$/.test(item.term)) {
      keywords.push({
        word: item.term,
        frequency: wordFreq[item.term] || 1,
        relevance: parseFloat(item.tfidf.toFixed(4))
      });
    }
  });

  return keywords
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, topN);
};

/**
 * Analyze sentiment
 */
const analyzeSentiment = (text) => {
  if (!text || !text.trim()) {
    return { label: 'neutral', score: 0, positive: 0, negative: 0, neutral: 100 };
  }

  try {
    const sentences = sentenceTokenizer.tokenize(text) || [text];
    let totalScore = 0;
    let positiveCount = 0;
    let negativeCount = 0;
    let neutralCount = 0;

    sentences.forEach(sentence => {
      const tokens = tokenizer.tokenize(sentence) || [];
      if (tokens.length === 0) return;
      const score = analyzer.getSentiment(tokens);
      totalScore += score;
      if (score > 0.05) positiveCount++;
      else if (score < -0.05) negativeCount++;
      else neutralCount++;
    });

    const avgScore = sentences.length > 0 ? totalScore / sentences.length : 0;
    const total = positiveCount + negativeCount + neutralCount || 1;

    return {
      label: avgScore > 0.05 ? 'positive' : avgScore < -0.05 ? 'negative' : 'neutral',
      score: parseFloat(avgScore.toFixed(4)),
      positive: parseFloat(((positiveCount / total) * 100).toFixed(1)),
      negative: parseFloat(((negativeCount / total) * 100).toFixed(1)),
      neutral: parseFloat(((neutralCount / total) * 100).toFixed(1))
    };
  } catch (error) {
    return { label: 'neutral', score: 0, positive: 0, negative: 0, neutral: 100 };
  }
};

/**
 * Extract named entities using compromise
 */
const extractEntities = (text) => {
  if (!text || !text.trim()) return [];

  try {
    const doc = nlp(text.substring(0, 10000)); // Limit for performance
    const entities = [];
    const entityMap = {};

    const addEntities = (items, type) => {
      items.forEach(item => {
        const t = item.text().trim();
        if (t.length > 1) {
          const key = `${t.toLowerCase()}_${type}`;
          if (entityMap[key]) {
            entityMap[key].count++;
          } else {
            entityMap[key] = { text: t, type, count: 1 };
          }
        }
      });
    };

    addEntities(doc.people().json(), 'PERSON');
    addEntities(doc.places().json(), 'PLACE');
    addEntities(doc.organizations().json(), 'ORGANIZATION');
    addEntities(doc.topics().json(), 'TOPIC');

    return Object.values(entityMap)
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);
  } catch (error) {
    return [];
  }
};

/**
 * Classify document topic/category
 */
const classifyDocument = (text, keywords) => {
  if (!text) return { category: 'other', topics: [] };

  const textLower = text.toLowerCase();
  const keywordWords = keywords.map(k => k.word);

  const categories = {
    medical: ['patient', 'diagnosis', 'treatment', 'medical', 'health', 'disease', 'doctor', 'hospital', 'clinical', 'medicine', 'symptom', 'therapy'],
    legal: ['law', 'court', 'legal', 'contract', 'agreement', 'plaintiff', 'defendant', 'attorney', 'jurisdiction', 'statute', 'liability', 'clause'],
    financial: ['revenue', 'profit', 'loss', 'investment', 'financial', 'budget', 'cost', 'expense', 'income', 'tax', 'balance', 'asset', 'equity'],
    technical: ['software', 'algorithm', 'system', 'code', 'function', 'database', 'network', 'server', 'api', 'technology', 'programming', 'data'],
    academic: ['research', 'study', 'analysis', 'hypothesis', 'methodology', 'conclusion', 'abstract', 'literature', 'theory', 'experiment', 'findings'],
    business: ['company', 'business', 'market', 'strategy', 'management', 'customer', 'product', 'service', 'sales', 'growth', 'team', 'project'],
    news: ['reported', 'according', 'announced', 'government', 'official', 'statement', 'press', 'media', 'news', 'journalist', 'published'],
    personal: ['personal', 'family', 'friend', 'home', 'life', 'experience', 'feeling', 'memory', 'story', 'diary', 'letter']
  };

  const scores = {};
  Object.entries(categories).forEach(([cat, catKeywords]) => {
    let score = 0;
    catKeywords.forEach(kw => {
      if (textLower.includes(kw)) score += 2;
      if (keywordWords.includes(kw)) score += 3;
    });
    scores[cat] = score;
  });

  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const topCategory = sorted[0][1] > 0 ? sorted[0][0] : 'other';

  const topics = sorted
    .filter(([, score]) => score > 0)
    .slice(0, 3)
    .map(([name, score]) => ({
      name,
      confidence: parseFloat(Math.min(score / 20, 1).toFixed(2)),
      keywords: categories[name].filter(kw => textLower.includes(kw)).slice(0, 5)
    }));

  return { category: topCategory, topics };
};

/**
 * Generate a summary of the text
 */
const generateSummary = (text, maxSentences = 5) => {
  if (!text || !text.trim()) return 'No content available for summarization.';

  try {
    const sentences = sentenceTokenizer.tokenize(text) || [];
    if (sentences.length <= maxSentences) return text.trim();

    const tfidf = new TfIdf();
    sentences.forEach(s => tfidf.addDocument(s));

    const scores = sentences.map((sentence, i) => {
      let score = 0;
      tfidf.listTerms(i).forEach(term => { score += term.tfidf; });
      // Boost first and last sentences
      if (i === 0 || i === sentences.length - 1) score *= 1.5;
      return { sentence, score, index: i };
    });

    const topSentences = scores
      .sort((a, b) => b.score - a.score)
      .slice(0, maxSentences)
      .sort((a, b) => a.index - b.index)
      .map(s => s.sentence);

    return topSentences.join(' ');
  } catch (error) {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
    return sentences.slice(0, maxSentences).join('. ') + '.';
  }
};

/**
 * Generate smart highlights
 */
const generateHighlights = (text, keywords) => {
  if (!text || keywords.length === 0) return [];

  const sentences = sentenceTokenizer.tokenize(text) || [];
  const topKeywords = keywords.slice(0, 10).map(k => k.word);

  const highlights = sentences
    .filter(sentence => {
      const lower = sentence.toLowerCase();
      return topKeywords.some(kw => lower.includes(kw));
    })
    .slice(0, 5)
    .map(s => s.trim());

  return highlights;
};

/**
 * Detect language (basic detection)
 */
const detectLanguage = (text) => {
  if (!text) return 'en';
  // Simple heuristic - could be enhanced with langdetect library
  const sample = text.substring(0, 500).toLowerCase();
  if (/[àáâãäåæçèéêëìíîïðñòóôõöùúûüý]/.test(sample)) return 'fr';
  if (/[äöüß]/.test(sample)) return 'de';
  if (/[áéíóúüñ¿¡]/.test(sample)) return 'es';
  return 'en';
};

/**
 * Full NLP analysis pipeline
 */
const analyzeText = (text) => {
  const statistics = getStatistics(text);
  const keywords = extractKeywords(text);
  const sentiment = analyzeSentiment(text);
  const entities = extractEntities(text);
  const { category, topics } = classifyDocument(text, keywords);
  const summary = generateSummary(text);
  const highlights = generateHighlights(text, keywords);
  const language = detectLanguage(text);

  return {
    summary,
    keywords,
    sentiment,
    topics,
    entities,
    statistics,
    category,
    highlights,
    language
  };
};

module.exports = {
  analyzeText,
  getStatistics,
  extractKeywords,
  analyzeSentiment,
  extractEntities,
  classifyDocument,
  generateSummary,
  generateHighlights,
  detectLanguage
};
