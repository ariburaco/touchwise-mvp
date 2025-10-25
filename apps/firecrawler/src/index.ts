import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import dotenv from 'dotenv';
import FirecrawlApp from '@mendable/firecrawl-js';
import { type CompanyInfo, companyInfoSchema } from './types.js';

// Load environment variables
dotenv.config();

const app = new Hono();
const PORT = Number(process.env.PORT) || 3002;

// Initialize Firecrawl
const firecrawl = new FirecrawlApp({
  apiKey: process.env.FIRECRAWL_API_KEY
});

// Utility function to validate URL
const isValidUrl = (urlString: string): boolean => {
  try {
    new URL(urlString);
    return true;
  } catch {
    return false;
  }
};

// Health check endpoint
app.get('/', (c) => {
  return c.json({
    message: 'Company Information Scraper API',
    endpoints: {
      extract: 'GET /extract?url=<company-website-url> - Extract structured company info',
      scrape: 'GET /scrape?url=<company-website-url> - Scrape page content',
      map: 'GET /map?url=<company-website-url> - Map website structure',
      deepScrape: 'GET /deep-scrape?url=<company-website-url>&maxPages=5 - Deep scrape multiple pages'
    }
  });
});

// Extract endpoint - uses LLM to extract structured company information
app.get('/extract', async (c) => {
  try {
    const url = c.req.query('url');

    if (!url) {
      return c.json({
        error: 'Missing URL parameter',
        message: 'Please provide a URL parameter: /extract?url=https://example.com'
      }, 400);
    }

    // Validate URL format
    if (!isValidUrl(url)) {
      return c.json({
        error: 'Invalid URL format',
        message: 'Please provide a valid URL'
      }, 400);
    }

    // Use Firecrawl's extract method with the company info schema
    const extractResult = await firecrawl.extract({
      urls: [url],
      schema: companyInfoSchema,
      prompt: 'Extract comprehensive company information from this website. Include all available details about the company, products, services, pricing, features, benefits, and more.'
    });

    const response = {
      url: url,
      extractedAt: new Date().toISOString(),
      data: extractResult.data as CompanyInfo,
      metadata: {
        success: extractResult.success,
        warning: extractResult.warning
      }
    };

    return c.json(response);
  } catch (error: unknown) {
    const err = error as { message?: string; response?: { data?: unknown } };
    return c.json({
      error: 'Failed to extract company information',
      message: err.message || 'An unexpected error occurred',
      details: err.response?.data || null
    }, 500);
  }
});

// Main scraping endpoint - extracts detailed company information
app.get('/scrape', async (c) => {
  try {
    const url = c.req.query('url');

    if (!url) {
      return c.json({
        error: 'Missing URL parameter',
        message: 'Please provide a URL parameter: /scrape?url=https://example.com'
      }, 400);
    }

    // Validate URL format
    if (!isValidUrl(url)) {
      return c.json({
        error: 'Invalid URL format',
        message: 'Please provide a valid URL'
      }, 400);
    }

    // Use Firecrawl to scrape the website with comprehensive extraction
    const scrapeResult = await firecrawl.scrape(url, {
      formats: ['markdown', 'html', 'links'],
      onlyMainContent: false,
      includeTags: ['title', 'meta', 'h1', 'h2', 'h3', 'p', 'a'],
      waitFor: 2000
    });

    // Structure the company information
    const companyInfo = {
      url: url,
      scrapedAt: new Date().toISOString(),
      data: {
        metadata: scrapeResult.metadata || {},
        content: {
          markdown: scrapeResult.markdown || '',
          html: scrapeResult.html || '',
        },
        links: scrapeResult.links || [],
      },
      summary: {
        title: scrapeResult.metadata?.title || 'No title found',
        description: scrapeResult.metadata?.description || 'No description found',
        keywords: scrapeResult.metadata?.keywords || [],
        language: scrapeResult.metadata?.language || 'Not specified',
        sourceURL: scrapeResult.metadata?.sourceURL || url,
        totalLinks: scrapeResult.links?.length || 0
      }
    };

    return c.json(companyInfo);
  } catch (error: unknown) {
    const err = error as { message?: string; response?: { data?: unknown } };
    return c.json({
      error: 'Failed to scrape website',
      message: err.message || 'An unexpected error occurred',
      details: err.response?.data || null
    }, 500);
  }
});

// Map endpoint - gets site structure and all pages
app.get('/map', async (c) => {
  try {
    const url = c.req.query('url');

    if (!url) {
      return c.json({
        error: 'Missing URL parameter',
        message: 'Please provide a URL parameter: /map?url=https://example.com'
      }, 400);
    }

    // Validate URL format
    if (!isValidUrl(url)) {
      return c.json({
        error: 'Invalid URL format',
        message: 'Please provide a valid URL'
      }, 400);
    }

    // Use Firecrawl to map the entire website
    const mapResult = await firecrawl.map(url, {
      search: '',
      limit: 100
    });

    const siteMap = {
      url: url,
      mappedAt: new Date().toISOString(),
      data: {
        links: mapResult.links || [],
      },
      summary: {
        totalPages: mapResult.links?.length || 0,
        baseUrl: url
      }
    };

    return c.json(siteMap);
  } catch (error: unknown) {
    const err = error as { message?: string; response?: { data?: unknown } };
    return c.json({
      error: 'Failed to map website',
      message: err.message || 'An unexpected error occurred',
      details: err.response?.data || null
    }, 500);
  }
});

// Deep scrape endpoint - scrapes multiple pages for comprehensive company info
app.get('/deep-scrape', async (c) => {
  try {
    const url = c.req.query('url');
    const maxPagesParam = c.req.query('maxPages');
    const maxPages = maxPagesParam ? parseInt(maxPagesParam) : 5;

    if (!url) {
      return c.json({
        error: 'Missing URL parameter',
        message: 'Please provide a URL parameter: /deep-scrape?url=https://example.com&maxPages=5'
      }, 400);
    }

    // Validate URL format
    if (!isValidUrl(url)) {
      return c.json({
        error: 'Invalid URL format',
        message: 'Please provide a valid URL'
      }, 400);
    }

    // First, map the site to discover all pages
    const mapResult = await firecrawl.map(url, {
      search: '',
      limit: maxPages
    });

    // Then crawl the discovered pages
    const crawlResult = await firecrawl.crawl(url, {
      limit: maxPages,
      scrapeOptions: {
        formats: ['markdown', 'html'],
        onlyMainContent: false
      }
    });

    const deepInfo = {
      url: url,
      scrapedAt: new Date().toISOString(),
      data: {
        discoveredPages: mapResult.links || [],
        crawledPages: crawlResult.data || [],
      },
      summary: {
        totalDiscoveredPages: mapResult.links?.length || 0,
        totalCrawledPages: crawlResult.data?.length || 0,
        maxPages: maxPages
      }
    };

    return c.json(deepInfo);
  } catch (error: unknown) {
    const err = error as { message?: string; response?: { data?: unknown } };
    return c.json({
      error: 'Failed to deep scrape website',
      message: err.message || 'An unexpected error occurred',
      details: err.response?.data || null
    }, 500);
  }
});

// Start server
serve({
  fetch: app.fetch,
  port: PORT
}, (info: { port: number; address: string }) => {
  console.log(`Server is running on port ${info.port}`);
  console.log('API endpoints available:');
  console.log('  - GET /extract?url=<url> - Extract structured company information (LLM-powered)');
  console.log('  - GET /scrape?url=<url> - Scrape a single page');
  console.log('  - GET /map?url=<url> - Map website structure');
  console.log('  - GET /deep-scrape?url=<url>&maxPages=5 - Deep scrape multiple pages');
});
