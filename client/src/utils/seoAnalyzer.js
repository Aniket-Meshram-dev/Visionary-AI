/**
 * SEO & Readability Analytical Engine
 * Evaluates Flesch-Kincaid Reading Ease, Keyword Density, Heading Distribution, and Read Time.
 */

// Helper to estimate syllables in an English word
const countSyllables = (word) => {
  const clean = word.toLowerCase().replace(/[^a-z]/g, '');
  if (!clean || clean.length <= 3) return 1;

  // Syllable regex heuristic
  const syllableMatches = clean
    .replace(/(?:[^laeiouy]|ed|es|e)$/, '')
    .replace(/^y/, '')
    .match(/[aeiouy]{1,2}/g);

  return syllableMatches ? Math.max(1, syllableMatches.length) : 1;
};

export const analyzeArticleSeo = (markdownContent = '', targetKeyword = '') => {
  if (!markdownContent || typeof markdownContent !== 'string') {
    return {
      wordCount: 0,
      charCount: 0,
      sentenceCount: 0,
      readingTimeMin: 0,
      fleschScore: 0,
      fleschGrade: 'N/A',
      fleschColor: 'slate',
      keywordDensity: 0,
      keywordCount: 0,
      keywordStatus: 'Missing',
      headings: { h1: 0, h2: 0, h3: 0 },
      overallHealthScore: 0,
      auditChecks: [],
    };
  }

  // 1. Clean plain text (strip markdown tokens)
  const plainText = markdownContent
    .replace(/^#+\s+/gm, '') // headings
    .replace(/(\*\*|__)(.*?)\1/g, '$2') // bold
    .replace(/(\*|_)(.*?)\1/g, '$2') // italic
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // links
    .replace(/`{1,3}[^`\n]+`{1,3}/g, '') // code
    .replace(/>\s+/g, '') // blockquotes
    .replace(/[-*+]\s+/g, '') // list markers
    .trim();

  // 2. Tokenize words & sentences
  const words = plainText.split(/\s+/).filter((w) => w.length > 0);
  const wordCount = words.length;
  const charCount = plainText.length;

  // Split by terminal punctuation (.!?)
  const sentences = plainText
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 3);
  const sentenceCount = Math.max(1, sentences.length);

  // 3. Flesch-Kincaid Reading Ease calculation
  // Formula: 206.835 - (1.015 * ASL) - (84.6 * ASW)
  // ASL = Average Sentence Length (words / sentence)
  // ASW = Average Syllables per Word (syllables / word)
  let totalSyllables = 0;
  for (let i = 0; i < words.length; i++) {
    totalSyllables += countSyllables(words[i]);
  }

  const asl = wordCount > 0 ? wordCount / sentenceCount : 0;
  const asw = wordCount > 0 ? totalSyllables / wordCount : 0;

  let rawFlesch = 206.835 - 1.015 * asl - 84.6 * asw;
  rawFlesch = Math.min(100, Math.max(0, Math.round(rawFlesch)));

  let fleschGrade = 'Standard';
  let fleschColor = 'emerald';
  if (rawFlesch >= 80) {
    fleschGrade = 'Very Easy / Fluent';
    fleschColor = 'emerald';
  } else if (rawFlesch >= 65) {
    fleschGrade = 'Conversational & Engaging';
    fleschColor = 'emerald';
  } else if (rawFlesch >= 50) {
    fleschGrade = 'Professional / Thought Leadership';
    fleschColor = 'blue';
  } else if (rawFlesch >= 30) {
    fleschGrade = 'Complex / Technical';
    fleschColor = 'amber';
  } else {
    fleschGrade = 'Very Dense / Academic';
    fleschColor = 'rose';
  }

  // 4. Keyword Density
  let keywordCount = 0;
  let keywordDensity = 0;
  let keywordStatus = 'None Specified';

  const cleanKeyword = targetKeyword.trim().toLowerCase();
  if (cleanKeyword && wordCount > 0) {
    const regex = new RegExp(`\\b${cleanKeyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
    const matches = plainText.match(regex);
    keywordCount = matches ? matches.length : 0;
    keywordDensity = Number(((keywordCount / wordCount) * 100).toFixed(2));

    if (keywordCount === 0) {
      keywordStatus = 'Not Detected in Content';
    } else if (keywordDensity < 0.8) {
      keywordStatus = 'Under-optimized (< 0.8%)';
    } else if (keywordDensity <= 2.5) {
      keywordStatus = 'Optimal SEO Range (1.0% - 2.5%)';
    } else {
      keywordStatus = 'Over-optimized / Keyword Stuffing (> 2.5%)';
    }
  }

  // 5. Heading Analysis
  const h1Matches = markdownContent.match(/^#\s+[^\n]+/gm) || [];
  const h2Matches = markdownContent.match(/^##\s+[^\n]+/gm) || [];
  const h3Matches = markdownContent.match(/^###\s+[^\n]+/gm) || [];

  const headings = {
    h1: h1Matches.length,
    h2: h2Matches.length,
    h3: h3Matches.length,
  };

  // 6. Overall Health Score (0 - 100)
  let healthScore = 0;

  // Length points (max 30)
  if (wordCount >= 600) healthScore += 30;
  else if (wordCount >= 300) healthScore += 20;
  else if (wordCount >= 100) healthScore += 10;

  // Readability points (max 30)
  if (rawFlesch >= 50 && rawFlesch <= 85) healthScore += 30;
  else if (rawFlesch >= 35) healthScore += 20;
  else healthScore += 10;

  // Heading structure points (max 20)
  if (headings.h1 >= 1 && headings.h2 >= 2) healthScore += 20;
  else if (headings.h1 >= 1 || headings.h2 >= 1) healthScore += 12;

  // Keyword points (max 20)
  if (cleanKeyword) {
    if (keywordDensity >= 0.8 && keywordDensity <= 2.5) healthScore += 20;
    else if (keywordCount > 0) healthScore += 10;
  } else {
    // If no keyword specified, default 15 points
    healthScore += 15;
  }

  healthScore = Math.min(100, Math.max(0, healthScore));

  // 7. Audit Checks for Checklist UI
  const auditChecks = [
    {
      label: 'Optimal Article Length',
      passed: wordCount >= 500,
      info: wordCount >= 500 ? `${wordCount} words (ideal for indexing)` : `${wordCount} words (aim for 500+)`,
    },
    {
      label: 'Readability Ease',
      passed: rawFlesch >= 50,
      info: `${rawFlesch}/100 — ${fleschGrade}`,
    },
    {
      label: 'Structured H2 Subheadings',
      passed: headings.h2 >= 2,
      info: headings.h2 >= 2 ? `${headings.h2} H2 sections found` : 'Add at least 2 H2 subheadings',
    },
    {
      label: 'Clean H1 Title',
      passed: headings.h1 === 1,
      info: headings.h1 === 1 ? 'Single H1 headline present' : headings.h1 === 0 ? 'Missing H1 title' : 'Multiple H1s found',
    },
  ];

  if (cleanKeyword) {
    auditChecks.push({
      label: `Keyword "${cleanKeyword}"`,
      passed: keywordDensity >= 0.8 && keywordDensity <= 2.8,
      info: `${keywordCount} matches (${keywordDensity}%) • ${keywordStatus}`,
    });
  }

  const readingTimeMin = Math.max(1, Math.ceil(wordCount / 200));

  return {
    wordCount,
    charCount,
    sentenceCount,
    readingTimeMin,
    fleschScore: rawFlesch,
    fleschGrade,
    fleschColor,
    keywordDensity,
    keywordCount,
    keywordStatus,
    headings,
    overallHealthScore: healthScore,
    auditChecks,
  };
};
