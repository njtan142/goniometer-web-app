#!/usr/bin/env node

/**
 * ESP32 Copy Uncompressed Script
 * Copies the dist folder to dist-esp32-uncompressed for testing
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(__dirname, '../dist');
const espDir = path.join(__dirname, '../dist-esp32-uncompressed');

// Remove existing directory
if (fs.existsSync(espDir)) {
	fs.rmSync(espDir, { recursive: true });
}
fs.mkdirSync(espDir, { recursive: true });

// Ensure dist exists
if (!fs.existsSync(distDir)) {
	console.error('Error: dist folder not found. Run "npm run build" first.');
	process.exit(1);
}

let totalSize = 0;
let fileCount = 0;

/**
 * Recursively copy files
 */
function copyFiles(src, dest) {
	const files = fs.readdirSync(src);

	for (const file of files) {
		const srcPath = path.join(src, file);
		const destPath = path.join(dest, file);
		const stat = fs.statSync(srcPath);

		if (stat.isDirectory()) {
			fs.mkdirSync(destPath, { recursive: true });
			copyFiles(srcPath, destPath);
		} else {
			fs.copyFileSync(srcPath, destPath);
			const size = stat.size;
			totalSize += size;
			fileCount++;
			const relativePath = path.relative(distDir, srcPath);
			console.log(`✓ ${relativePath.padEnd(40)} ${(size / 1024).toFixed(2)}KB`);
		}
	}
}

console.log('📦 Copying uncompressed ESP32 assets...\n');

copyFiles(distDir, espDir);

// Generate manifest
const manifest = {
	timestamp: new Date().toISOString(),
	note: 'Uncompressed version for quick testing',
	totalFiles: fileCount,
	totalSize: totalSize,
};

fs.writeFileSync(
	path.join(espDir, 'manifest.json'),
	JSON.stringify(manifest, null, 2)
);

console.log(`\n✅ Copy complete!`);
console.log(`📍 Output directory: dist-esp32-uncompressed/`);
console.log(`📊 Statistics:`);
console.log(`   Total size: ${(totalSize / 1024).toFixed(2)}KB`);
console.log(`   Files: ${fileCount}`);
console.log(`\n💡 This uncompressed version is for testing purposes.`);
console.log(`   For production deployment, use 'npm run build:esp32' for compressed version.\n`);
