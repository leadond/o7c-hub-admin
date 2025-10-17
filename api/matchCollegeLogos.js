import fs from 'fs';
import axios from 'axios';

// Load the official NCAA college logos
const ncaaLogos = JSON.parse(fs.readFileSync('public/collegeLogos.json', 'utf8'));

// Normalize college names for better matching
function normalizeName(name) {
  return name.toLowerCase()
    .trim()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ');
}

// Calculate Levenshtein distance between two strings
function levenshteinDistance(a, b) {
  const matrix = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

// Calculate similarity score (0-1, where 1 is perfect match)
function calculateSimilarity(str1, str2) {
  const maxLength = Math.max(str1.length, str2.length);
  if (maxLength === 0) return 1;
  const distance = levenshteinDistance(str1, str2);
  return 1 - (distance / maxLength);
}

// Find the best logo match for a college name
function findLogoMatch(collegeName, logos) {
  const normalizedInput = normalizeName(collegeName);

  // First try exact match against main name
  let match = logos.find(logo => normalizeName(logo.name) === normalizedInput);
  if (match) return match;

  // Try exact match against alternative names
  match = logos.find(logo =>
    logo.alternativeNames &&
    logo.alternativeNames.some(alt => normalizeName(alt) === normalizedInput)
  );
  if (match) return match;

  // Try partial matches against main name (only if input is significantly shorter)
  match = logos.find(logo => {
    const logoNorm = normalizeName(logo.name);
    return logoNorm.includes(normalizedInput) && normalizedInput.length >= 3 && logoNorm.length > normalizedInput.length + 2;
  });
  if (match) return match;

  // Try partial matches against alternative names (only if input is significantly shorter)
  match = logos.find(logo =>
    logo.alternativeNames &&
    logo.alternativeNames.some(alt => {
      const altNorm = normalizeName(alt);
      return altNorm.includes(normalizedInput) && normalizedInput.length >= 3 && altNorm.length > normalizedInput.length + 2;
    })
  );
  if (match) return match;

  // Skip reverse partial matching for now as it causes false positives

  // Try word-based matching against main name (require at least 2 matching words)
  const inputWords = normalizedInput.split(' ');
  match = logos.find(logo => {
    const logoWords = normalizeName(logo.name).split(' ');
    const matchingWords = inputWords.filter(word => logoWords.includes(word));
    return matchingWords.length >= 2;
  });
  if (match) return match;

  // Try word-based matching against alternative names (require at least 2 matching words)
  match = logos.find(logo => {
    if (!logo.alternativeNames) return false;
    return logo.alternativeNames.some(alt => {
      const altWords = normalizeName(alt).split(' ');
      const matchingWords = inputWords.filter(word => altWords.includes(word));
      return matchingWords.length >= 2;
    });
  });
  if (match) return match;

  // Fuzzy matching with similarity scoring against main name
  let bestMatch = null;
  let bestScore = 0;
  const similarityThreshold = 0.8; // Increased threshold for better accuracy

  for (const logo of logos) {
    const normalizedLogoName = normalizeName(logo.name);
    const score = calculateSimilarity(normalizedInput, normalizedLogoName);

    if (score > bestScore && score >= similarityThreshold) {
      bestScore = score;
      bestMatch = logo;
    }
  }

  // Fuzzy matching against alternative names
  for (const logo of logos) {
    if (!logo.alternativeNames) continue;

    for (const alt of logo.alternativeNames) {
      const normalizedAlt = normalizeName(alt);
      const score = calculateSimilarity(normalizedInput, normalizedAlt);

      if (score > bestScore && score >= similarityThreshold) {
        bestScore = score;
        bestMatch = logo;
      }
    }
  }

  return bestMatch;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('Starting college logo matching...');

    // Get API key from environment
    const apiKey = process.env.BASE44_API_KEY;
    if (!apiKey) {
      console.error('BASE44_API_KEY environment variable not set');
      return res.status(500).json({ error: 'BASE44_API_KEY not configured' });
    }

    // First, fetch all players to get commitments
    console.log('Fetching players to get commitments...');
    const playersResponse = await axios.get('https://app.base44.com/api/apps/68dff8e465ce1507be45d1b0/entities/Player', {
      headers: {
        'api_key': apiKey,
        'Content-Type': 'application/json'
      }
    });

    const players = playersResponse.data || [];
    console.log(`Found ${players.length} players`);

    // Get unique commitments (college names that players have committed to)
    const commitments = [...new Set(
      players
        .map(player => player.commitment)
        .filter(commitment => commitment && commitment.trim() !== '')
    )];
    console.log(`Found ${commitments.length} unique commitments`);

    const matchedCommitments = [];
    const unmatchedCommitments = [];

    // Match each commitment directly with a logo
    for (const commitment of commitments) {
      const logoMatch = findLogoMatch(commitment, ncaaLogos);

      if (logoMatch) {
        matchedCommitments.push({
          commitment: commitment,
          logo_url: logoMatch.logo,
          matched_name: logoMatch.name
        });
        console.log(`✓ Matched: ${commitment} -> ${logoMatch.name}`);
      } else {
        unmatchedCommitments.push({
          commitment: commitment
        });
        console.log(`✗ No match: ${commitment}`);
      }
    }

    console.log(`\nMatching complete:`);
    console.log(`- ${matchedCommitments.length} commitments matched with logos`);
    console.log(`- ${unmatchedCommitments.length} commitments without matches`);

    // Return results
    res.status(200).json({
      success: true,
      matchedCommitments,
      unmatchedCommitments,
      summary: {
        total: commitments.length,
        matched: matchedCommitments.length,
        unmatched: unmatchedCommitments.length
      }
    });

  } catch (error) {
    console.error('Error during matching:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}