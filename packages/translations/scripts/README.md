# Translation Scripts

This directory contains scripts for managing translations in the Invoice Tracker application.

## translate.ts

An AI-powered translation script that uses Google's Gemini 2.0 Flash model to automatically translate English text to other languages while preserving the exact structure and formatting.

### Quick Start

```bash
# Setup
cp ../.env.example ../.env
# Add your GOOGLE_GENERATIVE_AI_API_KEY to .env

# Translate to Turkish
bun run translate --lang=tr

# Translate specific file
bun run translate --lang=tr --file=analytics

# Check missing translations
bun run translate --lang=tr --check
```

See the main package README for full documentation.