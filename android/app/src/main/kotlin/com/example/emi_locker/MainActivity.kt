package com.example.emi_locker

import android.app.admin.DevicePolicyManager
import android.content.ComponentName
import android.content.Context
import io.flutter.embedding.android.FlutterActivity

class MainActivity : FlutterActivity() {

    override fun onResume() {
        super.onResume()

        val dpm = getSystemService(Context.DEVICE_POLICY_SERVICE) as DevicePolicyManager
        val componentName = ComponentName(this, EmiDeviceAdminReceiver::class.java)

        if (dpm.isDeviceOwnerApp(packageName)) {
            startLockTask()
        }
    }
}
