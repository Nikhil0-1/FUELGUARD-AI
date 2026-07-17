# Deployment Guide

## 1. Firebase Rules Setup
1. Open the [Firebase Console](https://console.firebase.google.com/).
2. Create a new Firebase project or open an existing one.
3. Select **Realtime Database** from the build menu and click **Create Database**.
4. Navigate to the **Rules** tab.
5. Copy the contents of [database.rules.json](file:///c:/Users/mdsha/Desktop/fuel/firebase/database.rules.json) and paste them into the Rules text area. Click **Publish**.

## 2. Firebase Authentication Setup
1. Go to **Authentication** inside the Firebase console.
2. Enable **Email/Password** as a sign-in provider.
3. Register a default user (e.g., `admin@fuelguard.ai`) with a secure password.
4. Go to **Realtime Database > Data** and write a database entry matching the user's UID to give them administrative permissions:
   ```json
   "FuelGuardAI": {
     "Users": {
       "USER_UID_HERE": {
         "email": "admin@fuelguard.ai",
         "displayName": "Super Admin",
         "role": "superadmin",
         "enabled": true
       }
     }
   }
   ```

## 3. Web Hosting Deploy
1. Build the production build inside the web folder:
   ```bash
   cd web
   npm run build
   ```
2. Install the Firebase CLI:
   ```bash
   npm install -g firebase-tools
   ```
3. Log in and initialize:
   ```bash
   firebase login
   firebase init
   ```
   Select **Hosting** and match with your existing project. Use `web/dist` as the public directory.
4. Deploy the build:
   ```bash
   firebase deploy --only hosting
   ```
