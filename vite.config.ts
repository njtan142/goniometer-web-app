import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';

// Custom plugin to rewrite glTF asset references
function glTFAssetPlugin() {
	const assetMap = new Map();
	
	return {
		name: 'gltf-asset-rewriter',
		apply: 'build',
		generateBundle(options, bundle) {
			// First pass: collect all bin files and their final names
			for (const [fileName, asset] of Object.entries(bundle)) {
				if (fileName.includes('.bin')) {
					const originalName = asset.originalFileName || fileName;
					assetMap.set(originalName, fileName);
				}
			}

			// Second pass: update gltf files to reference the correct bin files
			for (const [fileName, asset] of Object.entries(bundle)) {
				if (fileName.includes('.gltf') && asset.type === 'asset') {
					let source = asset.source.toString();
					
					// Replace all scene.bin references with the hashed version
					for (const [original, hashed] of assetMap) {
						source = source.replace(`"uri": "${original}"`, `"uri": "${hashed}"`);
					}
					
					asset.source = source;
				}
			}
		},
	};
}

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [
		preact({
			prerender: {
				enabled: true,
				renderTarget: '#app',
			},
		}),
		glTFAssetPlugin(),
	],
	publicDir: 'public',
	assetsInclude: ['**/*.gltf', '**/*.glb', '**/*.bin'],
	build: {
		// Optimize for ESP32 deployment
		target: 'es2020',
		minify: 'terser',
		terserOptions: {
			compress: {
				passes: 2,
				drop_console: true,
			},
			mangle: true,
		},
		// Output configuration
		outDir: 'dist',
		assetsDir: 'a',
		// Don't inline large model files
		assetsInlineLimit: 4096,
		rollupOptions: {
			output: {
				// Minimize chunk names for smaller filesystem
				chunkFileNames: 'c/[hash].js',
				entryFileNames: '[hash].js',
				assetFileNames: 'a/[name][extname]',
				compact: true,
			},
		},
		// Reduce sourcemaps or disable for production
		sourcemap: false,
		reportCompressedSize: true,
	},
});
