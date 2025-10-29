#!/usr/bin/env bun

/**
 * Release script for Grokify extension
 *
 * This script:
 * 1. Builds the production extension
 * 2. Creates a zip file
 * 3. Copies it to the website directory for download
 *
 * Usage: bun run release
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const BUILD_DIR = path.join(__dirname, 'build', 'chrome-mv3-prod');
const ZIP_NAME = 'grokify-extension.zip';
const ZIP_PATH = path.join(__dirname, ZIP_NAME);
const WEBSITE_DIR = path.join(__dirname, '..', 'website');
const WEBSITE_ZIP = path.join(WEBSITE_DIR, ZIP_NAME);

console.log('🚀 Starting Grokify release process...\n');

// Step 1: Build the extension
console.log('📦 Building extension...');
try {
  execSync('bun run build', { stdio: 'inherit' });
  console.log('✅ Build complete!\n');
} catch (error) {
  console.error('❌ Build failed');
  process.exit(1);
}

// Step 2: Check if build directory exists
if (!fs.existsSync(BUILD_DIR)) {
  console.error('❌ Build directory not found:', BUILD_DIR);
  process.exit(1);
}

// Step 3: Create zip file
console.log('🗜️  Creating zip file...');
try {
  // Remove old zip if it exists
  if (fs.existsSync(ZIP_PATH)) {
    fs.unlinkSync(ZIP_PATH);
  }

  // Create new zip
  execSync(`cd ${BUILD_DIR} && zip -r ${ZIP_PATH} .`, { stdio: 'inherit' });

  const stats = fs.statSync(ZIP_PATH);
  const fileSizeInKB = Math.round(stats.size / 1024);
  console.log(`✅ Zip created: ${fileSizeInKB}KB\n`);
} catch (error) {
  console.error('❌ Failed to create zip');
  process.exit(1);
}

// Step 4: Copy to website directory
console.log('📋 Copying to website directory...');
try {
  if (!fs.existsSync(WEBSITE_DIR)) {
    console.error('❌ Website directory not found:', WEBSITE_DIR);
    process.exit(1);
  }

  fs.copyFileSync(ZIP_PATH, WEBSITE_ZIP);
  console.log(`✅ Copied to: ${WEBSITE_ZIP}\n`);
} catch (error) {
  console.error('❌ Failed to copy to website directory');
  process.exit(1);
}

// Step 5: Display next steps
console.log('🎉 Release complete!\n');
console.log('Next steps:');
console.log('1. Test the extension locally');
console.log('2. git add website/grokify-extension.zip');
console.log('3. git commit -m "Release v1.0.0"');
console.log('4. git push');
console.log('5. Submit to Chrome Web Store if needed\n');

// Display package info
const packageJson = require('./package.json');
console.log(`📌 Version: ${packageJson.version}`);
console.log(`📦 Extension: ${ZIP_NAME}`);
