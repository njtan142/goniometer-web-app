#!/usr/bin/env node

/**
 * ESP32 Build Script
 * Prepares the dist folder for ESP32 deployment by:
 * 1. Compressing all files with gzip
 * 2. Generating a C header file with file metadata
 * 3. Creating a SPIFFS/LittleFS compatible structure
 */

import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(__dirname, '../dist');
const espDir = path.join(__dirname, '../dist-esp32');

// Create output directory
if (!fs.existsSync(espDir)) {
	fs.mkdirSync(espDir, { recursive: true });
}

// Ensure dist exists
if (!fs.existsSync(distDir)) {
	console.error('Error: dist folder not found. Run "npm run build" first.');
	process.exit(1);
}

const fileMetadata = [];
let totalOriginalSize = 0;
let totalCompressedSize = 0;

/**
 * Recursively process files
 */
function processFiles(dir, baseUrl = '') {
	const files = fs.readdirSync(dir);

	for (const file of files) {
		const filePath = path.join(dir, file);
		const stat = fs.statSync(filePath);
		const fileUrl = path.posix.join(baseUrl, file);

		if (stat.isDirectory()) {
			processFiles(filePath, fileUrl);
		} else {
			const originalBuffer = fs.readFileSync(filePath);
			const originalSize = originalBuffer.length;

			// Compress file
			const compressed = zlib.gzipSync(originalBuffer);
			const compressedSize = compressed.length;

			// Determine MIME type
			const ext = path.extname(file).toLowerCase();
			const mimeType = getMimeType(ext);

			// Save compressed file
			const outPath = path.join(espDir, `${fileUrl}.gz`);
			const outDir = path.dirname(outPath);
			if (!fs.existsSync(outDir)) {
				fs.mkdirSync(outDir, { recursive: true });
			}
			fs.writeFileSync(outPath, compressed);

			fileMetadata.push({
				path: `/${fileUrl}`,
				mimeType,
				originalSize,
				compressedSize,
				gzipped: true,
			});

			totalOriginalSize += originalSize;
			totalCompressedSize += compressedSize;

			console.log(
				`✓ ${fileUrl.padEnd(40)} ${(originalSize / 1024).toFixed(2)}KB -> ${(compressedSize / 1024).toFixed(2)}KB`
			);
		}
	}
}

/**
 * Get MIME type from file extension
 */
function getMimeType(ext) {
	const types = {
		'.html': 'text/html',
		'.css': 'text/css',
		'.js': 'text/javascript',
		'.json': 'application/json',
		'.png': 'image/png',
		'.jpg': 'image/jpeg',
		'.jpeg': 'image/jpeg',
		'.gif': 'image/gif',
		'.svg': 'image/svg+xml',
		'.woff': 'font/woff',
		'.woff2': 'font/woff2',
		'.ttf': 'font/ttf',
		'.eot': 'application/vnd.ms-fontobject',
		'.webp': 'image/webp',
	};
	return types[ext] || 'application/octet-stream';
}

/**
 * Generate C header file for embedding
 */
function generateCHeader() {
	let header = `#ifndef ESP32_WEB_ASSETS_H
#define ESP32_WEB_ASSETS_H

#include <stdint.h>
#include <stddef.h>

typedef struct {
    const char* path;
    const char* mimeType;
    const uint8_t* data;
    size_t size;
    bool gzipped;
} WebAsset;

// Web Assets Manifest
const size_t WEB_ASSETS_COUNT = ${fileMetadata.length};

const WebAsset webAssets[] = {
`;

	for (const file of fileMetadata) {
		header += `    { "${file.path}", "${file.mimeType}", NULL, ${file.compressedSize}, true },\n`;
	}

	header += `};

// Size information
#define TOTAL_ORIGINAL_SIZE ${totalOriginalSize}
#define TOTAL_COMPRESSED_SIZE ${totalCompressedSize}
#define COMPRESSION_RATIO ${(((totalOriginalSize - totalCompressedSize) / totalOriginalSize) * 100).toFixed(1)}

#endif // ESP32_WEB_ASSETS_H
`;

	return header;
}

/**
 * Generate filesystem info JSON
 */
function generateFileInfo() {
	return {
		timestamp: new Date().toISOString(),
		totalFiles: fileMetadata.length,
		originalSize: totalOriginalSize,
		compressedSize: totalCompressedSize,
		compressionRatio: ((totalOriginalSize - totalCompressedSize) / totalOriginalSize * 100).toFixed(1) + '%',
		files: fileMetadata,
	};
}

// Main execution
console.log('📦 Building ESP32 web assets...\n');

processFiles(distDir);

// Generate header file
const headerContent = generateCHeader();
fs.writeFileSync(path.join(espDir, 'web_assets.h'), headerContent);

// Generate info file
const infoContent = generateFileInfo();
fs.writeFileSync(path.join(espDir, 'manifest.json'), JSON.stringify(infoContent, null, 2));

console.log(`\n✅ ESP32 build complete!`);
console.log(`📍 Output directory: dist-esp32/`);
console.log(`📊 Compression stats:`);
console.log(`   Original size: ${(totalOriginalSize / 1024).toFixed(2)}KB`);
console.log(`   Compressed size: ${(totalCompressedSize / 1024).toFixed(2)}KB`);
console.log(`   Compression ratio: ${((totalOriginalSize - totalCompressedSize) / totalOriginalSize * 100).toFixed(1)}%`);
console.log(`   Files: ${fileMetadata.length}`);
console.log(`\n📝 Generated files:`);
console.log(`   - web_assets.h (C header with manifest)`);
console.log(`   - manifest.json (filesystem metadata)`);
console.log(`   - All .js, .css, .html files (gzipped)\n`);
