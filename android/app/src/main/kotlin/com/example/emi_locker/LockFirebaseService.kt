package com.example.emi_locker

import android.content.Intent
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage

class LockFirebaseService : FirebaseMessagingService() {

    override fun onMessageReceived(message: RemoteMessage) {

        val action = message.data["action"]

        if (action == "LOCK_DEVICE") {

            val intent = Intent(this, MainActivity::class.java)
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)

            startActivity(intent)
        }
    }
}
