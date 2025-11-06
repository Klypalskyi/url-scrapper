import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import { analyzeWebsite } from './agent';
import { cache } from './cache';
import { ApiResponse, WebsiteInfo } from './types';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Validation helper
function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// Normalize URL to cache key
function getCacheKey(url: string): string {
  try {
    const urlObj = new URL(url);
    return `${urlObj.protocol}//${urlObj.hostname}${urlObj.pathname}`.toLowerCase();
  } catch {
    return url.toLowerCase();
  }
}

// POST /analyze-website
app.post('/analyze-website', async (req: Request, res: Response): Promise<void> => {
  const { url } = req.body;

  // Validate input
  if (!url) {
    const errorResponse: ApiResponse = {
      success: false,
      error: 'URL is required',
    };
    res.status(400).json(errorResponse);
    return;
  }

  if (!isValidUrl(url)) {
    const errorResponse: ApiResponse = {
      success: false,
      error: 'Invalid URL format',
    };
    res.status(400).json(errorResponse);
    return;
  }

  try {
    const cacheKey = getCacheKey(url);

    // Check cache
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      const response: ApiResponse = {
        success: true,
        data: cachedData,
        cached: true,
      };
      res.status(200).json(response);
      return;
    }

    // Analyze website using agent
    const websiteInfo: WebsiteInfo = await analyzeWebsite(url);

    // Store in cache
    cache.set(cacheKey, websiteInfo);

    const response: ApiResponse = {
      success: true,
      data: websiteInfo,
      cached: false,
    };

    res.status(200).json(response);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

    const errorResponse: ApiResponse = {
      success: false,
      error: errorMessage,
    };

    res.status(500).json(errorResponse);
  }
});

// GET / - Health check
app.get('/', (req: Request, res: Response): void => {
  res.json({
    message: 'Website Analysis API is running',
    endpoints: {
      analyze: 'POST /analyze-website',
    },
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`OpenAI API Key: ${process.env.OPEN_AI_API_KEY ? 'Loaded' : 'NOT FOUND'}`);
});
