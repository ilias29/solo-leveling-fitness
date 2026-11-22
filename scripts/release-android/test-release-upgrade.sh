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
  adb shell am instrument -w -e phase "$1" -e class "$app.ReleaseUpgradeTest" \
    "$app.test/androidx.test.runner.AndroidJUnitRunner" | tee "android-upgrade-$1.log"
  grep -Fq 'OK (1 test)' "android-upgrade-$1.log"
}

adb install previous-stable.apk
adb install release-upgrade-test.apk
run_test seed
adb install -r Solo-Leveling-Fitness.apk
run_test upgrade
run_test restart
