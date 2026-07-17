# FUELGUARD-AI — Smart Fuel Accuracy & Monitoring Platform

A complete commercial IoT platform for tracking fuel accuracy, flow telemetry, and anti-theft detection.

## 🚀 Features

- **Hardware Edge System**: ESP8266 NodeMCU firmware with YF-S201 Flow Sensor, I2C 16x2 LCD display, LittleFS flash memory serialization, and OTA network flashing.
- **Web App Console**: React, Vite, and Tailwind CSS v4 dashboard utilizing Firebase Realtime Database and Authentication with full role-based controls.
- **Anti-Theft Detection**: Remote node locks trigger suspicious siphoning alerts to the cloud immediately.
- **Diagnostics Dashboard**: RSSI WiFi signal indicator, flow statistics, calibration triggers, and transaction export utilities (Excel, PDF, CSV).

## 📁 Repository Structure

- `firmware/FuelGuardAI/`: Consolidated compilable single-file ESP8266 Arduino sketch (`FuelGuardAI.ino`).
- `web/`: Vite + React UI source code.
- `firebase/`: RTDB JSON security rules.
- `docs/`: Installation, wiring, and calibration guides.
