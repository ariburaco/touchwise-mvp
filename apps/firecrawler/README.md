# Firecrawler API

A high-performance Hono-based backend service for web scraping and company information extraction using Firecrawl.

## Features

- **Extract**: LLM-powered structured data extraction from company websites
- **Scrape**: Single-page web scraping with markdown and HTML output
- **Map**: Website structure mapping and link discovery
- **Deep Scrape**: Multi-page crawling for comprehensive data collection

## Tech Stack

- **Runtime**: Node.js with Bun
- **Framework**: Hono (ultra-fast web framework)
- **Language**: TypeScript
- **Scraping**: Firecrawl API

## Setup

1. Install dependencies:
```bash
bun install
```

2. Create `.env` file:
```bash
cp .env.example .env
```

3. Add your Firecrawl API key to `.env`:
```
FIRECRAWL_API_KEY=your_api_key_here
PORT=3001
```

## Development

Start the development server with hot reload:
```bash
bun dev
```

The server will start on `http://localhost:3001` (or your configured PORT).

## Production

Build and run in production:
```bash
bun build
bun start
```

## API Endpoints

### Health Check
```
GET /
```
Returns API information and available endpoints.

### Extract Company Information
```
GET /extract?url=<company-website-url>
```
Uses LLM to extract structured company information including:
- Company name, industry, description
- Features, benefits, pricing
- Contact information
- Use cases, target audience
- Value proposition

**Example:**
```bash
curl "http://localhost:3001/extract?url=https://example.com"
```

### Scrape Single Page
```
GET /scrape?url=<company-website-url>
```
Scrapes a single page and returns:
- Markdown content
- HTML content
- Links found on the page
- Metadata (title, description, keywords)

**Example:**
```bash
curl "http://localhost:3001/scrape?url=https://example.com"
```

### Map Website Structure
```
GET /map?url=<company-website-url>
```
Maps the entire website structure and returns all discovered links (up to 100 pages).

**Example:**
```bash
curl "http://localhost:3001/map?url=https://example.com"
```

### Deep Scrape Multiple Pages
```
GET /deep-scrape?url=<company-website-url>&maxPages=5
```
Performs a deep crawl of multiple pages:
1. Maps the website to discover pages
2. Crawls and scrapes each page
3. Returns comprehensive data from all pages

**Parameters:**
- `url`: Website URL to scrape (required)
- `maxPages`: Maximum number of pages to crawl (default: 5)

**Example:**
```bash
curl "http://localhost:3001/deep-scrape?url=https://example.com&maxPages=10"
```

## Response Format

All endpoints return JSON responses with consistent structure:

**Success Response:**
```json
{
  "url": "https://example.com",
  "scrapedAt": "2025-01-15T10:30:00.000Z",
  "data": { ... },
  "summary": { ... }
}
```

**Error Response:**
```json
{
  "error": "Error type",
  "message": "Detailed error message",
  "details": null
}
```

## Type Safety

All endpoints are fully typed with TypeScript. The company information schema is defined in [src/types.ts](src/types.ts).

## Error Handling

The API handles common errors:
- Missing URL parameter (400)
- Invalid URL format (400)
- Firecrawl API errors (500)
- Network errors (500)

## Scripts

- `bun dev` - Start development server with hot reload
- `bun build` - Build TypeScript to JavaScript
- `bun start` - Run production build
- `bun typecheck` - Run TypeScript type checking

## Project Structure

```
apps/firecrawler/
├── src/
│   ├── index.ts       # Main server file with all endpoints
│   └── types.ts       # TypeScript types and schemas
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

## License

ISC
