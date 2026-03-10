package com.example.emi_locker

import android.app.admin.DevicePolicyManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage

class LockFirebaseService : FirebaseMessagingService() {

  override fun onMessageReceived(message: RemoteMessage) {

    val action = message.data["action"]

    if (action == "LOCK_DEVICE") {

      val dpm = getSystemService(Context.DEVICE_POLICY_SERVICE) as DevicePolicyManager
      val component = ComponentName(this, EmiDeviceAdminReceiver::class.java)

      if (dpm.isDeviceOwnerApp(packageName)) {

        // Start the app
        val intent = Intent(this, MainActivity::class.java)
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
        startActivity(intent)

        // Activate kiosk
        dpm.setLockTaskPackages(component, arrayOf(packageName))

        // Optional hard lock
        dpm.lockNow()
      }
    }
  }
}
