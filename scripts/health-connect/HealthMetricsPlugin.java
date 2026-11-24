package com.ilias.sololevelingfitness;

import android.health.connect.AggregateRecordsRequest;
import android.health.connect.AggregateRecordsResponse;
import android.health.connect.HealthConnectException;
import android.health.connect.HealthConnectManager;
import android.health.connect.TimeInstantRangeFilter;
import android.health.connect.datatypes.AggregationType;
import android.health.connect.datatypes.SleepSessionRecord;
import android.health.connect.datatypes.StepsRecord;
import android.os.Build;
import android.os.OutcomeReceiver;
import androidx.annotation.RequiresApi;
import androidx.core.content.ContextCompat;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;

@CapacitorPlugin(name = "HealthMetrics", permissions = {
    @Permission(alias = "steps", strings = {"android.permission.health.READ_STEPS"}),
    @Permission(alias = "sleep", strings = {"android.permission.health.READ_SLEEP"})
})
public class HealthMetricsPlugin extends Plugin {
    private boolean supported() {
        return Build.VERSION.SDK_INT >= 34 && getContext().getSystemService(HealthConnectManager.class) != null;
    }

    @PluginMethod
    public void connect(PluginCall call) {
        if (!supported()) {
            call.resolve(new JSObject().put("available", false));
            return;
        }
        List<String> missing = new ArrayList<>();
        for (String metric : List.of("steps", "sleep")) {
            if (getPermissionState(metric) != PermissionState.GRANTED) missing.add(metric);
        }
        if (missing.isEmpty()) readSummary(call);
        else requestPermissionForAliases(missing.toArray(new String[0]), call, "afterPermission");
    }

    @PermissionCallback
    private void afterPermission(PluginCall call) {
        readSummary(call);
    }

    @PluginMethod
    public void readSummary(PluginCall call) {
        if (!supported()) {
            call.resolve(new JSObject().put("available", false));
            return;
        }
        HealthConnectManager manager = getContext().getSystemService(HealthConnectManager.class);
        JSObject data = new JSObject().put("available", true);
        Instant now = Instant.now();
        ZoneId zone = ZoneId.systemDefault();
        Instant startOfDay = LocalDate.ofInstant(now, zone).atStartOfDay(zone).toInstant();
        readMetric(manager, data, "steps", StepsRecord.STEPS_COUNT_TOTAL, startOfDay, now, 1,
            () -> readMetric(manager, data, "sleep", SleepSessionRecord.SLEEP_DURATION_TOTAL,
                now.minus(Duration.ofHours(24)), now, 60000, () -> call.resolve(data)));
    }

    @RequiresApi(34)
    private void readMetric(HealthConnectManager manager, JSObject data, String name, AggregationType<Long> type,
                            Instant from, Instant to, long divisor, Runnable done) {
        if (getPermissionState(name) != PermissionState.GRANTED) {
            data.put(name, new JSObject().put("status", "denied"));
            done.run();
            return;
        }
        Runnable failed = () -> {
            String status = getPermissionState(name) == PermissionState.GRANTED ? "error" : "denied";
            data.put(name, new JSObject().put("status", status));
            done.run();
        };
        TimeInstantRangeFilter range = new TimeInstantRangeFilter.Builder().setStartTime(from).setEndTime(to).build();
        AggregateRecordsRequest<Long> request = new AggregateRecordsRequest.Builder<Long>(range)
            .addAggregationType(type).build();
        try {
            manager.aggregate(request, ContextCompat.getMainExecutor(getContext()), new OutcomeReceiver<>() {
                @Override
                public void onResult(AggregateRecordsResponse<Long> result) {
                    Long value = result.get(type);
                    JSObject metric = new JSObject().put("status", value == null ? "missing" : "ready");
                    if (value != null) metric.put("value", value / divisor);
                    data.put(name, metric);
                    done.run();
                }

                @Override
                public void onError(HealthConnectException error) {
                    failed.run();
                }
            });
        } catch (SecurityException | IllegalStateException error) {
            failed.run();
        }
    }
}
