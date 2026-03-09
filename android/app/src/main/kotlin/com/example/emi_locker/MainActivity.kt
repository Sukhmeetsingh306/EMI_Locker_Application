package com.example.emi_locker

import android.app.admin.DevicePolicyManager
import android.content.ComponentName
import android.content.Context
import android.os.Bundle
import android.os.UserManager
import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel

class MainActivity : FlutterActivity() {

    private val CHANNEL = "emi/kiosk"

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val dpm = getSystemService(Context.DEVICE_POLICY_SERVICE) as DevicePolicyManager
        val component = ComponentName(this, EmiDeviceAdminReceiver::class.java)

        if (dpm.isDeviceOwnerApp(packageName)) {

            // Allow only this app for kiosk mode
            dpm.setLockTaskPackages(component, arrayOf(packageName))

            // Prevent Safe Mode boot
            dpm.addUserRestriction(component, UserManager.DISALLOW_SAFE_BOOT)

            // Optional security restrictions
            dpm.addUserRestriction(component, UserManager.DISALLOW_FACTORY_RESET)

            dpm.addUserRestriction(component, UserManager.DISALLOW_ADD_USER)

            // Disable status bar (prevents pull-down settings)
            dpm.setStatusBarDisabled(component, true)
        }
    }

    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)

        MethodChannel(flutterEngine.dartExecutor.binaryMessenger, CHANNEL).setMethodCallHandler {
                call,
                result ->
            when (call.method) {
                "enableKiosk" -> {
                    startLockTask()
                    result.success(true)
                }
                "disableKiosk" -> {
                    stopLockTask()
                    result.success(true)
                }
                else -> result.notImplemented()
            }
        }
    }
}
