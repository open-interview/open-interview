/**
 * Web Search Utility
 * Uses Tavily or Exa API for searching real-world use cases
 */

const TAVILY_API_KEY = process.env.TAVILY_API_KEY;
const EXA_API_KEY = process.env.EXA_API_KEY;

export async function webSearch(query, options = {}) {
  const { numResults = 5, channel } = options;

  // Try Tavily first
  if (TAVILY_API_KEY) {
    try {
      return await tavilySearch(query, numResults);
    } catch (err) {
      console.log(`   ⚠️ Tavily failed: ${err.message}`);
    }
  }

  // Fallback to Exa
  if (EXA_API_KEY) {
    try {
      return await exaSearch(query, numResults);
    } catch (err) {
      console.log(`   ⚠️ Exa failed: ${err.message}`);
    }
  }

  // Fallback to DuckDuckGo (no API key needed)
  try {
    return await duckduckgoSearch(query, numResults);
  } catch (err) {
    console.log(`   ⚠️ DuckDuckGo failed: ${err.message}`);
  }

  return [];
}

/**
 * Tavily Search
 */
async function tavilySearch(query, numResults) {
  const response = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      api_key: TAVILY_API_KEY,
      query,
      search_depth: 'basic',
      max_results: numResults,
      include_answer: false,
      include_raw_content: false
    })
  });

  if (!response.ok) {
    throw new Error(`Tavily error: ${response.status}`);
  }

  const data = await response.json();
  return data.results.map(r => ({
    title: r.title,
    url: r.url,
    snippet: r.content,
    score: r.score
  }));
}

/**
 * Exa Search
 */
async function exaSearch(query, numResults) {
  const response = await fetch('https://api.exa.ai/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': EXA_API_KEY
    },
    body: JSON.stringify({
      query,
      numResults,
      type: 'article'
    })
  });

  if (!response.ok) {
    throw new Error(`Exa error: ${response.status}`);
  }

  const data = await response.json();
  return data.results.map(r => ({
    title: r.title,
    url: r.url,
    snippet: r.snippet,
    score: r.score
  }));
}

/**
 * DuckDuckGo Search (fallback)
 */
async function duckduckgoSearch(query, numResults) {
  const response = await fetch(
    `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_redirect=1`,
    { headers: { 'User-Agent': 'Mozilla/5.0' } }
  );

  if (!response.ok) {
    throw new Error(`DuckDuckGo error: ${response.status}`);
  }

  const data = await response.json();
  
  // DuckDuckGo Instant Answer API has limited results, supplement with RelatedTopics
  const results = [];
  
  if (data.AbstractText) {
    results.push({
      title: data.Heading || query,
      url: data.AbstractURL || '',
      snippet: data.AbstractText,
      score: 0.9
    });
  }

  if (data.RelatedTopics) {
    for (const topic of data.RelatedTopics.slice(0, numResults - results.length)) {
      if (topic.Text && topic.FirstURL) {
        results.push({
          title: topic.Text.substring(0, 100),
          url: topic.FirstURL,
          snippet: topic.Text,
          score: 0.5
        });
      }
    }
  }

  return results;
}

export default { webSearch };
