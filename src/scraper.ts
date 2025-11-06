/**
 * Web scraper utility to fetch and extract website information
 */

interface PageMetadata {
  title: string;
  description: string;
  text: string;
  socialLinks: {
    linkedin: string | null;
    twitter: string | null;
    facebook: string | null;
    instagram: string | null;
    youtube: string | null;
  };
  email: string | null;
  phone: string | null;
}

async function fetchWebsite(url: string): Promise<string> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000); // 10 second timeout

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.text();
  } catch (error) {
    throw new Error(`Failed to fetch website: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function extractMetadata(html: string, baseUrl: string): PageMetadata {
  // Extract title
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : '';

  // Extract meta description
  const descMatch = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i);
  const description = descMatch ? descMatch[1].trim() : '';

  // Extract all text content (basic)
  const textMatch = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '').replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '').replace(/<[^>]+>/g, ' ');
  const text = textMatch.replace(/\s+/g, ' ').substring(0, 5000).trim();

  // Extract social media links
  const linkedinMatch = html.match(/https?:\/\/(?:www\.)?linkedin\.com\/(?:company|in)\/([^\s"'<>]+)/i);
  const twitterMatch = html.match(/https?:\/\/(?:www\.)?twitter\.com\/([^\s"'<>]+)/i);
  const facebookMatch = html.match(/https?:\/\/(?:www\.)?facebook\.com\/([^\s"'<>]+)/i);
  const instagramMatch = html.match(/https?:\/\/(?:www\.)?instagram\.com\/([^\s"'<>]+)/i);

  // YouTube: match @username format first (newer), then fallback to channel/c/user formats
  let youtubeUrl: string | null = null;
  const youtubeAtMatch = html.match(/https?:\/\/(?:www\.)?youtube\.com\/@([^\s"'<>/]+)/i);
  if (youtubeAtMatch) {
    youtubeUrl = `https://youtube.com/@${youtubeAtMatch[1]}`;
  } else {
    const youtubeOldMatch = html.match(/https?:\/\/(?:www\.)?youtube\.com\/(?:channel|c|user)\/([^\s"'<>]+)/i);
    if (youtubeOldMatch) {
      youtubeUrl = `https://youtube.com/${youtubeOldMatch[1].includes('/') ? youtubeOldMatch[1] : 'channel/' + youtubeOldMatch[1]}`;
    }
  }

  const socialLinks = {
    linkedin: linkedinMatch ? `https://linkedin.com/company/${linkedinMatch[1]}` : null,
    twitter: twitterMatch ? `https://twitter.com/${twitterMatch[1]}` : null,
    facebook: facebookMatch ? `https://facebook.com/${facebookMatch[1]}` : null,
    instagram: instagramMatch ? `https://instagram.com/${instagramMatch[1]}` : null,
    youtube: youtubeUrl,
  };

  // Extract email
  const emailMatch = html.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
  const email = emailMatch ? emailMatch[1] : null;

  // Extract phone (basic pattern)
  const phoneMatch = html.match(/(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/);
  const phone = phoneMatch ? `+1-${phoneMatch[1]}-${phoneMatch[2]}-${phoneMatch[3]}` : null;

  return {
    title,
    description,
    text,
    socialLinks,
    email,
    phone,
  };
}

export async function scrapeWebsite(url: string): Promise<PageMetadata> {
  const html = await fetchWebsite(url);
  return extractMetadata(html, url);
}
