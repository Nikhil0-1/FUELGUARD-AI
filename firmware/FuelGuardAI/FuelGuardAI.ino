/**
 * ============================================================================
 * FuelGuard AI — Smart Fuel Accuracy & Monitoring Platform
 * ----------------------------------------------------------------------------
 * UNIFIED FIRMWARE SKETCH (Single-File Architecture - Standard Version)
 * Pin Configuration:
 *   - YF-S201 Flow Sensor Signal: D5 (GPIO 14)
 *   - LCD I2C SDA: D3 (GPIO 0)
 *   - LCD I2C SCL: D4 (GPIO 2)
 * ============================================================================
 */

#include <Arduino.h>
#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClientSecure.h>
#include <ESP8266mDNS.h>
#include <WiFiUdp.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <LittleFS.h>
#include <time.h>

// ==========================================
// 1. HARDWARE & CLOUD CONFIGURATION
// ==========================================
#define WIFI_SSID           "Test"
#define WIFI_PASSWORD       "22558800"

// Custom Hardware Device ID to match Web Dashboard (leave as "" to auto-use ESP Chip ID)
#define HARDWARE_DEVICE_ID  ""

#define FIREBASE_DATABASE_URL "https://fuelguard-ai-default-rtdb.firebaseio.com"

#define SENSOR_PIN          14   // D5 (GPIO14) - Hardware Interrupt Pin
#define LCD_SDA_PIN         0    // D3 (GPIO0) - Custom I2C SDA
#define LCD_SCL_PIN         2    // D4 (GPIO2) - Custom I2C SCL
#define LCD_I2C_ADDRESS     0x27 // 0x27 or 0x3F

#define DEFAULT_CALIBRATION_FACTOR 7.5f
#define DEFAULT_FUEL_PRICE         106.31f
#define MIN_FLOW_THRESHOLD         0.1f
#define FLOW_TIMEOUT_MS            3000

// ==========================================
// 2. ENUMS & STRUCTS
// ==========================================
enum FuelingState {
    STATE_IDLE,
    STATE_FILLING,
    STATE_COMPLETING,
    STATE_COMPLETED
};

enum DisplayStatus {
    STATUS_WAITING,
    STATUS_FILLING,
    STATUS_COMPLETED,
    STATUS_SENSOR_ERROR,
    STATUS_WIFI_LOST,
    STATUS_CLOUD_OFFLINE,
    STATUS_RECONNECTING,
    STATUS_THEFT_ALERT
};

struct CalibrationProfile {
    float calibrationFactor;
    float accumulatedTotalFuel;
    float accumulatedTodayFuel;
    float accumulatedMonthlyFuel;
    uint32_t lastResetDate; // YYYYMMDD
    uint32_t checksum;
};

// ==========================================
// 3. GLOBAL VARIABLES & OBJECT CLASS INSTANCES
// ==========================================
volatile uint32_t pulseCount = 0;
volatile unsigned long lastPulseTime = 0;

// LCD Driver (16x2)
LiquidCrystal_I2C lcd(LCD_I2C_ADDRESS, 16, 2);

// System Telemetry Variables
String deviceId;
FuelingState systemState = STATE_IDLE;
float currentFlowRate = 0.0f;
float sessionLitres = 0.0f;
float sessionCost = 0.0f;
uint32_t sessionPulses = 0;
unsigned long sessionStartTime = 0;
unsigned long sessionEndTime = 0;

float activeCalibrationFactor = DEFAULT_CALIBRATION_FACTOR;
float fuelPrice = DEFAULT_FUEL_PRICE;

float accumulatedTotalFuel = 0.0f;
float accumulatedTodayFuel = 0.0f;
float accumulatedMonthlyFuel = 0.0f;

// Timers
unsigned long lastSensorRead = 0;
unsigned long lastDisplayRefresh = 0;
unsigned long lastFirebasePush = 0;
unsigned long lastWifiCheck = 0;
unsigned long lastCommandCheck = 0;
unsigned long lastLcdRotate = 0;
unsigned long lastFlowDetectedTime = 0;

uint8_t lcdActiveScreen = 0;
bool isCalibrationMode = false;
bool firebaseReady = false;
bool deviceLocked = false;
unsigned long lastTheftAlertTime = 0;

// Custom Indian Rupee Symbol
byte rupeeChar[8] = {
    B00000,
    B11111,
    B01000,
    B11110,
    B01000,
    B10100,
    B00010,
    B00000
};

// ==========================================
// 4. INTERRUPT SERVICE ROUTINE (ISR)
// ==========================================
void IRAM_ATTR pulseISR() {
    unsigned long now = micros();
    // 500 microseconds debounce window
    if (now - lastPulseTime > 500) {
        pulseCount++;
        lastPulseTime = now;
    }
}

// ==========================================
// 5. HELPER UTILITIES & DATE FUNCTIONS
// ==========================================
uint32_t getEpochTime() {
    time_t now;
    struct tm timeinfo;
    if (!getLocalTime(&timeinfo)) {
        return (uint32_t)(millis() / 1000);
    }
    time(&now);
    return (uint32_t)now;
}

String getFormattedDate() {
    time_t now;
    struct tm timeinfo;
    char buffer[12];
    if (!getLocalTime(&timeinfo)) {
        return "2026-07-21";
    }
    time(&now);
    localtime_r(&now, &timeinfo);
    strftime(buffer, sizeof(buffer), "%Y-%m-%d", &timeinfo);
    return String(buffer);
}

uint32_t getTodayDateCode() {
    time_t now;
    struct tm timeinfo;
    char buffer[9];
    if (!getLocalTime(&timeinfo)) {
        return 20260721;
    }
    time(&now);
    localtime_r(&now, &timeinfo);
    strftime(buffer, sizeof(buffer), "%Y%m%d", &timeinfo);
    return (uint32_t)strtoul(buffer, nullptr, 10);
}

// ==========================================
// 6. FLASH MEMORY STORAGE (Calibration Profile)
// ==========================================
uint32_t calculateChecksum(const CalibrationProfile &profile) {
    uint32_t checksum = 0;
    byte *ptr = (byte*)&profile;
    size_t size = sizeof(CalibrationProfile) - sizeof(uint32_t);
    for (size_t i = 0; i < size; i++) {
        checksum += ptr[i];
    }
    return checksum;
}

void saveProfile() {
    CalibrationProfile profile;
    profile.calibrationFactor = activeCalibrationFactor;
    profile.accumulatedTotalFuel = accumulatedTotalFuel;
    profile.accumulatedTodayFuel = accumulatedTodayFuel;
    profile.accumulatedMonthlyFuel = accumulatedMonthlyFuel;
    profile.lastResetDate = getTodayDateCode();
    profile.checksum = calculateChecksum(profile);

    File file = LittleFS.open("/calib.bin", "w");
    if (file) {
        file.write((byte*)&profile, sizeof(CalibrationProfile));
        file.close();
        Serial.println(F("[Flash] Settings saved to LittleFS."));
    }
}

void loadProfile() {
    if (!LittleFS.exists("/calib.bin")) {
        Serial.println(F("[Flash] No saved config found. Using default profile settings."));
        saveProfile();
        return;
    }

    File file = LittleFS.open("/calib.bin", "r");
    if (!file) return;

    CalibrationProfile profile;
    file.read((byte*)&profile, sizeof(CalibrationProfile));
    file.close();

    if (calculateChecksum(profile) == profile.checksum) {
        activeCalibrationFactor = profile.calibrationFactor;
        accumulatedTotalFuel = profile.accumulatedTotalFuel;
        accumulatedTodayFuel = profile.accumulatedTodayFuel;
        accumulatedMonthlyFuel = profile.accumulatedMonthlyFuel;
        
        // Date Reset Check
        uint32_t currentDay = getTodayDateCode();
        if (profile.lastResetDate != currentDay) {
            accumulatedTodayFuel = 0.0f;
            saveProfile();
        }
        Serial.println(F("[Flash] Settings profile loaded successfully."));
    } else {
        Serial.println(F("[Flash] Checksum mismatch. Restoring default profile."));
        saveProfile();
    }
}

// ==========================================
// 7. LCD DISPLAY RENDERING ROUTINES
// ==========================================
char line1Cache[17] = {0};
char line2Cache[17] = {0};

void printLcdLine(uint8_t row, const char* text) {
    lcd.setCursor(0, row);
    for (int i = 0; i < 16; i++) {
        if (text[i] == '\0') {
            for (int j = i; j < 16; j++) lcd.print(' ');
            break;
        }
        if (text[i] == '\x08') {
            lcd.write(0); // Indian Rupee custom sign
        } else {
            lcd.print(text[i]);
        }
    }
}

void updateLcdBuffer(const char* l1, const char* l2) {
    if (strncmp(line1Cache, l1, 16) != 0) {
        strncpy(line1Cache, l1, 16);
        line1Cache[16] = '\0';
        printLcdLine(0, line1Cache);
    }
    if (strncmp(line2Cache, l2, 16) != 0) {
        strncpy(line2Cache, l2, 16);
        line2Cache[16] = '\0';
        printLcdLine(1, line2Cache);
    }
}

void refreshLcdDisplay(DisplayStatus status) {
    char l1[17] = {0};
    char l2[17] = {0};

    switch (status) {
        case STATUS_WIFI_LOST:
            snprintf(l1, 17, "Signal Error    ");
            snprintf(l2, 17, "WiFi Lost...    ");
            break;
            
        case STATUS_CLOUD_OFFLINE:
            snprintf(l1, 17, "Cloud Status:   ");
            snprintf(l2, 17, "Offline...      ");
            break;

        case STATUS_RECONNECTING:
            snprintf(l1, 17, "Reconnecting    ");
            snprintf(l2, 17, "Please wait...  ");
            break;

        case STATUS_FILLING:
            if (lcdActiveScreen == 0) {
                snprintf(l1, 17, "Fuel: %6.2f L ", sessionLitres);
                snprintf(l2, 17, "Price: \x08%7.2f", sessionCost);
            } else {
                snprintf(l1, 17, "Flow: %5.2f L/m ", currentFlowRate);
                snprintf(l2, 17, "Status: Filling ");
            }
            break;

        case STATUS_COMPLETED:
            if (lcdActiveScreen == 0) {
                snprintf(l1, 17, "Fuel: %6.2f L ", sessionLitres);
                snprintf(l2, 17, "Total: \x08%7.2f", sessionCost);
            } else {
                snprintf(l1, 17, "Status: Finished");
                snprintf(l2, 17, "Thank You       ");
            }
            break;

        case STATUS_THEFT_ALERT:
            snprintf(l1, 17, "SECURITY ALERT  ");
            snprintf(l2, 17, "FLOW DISALLOWED ");
            break;

        case STATUS_WAITING:
        default:
            snprintf(l1, 17, "FuelGuard AI    ");
            snprintf(l2, 17, "Status: Ready   ");
            break;
    }

    updateLcdBuffer(l1, l2);
}

// ==========================================
// 8. FIREBASE REALTIME DATABASE NATIVE REST ENGINE
// ==========================================
bool sendHttpPatch(const String& path, const String& jsonBody) {
    if (WiFi.status() != WL_CONNECTED) return false;
    
    WiFiClientSecure client;
    client.setInsecure();
    client.setTimeout(5000);
    
    HTTPClient http;
    String url = String(FIREBASE_DATABASE_URL) + path + ".json";
    
    if (http.begin(client, url)) {
        http.addHeader("Content-Type", "application/json");
        int httpCode = http.sendRequest("PATCH", jsonBody);
        http.end();
        return (httpCode == 200 || httpCode == 204);
    }
    return false;
}

bool sendHttpPost(const String& path, const String& jsonBody) {
    if (WiFi.status() != WL_CONNECTED) return false;
    
    WiFiClientSecure client;
    client.setInsecure();
    client.setTimeout(5000);
    
    HTTPClient http;
    String url = String(FIREBASE_DATABASE_URL) + path + ".json";
    
    if (http.begin(client, url)) {
        http.addHeader("Content-Type", "application/json");
        int httpCode = http.POST(jsonBody);
        http.end();
        return (httpCode == 200);
    }
    return false;
}

String sendHttpGet(const String& path) {
    if (WiFi.status() != WL_CONNECTED) return "";
    
    WiFiClientSecure client;
    client.setInsecure();
    client.setTimeout(5000);
    
    HTTPClient http;
    String url = String(FIREBASE_DATABASE_URL) + path + ".json";
    
    if (http.begin(client, url)) {
        int httpCode = http.GET();
        String resp = "";
        if (httpCode == 200) {
            resp = http.getString();
        }
        http.end();
        return resp;
    }
    return "";
}

void sendTheftAlert() {
    unsigned long now = millis();
    if (now - lastTheftAlertTime >= 10000) {
        lastTheftAlertTime = now;
        Serial.println(F("[ALERT] CRITICAL: Unauthorized flow detected on locked device!"));
        
        double nowMs = (double)getEpochTime() * 1000.0;
        if (nowMs < 100000000000.0) nowMs = (double)millis();
        
        String notifPayload = "{\"type\":\"THEFT_ALERT\",\"deviceId\":\"" + deviceId + 
                             "\",\"message\":\"CRITICAL: Unauthorized fuel flow detected on locked node!\"" + 
                             ",\"read\":false,\"timestamp\":" + String(nowMs, 0) + "}";
        sendHttpPost("/FuelGuardAI/Notifications", notifPayload);
    }
}

void reportHeartbeat() {
    if (WiFi.status() != WL_CONNECTED) return;
    
    double nowMs = (double)getEpochTime() * 1000.0;
    if (nowMs < 100000000000.0) nowMs = (double)millis();
    
    String payload = "{\"name\":\"Nikhil Node\",\"status\":\"online\",\"wifiStrength\":" + String(WiFi.RSSI()) + 
                     ",\"lastSeen\":" + String(nowMs, 0) + 
                     ",\"calibrationFactor\":" + String(activeCalibrationFactor, 2) + 
                     ",\"lockStatus\":" + String(deviceLocked ? "true" : "false") + 
                     ",\"firmwareVersion\":\"1.0.0\"}";

    bool ok1 = sendHttpPatch("/FuelGuardAI/Devices/" + deviceId, payload);
    if (deviceId != "DEVICE_ESP8266") {
        sendHttpPatch("/FuelGuardAI/Devices/DEVICE_ESP8266", payload);
    }

    if (ok1) {
        Serial.println(F("[Heartbeat] Firebase RTDB updated -> Status: ONLINE (200 OK)"));
        firebaseReady = true;
    } else {
        Serial.println(F("[Heartbeat] REST update failed. Retrying..."));
    }
}

void checkRemoteCommands() {
    if (WiFi.status() != WL_CONNECTED) return;
    
    String resp = sendHttpGet("/FuelGuardAI/Devices/" + deviceId + "/config");
    if (resp.length() > 0 && resp != "null") {
        if (resp.indexOf("\"lockStatus\":true") != -1) {
            deviceLocked = true;
        } else if (resp.indexOf("\"lockStatus\":false") != -1) {
            deviceLocked = false;
        }
    }

    String cmdResp = sendHttpGet("/FuelGuardAI/Devices/" + deviceId + "/commands/action");
    if (cmdResp.length() > 0 && cmdResp != "null" && cmdResp != "\"\"") {
        Serial.printf("[Cloud] Received Command: %s\n", cmdResp.c_str());
        sendHttpPatch("/FuelGuardAI/Devices/" + deviceId + "/commands", "{\"action\":\"\"}");
        
        if (cmdResp.indexOf("restart") != -1) {
            delay(1000);
            ESP.restart();
        } else if (cmdResp.indexOf("resetToday") != -1) {
            accumulatedTodayFuel = 0.0f;
            saveProfile();
        }
    }
}

void pushLiveReadings() {
    if (WiFi.status() != WL_CONNECTED) return;
    
    double nowMs = (double)getEpochTime() * 1000.0;
    if (nowMs < 100000000000.0) nowMs = (double)millis();
    
    String payload = "{\"flowRate\":" + String(currentFlowRate, 2) + 
                     ",\"totalLitres\":" + String(sessionLitres, 2) + 
                     ",\"fuelCost\":" + String(sessionCost, 2) + 
                     ",\"pulseCount\":" + String(sessionPulses) + 
                     ",\"status\":\"" + String(systemState == STATE_FILLING ? "Filling" : "Waiting") + "\"" + 
                     ",\"timestamp\":" + String(nowMs, 0) + "}";

    sendHttpPatch("/FuelGuardAI/LiveData/" + deviceId, payload);
    if (deviceId != "DEVICE_ESP8266") {
        sendHttpPatch("/FuelGuardAI/LiveData/DEVICE_ESP8266", payload);
    }
}

void commitTransaction() {
    if (WiFi.status() != WL_CONNECTED) return;
    
    double startTimeMs = (double)sessionStartTime;
    double endTimeMs = (double)sessionEndTime;
    uint32_t durationSec = (sessionEndTime - sessionStartTime) / 1000;
    
    String payload = "{\"deviceId\":\"" + deviceId + "\"" + 
                     ",\"vehicleId\":\"VH-AUTO\"" + 
                     ",\"fuel\":" + String(sessionLitres, 2) + 
                     ",\"price\":" + String(sessionCost, 2) + 
                     ",\"pricePerLitre\":" + String(fuelPrice, 2) + 
                     ",\"duration\":" + String(durationSec) + 
                     ",\"date\":\"" + getFormattedDate() + "\"" + 
                     ",\"status\":\"completed\"" + 
                     ",\"startTime\":" + String(startTimeMs, 0) + 
                     ",\"endTime\":" + String(endTimeMs, 0) + "}";

    sendHttpPost("/FuelGuardAI/Transactions", payload);

    double nowMs = (double)getEpochTime() * 1000.0;
    if (nowMs < 100000000000.0) nowMs = (double)millis();
    
    String notifPayload = "{\"type\":\"FUEL_COMPLETED\",\"deviceId\":\"" + deviceId + 
                         "\",\"message\":\"Fueling session completed: " + String(sessionLitres, 2) + "L\"" + 
                         ",\"read\":false,\"timestamp\":" + String(nowMs, 0) + "}";
    sendHttpPost("/FuelGuardAI/Notifications", notifPayload);
}

// ==========================================
// 9. SYSTEM INITIALIZATION & MAIN LOOPS
// ==========================================
void setup() {
    Serial.begin(115200);
    delay(500);

    if (String(HARDWARE_DEVICE_ID).length() > 0) {
        deviceId = HARDWARE_DEVICE_ID;
    } else {
        deviceId = "DEVICE_" + String(ESP.getChipId());
    }
    Serial.printf("\n[Boot] Device ID initialized: %s\n", deviceId.c_str());

    // Customized I2C on Pins D3 (SDA), D4 (SCL)
    Wire.begin(LCD_SDA_PIN, LCD_SCL_PIN);
    lcd.init();
    lcd.backlight();
    lcd.createChar(0, rupeeChar);

    // Draw Boot Info
    printLcdLine(0, "FuelGuard AI 1.0");
    printLcdLine(1, "Booting Edge OS ");
    delay(1000);

    // Mount Flash
    printLcdLine(1, "Mounting FS...  ");
    if (!LittleFS.begin()) {
        LittleFS.format();
        LittleFS.begin();
    }
    loadProfile();
    delay(500);

    // Attach Sensor Interrupt
    pinMode(SENSOR_PIN, INPUT_PULLUP);
    attachInterrupt(digitalPinToInterrupt(SENSOR_PIN), pulseISR, RISING);

    // Launch WiFi connection
    printLcdLine(1, "Connecting WiFi ");
    WiFi.mode(WIFI_STA);
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    
    // Connect wait loop with dots on LCD (max 10s timeout)
    int wifiTimeout = 0;
    char wifiDotStr[17] = "Connecting...   ";
    while (WiFi.status() != WL_CONNECTED && wifiTimeout < 20) {
        wifiDotStr[10 + (wifiTimeout % 4)] = '.';
        if (wifiTimeout % 4 == 0) {
            strncpy(wifiDotStr + 10, "... ", 5);
        }
        printLcdLine(1, wifiDotStr);
        delay(500);
        wifiTimeout++;
    }

    if (WiFi.status() == WL_CONNECTED) {
        printLcdLine(1, "WiFi Connected! ");
    } else {
        printLcdLine(1, "WiFi Timeout!   ");
    }
    delay(1000);

    // Setup NTP time synchronizer clock updates
    printLcdLine(1, "Configuring Time");
    configTime(19800, 0, "pool.ntp.org", "time.nist.gov");
    delay(500);

    printLcdLine(1, "System Ready!   ");
    delay(1000);

    Serial.println(F("[System] Boot Sequence completed. Native REST Engine active."));
}

void loop() {
    unsigned long now = millis();
    bool isConnected = (WiFi.status() == WL_CONNECTED);

    // 1. Core Flow Rate computations & State Machine logic
    if (now - lastSensorRead >= 500) {
        lastSensorRead = now;

        // Atomically copy pulseCount
        noInterrupts();
        uint32_t pulses = pulseCount;
        pulseCount = 0;
        interrupts();

        float durationSeconds = 0.5f; // read window is 500ms
        float rawFlowRate = (pulses / activeCalibrationFactor) / durationSeconds;

        // Simple noise threshold logic
        if (rawFlowRate < MIN_FLOW_THRESHOLD) {
            currentFlowRate = 0.0f;
        } else {
            // Apply rolling average factor mapping
            currentFlowRate = (currentFlowRate * 0.7f) + (rawFlowRate * 0.3f);
            currentFlowRate = round(currentFlowRate * 100.0f) / 100.0f;
        }

        // State Machine Loop
        switch (systemState) {
            case STATE_IDLE:
                if (currentFlowRate >= MIN_FLOW_THRESHOLD && !isCalibrationMode) {
                    if (deviceLocked) {
                        sendTheftAlert();
                    } else {
                        systemState = STATE_FILLING;
                        sessionStartTime = getEpochTime() * 1000;
                        sessionLitres = 0.0f;
                        sessionCost = 0.0f;
                        sessionPulses = 0;
                        lastFlowDetectedTime = now;
                        Serial.println(F("[State] Transition: Waiting -> Filling"));
                    }
                }
                break;

            case STATE_FILLING:
                sessionPulses += pulses;
                sessionLitres = (float)sessionPulses / (activeCalibrationFactor * 60.0f);
                sessionLitres = round(sessionLitres * 100.0f) / 100.0f;
                sessionCost = sessionLitres * fuelPrice;
                sessionCost = round(sessionCost * 100.0f) / 100.0f;

                if (currentFlowRate < MIN_FLOW_THRESHOLD) {
                    systemState = STATE_COMPLETING;
                    lastFlowDetectedTime = now;
                    Serial.println(F("[State] Transition: Filling -> Completing"));
                } else {
                    lastFlowDetectedTime = now;
                }
                break;

            case STATE_COMPLETING:
                sessionPulses += pulses;
                sessionLitres = (float)sessionPulses / (activeCalibrationFactor * 60.0f);
                sessionLitres = round(sessionLitres * 100.0f) / 100.0f;
                sessionCost = sessionLitres * fuelPrice;
                sessionCost = round(sessionCost * 100.0f) / 100.0f;

                if (currentFlowRate >= MIN_FLOW_THRESHOLD) {
                    systemState = STATE_FILLING;
                    lastFlowDetectedTime = now;
                    Serial.println(F("[State] Transition: Completing -> Filling"));
                } else if (now - lastFlowDetectedTime >= FLOW_TIMEOUT_MS) {
                    systemState = STATE_COMPLETED;
                    sessionEndTime = getEpochTime() * 1000;
                    Serial.println(F("[State] Transition: Completing -> Completed"));
                }
                break;

            case STATE_COMPLETED:
                accumulatedTotalFuel += sessionLitres;
                accumulatedTodayFuel += sessionLitres;
                accumulatedMonthlyFuel += sessionLitres;
                
                commitTransaction();
                saveProfile();

                systemState = STATE_IDLE;
                Serial.println(F("[State] Transition: Completed -> Waiting"));
                break;
        }
    }

    // 2. Rotate screens every 3 seconds
    if (now - lastLcdRotate >= 3000) {
        lastLcdRotate = now;
        lcdActiveScreen = (lcdActiveScreen + 1) % 2;
    }

    // 3. LCD screen redraw loops
    if (now - lastDisplayRefresh >= 500) {
        lastDisplayRefresh = now;

        DisplayStatus screenStatus = STATUS_WAITING;
        if (!isConnected) {
            screenStatus = STATUS_WIFI_LOST;
        } else if (!firebaseReady) {
            screenStatus = STATUS_CLOUD_OFFLINE;
        } else if (deviceLocked && currentFlowRate >= MIN_FLOW_THRESHOLD) {
            screenStatus = STATUS_THEFT_ALERT;
        } else if (systemState == STATE_FILLING) {
            screenStatus = STATUS_FILLING;
        } else if (systemState == STATE_COMPLETING) {
            screenStatus = STATUS_FILLING;
        }

        refreshLcdDisplay(screenStatus);
    }

    // 4. Remote config command queries (Every 3 seconds)
    if (now - lastCommandCheck >= 3000) {
        lastCommandCheck = now;
        checkRemoteCommands();
    }

    // 5. Firebase live telemetry pushes
    unsigned long pushInterval = (systemState == STATE_FILLING) ? 1000 : 3000;
    if (now - lastFirebasePush >= pushInterval) {
        lastFirebasePush = now;
        pushLiveReadings();
    }

    // 6. WiFi Connection checking watchdog & Heartbeat (Every 3 seconds)
    if (now - lastWifiCheck >= 3000) {
        lastWifiCheck = now;
        if (!isConnected) {
            Serial.println(F("[WiFi] Connection lost. Reconnecting..."));
            WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
        } else {
            reportHeartbeat();
        }
    }

    yield(); // Give CPU cycle back to hardware Watchdog
}
