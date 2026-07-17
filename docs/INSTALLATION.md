# Installation Guide

## 1. Setup Arduino Firmware
1. Open the Arduino IDE.
2. Go to **File > Preferences** and add the following URL to **Additional Boards Manager URLs**:
   `http://arduino.esp8266.com/stable/package_esp8266com_index.json`
3. Go to **Tools > Board > Boards Manager**, search for `esp8266` and click **Install**.
4. Install these libraries from Library Manager:
   - `LiquidCrystal_I2C` by Frank de Brabander
   - `FirebaseClient` by Mobizt
5. Open [FuelGuardAI.ino](file:///c:/Users/mdsha/Desktop/fuel/firmware/FuelGuardAI/FuelGuardAI.ino).
6. Edit [config.h](file:///c:/Users/mdsha/Desktop/fuel/firmware/FuelGuardAI/config.h) with your credentials.
7. Select Board: **NodeMCU 1.0 (ESP-12E Module)** and hit Upload!

## 2. Setup React Web App
1. Make sure Node.js (v18+) is installed.
2. Navigate to the web folder and install dependencies:
   ```bash
   cd web
   npm install
   ```
3. Copy the environment template:
   ```bash
   cp .env.example .env
   ```
4. Edit the `.env` file, replacing the placeholder values with your Firebase Project Configuration keys.
5. Launch the local development server:
   ```bash
   npm run dev
   ```
6. Open `http://localhost:5173` in your browser.
