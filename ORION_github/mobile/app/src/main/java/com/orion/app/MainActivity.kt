package com.orion.app

import android.Manifest
import android.content.pm.PackageManager
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.os.Bundle
import android.webkit.*
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    private lateinit var swipeRefresh: SwipeRefreshLayout
    private var orionServerUrl: String = ""

    // Permission launcher
    private val permissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { perms ->
        val allGranted = perms.values.all { it }
        if (!allGranted) {
            Toast.makeText(this, "Some permissions denied. Voice features may not work.", Toast.LENGTH_LONG).show()
        }
        loadOrion()
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        webView      = findViewById(R.id.webview)
        swipeRefresh = findViewById(R.id.swipe_refresh)

        setupWebView()
        requestPermissionsIfNeeded()

        // Swipe to refresh
        swipeRefresh.setColorSchemeColors(0xFF00E6C8.toInt())
        swipeRefresh.setProgressBackgroundColorSchemeColor(0xFF060D0C.toInt())
        swipeRefresh.setOnRefreshListener {
            webView.reload()
            swipeRefresh.isRefreshing = false
        }
    }

    private fun setupWebView() {
        val settings = webView.settings
        settings.javaScriptEnabled         = true
        settings.domStorageEnabled          = true
        settings.allowFileAccess            = true
        settings.mediaPlaybackRequiresUserGesture = false
        settings.mixedContentMode           = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
        settings.cacheMode                  = WebSettings.LOAD_DEFAULT
        settings.userAgentString            = "ORION-Android/2.0 " + settings.userAgentString

        // Permisos de micrófono en WebView
        webView.webChromeClient = object : WebChromeClient() {
            override fun onPermissionRequest(request: PermissionRequest) {
                runOnUiThread { request.grant(request.resources) }
            }
        }

        webView.webViewClient = object : WebViewClient() {
            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)
                swipeRefresh.isRefreshing = false
                // Inyectar info del dispositivo
                webView.evaluateJavascript(
                    "window.ORION_PLATFORM = 'android'; console.log('[ORION] Android WebView loaded');",
                    null
                )
            }

            override fun onReceivedError(view: WebView?, request: WebResourceRequest?, error: WebResourceError?) {
                super.onReceivedError(view, request, error)
                // Mostrar página de error de conexión
                if (request?.isForMainFrame == true) {
                    view?.loadData(buildErrorPage(), "text/html", "UTF-8")
                }
            }
        }

        // Añadir interfaz JavaScript para comunicación nativa
        webView.addJavascriptInterface(ORIONBridge(this), "ORIONAndroid")
    }

    private fun requestPermissionsIfNeeded() {
        val permsNeeded = arrayOf(
            Manifest.permission.RECORD_AUDIO,
            Manifest.permission.INTERNET,
            Manifest.permission.ACCESS_NETWORK_STATE,
            Manifest.permission.ACCESS_WIFI_STATE,
        ).filter {
            ContextCompat.checkSelfPermission(this, it) != PackageManager.PERMISSION_GRANTED
        }.toTypedArray()

        if (permsNeeded.isNotEmpty()) {
            permissionLauncher.launch(permsNeeded)
        } else {
            loadOrion()
        }
    }

    private fun loadOrion() {
        orionServerUrl = getOrionServerUrl()
        webView.loadUrl(orionServerUrl)
    }

    /**
     * Determina la URL del servidor O.R.I.O.N.
     * 1. Si hay una URL guardada en preferencias, la usa
     * 2. Si no, intenta el mismo dispositivo (para cuando el APK corre junto al servidor)
     * 3. Si no, muestra la pantalla de configuración para que el usuario ingrese la IP
     */
    private fun getOrionServerUrl(): String {
        val prefs = getSharedPreferences("orion_prefs", MODE_PRIVATE)
        val savedUrl = prefs.getString("server_url", "")
        if (!savedUrl.isNullOrBlank()) return savedUrl

        // Intento por defecto: localhost (si el servidor está en el mismo dispositivo)
        return "http://localhost:8080"
    }

    private fun buildErrorPage(): String = """
        <!DOCTYPE html><html>
        <head><meta charset='UTF-8'><meta name='viewport' content='width=device-width,initial-scale=1'>
        <style>
          body{background:#000;color:#00e6c8;font-family:'Courier New',monospace;
               display:flex;flex-direction:column;align-items:center;justify-content:center;
               height:100vh;margin:0;text-align:center;padding:20px}
          h1{font-size:18px;letter-spacing:4px;margin-bottom:16px}
          p{font-size:12px;color:#2a5a55;line-height:1.8}
          input{background:#060d0c;border:1px solid #00e6c844;color:#00e6c8;padding:10px 16px;
                font-family:'Courier New',monospace;font-size:14px;border-radius:4px;
                width:260px;margin:12px 0;outline:none}
          button{background:transparent;border:1px solid #00e6c855;color:#00e6c8;padding:10px 24px;
                 font-family:'Courier New',monospace;font-size:12px;letter-spacing:2px;
                 border-radius:4px;cursor:pointer;margin-top:8px}
        </style></head>
        <body>
          <h1>O.R.I.O.N.</h1>
          <p>No se pudo conectar al servidor.<br>
             Asegurate de que O.R.I.O.N. esta corriendo<br>
             en tu PC en la misma red WiFi.</p>
          <p style='margin-top:20px;color:#00e6c8'>IP del servidor:</p>
          <input id='url' type='text' placeholder='http://192.168.1.X:8080' value='http://192.168.1.'>
          <br>
          <button onclick='connect()'>CONECTAR ▶</button>
          <script>
            function connect(){
              var url=document.getElementById('url').value.trim();
              if(!url)return;
              if(!url.startsWith('http'))url='http://'+url;
              ORIONAndroid.saveServerUrl(url);
              window.location.href=url;
            }
          </script>
        </body></html>
    """.trimIndent()

    override fun onBackPressed() {
        if (webView.canGoBack()) webView.goBack()
        else super.onBackPressed()
    }

    override fun onResume() {
        super.onResume()
        webView.onResume()
    }

    override fun onPause() {
        super.onPause()
        webView.onPause()
    }
}
