# ESP32 Static Website Deployment Guide

This project is now optimized for deploying as a static website on ESP32 microcontrollers.

## Quick Start

### 1. Build for ESP32

```bash
npm run build:esp32
```

This will:
- Build the Vite project with optimizations for minimal size
- Compress all files with gzip
- Generate `dist-esp32/` with compressed assets
- Create `web_assets.h` C header file with file metadata

### 2. Upload to ESP32

The `dist-esp32/` folder contains:
- **Compressed files** (.js.gz, .css.gz, .html.gz) for SPIFFS/LittleFS
- **web_assets.h** - C header for embedded asset reference
- **manifest.json** - Filesystem metadata and statistics

## Deployment Methods

### Option A: SPIFFS Web Uploader
1. Use [ESP32 Sketch Data Upload](https://github.com/me-no-dev/arduino-esp32fs-plugin) to upload `dist-esp32/` to your ESP32
2. Configure your web server to serve files from SPIFFS

### Option B: LittleFS (Recommended)
1. Convert dist-esp32 files for LittleFS filesystem
2. Use [LittleFS upload tool](https://github.com/me-no-dev/arduino-littlefs)

## Example ESP32 Web Server Code

```cpp
#include <WiFi.h>
#include <WebServer.h>
#include <SPIFFS.h>

WebServer server(80);

void setup() {
  Serial.begin(115200);
  
  // Initialize SPIFFS
  if(!SPIFFS.begin(true)) {
    Serial.println("SPIFFS Mount Failed");
    return;
  }
  
  // Connect to WiFi
  WiFi.begin("YOUR_SSID", "YOUR_PASSWORD");
  while(WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi connected");
  Serial.println(WiFi.localIP());
  
  // Setup routes
  server.onNotFound([]() {
    String path = server.uri();
    if(path.endsWith("/")) path += "index.html";
    
    // Try to serve the file
    if(SPIFFS.exists(path)) {
      File file = SPIFFS.open(path, "r");
      String contentType = getContentType(path);
      
      // Check if file is gzipped
      if(path.endsWith(".js.gz")) {
        server.sendHeader("Content-Encoding", "gzip");
        contentType = "text/javascript";
      } else if(path.endsWith(".css.gz")) {
        server.sendHeader("Content-Encoding", "gzip");
        contentType = "text/css";
      } else if(path.endsWith(".html.gz")) {
        server.sendHeader("Content-Encoding", "gzip");
        contentType = "text/html";
      }
      
      server.streamFile(file, contentType);
      file.close();
    } else {
      // Serve index.html for SPA routing
      File file = SPIFFS.open("/index.html.gz", "r");
      server.sendHeader("Content-Encoding", "gzip");
      server.streamFile(file, "text/html");
      file.close();
    }
  });
  
  server.begin();
}

void loop() {
  server.handleClient();
}

String getContentType(String filename) {
  if(filename.endsWith(".html")) return "text/html";
  if(filename.endsWith(".css")) return "text/css";
  if(filename.endsWith(".js")) return "text/javascript";
  if(filename.endsWith(".json")) return "application/json";
  if(filename.endsWith(".png")) return "image/png";
  if(filename.endsWith(".jpg")) return "image/jpeg";
  if(filename.endsWith(".svg")) return "image/svg+xml";
  return "application/octet-stream";
}
```

## Optimization Tips

### Bundle Size Optimization
- Preact is used instead of React (3KB vs 40KB)
- All assets are gzipped (typically 60-80% reduction)
- CSS-in-JS compiled to minimal inline styles
- Unused code tree-shaken by Vite

### Current Build Stats
Run `npm run build:esp32` to see compression statistics.

### Memory Considerations
- ESP32 has limited RAM (~520KB available)
- SPIFFS/LittleFS stores on flash memory
- Gzipped assets are decompressed on-the-fly by browser
- Keep preloaded assets minimal

## File Structure

```
dist-esp32/
├── index.html.gz           # Main page (gzipped)
├── *.js.gz                 # JavaScript bundles (gzipped)
├── *.css.gz                # Stylesheets (gzipped)
├── a/                      # Inline assets directory
├── c/                      # Chunk files
├── web_assets.h            # C header for embedded reference
└── manifest.json           # Filesystem metadata
```

## Monitoring & Debugging

Check SPIFFS usage:
```cpp
// In ESP32 code
size_t totalBytes = SPIFFS.totalBytes();
size_t usedBytes = SPIFFS.usedBytes();
Serial.printf("SPIFFS Total: %d, Used: %d\n", totalBytes, usedBytes);
```

## Build Configuration Details

The Vite config includes:
- **Terser minification** with multiple passes
- **Gzip compression** via Node.js build script
- **Chunk optimization** with short filenames
- **Inline small assets** to reduce file count
- **Asset filename hashing** for cache busting

See `vite.config.ts` for details.
