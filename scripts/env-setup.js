/**
 * Copies .env.example → .env at the repo root.
 * Skips silently if .env already exists so existing configs are never overwritten.
 */

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const examplePath = path.join(root, '.env.example');
const envPath = path.join(root, '.env');

if (!fs.existsSync(envPath)) {
  fs.copyFileSync(examplePath, envPath);
  console.log(
    'Created .env from .env.example — fill in the required values before starting the app.'
  );
} else {
  console.log('.env already exists — skipping.');
}
