const OpenAI = require('openai');

let openaiClient = null;

const getClient = () => {
  if (!openaiClient) {
    openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openaiClient;
};

/**
 * Truncate text to a safe token limit (~3000 words ≈ 4000 tokens)
 */
const truncateText = (text, maxWords = 3000) => {
  const words = text.split(/\s+/);
  if (words.length <= maxWords) return text;
  return words.slice(0, maxWords).join(' ') + '\n\n[Document truncated for analysis...]';
};

/**
 * Generate AI-powered document analysis using GPT
 */
const analyzeWithOpenAI = async (text, fileName = '') => {
  const client = getClient();
  const truncated = truncateText(text);

  const prompt = `You are an expert document analyst. Analyze the following document and return a JSON response with these exact fields:

{
  "summary": "A clear, concise 3-5 sentence summary of the document",
  "keywords": [{"word": "keyword", "frequency": 5, "relevance": 0.95}],
  "sentiment": {
    "label": "positive|negative|neutral",
    "score": 0.2,
    "positive": 45.0,
    "negative": 15.0,
    "neutral": 40.0
  },
  "topics": [{"name": "topic name", "confidence": 0.85, "keywords": ["kw1", "kw2"]}],
  "entities": [{"text": "entity name", "type": "PERSON|ORGANIZATION|PLACE|DATE|TOPIC", "count": 3}],
  "category": "business|legal|medical|technical|academic|financial|news|personal|other",
  "highlights": ["Key insight 1", "Key insight 2", "Key insight 3"],
  "language": "en",
  "readingLevel": "elementary|intermediate|advanced|expert",
  "tone": "formal|informal|technical|conversational|persuasive|informative"
}

Rules:
- Return ONLY valid JSON, no markdown, no explanation
- keywords: top 15 most important terms with frequency count and relevance 0-1
- topics: top 3 main topics with confidence 0-1
- entities: up to 15 named entities
- highlights: 3-5 most important sentences or insights from the document
- sentiment percentages must sum to 100

Document filename: ${fileName}

Document content:
${truncated}`;

  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.3,
    max_tokens: 2000,
    response_format: { type: 'json_object' }
  });

  const raw = response.choices[0].message.content;
  return JSON.parse(raw);
};

/**
 * Generate a detailed summary with OpenAI
 */
const generateSummary = async (text, style = 'concise') => {
  const client = getClient();
  const truncated = truncateText(text, 4000);

  const stylePrompts = {
    concise: 'Write a concise 3-5 sentence summary.',
    detailed: 'Write a detailed paragraph summary covering all main points.',
    bullets: 'Write a bullet-point summary with 5-7 key points.'
  };

  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{
      role: 'user',
      content: `${stylePrompts[style] || stylePrompts.concise}\n\nDocument:\n${truncated}`
    }],
    temperature: 0.4,
    max_tokens: 500
  });

  return response.choices[0].message.content.trim();
};

/**
 * Answer a question about the document
 */
const askQuestion = async (text, question) => {
  const client = getClient();
  const truncated = truncateText(text, 3000);

  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'You are a helpful document assistant. Answer questions based only on the provided document content. Be concise and accurate.'
      },
      {
        role: 'user',
        content: `Document:\n${truncated}\n\nQuestion: ${question}`
      }
    ],
    temperature: 0.3,
    max_tokens: 600
  });

  return response.choices[0].message.content.trim();
};

/**
 * Full analysis pipeline — OpenAI first, fallback to NLP if it fails
 */
const analyzeDocument = async (text, fileName = '') => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('No OpenAI API key configured');
    }
    console.log(`🤖 Running OpenAI analysis for: ${fileName}`);
    const result = await analyzeWithOpenAI(text, fileName);

    // Normalize and validate the response
    return {
      summary: result.summary || '',
      keywords: (result.keywords || []).slice(0, 20).map(k => ({
        word: String(k.word || '').toLowerCase(),
        frequency: parseInt(k.frequency) || 1,
        relevance: parseFloat(k.relevance) || 0.5
      })),
      sentiment: {
        label: ['positive', 'negative', 'neutral'].includes(result.sentiment?.label)
          ? result.sentiment.label : 'neutral',
        score: parseFloat(result.sentiment?.score) || 0,
        positive: parseFloat(result.sentiment?.positive) || 33.3,
        negative: parseFloat(result.sentiment?.negative) || 33.3,
        neutral: parseFloat(result.sentiment?.neutral) || 33.4
      },
      topics: (result.topics || []).slice(0, 5).map(t => ({
        name: String(t.name || ''),
        confidence: parseFloat(t.confidence) || 0.5,
        keywords: Array.isArray(t.keywords) ? t.keywords.slice(0, 5) : []
      })),
      entities: (result.entities || []).slice(0, 20).map(e => ({
        text: String(e.text || ''),
        type: String(e.type || 'TOPIC'),
        count: parseInt(e.count) || 1
      })),
      category: result.category || 'other',
      highlights: (result.highlights || []).slice(0, 5),
      language: result.language || 'en',
      readingLevel: result.readingLevel || 'intermediate',
      tone: result.tone || 'informative',
      aiPowered: true
    };
  } catch (error) {
    console.warn(`⚠️  OpenAI analysis failed (${error.message}), falling back to local NLP`);
    return null; // caller will use local NLP fallback
  }
};

module.exports = { analyzeDocument, generateSummary, askQuestion };
