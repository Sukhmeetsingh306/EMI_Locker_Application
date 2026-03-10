package com.example.emi_locker

import android.app.admin.DevicePolicyManager
import android.content.BroadcastReceiver
import android.content.ComponentName
import android.content.Context
import android.content.Intent

class LockReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {

        val action = intent.getStringExtra("action")

        if (action == "LOCK_DEVICE") {

            val launchIntent = Intent(context, MainActivity::class.java)
            launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)

            context.startActivity(launchIntent)

            val dpm = context.getSystemService(Context.DEVICE_POLICY_SERVICE) as DevicePolicyManager

            val component = ComponentName(context, EmiDeviceAdminReceiver::class.java)

            dpm.setLockTaskPackages(component, arrayOf(context.packageName))
        }
    }
}
