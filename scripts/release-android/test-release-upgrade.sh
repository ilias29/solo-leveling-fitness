#!/usr/bin/env bash
set -euo pipefail

adb shell wm size 640x1136
adb shell wm density 320
adb shell cmd connectivity airplane-mode enable
adb shell svc wifi disable
adb shell svc data disable
test "$(adb shell settings get global airplane_mode_on | tr -d '\r')" = 1
test "$(adb shell settings get global wifi_on | tr -d '\r')" = 0

app=com.ilias.sololevelingfitness
run_test() {
  adb shell am force-stop "$app"
  adb shell am instrument -w -e phase "$1" -e expectedVersion "$2" -e class "$app.ReleaseUpgradeTest" \
    "$app.test/androidx.test.runner.AndroidJUnitRunner" | tee "android-$baseline-$1.log"
  grep -Fq 'OK (1 test)' "android-$baseline-$1.log"
}

for baseline in 2.1.2 2.1.3; do
  adb install "previous-$baseline.apk"
  adb install release-upgrade-test.apk
  run_test seed "$baseline"
  adb install -r Solo-Leveling-Fitness.apk
  run_test upgrade "$VERSION_NAME"
  run_test restart "$VERSION_NAME"
  adb uninstall "$app.test"
  adb uninstall "$app"
done
