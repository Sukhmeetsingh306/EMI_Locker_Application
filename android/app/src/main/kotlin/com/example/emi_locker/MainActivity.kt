package com.example.emi_locker

import android.app.admin.DevicePolicyManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.os.UserManager
import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel

class MainActivity : FlutterActivity() {

  private val LOCK_CHANNEL = "emi/lock"
  private val KIOSK_CHANNEL = "emi/kiosk"

  private fun isInLockTaskMode(): Boolean {
    val activityManager = getSystemService(Context.ACTIVITY_SERVICE) as android.app.ActivityManager
    return activityManager.lockTaskModeState != android.app.ActivityManager.LOCK_TASK_MODE_NONE
  }

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)

    val dpm = getSystemService(Context.DEVICE_POLICY_SERVICE) as DevicePolicyManager
    val component = ComponentName(this, EmiDeviceAdminReceiver::class.java)

    if (dpm.isDeviceOwnerApp(packageName)) {

      dpm.setLockTaskPackages(component, arrayOf(packageName))

      dpm.addUserRestriction(component, UserManager.DISALLOW_SAFE_BOOT)
      dpm.addUserRestriction(component, UserManager.DISALLOW_FACTORY_RESET)
      dpm.addUserRestriction(component, UserManager.DISALLOW_ADD_USER)

      dpm.setStatusBarDisabled(component, true)
    }
  }

  override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
    super.configureFlutterEngine(flutterEngine)

    /// LOCK CHANNEL
    MethodChannel(flutterEngine.dartExecutor.binaryMessenger, LOCK_CHANNEL).setMethodCallHandler {
            call,
            result ->
      if (call.method == "openLockScreen") {

        val intent = Intent(this, MainActivity::class.java)
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)

        startActivity(intent)

        result.success(true)
      } else {
        result.notImplemented()
      }
    }

    /// KIOSK CHANNEL
    MethodChannel(flutterEngine.dartExecutor.binaryMessenger, KIOSK_CHANNEL).setMethodCallHandler {
            call,
            result ->
      when (call.method) {
        "enableKiosk" -> {

          val dpm = getSystemService(Context.DEVICE_POLICY_SERVICE) as DevicePolicyManager
          val component = ComponentName(this, EmiDeviceAdminReceiver::class.java)

          if (dpm.isDeviceOwnerApp(packageName) && !isInLockTaskMode()) {
            startLockTask()
          }

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

  /// Prevent leaving the app while kiosk is active
  override fun onPause() {
    super.onPause()

    val dpm = getSystemService(Context.DEVICE_POLICY_SERVICE) as DevicePolicyManager
    val component = ComponentName(this, EmiDeviceAdminReceiver::class.java)

    if (dpm.isDeviceOwnerApp(packageName) && isInLockTaskMode()) {

      val intent = Intent(this, MainActivity::class.java)
      intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)

      startActivity(intent)
    }
  }
}
