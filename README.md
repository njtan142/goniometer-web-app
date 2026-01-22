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

## Features

- **Real-time Angle Display** - High-contrast readout of degrees or radians with large, readable fonts
- **Visual Gauge** - SVG-based needle or arc overlay that updates instantly with sensor data
- **Zero/Tare Calibration** - Button to set the current position as the 0-degree reference point
- **Hold/Freeze Toggle** - Lock the current reading on screen for easier data recording
- **Max/Min Range Tracking** - Automatically records peak range of motion during a measurement session
- **Data Logging** - "Record" button to capture data points with CSV export functionality
- **Device Status** - Real-time indicators for WiFi signal strength (RSSI), battery level, and connection heartbeat
- **Sampling Rate Control** - Adjustable slider to control ESP32 data transmission frequency (10Hz to 100Hz)
- **Report Generation** - Generate diagnostic reports including ROM (Range of Motion) and other patient metrics for physical therapists

## Getting Started

-   `npm run dev` - Starts a dev server at http://localhost:5173/ for local development

-   `npm run build` - Builds for production, emitting to `dist/` as static HTML

-   `npm run preview` - Starts a server at http://localhost:4173/ to test the production build locally

## Deployment

The built static files from the `dist/` directory are transferred to the ESP32's external flash memory, where they are served to clients connecting to the device.

### Size Constraints

The built website **must not exceed 7MB** to fit within the ESP32's external flash storage. Optimize assets (images, SVGs) and minimize bundle size during development to stay within this limit.
