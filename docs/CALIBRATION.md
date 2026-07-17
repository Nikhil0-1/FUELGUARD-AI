# Calibration Guide

The YF-S201 Flow Sensor works by counting pulse signals outputted from a Hall-effect wheel as liquid passes through the chamber. To achieve commercial-grade accuracy, follow this procedure.

## Formula
- **Flow Rate (L/min)** = Frequency (Hz) / Calibration Factor
- **Volume (L)** = Accumulated Pulses / (Calibration Factor × 60)
- **Standard Default Factor**: `7.50` (translates to 450 pulses per Litre)

## Calibration Procedure
1. Navigate to the **Admin Console** in your FuelGuard AI dashboard.
2. Select **Sensor Calibration** from the configuration tabs.
3. Choose the target Node ID from the selector dropdown.
4. Click **Start Calibration Mode**. The physical LCD screen will display `Calibration Mode: Running...`.
5. Run exactly **1.00 Litre** of liquid through the flow sensor.
6. Click **Stop Calibration Mode** from the admin dashboard.
7. The ESP8266 controller calculates the actual pulses recorded (e.g. 465 pulses), computes the new factor (`465 / 60 = 7.75`), saves it permanently inside LittleFS flash memory, and synchronizes the configuration to the cloud.
