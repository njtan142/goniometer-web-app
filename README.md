# Digital Goniometer

A lightweight web application for angle measurement and analysis, built as part of a thesis project. This repository contains the web interface only, which runs on an ESP32 microcontroller and is hosted locally.

## Overview

This project is a digital goniometer web application that:
- Runs on an **ESP32 microcontroller** as the backend
- Provides a responsive web interface built with **Preact** for fast development
- Is **statically hosted** with static files stored on the ESP32's external flash
- Serves files to connected clients over a local network
- Uses **Vite** as the build tool for optimal development and production builds

**Note:** This repository contains only the website code. ESP32 firmware and microcontroller-related files are maintained separately.

## Getting Started

-   `npm run dev` - Starts a dev server at http://localhost:5173/ for local development

-   `npm run build` - Builds for production, emitting to `dist/` as static HTML

-   `npm run preview` - Starts a server at http://localhost:4173/ to test the production build locally

## Deployment

The built static files from the `dist/` directory are transferred to the ESP32's external flash memory, where they are served to clients connecting to the device.
