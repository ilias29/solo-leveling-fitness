package com.ilias.sololevelingfitness;

import android.app.Activity;
import android.app.AlertDialog;
import android.os.Bundle;

public class HealthPrivacyActivity extends Activity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        new AlertDialog.Builder(this)
            .setTitle("Solo Leveling Fitness · Health Connect")
            .setMessage("Με την άδειά σου, η εφαρμογή διαβάζει μόνο το σύνολο βημάτων και τη διάρκεια ύπνου για την κάρτα «Σήμερα». "
                + "Οι μετρήσεις εμφανίζονται στο κινητό, χωρίς αποστολή σε διακομιστή ή αντιγραφή στο backup. "
                + "Μπορείς να ανακαλέσεις κάθε άδεια μέσα από το Health Connect.")
            .setPositiveButton(android.R.string.ok, (dialog, which) -> finish())
            .setOnDismissListener(dialog -> finish())
            .show();
    }
}
