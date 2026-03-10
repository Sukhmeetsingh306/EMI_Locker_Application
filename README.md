# EMI Locker – Android Device Locking System

EMI Locker is a secure Android application designed to restrict access to a device when EMI (Equated Monthly Installment) payments are overdue.

- The system integrates:
- Flutter mobile application
- Node.js backend API
- Android Device Policy Manager
- Firebase Cloud Messaging (FCM)
- Kiosk Mode enforcement

When a user's payment becomes overdue, the backend triggers a device lock, forcing the phone into a restricted mode until the payment is completed.

This type of system is commonly used by financing companies, lending platforms, and EMI-based device purchase systems.

---

# Project Architecture

    Flutter Mobile App
            │
            │ REST API
            ▼
    Node.js Backend Server
            │
            │ Push Notification
            ▼
    Firebase Cloud Messaging
            │
            ▼
    Android Native Service
            │
            ▼
    Device Policy Manager
            │
            ▼
    Device Locked (Kiosk Mode)

---

# Technology Stack

Mobile Application

- Flutter
- Dart
- Android Native (Kotlin)

Backend

- Node.js
- Express.js
- MongoDB
- JWT Authentication

Android Device Control

- DevicePolicyManager
- Android Enterprise APIs
- Kiosk Mode (LockTask)
- Broadcast Receiver

Notifications

- Firebase Cloud Messaging (FCM)

---

# Core Functional Modules

1. Authentication System

The application supports multiple roles:

    - Client
    - Admin
    - Agent
    - Super Admin

Users login using:

        Email or Mobile = rahul@gmail.com
        Password = 123456

The backend returns a JWT token used for secure API communication.

2. EMI Management System

Admins create EMI records for users.

Example EMI data:

        principalAmount: 10000
        interestPercentage: 10
        totalInstallments: 5
        description: Samsung Mobile Purchase

The backend automatically calculates:

        totalAmount = principalAmount + interest

Each EMI includes:

    - Bill number
    - Installment schedule
    - Payment history
    - EMI status
    - Device lock status

3. Device Lock System

The backend determines whether a device should be locked.

If a payment becomes overdue:

        deviceLocked = true

The system then:

    - Sends a lock notification
    - Starts the application
    - Activates kiosk mode
    - Prevents leaving the application
    - Displays the lock screen

4. Kiosk Mode

The device is restricted using Android's LockTask mode.

        startLockTask()

Security restrictions applied:

    - Disable status bar
    - Disable safe boot
    - Disable factory reset
    - Disable adding new users

This ensures the user cannot bypass the lock screen.

5. Lock Screen

When the device is locked the user sees:

        DEVICE LOCKED
        Payment Overdue
        Please clear your EMI installment

The user can then proceed to the payment screen.

Backend API

Base URL:

        /lib/core/constants/api_constants.dart
        class ApiConstants {
          static const String baseUrl = "http://server.running.on:1600/api";
        }
        Authentication APIs

Client Login

        POST /api/auth/login

Admin Login

        POST /api/auth/admin/login

Agent Login

        POST /api/auth/agent/login

Device Lock API

Check device lock status:

         GET /api/device-lock/me

Example Response:

        {
          "data": {
            "deviceLocked": true
          }
        }

Test User

The system was tested with the following client account:

        Email: rahul@gmail.com

This user exists in the MongoDB database.

Project Folder Structure

            id="structure01"
            emi_locker
            │
            ├── lib
            │   ├── controllers
            │   │     emi_controllers.dart
            │   │     lock_controllers.dart
            │   │     kiosk_controllers.dart
            │   │
            │   ├── core
            │   │     api_clients.dart
            │   │     api_constants.dart
            │   │
            │   ├── models
            │   │     emi_model.dart
            │   │     emi_payment_model.dart
            │   │
            │   ├── router
            │   │     app_router.dart
            │   │
            │   ├── screen
            │   │     client_home_screen.dart
            │   │     lock_screen.dart
            │   │     pay_installment_screen.dart
            │   │
            │   └── main.dart
            │
            ├── android
            │   └── kotlin
            │        MainActivity.kt
            │        EmiDeviceAdminReceiver.kt
            │
            └── functions/server
                  Backend API

Important Flutter Components
API Client

Handles all backend communication.

         ApiClient().get("/device-lock/me")

Lock Controller

Checks device lock status from the backend.

        LockController.checkNow()

Kiosk Controller

Handles enabling and disabling kiosk mode.

        enableKiosk()
        disableKiosk()

Android Native Components
MainActivity.kt

Handles:

- Flutter MethodChannel communication
- Kiosk activation
- Device restrictions

Important functions:

        startLockTask()
        stopLockTask()

Device Admin Receiver

Registers the application as a device administrator.

        EmiDeviceAdminReceiver

Firebase Messaging Service

Receives device lock commands from the backend.

        LockFirebaseService

Commands supported:

        LOCK_DEVICE
        UNLOCK_DEVICE

How to Run the Project
Install dependencies

        flutter pub get

Run the mobile application

        flutter run

Start the backend server

        npm install
        npm start

Debugging Guide
Check API Response

Use Postman:

        GET /api/device-lock/me

Expected:

        deviceLocked: true
        Flutter Debug Logs

Run the application with logs:

        flutter run

Look for logs like:

        LOCK STATUS FROM API

Firebase Debugging

Verify push notifications using:

        adb logcat | grep Firebase

Kiosk Mode Debug

Check lock task mode:

        adb shell dumpsys activity activities | grep lockTask

Device Owner Verification

Run:

        adb shell dpm list-owners

Expected output:

        Device Owner: com.example.emi_locker

Common Issues
Device not locking

Possible causes:

- Device is not registered as Device Owner
- Backend API not returning correct lock status
- Firebase message not received

App exits kiosk mode

Ensure this is executed:

        startLockTask()

Firebase not working

Verify:

        google-services.json

matches the application's package name.

Security Features

- JWT authentication
- Android Device Policy enforcement
- Secure API communication
- Kiosk mode restrictions
- Remote device lock capability

Future Improvements

Possible enhancements:

- QR code Android Enterprise enrollment
- Offline device locking
- Anti-tampering detection
- Factory reset protection
- Remote unlock dashboard

---

# Enrollment Configuration

The QR code is generated using the following Android Enterprise provisioning configuration.

enroll.json

    {
      "android.app.extra.PROVISIONING_DEVICE_ADMIN_COMPONENT_NAME": "com.example.emi_locker/.EmiDeviceAdminReceiver",
      "android.app.extra.PROVISIONING_DEVICE_ADMIN_PACKAGE_DOWNLOAD_LOCATION": "http://192.168.1.44:1600/downloads/emi-locker.apk",
      "android.app.extra.PROVISIONING_DEVICE_ADMIN_PACKAGE_CHECKSUM": "6d13a6345b8de1dc0b9fae80342aaff43cded0d39f4fa7d9a2ad9f9d071ebb9b",
      "android.app.extra.PROVISIONING_SKIP_ENCRYPTION": true,
      "android.app.extra.PROVISIONING_LEAVE_ALL_SYSTEM_APPS_ENABLED": true
    }

Enrollment QR Code Location

The generated QR code used for provisioning is stored in the backend project.

    emi_locker/functions/server/src/enrollment/enroll.png

This QR code is scanned during the Android setup process to automatically configure the device.

APK Download Source

During provisioning, the device downloads the application directly from the backend server.

    http://<server-ip>:1600/downloads/emi-locker.apk

This ensures the latest version of the application is installed automatically during enrollment.

Device Owner Configuration

Once enrolled, the application becomes the Device Owner, allowing it to enforce system-level restrictions using Android Device Policy APIs.

This enables features such as:

- Kiosk Mode enforcement
- Device locking
- Restricting system settings
- Preventing factory reset bypass
- Enforcing application restrictions

Purpose of QR Enrollment
QR enrollment simplifies device setup and ensures that every device:

- Automatically installs the EMI Locker application
- Registers as a managed device
- Enforces EMI payment rules
- Locks automatically when payments are overdue

---

# Testing Device Lock

Step 1
Run backend server.

Step 2
Run the Flutter app.

Step 3
Login using the test user.

Step 4
Open MongoDB.

Find collection:
UserDevice
Update device lock status:

    deviceLocked = true

Example MongoDB query:

    db.userdevices.updateOne(
    { userId: ObjectId("USER_ID") },
    { $set: { deviceLocked: true } }
    )

Within 30 seconds, the device will:
Open lock screen
Enable kiosk mode
Prevent leaving the application

# Author

I am a Full Stack Software Engineer with experience in Flutter mobile development, backend development, and DevOps practices. I focus on building complete end-to-end applications, from the mobile interface to backend APIs, database systems, and deployment.

In this project, I designed and implemented the full system including:

- Flutter mobile application
- Android native integration using Kotlin
- Node.js and Express backend APIs
- MongoDB database management
- Secure authentication using JWT
- Firebase Cloud Messaging for real-time device control
- Android Device Policy Manager and Kiosk Mode for device locking

The EMI Locker project demonstrates my ability to build and integrate a full-stack system where mobile applications, backend services, and device-level security work together.

GitHub:<https://github.com/Sukhmeetsingh306>
