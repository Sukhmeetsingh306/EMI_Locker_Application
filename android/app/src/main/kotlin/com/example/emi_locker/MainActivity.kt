package com.example.emi_locker

import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel

class MainActivity : FlutterActivity() {

    private val CHANNEL = "emi/kiosk"

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
