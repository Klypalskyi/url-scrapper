import OpenAI from 'openai';
import { WebsiteInfo } from './types';
import dotenv from 'dotenv';

dotenv.config();

const client = new OpenAI({
  apiKey: process.env.OPEN_AI_API_KEY,
});

const TIMEOUT = 30000; // 30 seconds timeout

export async function analyzeWebsite(url: string): Promise<WebsiteInfo> {
  try {
    const response = await Promise.race([
      executeAgent(url),
      new Promise<WebsiteInfo>((_, reject) =>
        setTimeout(() => reject(new Error('Agent timeout')), TIMEOUT)
      ),
    ]);
    return response;
  } catch (error) {
    throw new Error(`Failed to analyze website: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function executeAgent(url: string): Promise<WebsiteInfo> {
  const prompt = `You are a web research agent. Analyze this website and extract structured business information.

Website URL: ${url}

Extract and respond with ONLY a valid JSON object (no markdown, no code blocks, no additional text) in this exact format:
{
  "name": "company name",
  "description": "brief description",
  "website": "url",
  "contact": {
    "email": "email or null",
    "phone": "phone or null"
  },
  "socialMedia": {
    "linkedin": "url or null",
    "twitter": "url or null",
    "facebook": "url or null",
    "instagram": "url or null",
    "youtube": "url or null"
  },
  "registrationNumber": "registration number or null"
}

Task:
1. Use web_search tool to visit and analyze the website
2. Extract company name, description, contact info
3. Find all social media profiles (LinkedIn, Twitter, Facebook, Instagram, YouTube)
4. Look for business registration number if available
5. Return ONLY the JSON object with all extracted information`;

  console.log('[AGENT] Starting analysis for:', url);

  // Use Responses API (simplified from OpenAI docs)
  const response = await (client as unknown as Record<string, Record<string, Function>>).responses.create({
    model: 'gpt-5',
    tools: [
      {
        type: 'web_search',
      },
    ],
    input: prompt,
  });

  console.log('[AGENT] Response received');

  // Extract the text content from response
  const textContent = ((response as unknown as Record<string, unknown>).content as string) || '';

  console.log('[DEBUG] Agent response:', textContent);

  // Parse JSON from response - handle markdown code blocks too
  let jsonMatch = textContent.match(/\{[\s\S]*\}/);

  if (!jsonMatch) {
    // Try to find JSON in markdown code blocks
    jsonMatch = textContent.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
    if (jsonMatch) {
      jsonMatch[0] = jsonMatch[1];
    }
  }

  if (!jsonMatch) {
    console.error('[ERROR] Could not find JSON in response:', textContent);
    throw new Error(`Failed to extract structured data from agent response. Response was: "${textContent}"`);
  }

  let parsedData: Record<string, unknown>;
  try {
    parsedData = JSON.parse(jsonMatch[0]) as Record<string, unknown>;
  } catch (parseError) {
    console.error('[ERROR] Failed to parse JSON:', jsonMatch[0]);
    throw new Error(`Failed to parse JSON from agent response: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
  }

  return {
    name: (parsedData.name as string) || null,
    description: (parsedData.description as string) || null,
    website: (parsedData.website as string) || '',
    contact: {
      email: ((parsedData.contact as Record<string, unknown>)?.email as string) || null,
      phone: ((parsedData.contact as Record<string, unknown>)?.phone as string) || null,
    },
    socialMedia: {
      linkedin: ((parsedData.socialMedia as Record<string, unknown>)?.linkedin as string) || null,
      twitter: ((parsedData.socialMedia as Record<string, unknown>)?.twitter as string) || null,
      facebook: ((parsedData.socialMedia as Record<string, unknown>)?.facebook as string) || null,
      instagram: ((parsedData.socialMedia as Record<string, unknown>)?.instagram as string) || null,
      youtube: ((parsedData.socialMedia as Record<string, unknown>)?.youtube as string) || null,
    },
    registrationNumber: (parsedData.registrationNumber as string) || null,
    extractedAt: new Date().toISOString(),
  };
}
