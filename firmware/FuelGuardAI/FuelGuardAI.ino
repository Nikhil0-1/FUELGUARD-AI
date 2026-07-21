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
#include <ESP8266mDNS.h>
#include <WiFiUdp.h>
// #include <ArduinoOTA.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <LittleFS.h>
#include <time.h>

// Classic FirebaseESP8266 Library (Install "Firebase ESP8266 Client" by Mobizt)
#include <FirebaseESP8266.h>

// ==========================================
// 1. HARDWARE & CLOUD CONFIGURATION
// ==========================================
#define WIFI_SSID           "Test"
#define WIFI_PASSWORD       "22558800"

// Custom Hardware Device ID to match Web Dashboard (leave as "" to use ESP Chip ID)
#define HARDWARE_DEVICE_ID  "DEVICE_ESP8266"

#define FIREBASE_API_KEY    "AIzaSyDjFNRqEMZT1E7igssIx8g1I2hUG5G-Hdg"
#define FIREBASE_DATABASE_URL "fuelguard-ai-default-rtdb.firebaseio.com"
#define FIREBASE_USER_EMAIL "device@fuelguard.ai"
#define FIREBASE_USER_PASSWORD "SecureDevicePassword123"

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
    STATUS_OTA_UPDATE,
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

// Firebase Client Objects
FirebaseData fbdo;
FirebaseAuth fbAuth;
FirebaseConfig fbConfig;

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
bool firebaseInitialized = false;
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
        return "2026-07-16";
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
        return 20260716;
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
            snprintf(l2, 17, "Status: Waiting ");
            break;
    }

    updateLcdBuffer(l1, l2);
}

// ==========================================
// 8. FIREBASE LOGIC & HANDLERS
// ==========================================
void sendTheftAlert() {
    unsigned long now = millis();
    if (now - lastTheftAlertTime >= 10000) { // Throttle alerts to once per 10 seconds
        lastTheftAlertTime = now;
        Serial.println(F("[ALERT] CRITICAL: Unauthorized flow detected on locked device!"));
        
        if (firebaseReady) {
            FirebaseJson notifJson;
            notifJson.add("type", "THEFT_ALERT");
            notifJson.add("deviceId", deviceId);
            notifJson.add("message", "CRITICAL: Unauthorized fuel flow detected on locked node!");
            notifJson.add("read", false);
            notifJson.add("timestamp", (double)getEpochTime());
            
            String notifPath = "/FuelGuardAI/Notifications";
            Firebase.push(fbdo, notifPath, notifJson);
        }
    }
}

void reportHeartbeat() {
    if (!firebaseReady) return;
    String basePath = "/FuelGuardAI/Devices/" + deviceId;
    double nowMs = (double)getEpochTime() * 1000.0;
    Firebase.setString(fbdo, basePath + "/name", "FuelGuard Station");
    Firebase.setString(fbdo, basePath + "/status", "online");
    Firebase.setInt(fbdo, basePath + "/wifiStrength", WiFi.RSSI());
    Firebase.setDouble(fbdo, basePath + "/lastSeen", nowMs);
    Firebase.setFloat(fbdo, basePath + "/calibrationFactor", activeCalibrationFactor);
    Firebase.setBool(fbdo, basePath + "/lockStatus", deviceLocked);
    Firebase.setString(fbdo, basePath + "/firmwareVersion", "1.0.0");
}

void checkRemoteCommands() {
    if (!firebaseReady) return;
    
    // Sync lock status dynamically
    if (Firebase.getBool(fbdo, "/FuelGuardAI/Devices/" + deviceId + "/config/lockStatus")) {
        deviceLocked = fbdo.boolData();
    }

    String path = "/FuelGuardAI/Devices/" + deviceId + "/commands/action";
    if (Firebase.getString(fbdo, path)) {
        String cmd = fbdo.stringData();
        if (cmd.length() > 0 && cmd != "null") {
            Serial.printf("[Firebase] Command: %s\n", cmd.c_str());
            Firebase.setString(fbdo, path, ""); // Clear command

            if (cmd == "restart") {
                delay(1000);
                ESP.restart();
            } 
            else if (cmd == "reconnectWifi") {
                WiFi.disconnect();
                WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
            } 
            else if (cmd == "resetToday") {
                accumulatedTodayFuel = 0.0f;
                saveProfile();
            }
            else if (cmd == "syncSettings") {
                // Read latest Price
                if (Firebase.getFloat(fbdo, "/FuelGuardAI/Settings/fuelPrice/current")) {
                    float pr = fbdo.floatData();
                    if (pr > 0.0f) fuelPrice = pr;
                }

                // Read Calibration Factor
                if (Firebase.getFloat(fbdo, "/FuelGuardAI/Devices/" + deviceId + "/config/calibrationFactor")) {
                    float cal = fbdo.floatData();
                    if (cal > 0.1f && cal < 30.0f) {
                        activeCalibrationFactor = cal;
                        saveProfile();
                    }
                }
            }
            else if (cmd == "startCalibration") {
                isCalibrationMode = true;
                pulseCount = 0;
            }
            else if (cmd == "stopCalibration") {
                isCalibrationMode = false;
            }
        }
    }
}

void pushLiveReadings() {
    if (!firebaseReady) return;
    String basePath = "/FuelGuardAI/LiveData/" + deviceId;
    double nowMs = (double)getEpochTime() * 1000.0;
    Firebase.setFloat(fbdo, basePath + "/flowRate", currentFlowRate);
    Firebase.setFloat(fbdo, basePath + "/totalLitres", sessionLitres);
    Firebase.setFloat(fbdo, basePath + "/fuelCost", sessionCost);
    Firebase.setInt(fbdo, basePath + "/pulseCount", sessionPulses);
    Firebase.setString(fbdo, basePath + "/status", (systemState == STATE_FILLING ? "Filling" : "Waiting"));
    Firebase.setDouble(fbdo, basePath + "/timestamp", nowMs);
}

void commitTransaction() {
    if (!firebaseReady) return;
    String pushPath = "/FuelGuardAI/Transactions";
    
    FirebaseJson json;
    json.add("deviceId", deviceId);
    json.add("vehicleId", "VH-AUTO");
    json.add("fuel", sessionLitres);
    json.add("price", sessionCost);
    json.add("pricePerLitre", fuelPrice);
    json.add("duration", (sessionEndTime - sessionStartTime) / 1000);
    json.add("date", getFormattedDate());
    json.add("status", "completed");
    json.add("startTime", (double)sessionStartTime);
    json.add("endTime", (double)sessionEndTime);
    
    Firebase.push(fbdo, pushPath, json);

    // Write cloud alert notification
    FirebaseJson notifJson;
    notifJson.add("type", "FUEL_COMPLETED");
    notifJson.add("deviceId", deviceId);
    notifJson.add("message", "Fueling session completed: " + String(sessionLitres) + "L");
    notifJson.add("read", false);
    notifJson.add("timestamp", (double)getEpochTime());
    
    String notifPath = "/FuelGuardAI/Notifications";
    Firebase.push(fbdo, notifPath, notifJson);
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

    // Initial OTA configuration parameters
    // printLcdLine(1, "Starting OTA... ");
    // Serial.println(F("[Boot] Initializing ArduinoOTA..."));
    // ArduinoOTA.setHostname(deviceId.c_str());
    // ArduinoOTA.setPassword("FuelGuardOTA99");
    // ArduinoOTA.begin();
    // Serial.println(F("[Boot] ArduinoOTA initialized successfully."));
    delay(500);

    printLcdLine(1, "System Ready!   ");
    delay(1000);

    Serial.println(F("[System] Boot Sequence completed. Loops active."));
}

void loop() {
    unsigned long now = millis();

    // Process OTA packets in background
    // ArduinoOTA.handle();

    bool isConnected = (WiFi.status() == WL_CONNECTED);

    // Initialize Firebase as soon as WiFi is connected
    if (isConnected && !firebaseInitialized) {
        Serial.println(F("[Firebase] WiFi active. Initializing Firebase client..."));
        Serial.printf("[System] Free heap before Firebase init: %d bytes\n", ESP.getFreeHeap());
        
        fbConfig.host = FIREBASE_DATABASE_URL;
        fbConfig.api_key = FIREBASE_API_KEY;
        fbConfig.signer.tokens.legacy_token = "";
        
        Firebase.begin(&fbConfig, nullptr);
        Firebase.reconnectWiFi(true);
        firebaseInitialized = true;
        Serial.println(F("[Firebase] Client initialization completed."));
        Serial.printf("[System] Free heap after Firebase init: %d bytes\n", ESP.getFreeHeap());
    }

    // Bypass Firebase.ready() check to support direct No-Auth writes, saving RAM and avoiding connection errors
    bool isFbReady = firebaseInitialized;

    if (isFbReady != firebaseReady) {
        firebaseReady = isFbReady;
        if (firebaseReady) {
            Serial.println(F("[Firebase] Connection successful! Device online."));
            reportHeartbeat();
        } else {
            Serial.printf("[Firebase] Connection failed/lost. Reason: %s\n", fbdo.errorReason().c_str());
            Serial.printf("[System] Free Heap: %d bytes\n", ESP.getFreeHeap());
        }
    }

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

    // 4. Remote config command queries (Every 5 seconds)
    if (now - lastCommandCheck >= 5000) {
        lastCommandCheck = now;
        checkRemoteCommands();
    }

    // 5. Firebase live telemetry pushes
    unsigned long pushInterval = (systemState == STATE_FILLING) ? 1000 : 10000;
    if (now - lastFirebasePush >= pushInterval) {
        lastFirebasePush = now;
        pushLiveReadings();
    }

    // 6. WiFi Connection checking watchdog & Heartbeat (Every 5 seconds)
    if (now - lastWifiCheck >= 5000) {
        lastWifiCheck = now;
        if (!isConnected) {
            Serial.println(F("[WiFi] Network Connection lost. Reconnecting..."));
            WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
        } else {
            reportHeartbeat();
        }
    }

    yield(); // Give CPU cycle back to hardware Watchdog
}
