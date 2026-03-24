-keep class com.orion.app.** { *; }
-keepclassmembers class com.orion.app.ORIONBridge {
    @android.webkit.JavascriptInterface <methods>;
}
