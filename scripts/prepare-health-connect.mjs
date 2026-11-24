// Capacitor recreates android/ in CI. Apply the tracked native integration after cap add.
import { copyFileSync, readFileSync, writeFileSync } from "node:fs";

const native = "android/app/src/main";
const java = `${native}/java/com/ilias/sololevelingfitness`;

function insert(path, marker, anchor, replacement) {
  const source = readFileSync(path, "utf8");
  if (source.includes(marker)) return;
  if (!source.includes(anchor)) throw new Error(`Unexpected Capacitor template in ${path}`);
  writeFileSync(path, source.replace(anchor, replacement));
}

for (const file of ["HealthMetricsPlugin.java", "HealthPrivacyActivity.java"]) {
  copyFileSync(`scripts/health-connect/${file}`, `${java}/${file}`);
}
insert(`${java}/MainActivity.java`, "registerPlugin(HealthMetricsPlugin.class)",
  "public class MainActivity extends BridgeActivity {}",
  `public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(android.os.Bundle savedInstanceState) {
        registerPlugin(HealthMetricsPlugin.class);
        super.onCreate(savedInstanceState);
    }
}`);
const manifest = `${native}/AndroidManifest.xml`;
insert(manifest, 'android:name=".HealthPrivacyActivity"', "    </application>", `        <activity android:name=".HealthPrivacyActivity" android:exported="false" />
        <activity-alias
            android:name=".HealthPermissionUsageActivity"
            android:targetActivity=".HealthPrivacyActivity"
            android:exported="true"
            android:permission="android.permission.START_VIEW_PERMISSION_USAGE">
            <intent-filter>
                <action android:name="android.intent.action.VIEW_PERMISSION_USAGE" />
                <category android:name="android.intent.category.HEALTH_PERMISSIONS" />
            </intent-filter>
        </activity-alias>
    </application>`);
insert(manifest, 'android.permission.health.READ_STEPS', "</manifest>", `    <uses-permission android:name="android.permission.health.READ_STEPS" />
    <uses-permission android:name="android.permission.health.READ_SLEEP" />
</manifest>`);
