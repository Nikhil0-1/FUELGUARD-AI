# Testing and Verification Manual

Before deploying FuelGuard AI to production, verify the hardware calibration and the web sync telemetry.

## 1. Hardware Tests
- **Startup Display Test**: Turn on power and verify that the LCD shows `FuelGuard AI v1.0.0` for 2 seconds before shifting to `Status: Waiting`.
- **Pulses Interrupt Test**: Blow into the YF-S201 sensor chamber and verify that the LCD status shifts from `Waiting` to `Filling` and the flow rate counts update.
- **Auto-Reconnect Test**: Power down your WiFi router. Verify that the LCD displays `WiFi Connection / Reconnecting...` status within 30 seconds. Turn the router back on and verify that the status returns to `Waiting` automatically.

## 2. Web Telemetry Validation
- **Dashboard Counter Test**: Run water through the flow sensor and verify that the Litres count on the React dashboard matches the LCD reading instantly.
- **Log Verification**: Stop the flow of water. After 3 seconds, verify that the LCD displays `Status: Finished` and a new record appears in the **Recent Transactions** list on the dashboard.
- **CSV Export Validation**: Go to the **History Logs** page on the dashboard and click **Export CSV**. Open the downloaded file and check that the columns align correctly.
