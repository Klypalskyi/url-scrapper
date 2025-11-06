# Website Analysis API

A TypeScript-based API that uses OpenAI agents with web search capabilities to extract structured business information from websites.

## Features

- Extract company name, description, and business details
- Find contact information (email, phone)
- Discover social media profiles (LinkedIn, Twitter, Facebook, Instagram)
- Identify business registration numbers
- In-memory caching to avoid re-processing
- Timeout protection (30 seconds max per request)

## Setup

1. Ensure your `.env` file contains:
   ```
   OPEN_AI_API_KEY=your-api-key-here
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

## Running the Server

Development mode:
```bash
npm run dev
```

Production build and run:
```bash
npm run build
npm start
```

The API will be available at `http://localhost:3000`

## API Endpoints

### Health Check
```
GET /
```

### Analyze Website
```
POST /analyze-website
Content-Type: application/json

{
  "url": "https://example.com"
}
```

Response format:
```json
{
  "success": true,
  "data": {
    "name": "Company Name",
    "description": "Company description",
    "website": "https://example.com",
    "contact": {
      "email": "contact@example.com",
      "phone": "+1-234-567-8900"
    },
    "socialMedia": {
      "linkedin": "https://linkedin.com/company/example",
      "twitter": "https://twitter.com/example",
      "facebook": "https://facebook.com/example",
      "instagram": "https://instagram.com/example",
      "youtube": "https://youtube.com/example"
    },
    "registrationNumber": "ABC123456",
    "extractedAt": "2025-11-05T10:30:00.000Z"
  },
  "cached": false
}
```

## Example Usage

```bash
curl -X POST http://localhost:3000/analyze-website \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.anthropic.com"}'
```

## Architecture

- **server.ts**: Express server and API endpoints
- **agent.ts**: OpenAI agent with web_search tool integration
- **cache.ts**: In-memory cache with 24-hour expiration
- **types.ts**: TypeScript interfaces and types
