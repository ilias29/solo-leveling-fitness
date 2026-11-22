export const wallGuides={"Wall Sit": {"image": "wall-sit", "title": "Κάθισμα με κράτημα", "steps": ["Ακούμπησε πλάτη στον τοίχο. Πριν κατέβεις, φέρε τα πέλματα μπροστά.", "Γλίστρησε σε άνετο βάθος, με πέλματα κάτω και γόνατα πάνω από αστραγάλους. Κράτα τη θέση 2."]}, "Wall Squat": {"image": "wall-squat", "title": "Κάθισμα με κίνηση", "steps": ["Ακούμπησε πλάτη στον τοίχο και βάλε τα πέλματα μπροστά πριν λυγίσεις τα γόνατα.", "Κατέβα αργά και ανέβα ξανά. Δεν χρειάζεται να φτάσεις τόσο χαμηλά όσο η εικόνα."]}, "Wall-Supported Hip Abduction": {"image": "hip-abduction", "title": "Άνοιγμα ποδιού στο πλάι", "steps": ["Στάσου πλάι στον τοίχο, στηρίξου ελαφρά με το κοντινό χέρι.", "Άνοιξε λίγο το εξωτερικό πόδι, με δάχτυλα μπροστά και κορμό όρθιο. Επέστρεψε και άλλαξε πλευρά."]}, "Wall Hip Hinge": {"image": "hip-hinge", "title": "Ισχία πίσω προς τον τοίχο", "steps": ["Στάσου περίπου 20–30 cm μπροστά από τον τοίχο, με πλάτη προς αυτόν και μαλακά γόνατα.", "Στείλε τους γλουτούς πίσω να αγγίξουν τον τοίχο. Ο κορμός γέρνει από τα ισχία, χωρίς καμπούρα. Ξαναστάσου όρθιος."]}, "Wall Slide": {"image": "wall-slide", "title": "Χέρια από W προς Y", "steps": ["Πλάτη στον τοίχο, αγκώνες λυγισμένοι, ώμοι χαλαροί.", "Σύρε τα χέρια προς τα πάνω μόνο όσο είναι άνετο. Μην ανοίγεις τη μέση για να κερδίσεις ύψος. Επέστρεψε."]}, "Wall W Hold": {"image": "wall-w-hold", "title": "Κράτημα χεριών σε W", "steps": ["Στάσου με την πλάτη στον τοίχο και χαλάρωσε τους ώμους.", "Σήκωσε χέρια σε W με λυγισμένους αγκώνες. Κράτα τη θέση 2, χωρίς να πιέζεις αυχένα ή καρπούς στον τοίχο."]}, "Chin Tuck at Wall": {"image": "chin-tuck", "title": "Πηγούνι οριζόντια πίσω", "steps": ["Κοίτα ευθεία. Κράτα τον κορμό ήρεμο, με το πίσω μέρος του κεφαλιού κοντά στον τοίχο.", "Μετακίνησε απαλά το κεφάλι οριζόντια πίσω, σαν μικρό διπλοσάγονο. Κράτα 2–3 δευτερόλεπτα. Μην κοιτάς κάτω."]}};

const commons = "https://commons.wikimedia.org/wiki/File:";
const publicDomain = "https://www.dvidshub.net/about/copyright";
const ccBy = "https://creativecommons.org/licenses/by/4.0/";
const ccBySa = "https://creativecommons.org/licenses/by-sa/4.0/";
const usmc = "CPT Matthew Holfinger / U.S. Marine Corps";
const pexelsLicense = { license: "Pexels License", licenseUrl: "https://www.pexels.com/license/" };

function videoStills(slug, videoId, author, labels) {
  return {
    path: `exercise-photos/${slug}`,
    source: `https://www.youtube.com/watch?v=${videoId}`,
    author,
    license: "CC BY",
    licenseUrl: "https://support.google.com/youtube/answer/2797468",
    edit: "Καρέ βίντεο · περικοπή",
    labels
  };
}

function generatedGuide(slug, start, end) {
  return { path: `exercise-photos/${slug}`, generated: true, labels: [start, end] };
}

export const photoGuides = {
  "Goblet Squat": {
    path: "arnold/squat", author: "Taco Fleur / Cavemantraining",
    source: commons + "Kettlebell_Goblet_Squat.webm", license: "CC BY-SA 4.0", licenseUrl: ccBySa
  },
  "One-Arm Dumbbell Row": videoStills("dumbbell-row", "mq9DnSQpTyc", "Paul Sandburg Fitness", [
    "Χέρι χαμηλά", "Αγκώνας προς το ισχίο"
  ]),
  "One-Arm Dumbbell Floor Press": videoStills("dumbbell-floor-press", "9_Xvte2Dmrs", "Get Strong with Emily", [
    "Βραχίονας στο πάτωμα", "Αλτήρας πάνω από τον ώμο"
  ]),
  "One-Arm Dumbbell Shoulder Press": videoStills("dumbbell-shoulder-press", "YaCINLXZnAU", "Get Strong with Emily", [
    "Αλτήρας δίπλα στον ώμο", "Αλτήρας πάνω από το κεφάλι"
  ]),
  "Kettlebell Swing": {
    path: "exercise-photos/swing", author: usmc,
    source: "https://www.dvidshub.net/video/754731/kettlebell-swing",
    license: "Δημόσιος τομέας (ΗΠΑ)", licenseUrl: publicDomain,
    labels: ["Ισχία πίσω", "Όρθιος κορμός"]
  },
  "Dumbbell Suitcase March": generatedGuide("suitcase-march", "Αλτήρας στο πλάι", "Σήκωσε το αντίθετο γόνατο"),
  "Dumbbell Triceps Extension": generatedGuide("overhead-triceps", "Αλτήρας πάνω από το κεφάλι", "Λύγισε μόνο τους αγκώνες"),
  "Wall Sit": generatedGuide("wall-sit", "Πλάτη στον τοίχο", "Κάθισμα σε άνετο βάθος"),
  "Wall Push-Up": {
    path: "exercise-photos/wall-push-up", author: "Ketut Subiyanto / Pexels",
    source: "https://www.pexels.com/video/a-man-doing-wall-push-ups-5034563/",
    ...pexelsLicense,
    labels: ["Χέρια τεντωμένα", "Αγκώνες λυγισμένοι"]
  },
  "Wall-Supported Hip Abduction": generatedGuide("wall-hip-abduction", "Στήριξη με το κοντινό χέρι", "Εξωτερικό πόδι στο πλάι"),
  "Wall Hip Hinge": generatedGuide("wall-hip-hinge", "Όρθια θέση μπροστά από τον τοίχο", "Γλουτοί πίσω στον τοίχο"),
  "Wall Slide": generatedGuide("wall-slide", "Χέρια σε W", "Σύρε τα χέρια προς Y"),
  "Wall W Hold": {
    path: "exercise-photos/wall-w", author: "Koji Murofushi et al. / Frontiers in Psychology",
    source: "https://doi.org/10.3389/fpsyg.2025.1718718",
    license: "CC BY 4.0", licenseUrl: ccBy,
    labels: ["Στήσιμο σε W", "Κράτημα σε W"]
  },
  "Chin Tuck at Wall": generatedGuide("wall-chin-tuck", "Βλέμμα ευθεία", "Πηγούνι οριζόντια πίσω"),
  "Cat-Cow": {
    path: "exercise-photos/cat-cow", author: "Mary O’Neill / U.S. National Park Service",
    source: commons + "Yoga_at_Your_Park_-_Bitilasana.jpg",
    endSource: commons + "Yoga_at_Your_Park_-_Bidalasana.jpg",
    license: "Δημόσιος τομέας (ΗΠΑ)", licenseUrl: "https://www.nps.gov/aboutus/disclaimer.htm",
    labels: ["Γάτα · πλάτη στρογγυλή", "Αγελάδα · στήθος μπροστά"]
  },
  "Hip Flexor Stretch": {
    path: "exercise-photos/hip-flexor", author: usmc,
    source: "https://www.dvidshub.net/video/638238/pvc-half-kneeling-hip-flexor",
    license: "Δημόσιος τομέας (ΗΠΑ)", licenseUrl: publicDomain,
    labels: ["Στήσιμο στο ένα γόνατο", "Κορμός όρθιος"],
    note: "Στη φωτογραφία το κοντάρι προσφέρει στήριξη."
  },
  "Hamstring Stretch": generatedGuide("standing-hamstring", "Μπροστινή φτέρνα στο πάτωμα", "Κλίση από τα ισχία"),
  "Figure-4 Glute Stretch": {
    path: "exercise-photos/figure-four", author: usmc,
    source: "https://www.dvidshub.net/video/754732/figure-4-stretch",
    license: "Δημόσιος τομέας (ΗΠΑ)", licenseUrl: publicDomain,
    labels: ["Αστράγαλος πάνω στο γόνατο", "Μηρός προς το στήθος"]
  },
  "Doorway Chest Stretch": generatedGuide("doorway-chest", "Πήχης στην κάσα", "Στρέψε τον κορμό μακριά"),
  "Child's Pose": {
    path: "exercise-photos/child-pose", author: "Klaus Nielsen / Pexels",
    source: "https://www.pexels.com/photo/peaceful-black-woman-performing-vajrasana-for-meditation-6303440/",
    endAuthor: "Monstera Production / Pexels",
    endSource: "https://www.pexels.com/photo/anonymous-woman-stretching-body-in-extended-child-s-yoga-pose-5331223/",
    ...pexelsLicense,
    labels: ["Κάθισμα προς τις φτέρνες", "Χέρια μπροστά · στήθος χαμηλά"]
  },
  "Supine Spinal Twist": {
    path: "exercise-photos/spinal-twist", author: "olia danilevich / Pexels",
    source: "https://www.pexels.com/video/women-doing-the-supine-spinal-twist-pose-9003587/",
    ...pexelsLicense,
    edit: "Καρέ βίντεο · περικοπή",
    labels: ["Ανάσκελα · χέρια ανοιχτά", "Λυγισμένο γόνατο στην αντίθετη πλευρά"]
  }
};
