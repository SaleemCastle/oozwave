package com.oozwavemobile.equalizer;

import android.media.audiofx.Equalizer;
import android.util.Log;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.modules.core.DeviceEventManagerModule;

public class EqualizerModule extends ReactContextBaseJavaModule {
    private static final String TAG = "EqualizerModule";

    private Equalizer equalizer;
    private float[] bandGainsDb; // logical per-band gains (without preamp)
    private float preampDb = 0f;
    private boolean bypass = false;

    public EqualizerModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    // Required for RN NativeEventEmitter support on some versions
    @ReactMethod
    public void addListener(String eventName) {
        // No-op: this module currently does not emit events
    }

    @ReactMethod
    public void removeListeners(Integer count) {
        // No-op
    }

    @NonNull
    @Override
    public String getName() {
        return "EqualizerModule";
    }

    @ReactMethod
    public void initEQ(Integer sessionId, Promise promise) {
        try {
            releaseInternal();
            int sid = (sessionId != null && sessionId >= 0) ? sessionId : 0;
            equalizer = new Equalizer(0, sid);
            equalizer.setEnabled(true);
            int bands = equalizer.getNumberOfBands();
            if (bands <= 0) bands = 5; // sensible default
            bandGainsDb = new float[bands];
            for (int i = 0; i < bands; i++) bandGainsDb[i] = 0f;
            // default state
            preampDb = 0f;
            bypass = false;
            promise.resolve(true);
        } catch (Throwable t) {
            Log.w(TAG, "initEQ failed", t);
            releaseInternal();
            promise.resolve(false);
        }
    }

    @ReactMethod
    public void setBandGain(int index, double gainDb, Promise promise) {
        try {
            if (equalizer == null) { promise.resolve(null); return; }
            int bands = equalizer.getNumberOfBands();
            if (index < 0 || index >= bands) { promise.resolve(null); return; }
            float clamped = (float) clamp(gainDb, -12.0, 12.0);
            bandGainsDb[index] = clamped;
            applyBandLevel(index);
            promise.resolve(null);
        } catch (Throwable t) {
            Log.w(TAG, "setBandGain failed", t);
            promise.reject("EQ_SET_BAND", t);
        }
    }

    @ReactMethod
    public void setPreamp(double gainDb, Promise promise) {
        try {
            if (equalizer == null) { promise.resolve(null); return; }
            preampDb = (float) clamp(gainDb, -12.0, 12.0);
            // Re-apply all bands using new preamp offset
            int bands = equalizer.getNumberOfBands();
            for (int i = 0; i < bands; i++) applyBandLevel(i);
            promise.resolve(null);
        } catch (Throwable t) {
            Log.w(TAG, "setPreamp failed", t);
            promise.reject("EQ_SET_PREAMP", t);
        }
    }

    @ReactMethod
    public void setBypass(boolean enabled, Promise promise) {
        try {
            if (equalizer == null) { promise.resolve(null); return; }
            bypass = enabled;
            equalizer.setEnabled(!bypass);
            promise.resolve(null);
        } catch (Throwable t) {
            Log.w(TAG, "setBypass failed", t);
            promise.reject("EQ_BYPASS", t);
        }
    }

    @ReactMethod
    public void applyPreset(String name, ReadableArray gains, Promise promise) {
        try {
            if (equalizer == null) { promise.resolve(null); return; }
            int deviceBands = equalizer.getNumberOfBands();
            if (deviceBands <= 0) { promise.resolve(null); return; }
            int srcLen = gains != null ? gains.size() : 0;
            if (srcLen <= 0) { promise.resolve(null); return; }
            // Map provided 10-band gains to device band count
            for (int i = 0; i < deviceBands; i++) {
                int idx = Math.round(i * (srcLen - 1f) / (deviceBands - 1f));
                double g = gains.getDouble(idx);
                bandGainsDb[i] = (float) clamp(g, -12.0, 12.0);
                applyBandLevel(i);
            }
            promise.resolve(null);
        } catch (Throwable t) {
            Log.w(TAG, "applyPreset failed", t);
            promise.reject("EQ_APPLY_PRESET", t);
        }
    }

    @ReactMethod
    public void getIsAvailable(Promise promise) {
        promise.resolve(equalizer != null);
    }

    @ReactMethod
    public void teardown(Promise promise) {
        try {
            releaseInternal();
            promise.resolve(null);
        } catch (Throwable t) {
            promise.reject("EQ_TEARDOWN", t);
        }
    }

    private void applyBandLevel(int index) {
        if (equalizer == null) return;
        try {
            short[] range = equalizer.getBandLevelRange(); // [min, max] millibels
            int minMb = (range != null && range.length >= 2) ? range[0] : -1500;
            int maxMb = (range != null && range.length >= 2) ? range[1] : 1500;
            float totalDb = bandGainsDb[index] + preampDb;
            int mb = (int) Math.round(totalDb * 100.0);
            if (mb < minMb) mb = minMb;
            if (mb > maxMb) mb = maxMb;
            equalizer.setBandLevel((short) index, (short) mb);
        } catch (Throwable t) {
            Log.w(TAG, "applyBandLevel failed", t);
        }
    }

    private static double clamp(double v, double min, double max) {
        return Math.min(max, Math.max(min, v));
    }

    private void releaseInternal() {
        try {
            if (equalizer != null) {
                equalizer.setEnabled(false);
                equalizer.release();
            }
        } catch (Throwable ignore) {}
        equalizer = null;
        bandGainsDb = null;
        preampDb = 0f;
        bypass = false;
    }
}
