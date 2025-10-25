#!/usr/bin/env tsx

import { google } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { z } from 'zod';
import fs from 'fs/promises';
import path from 'path';
import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

// Configuration
const TRANSLATIONS_DIR = path.join(__dirname, '../src/translations');
const SUPPORTED_LANGUAGES = {
  tr: 'Turkish',
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  pt: 'Portuguese',
  it: 'Italian',
  ja: 'Japanese',
  ko: 'Korean',
  zh: 'Chinese (Simplified)',
  ar: 'Arabic',
  ru: 'Russian',
  nl: 'Dutch',
  pl: 'Polish',
  sv: 'Swedish',
  no: 'Norwegian',
};

// Helper to extract translation object from TypeScript file
async function extractTranslationObject(filePath: string): Promise<any> {
  const content = await fs.readFile(filePath, 'utf-8');
  
  // More robust approach: find the export statement and extract object
  const exportMatch = content.match(/export\s+const\s+(\w+)\s*=\s*/);
  if (!exportMatch) {
    throw new Error(`Could not find export statement in ${filePath}`);
  }
  
  // Find the opening brace after the export statement
  const startIndex = exportMatch.index! + exportMatch[0].length;
  const restContent = content.substring(startIndex);
  
  // Find the matching closing brace
  let braceCount = 0;
  let objectEnd = -1;
  
  for (let i = 0; i < restContent.length; i++) {
    if (restContent[i] === '{') {
      braceCount++;
    } else if (restContent[i] === '}') {
      braceCount--;
      if (braceCount === 0) {
        objectEnd = i;
        break;
      }
    }
  }
  
  if (objectEnd === -1) {
    throw new Error(`Could not find matching closing brace in ${filePath}`);
  }
  
  const objectStr = restContent.substring(0, objectEnd + 1);
  
  // Evaluate the object (safe because we control the content)
  try {
    // First try to parse as JSON (for files that were created with old version)
    if (objectStr.includes('"')) {
      try {
        return JSON.parse(objectStr);
      } catch {
        // Not valid JSON, continue to TypeScript evaluation
      }
    }
    
    // Use Function constructor to safely evaluate the object literal
    const fn = new Function('return ' + objectStr);
    return fn();
  } catch (error) {
    throw new Error(`Failed to parse translation object from ${filePath}: ${error}`);
  }
}

// Helper to create TypeScript file content
function createTsFileContent(moduleName: string, translations: any): string {
  // Convert JSON to TypeScript object literal
  const toTsObject = (obj: any, indent = 0): string => {
    const spaces = '  '.repeat(indent);
    
    if (typeof obj === 'string') {
      // Escape quotes and special characters
      return JSON.stringify(obj);
    } else if (typeof obj === 'number' || typeof obj === 'boolean' || obj === null) {
      return String(obj);
    } else if (Array.isArray(obj)) {
      if (obj.length === 0) return '[]';
      const items = obj.map(item => `${spaces}  ${toTsObject(item, indent + 1)}`);
      return `[\n${items.join(',\n')}\n${spaces}]`;
    } else if (typeof obj === 'object') {
      const entries = Object.entries(obj);
      if (entries.length === 0) return '{}';
      
      const lines = entries.map(([key, value]) => {
        // Check if key needs quotes (contains special characters or starts with number)
        const needsQuotes = !/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key);
        const keyStr = needsQuotes ? JSON.stringify(key) : key;
        const valueStr = toTsObject(value, indent + 1);
        return `${spaces}  ${keyStr}: ${valueStr}`;
      });
      
      return `{\n${lines.join(',\n')}\n${spaces}}`;
    }
    
    return String(obj);
  };
  
  return `export const ${moduleName} = ${toTsObject(translations)} as const;\n`;
}

// Helper to ensure directory exists
async function ensureDir(dirPath: string) {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (error) {
    // Directory might already exist
  }
}

// Translate a single module with fallback models
async function translateModule(
  moduleName: string,
  englishContent: any,
  _targetLang: string,
  targetLangName: string
): Promise<any> {
  // Try different models in order
  const models = [
    'gemini-2.0-flash-exp',
    'gemini-2.5-flash',
    'gemini-1.5-flash',
    'gemini-1.5-flash-8b',
  ];
  
  let lastError: any = null;
  
  // Create a dynamic schema based on the English content structure
  const createSchema = (obj: any): any => {
    if (typeof obj === 'string') {
      return z.string();
    } else if (typeof obj === 'object' && obj !== null) {
      const shape: any = {};
      for (const [key, value] of Object.entries(obj)) {
        shape[key] = createSchema(value);
      }
      return z.object(shape);
    }
    return z.any();
  };

  const schema = createSchema(englishContent);

  // Try each model until one works
  for (const modelName of models) {
    try {
      console.log(chalk.gray(`  Using model: ${modelName}`));
      const model = google(modelName);
      
      let currentSchema = schema;
      let useSimpleSchema = false;
      
      // Check if we need to use a simplified schema for large files
      const contentSize = JSON.stringify(englishContent).length;
      if (contentSize > 10000) {
        console.log(chalk.yellow(`  Large file detected (${contentSize} chars), using simplified schema`));
        useSimpleSchema = true;
        currentSchema = z.record(z.any()); // Simple key-value schema
      }
      
      const { object } = await generateObject({
        model,
        schema: currentSchema,
        prompt: `Translate the following English UI text to ${targetLangName}.
Important rules:
1. Maintain the EXACT same JSON structure and keys
2. Only translate the string values, never change the keys
3. Keep placeholders like {count}, {name}, {{variable}} unchanged
4. Preserve any HTML tags
5. Keep technical terms that shouldn't be translated (like brand names, file extensions)
6. Maintain the same tone and formality level
7. For empty strings, return empty strings
8. Be culturally appropriate for ${targetLangName} speakers

Module name: ${moduleName}
English content to translate:
${JSON.stringify(englishContent, null, 2)}

Return the translated content in the exact same structure.${useSimpleSchema ? '\n\nNOTE: This is a large file. Make sure to preserve the exact nested object structure.' : ''}`,
        temperature: 0.3,
        maxTokens: 8000, // Increased for large files
      });

      return object;
    } catch (error: any) {
      lastError = error;
      
      // Check if it's a schema constraint error
      if (error.message?.includes('constraint that has too many states')) {
        console.log(chalk.yellow(`  Schema too complex with ${modelName}, trying simplified approach...`));
        // Try with a very simple schema
        try {
          const model = google(modelName);
          const { object } = await generateObject({
            model,
            schema: z.record(z.any()),
            prompt: `Translate the following English UI text to ${targetLangName}.
CRITICAL: Return a JSON object with the exact same structure as the input.
Only translate the string values, never change the keys.
Keep placeholders like {count}, {name}, {{variable}} unchanged.

Input:
${JSON.stringify(englishContent, null, 2)}

Output should be a JSON object with the same structure but translated values.`,
            temperature: 0.3,
            maxTokens: 8000,
          });
          
          return object;
        } catch (simplifiedError) {
          console.log(chalk.yellow(`  Simplified schema also failed with ${modelName}, trying schema-free approach...`));
          // Try completely schema-free approach with generateText
          try {
            const { generateText } = await import('ai');
            const schemaFreeModel = google(modelName);
            const { text } = await generateText({
              model: schemaFreeModel,
              prompt: `Translate the following English UI text to ${targetLangName}.
CRITICAL: Return ONLY a valid JSON object with the exact same structure as the input.
Only translate the string values, never change the keys.
Keep placeholders like {count}, {name}, {{variable}} unchanged.
Do not add any explanation or markdown formatting.

Input:
${JSON.stringify(englishContent, null, 2)}

Output (JSON only):`,
              temperature: 0.3,
              maxTokens: 8000,
            });
            
            // Parse the JSON response
            const cleanText = text.trim();
            const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              return JSON.parse(jsonMatch[0]);
            } else {
              throw new Error('No valid JSON found in response');
            }
          } catch (textError) {
            console.log(chalk.yellow(`  Schema-free approach also failed with ${modelName}: ${textError.message}`));
            // Continue to next model
          }
        }
      }
      
      // Check if it's a rate limit error
      if (error.message?.includes('quota') || error.message?.includes('rate limit')) {
        console.log(chalk.yellow(`  Rate limit hit with ${modelName}, trying next model...`));
        // Add a small delay before trying the next model
        await new Promise(resolve => setTimeout(resolve, 1000));
        continue;
      }
      
      // For other errors, continue to next model
      console.log(chalk.yellow(`  Error with ${modelName}: ${error.message}`));
      continue;
    }
  }
  
  // If all models failed, throw the last error
  throw new Error(`Failed to translate ${moduleName} after trying all models: ${lastError}`);
}

// Main translation function
async function translateFiles(options: {
  lang: string;
  file?: string;
  force?: boolean;
  dryRun?: boolean;
  check?: boolean;
  fix?: boolean;
  delay?: string;
  retryFailed?: boolean;
}) {
  const { lang, file, force, dryRun, check, fix } = options;
  
  if (!SUPPORTED_LANGUAGES[lang as keyof typeof SUPPORTED_LANGUAGES]) {
    console.error(chalk.red(`Unsupported language: ${lang}`));
    console.log(chalk.yellow('Supported languages:'));
    Object.entries(SUPPORTED_LANGUAGES).forEach(([code, name]) => {
      console.log(chalk.gray(`  ${code}: ${name}`));
    });
    process.exit(1);
  }

  const targetLangName = SUPPORTED_LANGUAGES[lang as keyof typeof SUPPORTED_LANGUAGES];
  const enDir = path.join(TRANSLATIONS_DIR, 'en');
  const targetDir = path.join(TRANSLATIONS_DIR, lang);

  // Ensure target directory exists
  if (!dryRun && !check) {
    await ensureDir(targetDir);
  }

  // Get list of files to process
  const files = await fs.readdir(enDir);
  const tsFiles = files.filter(f => f.endsWith('.ts') && f !== 'index.ts');
  
  // Filter to specific file if requested
  let filesToProcess = file 
    ? tsFiles.filter(f => f.replace('.ts', '') === file)
    : tsFiles;
    
  // If retry-failed mode, only process files that exist but might have wrong format
  if (options.retryFailed) {
    const failedFiles: string[] = [];
    for (const fileName of filesToProcess) {
      const targetFilePath = path.join(targetDir, fileName);
      try {
        await fs.access(targetFilePath);
        // File exists, try to parse it
        try {
          await extractTranslationObject(targetFilePath);
        } catch {
          // Failed to parse, add to retry list
          failedFiles.push(fileName);
        }
      } catch {
        // File doesn't exist, also add to retry list
        failedFiles.push(fileName);
      }
    }
    filesToProcess = failedFiles;
    console.log(chalk.blue(`Found ${failedFiles.length} files to retry`));
  }

  if (filesToProcess.length === 0) {
    console.error(chalk.red(`No files found to process${file ? ` (looking for ${file}.ts)` : ''}`));
    process.exit(1);
  }

  console.log(chalk.blue(`\nTranslating to ${targetLangName} (${lang})...\n`));
  
  const results = {
    success: [] as string[],
    failed: [] as string[],
    skipped: [] as string[],
  };

  // Process files one by one
  for (const fileName of filesToProcess) {
    const spinner = ora(`Processing ${fileName}`).start();
    const moduleName = fileName.replace('.ts', '');
    
    try {
      // Read English content
      const enFilePath = path.join(enDir, fileName);
      const englishContent = await extractTranslationObject(enFilePath);
      
      // Check if target file exists
      const targetFilePath = path.join(targetDir, fileName);
      let targetExists = false;
      let existingContent: any = null;
      
      try {
        await fs.access(targetFilePath);
        targetExists = true;
        existingContent = await extractTranslationObject(targetFilePath);
      } catch {
        // File doesn't exist yet
      }

      // In check mode, just report status
      if (check) {
        if (targetExists) {
          if (existingContent) {
            const issues = compareStructures(englishContent, existingContent);
            const totalIssues = issues.missing.length + issues.typeMismatches.length;
            
            if (totalIssues > 0) {
              spinner.fail(chalk.yellow(`${fileName} - ${totalIssues} issues found`));
              
              if (issues.missing.length > 0) {
                console.log(chalk.gray(`  Missing keys (${issues.missing.length}): ${issues.missing.slice(0, 5).join(', ')}${issues.missing.length > 5 ? '...' : ''}`));
              }
              
              if (issues.typeMismatches.length > 0) {
                console.log(chalk.gray(`  Type mismatches (${issues.typeMismatches.length}): ${issues.typeMismatches.slice(0, 3).join(', ')}${issues.typeMismatches.length > 3 ? '...' : ''}`));
              }
              
              if (issues.extraKeys.length > 0) {
                console.log(chalk.gray(`  Extra keys (${issues.extraKeys.length}): ${issues.extraKeys.slice(0, 3).join(', ')}${issues.extraKeys.length > 3 ? '...' : ''}`));
              }
              
              results.failed.push(fileName);
            } else {
              spinner.succeed(chalk.green(`${fileName} - Complete`));
              results.success.push(fileName);
            }
          } else {
            spinner.fail(chalk.red(`${fileName} - Parse error (invalid format)`));
            results.failed.push(fileName);
          }
        } else {
          spinner.fail(chalk.red(`${fileName} - Not translated`));
          results.failed.push(fileName);
        }
        continue;
      }

      // In fix mode, only fix files that have missing keys
      if (fix) {
        if (targetExists && existingContent) {
          const issues = compareStructures(englishContent, existingContent);
          
          if (issues.missing.length > 0) {
            if (dryRun) {
              spinner.info(chalk.yellow(`${fileName} - Would fix ${issues.missing.length} missing keys`));
              console.log(chalk.gray(`  Would add: ${issues.missing.slice(0, 5).join(', ')}${issues.missing.length > 5 ? '...' : ''}`));
              continue;
            }
            
            spinner.text = `Fixing ${fileName} - translating ${issues.missing.length} missing keys...`;
            
            // Extract only missing keys from English content
            const missingKeysContent = extractMissingKeys(englishContent, issues.missing);
            
            // Add delay between translations to avoid rate limits
            if (results.success.length > 0) {
              const delay = parseInt(options.delay || '500', 10);
              await new Promise(resolve => setTimeout(resolve, delay));
            }
            
            // Translate only the missing keys
            const translatedMissingKeys = await translateModule(
              moduleName,
              missingKeysContent,
              lang,
              targetLangName
            );
            
            // Merge the new translations with existing content
            const mergedContent = mergeTranslations(existingContent, translatedMissingKeys);
            
            // Write the updated file
            const tsContent = createTsFileContent(moduleName, mergedContent);
            await fs.writeFile(targetFilePath, tsContent, 'utf-8');
            
            spinner.succeed(chalk.green(`${fileName} - Fixed ${issues.missing.length} missing keys`));
            results.success.push(fileName);
          } else {
            spinner.info(chalk.gray(`${fileName} - No missing keys to fix`));
            results.success.push(fileName);
          }
        } else if (!targetExists) {
          spinner.fail(chalk.red(`${fileName} - File doesn't exist, use regular translation mode`));
          results.failed.push(fileName);
        } else {
          spinner.fail(chalk.red(`${fileName} - Parse error, cannot fix`));
          results.failed.push(fileName);
        }
        continue;
      }

      // Skip if exists and not forcing
      if (targetExists && !force) {
        spinner.info(chalk.gray(`${fileName} - Skipped (already exists)`));
        results.skipped.push(fileName);
        continue;
      }

      // In dry run mode, just show what would be done
      if (dryRun) {
        if (targetExists) {
          spinner.info(chalk.yellow(`${fileName} - Would update`));
        } else {
          spinner.info(chalk.green(`${fileName} - Would create`));
        }
        continue;
      }

      // Translate the content
      spinner.text = `Translating ${fileName}...`;
      
      // Add delay between translations to avoid rate limits
      if (results.success.length > 0) {
        const delay = parseInt(options.delay || '500', 10);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      
      const translatedContent = await translateModule(
        moduleName,
        englishContent,
        lang,
        targetLangName
      );

      // Write the translated file
      const tsContent = createTsFileContent(moduleName, translatedContent);
      await fs.writeFile(targetFilePath, tsContent, 'utf-8');
      
      spinner.succeed(chalk.green(`${fileName} - Translated successfully`));
      results.success.push(fileName);
      
    } catch (error) {
      spinner.fail(chalk.red(`${fileName} - Failed: ${error}`));
      results.failed.push(fileName);
    }
  }

  // Update index.ts if we translated any files
  if (!dryRun && !check && results.success.length > 0) {
    await updateIndexFile(lang, tsFiles);
  }

  // Summary
  console.log(chalk.blue('\n=== Summary ==='));
  if (check) {
    console.log(chalk.blue(`Checked ${filesToProcess.length} files for completeness:`));
    if (results.success.length > 0) {
      console.log(chalk.green(`✓ Complete: ${results.success.length} files`));
    }
    if (results.failed.length > 0) {
      console.log(chalk.yellow(`⚠ Issues found: ${results.failed.length} files`));
      console.log(chalk.gray(`  ${results.failed.join(', ')}`));
      console.log(chalk.yellow('\nTo fix missing keys, run:'));
      console.log(chalk.cyan(`  bun translate --lang=${lang} --fix`));
    }
  } else if (fix) {
    console.log(chalk.blue(`Fixed missing keys in ${filesToProcess.length} files:`));
    if (results.success.length > 0) {
      console.log(chalk.green(`✓ Fixed: ${results.success.length} files`));
      console.log(chalk.gray(`  ${results.success.join(', ')}`));
    }
    if (results.failed.length > 0) {
      console.log(chalk.red(`✗ Failed to fix: ${results.failed.length} files`));
      console.log(chalk.gray(`  ${results.failed.join(', ')}`));
    }
  } else {
    if (results.success.length > 0) {
      console.log(chalk.green(`✓ Translated: ${results.success.length} files`));
      console.log(chalk.gray(`  ${results.success.join(', ')}`));
    }
    if (results.skipped.length > 0) {
      console.log(chalk.gray(`- Skipped: ${results.skipped.length} files`));
    }
    if (results.failed.length > 0) {
      console.log(chalk.red(`✗ Failed: ${results.failed.length} files`));
      console.log(chalk.gray(`  ${results.failed.join(', ')}`));
      console.log(chalk.yellow('\nTo retry failed files, run:'));
      console.log(chalk.cyan(`  bun translate --lang=${lang} --file=${results.failed[0].replace('.ts', '')}`));
      
      if (results.failed.some(f => f.includes('common') || f.includes('export'))) {
        console.log(chalk.yellow('\nNote: Some files may be hitting rate limits due to their size.'));
        console.log(chalk.yellow('Try increasing the delay between translations:'));
        console.log(chalk.cyan(`  bun translate --lang=${lang} --delay=2000`));
      }
    }
  }
}


// Helper to compare complete structures and find issues
function compareStructures(english: any, translated: any, path = ''): {
  missing: string[];
  typeMismatches: string[];
  extraKeys: string[];
} {
  const issues = {
    missing: [] as string[],
    typeMismatches: [] as string[],
    extraKeys: [] as string[],
  };
  
  // If translated doesn't exist or is not an object
  if (!translated || typeof translated !== 'object') {
    issues.missing.push(...getAllKeys(english, path));
    return issues;
  }
  
  // Check for missing keys in translated
  for (const [key, value] of Object.entries(english)) {
    const fullKey = path ? `${path}.${key}` : key;
    
    if (!(key in translated)) {
      issues.missing.push(fullKey);
    } else {
      const englishType = typeof value;
      const translatedType = typeof translated[key];
      
      // Type mismatch check
      if (englishType !== translatedType) {
        issues.typeMismatches.push(`${fullKey} (expected ${englishType}, got ${translatedType})`);
      } else if (englishType === 'object' && value !== null && translated[key] !== null) {
        // Recursive check for nested objects
        const nestedIssues = compareStructures(value, translated[key], fullKey);
        issues.missing.push(...nestedIssues.missing);
        issues.typeMismatches.push(...nestedIssues.typeMismatches);
        issues.extraKeys.push(...nestedIssues.extraKeys);
      }
    }
  }
  
  // Check for extra keys in translated (not in English)
  for (const key of Object.keys(translated)) {
    if (!(key in english)) {
      const fullKey = path ? `${path}.${key}` : key;
      issues.extraKeys.push(fullKey);
    }
  }
  
  return issues;
}

// Helper to get all keys from an object (for when translated is completely missing)
function getAllKeys(obj: any, prefix = ''): string[] {
  const keys: string[] = [];
  
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    
    if (typeof value === 'object' && value !== null) {
      keys.push(...getAllKeys(value, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  
  return keys;
}

// Helper to extract only missing keys from English content
function extractMissingKeys(englishContent: any, missingPaths: string[]): any {
  const result: any = {};
  
  for (const path of missingPaths) {
    const keys = path.split('.');
    let current = englishContent;
    let target = result;
    
    // Navigate to the missing key
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!(key in current)) break;
      current = current[key];
      
      if (!(key in target)) {
        target[key] = {};
      }
      target = target[key];
    }
    
    // Set the final key
    const finalKey = keys[keys.length - 1];
    if (finalKey in current) {
      target[finalKey] = current[finalKey];
    }
  }
  
  return result;
}

// Helper to merge missing translations into existing content
function mergeTranslations(existingContent: any, missingTranslations: any): any {
  const result = JSON.parse(JSON.stringify(existingContent)); // Deep clone
  
  function mergeRecursive(target: any, source: any) {
    for (const [key, value] of Object.entries(source)) {
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        if (!(key in target)) {
          target[key] = {};
        }
        mergeRecursive(target[key], value);
      } else {
        target[key] = value;
      }
    }
  }
  
  mergeRecursive(result, missingTranslations);
  return result;
}

// Update index.ts for the target language
async function updateIndexFile(lang: string, moduleFiles: string[]) {
  const modules = moduleFiles.map(f => f.replace('.ts', ''));
  
  const imports = modules.map(m => 
    m === 'exportTranslations' 
      ? `import { exportTranslations } from './${m}';`
      : `import { ${m} } from './${m}';`
  ).join('\n');
  
  const exports = modules.map(m => 
    `  ${m},`
  ).join('\n');
  
  const indexContent = `// Auto-generated file - do not edit directly
${imports}

// Export the complete translation object
export const ${lang}Translations = {
${exports}
} as const;

// Export the type for other files to use
export type TranslationKeys = typeof ${lang}Translations;
`;

  const indexPath = path.join(TRANSLATIONS_DIR, lang, 'index.ts');
  await fs.writeFile(indexPath, indexContent, 'utf-8');
}

// CLI setup
const program = new Command();

program
  .name('translate')
  .description('AI-powered translation tool for the invoice tracker app')
  .option('-l, --lang <language>', 'Target language code (e.g., tr, es, fr)')
  .option('-f, --file <file>', 'Translate specific file only (without .ts extension)')
  .option('--force', 'Force retranslation even if file exists')
  .option('--dry-run', 'Show what would be done without making changes')
  .option('--check', 'Check for missing translations')
  .option('--fix', 'Fix missing translations by adding only missing keys')
  .option('--delay <ms>', 'Delay between translations in milliseconds', '500')
  .option('--retry-failed', 'Only retry files that failed in previous run')
  .action(async (options) => {
    if (!options.lang) {
      console.error(chalk.red('Error: Language code is required'));
      program.help();
      process.exit(1);
    }

    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      console.error(chalk.red('Error: GOOGLE_GENERATIVE_AI_API_KEY not found in environment'));
      console.log(chalk.yellow('Please create a .env file with your API key'));
      process.exit(1);
    }

    try {
      await translateFiles(options);
    } catch (error) {
      console.error(chalk.red(`\nError: ${error}`));
      process.exit(1);
    }
  });

program.parse();