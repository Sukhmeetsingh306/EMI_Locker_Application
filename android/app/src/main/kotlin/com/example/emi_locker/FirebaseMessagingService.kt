package com.example.emi_locker

import android.content.Intent
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage

class MyFirebaseService : FirebaseMessagingService() {

    override fun onMessageReceived(message: RemoteMessage) {

        val action = message.data["action"]

        if (action == "LOCK_DEVICE") {

            val intent = Intent("com.emi.LOCK_DEVICE")
            intent.putExtra("action", "LOCK_DEVICE")

            sendBroadcast(intent)
        }
    }
}
