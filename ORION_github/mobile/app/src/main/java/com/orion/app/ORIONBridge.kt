package com.orion.app

import android.content.Context
import android.webkit.JavascriptInterface
import android.widget.Toast

/**
 * Puente JavaScript ↔ Android nativo
 * Accesible desde el frontend web como window.ORIONAndroid.metodo()
 */
class ORIONBridge(private val context: Context) {

    @JavascriptInterface
    fun saveServerUrl(url: String) {
        val prefs = context.getSharedPreferences("orion_prefs", Context.MODE_PRIVATE)
        prefs.edit().putString("server_url", url).apply()
    }

    @JavascriptInterface
    fun getServerUrl(): String {
        val prefs = context.getSharedPreferences("orion_prefs", Context.MODE_PRIVATE)
        return prefs.getString("server_url", "http://localhost:8080") ?: "http://localhost:8080"
    }

    @JavascriptInterface
    fun showToast(message: String) {
        (context as? MainActivity)?.runOnUiThread {
            Toast.makeText(context, message, Toast.LENGTH_SHORT).show()
        }
    }

    @JavascriptInterface
    fun getPlatform(): String = "android"

    @JavascriptInterface
    fun getAppVersion(): String = BuildConfig.VERSION_NAME
}
