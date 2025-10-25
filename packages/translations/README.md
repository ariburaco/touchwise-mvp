# @invoice-tracker/translations

Shared translations, constants, and utilities for Invoice Tracker applications.

## Features

- **Centralized Translations**: English and Turkish translations for all app text
- **Category Constants**: Predefined expense categories with colors and icons
- **Currency Utilities**: Currency definitions and formatting functions
- **Payment Methods**: Common payment method options
- **Type Safety**: Full TypeScript support with type-safe translation keys
- **Framework Agnostic**: Works with both React Native and Next.js

## Installation

```bash
# In your workspace
bun add @invoice-tracker/translations
```

## Usage

### Basic Import

```typescript
import { 
  enTranslations, 
  trTranslations, 
  getCategoryName, 
  formatCurrency,
  CATEGORIES,
  CURRENCIES 
} from '@invoice-tracker/translations';
```

### Translation Functions

```typescript
import { getCategoryName } from '@invoice-tracker/translations';

// With your i18n translation function
const categoryName = getCategoryName('food', t);
// Returns: "Food & Dining" (en) or "Yiyecek ve İçecek" (tr)
```

### Currency Utilities

```typescript
import { formatCurrency, getCurrencySymbol } from '@invoice-tracker/translations';

const formatted = formatCurrency(100, 'TRY');
// Returns: "₺100.00"

const symbol = getCurrencySymbol('USD');
// Returns: "$"
```

### Constants

```typescript
import { CATEGORIES, CURRENCIES, PAYMENT_METHODS } from '@invoice-tracker/translations';

// All available categories with colors and icons
console.log(CATEGORIES);

// All supported currencies
console.log(CURRENCIES);

// All payment methods
console.log(PAYMENT_METHODS);
```

## Available Languages

- English (`en`) - Source language
- Turkish (`tr`) - Auto-translated with AI

## AI-Powered Translation

This package includes an AI-powered translation script that uses Google's Gemini 2.0 Flash model to automatically translate English files to other languages.

### Setup

1. Get a Google AI Studio API key from https://aistudio.google.com/app/apikey
2. Create a `.env` file:
   ```bash
   cp .env.example .env
   ```
3. Add your API key:
   ```
   GOOGLE_GENERATIVE_AI_API_KEY=your-api-key-here
   ```

### Usage

```bash
# Translate all files to Turkish
bun run translate --lang=tr

# Translate specific file
bun run translate --lang=tr --file=analytics

# Check for missing translations
bun run translate:check --lang=tr

# Preview changes (dry run)
bun run translate --lang=tr --dry-run

# Force retranslation
bun run translate --lang=tr --force

# Retry only failed translations
bun run translate --lang=tr --retry-failed

# Increase delay to avoid rate limits
bun run translate --lang=tr --delay=2000
```

### Supported Languages

The translation script supports: Turkish (tr), Spanish (es), French (fr), German (de), Portuguese (pt), Italian (it), Japanese (ja), Korean (ko), Chinese (zh), Arabic (ar), Russian (ru), Dutch (nl), Polish (pl), Swedish (sv), Norwegian (no).

## Structure

```
src/
├── constants/          # Shared constants
│   ├── categories.ts   # Expense categories
│   ├── currencies.ts   # Currency definitions
│   └── payment-methods.ts
├── translations/       # Translation files
│   ├── en/            # English translations (modular)
│   │   ├── index.ts   # Main export
│   │   ├── common.ts  # Common UI elements
│   │   ├── auth.ts    # Authentication
│   │   └── ...        # Other modules
│   ├── tr/            # Turkish translations
│   ├── en.ts          # English translations (legacy)
│   ├── tr.ts          # Turkish translations (legacy)
│   └── index.ts
├── types/             # TypeScript types
├── utils/             # Utility functions
├── scripts/           # Translation scripts
│   └── translate.ts   # AI translation tool
└── index.ts           # Main exports
```

## License

MIT