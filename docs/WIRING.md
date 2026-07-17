# Wiring and Connections Layout

To connect the flow sensor, LCD display, buck converter, and ESP8266 NodeMCU, use the following layout:

## Connection Table

| Device | NodeMCU Pin | GPIO Pin | Description |
|:-------|:------------|:---------|:------------|
| **YF-S201 Signal (Yellow)** | **D5** | GPIO 14 | Pulse signal trigger (Hardware interrupt) |
| **YF-S201 VCC (Red)** | **VIN (5V)** | — | Power input (Requires 5V for accurate Hall readings) |
| **YF-S201 GND (Black)** | **GND** | — | System ground |
| **LCD SDA** | **D3** | GPIO 0 | LiquidCrystal I2C Data pin |
| **LCD SCL** | **D4** | GPIO 2 | LiquidCrystal I2C Clock pin |
| **LCD VCC** | **VIN (5V)** | — | Power input (Requires 5V for bright LCD backlight) |
| **LCD GND** | **GND** | — | System ground |

---

## Power Scheme (Buck Converter)

The YF-S201 sensor and I2C LCD require a 5V supply to run accurately and prevent dim screens. 

```
[12V DC Supply Input]
       │
       ├───► [Buck Converter (In)]
       │         │
       │         └───► [Buck Converter (Out: Adjust to 5V)] ───┬──► [NodeMCU VIN]
       │                                                       ├──► [YF-S201 VCC]
       │                                                       └──► [LCD VCC]
       │
       └───► [System Ground (GND)] ────────────────────────────┴──► [All GND Pins]
```

> [!CAUTION]
> Always verify that your buck converter outputs exactly **5.0V** using a multimeter before connecting it to the NodeMCU's **VIN** pin to prevent damaging the board.
