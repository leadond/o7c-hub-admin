// Vercel API function for documentation Q&A using HuggingFace AI
// Provides intelligent answers about the O7C Hub application using comprehensive documentation

import { InferenceClient } from '@huggingface/inference';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';
// Simple error sanitization
function sanitizeErrorMessage(message) {
  return message?.replace(/hf_[a-zA-Z0-9]{34}/g, '[REDACTED_TOKEN]') || 'Unknown error';
}

// Simple logger
const logger = {
  info: (msg, data) => console.log(`[INFO] ${msg}`, data),
  warn: (msg, data) => console.warn(`[WARN] ${msg}`, data),
  error: (msg, data) => console.error(`[ERROR] ${msg}`, data),
  authEvent: (event, data) => console.log(`[AUTH] ${event}`, data)
};

// Create secure logger for this component
const logger = createSecureLogger('Documentation Q&A');

/**
 * Gets Hugging Face API token from environment variables
 */
function getHuggingFaceToken() {
  return process.env.HUGGINGFACE_API_TOKEN || process.env.VITE_HUGGINGFACE_API_TOKEN || null;
}

/**
 * Recursively reads all documentation files and builds a knowledge base
 */
function buildDocumentationKnowledgeBase() {
  const docsPath = join(process.cwd(), 'docs');
  const knowledgeBase = {
    sections: [],
    content: '',
    metadata: {}
  };

  function readDocsRecursively(dirPath, currentPath = '') {
    try {
      const items = readdirSync(dirPath);

      for (const item of items) {
        const fullPath = join(dirPath, item);
        const stat = statSync(fullPath);
        const relativePath = join(currentPath, item);

        if (stat.isDirectory()) {
          readDocsRecursively(fullPath, relativePath);
        } else if (stat.isFile() && ['.md', '.json'].includes(extname(item))) {
          try {
            const content = readFileSync(fullPath, 'utf8');
            const section = {
              path: relativePath,
              title: extractTitle(content),
              content: content,
              type: extname(item).slice(1),
              lastModified: stat.mtime.toISOString()
            };

            knowledgeBase.sections.push(section);
            knowledgeBase.content += `\n\n=== ${relativePath} ===\n${content}`;
          } catch (error) {
            logger.warn('Error reading documentation file', {
              file: relativePath,
              error: sanitizeErrorMessage(error.message)
            });
          }
        }
      }
    } catch (error) {
      logger.error('Error reading docs directory', {
        directory: dirPath,
        error: sanitizeErrorMessage(error.message)
      });
    }
  }

  readDocsRecursively(docsPath);
  knowledgeBase.metadata = {
    totalSections: knowledgeBase.sections.length,
    lastUpdated: new Date().toISOString(),
    totalContentLength: knowledgeBase.content.length
  };

  return knowledgeBase;
}

/**
 * Extracts title from markdown content
 */
function extractTitle(content) {
  const lines = content.split('\n');
  for (const line of lines) {
    if (line.startsWith('# ')) {
      return line.substring(2).trim();
    }
  }
  return 'Untitled';
}

/**
 * Searches documentation for relevant sections based on query
 */
function searchDocumentation(query, knowledgeBase) {
  const queryLower = query.toLowerCase();
  const relevantSections = [];

  for (const section of knowledgeBase.sections) {
    const contentLower = section.content.toLowerCase();
    const titleLower = section.title.toLowerCase();

    // Calculate relevance score
    let score = 0;

    // Exact phrase matches get highest score
    if (contentLower.includes(queryLower)) {
      score += 10;
    }

    // Title matches get high score
    if (titleLower.includes(queryLower)) {
      score += 5;
    }

    // Individual word matches
    const queryWords = queryLower.split(/\s+/);
    for (const word of queryWords) {
      if (word.length > 2) {
        if (contentLower.includes(word)) {
          score += 1;
        }
        if (titleLower.includes(word)) {
          score += 2;
        }
      }
    }

    if (score > 0) {
      relevantSections.push({
        ...section,
        relevanceScore: score
      });
    }
  }

  // Sort by relevance and return top matches
  return relevantSections
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, 5);
}

/**
 * Builds a context string from relevant documentation sections
 */
function buildContextFromSections(sections, maxLength = 4000) {
  let context = '';
  let currentLength = 0;

  for (const section of sections) {
    const sectionText = `\n\n[${section.path}]\n${section.title}\n${section.content}`;
    if (currentLength + sectionText.length <= maxLength) {
      context += sectionText;
      currentLength += sectionText.length;
    } else {
      // Add truncated version if it fits
      const remainingSpace = maxLength - currentLength;
      if (remainingSpace > 200) {
        context += sectionText.substring(0, remainingSpace - 10) + '...';
      }
      break;
    }
  }

  return context;
}

export default async function handler(req, res) {
  // Only allow POST method for security
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    const { question, context: additionalContext = '' } = req.body;

    if (!question || typeof question !== 'string') {
      return res.status(400).json({ error: 'Missing required parameter: question' });
    }

    const apiToken = getHuggingFaceToken();
    if (!apiToken) {
      logger.error('API token not configured');
      return res.status(500).json({
        error: 'HuggingFace API token not configured',
        errorCode: 'MISSING_TOKEN'
      });
    }

    // Simple token validation
    if (!apiToken.startsWith('hf_') || apiToken.length !== 37) {
      logger.authEvent('token_validation_failed', {
        error: 'INVALID_TOKEN_FORMAT',
        service: 'huggingface'
      });
      return res.status(500).json({
        error: 'Invalid HuggingFace API token format',
        errorCode: 'INVALID_TOKEN_FORMAT'
      });
    }

    // Build documentation knowledge base
    const knowledgeBase = buildDocumentationKnowledgeBase();

    // Search for relevant documentation
    const relevantSections = searchDocumentation(question, knowledgeBase);

    // Build context from relevant sections
    const documentationContext = buildContextFromSections(relevantSections);

    // Create HuggingFace client
    const client = new InferenceClient(apiToken);

    // Build comprehensive prompt
    const systemPrompt = `You are an expert documentation assistant for the O7C Hub application, a comprehensive recruiting and athlete management platform.

Your role is to provide accurate, helpful answers about the O7C Hub application based on the provided documentation. Always be:

1. ACCURATE: Only provide information that is supported by the documentation
2. HELPFUL: Structure answers clearly with step-by-step instructions when appropriate
3. CONTEXT-AWARE: Reference specific sections, features, or guides from the documentation
4. USER-FRIENDLY: Use clear language and avoid jargon unless explaining it

If you cannot find specific information in the documentation, acknowledge this and suggest where the user might find more information or contact support.

Documentation Context:
${documentationContext}

${additionalContext ? `Additional Context:\n${additionalContext}` : ''}`;

    const prompt = `${systemPrompt}

Question: ${question}

Please provide a comprehensive answer based on the O7C Hub documentation above. Include specific references to relevant sections when possible.`;

    logger.info('Processing documentation Q&A request', {
      questionLength: question.length,
      relevantSectionsFound: relevantSections.length,
      contextLength: documentationContext.length
    });

    // Make request to HuggingFace
    const startTime = Date.now();
    const result = await client.textGeneration({
      model: 'google/flan-t5-large',
      inputs: prompt,
      parameters: {
        max_new_tokens: 512,
        temperature: 0.3,
        do_sample: true,
        wait_for_model: true
      }
    });
    const duration = Date.now() - startTime;

    const responseContent = result.generated_text?.trim() || '';

    logger.info('Documentation Q&A response generated', {
      duration: duration,
      responseLength: responseContent.length
    });

    // Return response with metadata
    return res.status(200).json({
      success: true,
      answer: responseContent,
      metadata: {
        question: question,
        relevantSections: relevantSections.map(s => ({
          path: s.path,
          title: s.title,
          relevanceScore: s.relevanceScore
        })),
        knowledgeBaseStats: knowledgeBase.metadata,
        processingTime: duration
      },
      model: 'google/flan-t5-large',
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Documentation Q&A request failed', {
      error: sanitizeErrorMessage(error.message),
      question: req.body?.question?.substring(0, 100)
    });

    // Handle specific errors
    if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
      return res.status(401).json({
        success: false,
        error: 'Authentication failed with HuggingFace API',
        errorCode: 'UNAUTHORIZED'
      });
    }

    if (error.message?.includes('429')) {
      return res.status(429).json({
        success: false,
        error: 'Rate limit exceeded',
        errorCode: 'RATE_LIMITED'
      });
    }

    return res.status(500).json({
      success: false,
      error: sanitizeErrorMessage(error.message),
      errorCode: 'API_ERROR'
    });
  }
}