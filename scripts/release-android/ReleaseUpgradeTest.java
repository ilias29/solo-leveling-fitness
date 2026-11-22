package com.ilias.sololevelingfitness;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;

import android.app.Instrumentation;
import android.content.Context;
import android.content.Intent;
import android.provider.Settings;
import android.webkit.WebView;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.platform.app.InstrumentationRegistry;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.Test;
import org.junit.runner.RunWith;

@RunWith(AndroidJUnit4.class)
public class ReleaseUpgradeTest {
    private static final String FIRST_SET = "[data-check='0']";
    private final Instrumentation instrumentation = InstrumentationRegistry.getInstrumentation();
    private WebView web;

    @Test
    public void verifyReleaseUpgrade() throws Exception {
        String phase = InstrumentationRegistry.getArguments().getString("phase");
        Context context = instrumentation.getTargetContext();
        String version = context.getPackageManager().getPackageInfo(context.getPackageName(), 0).versionName;
        assertEquals("seed".equals(phase) ? "2.1.2" : "2.1.3", version);

        assertEquals(1, Settings.Global.getInt(context.getContentResolver(), Settings.Global.AIRPLANE_MODE_ON, 0));
        Intent intent = new Intent(context, MainActivity.class).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        MainActivity activity = (MainActivity) instrumentation.startActivitySync(intent);
        try {
            web = activity.getBridge().getWebView();
            waitFor("document.querySelector('#list .exercise') !== null");
            switch (phase) {
                case "seed":
                    seedPreviousRelease();
                    break;
                case "upgrade":
                    assertSavedProgress(2);
                    verifyPhotosAndLayout();
                    click(FIRST_SET);
                    assertSavedProgress(3);
                    awaitNativeMirror();
                    // Finish instrumentation only after WebView has had time to flush its
                    // batched localStorage writes. The runner kills the app process at exit.
                    Thread.sleep(7000);
                    break;
                case "restart":
                    assertSavedProgress(3);
                    break;
                default:
                    throw new AssertionError("Unknown phase: " + phase);
            }
        } finally {
            instrumentation.runOnMainSync(activity::finish);
        }
    }

    private void seedPreviousRelease() throws Exception {
        for (int index = 0; index < 7; index++) {
            click("[data-check='" + index + "']");
            click("[data-check='" + index + "']");
        }
        click("#complete");
        click("[data-sets='0'][data-value='4']");
        click("[data-weight='0'][data-value='16']");
        click("[data-plus='0']");
        click(FIRST_SET);
        click("[data-mode='arnold']");
        click("[data-sets='0'][data-value='3']");
        click("[data-weight='0'][data-value='32']");
        click("[data-minus='0']");
        click(FIRST_SET);
        click(FIRST_SET);
        assertSavedProgress(2);
        awaitNativeMirror();
    }

    private void awaitNativeMirror() throws Exception {
        evaluate("window.nativeMirrorVerified=false; Capacitor.nativePromise('Preferences','get',{key:'soloState'}).then(({value})=>{window.nativeMirrorVerified=value===localStorage.getItem('soloState')})");
        waitFor("window.nativeMirrorVerified === true");
    }

    private void assertSavedProgress(int arnoldSets) throws Exception {
        String stateCheck = evaluate("""
            (() => {
              const saved = JSON.parse(localStorage.getItem('soloState'));
              const full = saved.sessions.kb;
              const arnold = saved.sessions.arnold;
              const valid = saved.activeMode === 'arnold' &&
                full.sets[0] === 4 && full.setProgress[0] === 1 &&
                full.values[0] === 13 && full.weights[0] === 16 &&
                arnold.sets[0] === 3 && arnold.setProgress[0] === EXPECTED &&
                arnold.values[0] === 11 && arnold.weights[0] === 32 &&
                saved.xp === 50 && saved.questDays.length === 1 &&
                saved.lastXpDate.kb === saved.questDays[0] &&
                document.querySelector('#level').textContent === '1' &&
                document.querySelector('#xpText').textContent === '50';
              return valid || { mode: saved.activeMode, xp: saved.xp,
                full, arnold, days: saved.questDays, lastXpDate: saved.lastXpDate };
            })()
            """.replace("EXPECTED", String.valueOf(arnoldSets)));
        assertEquals("Saved workout and progress: " + stateCheck, "true", stateCheck);
        String text = arnoldSets == 3 ? "✓ 3/3" : "SET 2/3";
        assertEquals("true", evaluate("document.querySelector(\"" + FIRST_SET + "\").textContent === '" + text + "'"));
    }

    private void verifyPhotosAndLayout() throws Exception {
        click("[data-mode='kb']");
        checkCount(7);
        click("[data-mode='wall']");
        checkCount(7);
        click("[data-mode='stretch']");
        checkCount(7);
        click("[data-mode='arnold']");
        checkCount(5);

        assertEquals("10", evaluate("document.querySelectorAll('.arnold-guide img').length"));
        for (int index = 0; index < 10; index++) {
            String photo = "document.querySelectorAll('.arnold-guide img')[" + index + "]";
            evaluate(photo + ".scrollIntoView({block:'center'})");
            waitFor(photo + ".naturalWidth > 200");
        }
        assertEquals("true", evaluate("scrollY > 0 && document.documentElement.scrollWidth <= innerWidth"));
        instrumentation.runOnMainSync(() -> {
            int[] position = new int[2];
            web.getLocationOnScreen(position);
            assertNotNull(web.getRootWindowInsets());
            int statusBar = web.getRootWindowInsets().getInsetsIgnoringVisibility(
                    android.view.WindowInsets.Type.statusBars()).top;
            assertTrue("Expected a visible status bar and WebView below it",
                    statusBar > 0 && position[1] >= statusBar);
        });
    }

    private void checkCount(int expected) throws Exception {
        assertEquals(Integer.toString(expected), evaluate("document.querySelectorAll('#list .exercise').length"));
    }

    private void click(String selector) throws Exception {
        evaluate("document.querySelector(\"" + selector + "\").click()");
    }

    private void waitFor(String condition) throws Exception {
        for (int attempt = 0; attempt < 60; attempt++) {
            if ("true".equals(evaluate(condition))) return;
            Thread.sleep(250);
        }
        throw new AssertionError("Timed out: " + condition);
    }

    private String evaluate(String script) throws Exception {
        CountDownLatch done = new CountDownLatch(1);
        AtomicReference<String> result = new AtomicReference<>();
        instrumentation.runOnMainSync(() -> web.evaluateJavascript(script, value -> {
            result.set(value);
            done.countDown();
        }));
        assertTrue("WebView did not respond", done.await(10, TimeUnit.SECONDS));
        return result.get();
    }
}
