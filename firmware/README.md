# 🔧 FuelGuard AI — Firmware setup guide

This folder contains the complete C++ firmware for the **FuelGuard AI ESP8266 NodeMCU** flow monitoring controller.

## Pin Connections (Revised)

To avoid conflicts with default pins on the ESP8266, use the following layout:

| Component | NodeMCU Label | GPIO Pin | Description |
|-----------|---------------|----------|-------------|
| **YF-S201 Signal** | **D5** | GPIO 14 | Pulse flow output (Uses hardware interrupt) |
| **I2C LCD SDA** | **D3** | GPIO 0 | LiquidCrystal I2C Data pin |
| **I2C LCD SCL** | **D4** | GPIO 2 | LiquidCrystal I2C Clock pin |
| **YF-S201 VCC** | **VIN (5V)** | — | Power input (Requires 5V for accurate Hall readings) |
| **YF-S201 GND** | **GND** | — | System ground |
| **LCD VCC** | **VIN (5V)** | — | Power input (Requires 5V for bright LCD screen backlight) |
| **LCD GND** | **GND** | — | System ground |

*Note: In the firmware, I2C is explicitly configured on D3/D4 using `Wire.begin(0, 2)` to leave D1/D2 free for generic interrupt signals if needed, resolving I2C resource blocking.*

## Setup Instructions

1. **Install Arduino IDE** (v1.8.19 or v2.0+).
2. Go to **File > Preferences** and add the following URL to **Additional Boards Manager URLs**:
   `http://arduino.esp8266.com/stable/package_esp8266com_index.json`
3. Go to **Tools > Board > Boards Manager**, search for `esp8266` and click **Install** (Use version 3.0.2 or higher).
4. Install libraries listed in [libraries.txt](file:///c:/Users/mdsha/Desktop/fuel/firmware/libraries.txt).
5. Open [FuelGuardAI.ino](file:///c:/Users/mdsha/Desktop/fuel/firmware/FuelGuardAI/FuelGuardAI.ino) in Arduino IDE.
6. Edit [config.h](file:///c:/Users/mdsha/Desktop/fuel/firmware/FuelGuardAI/config.h) to configure your **WiFi SSID**, **WiFi Password**, **Firebase Database URL**, and **Firebase API Key**.
7. Go to **Tools > Board** and select **NodeMCU 1.0 (ESP-12E Module)**.
8. Compile and Upload to the ESP8266!

## Calibration Guide

The YF-S201 sensor outputs a nominal 450 pulses per liter (Calibration Factor = 7.5). To calibrate:
1. Trigger **Calibration Mode** from the Web Admin dashboard.
2. Flow exactly 1 Liter of liquid through the sensor.
3. Turn off **Calibration Mode** from the dashboard.
4. The ESP automatically calculates your specific Calibration Factor based on actual pulses and saves it to LittleFS.
