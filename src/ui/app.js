import { workouts } from "../data/workouts.js";
import { wallGuides } from "../data/guides.js";
import { todayKey } from "../logic/dates.js";
import { levelInfo, XP_PER_LEVEL, xpClaimedToday, awardQuestXp } from "../logic/xp.js";
import { applyHpDecay } from "../logic/hp.js";
import { currentStreak, latestWorkoutDay, daysThisWeek, recordWorkoutDay, WEEKLY_TARGET_DAYS } from "../logic/streak.js";
import * as S from "../state/state.js";
import { loadRaw, saveState, backupBeforeImport, CORRUPT_KEY, PRE_IMPORT_KEY } from "../storage/storage.js";
import { buildExport, parseImport, summarize } from "../backup/backup.js";

const store=window.localStorage;
const loaded=loadRaw(store);
let state=S.prepareState(loaded.data,workouts,todayKey());
const allowedWeights=S.ALLOWED_WEIGHTS,allowedSets=S.ALLOWED_SETS;

function save(){if(!saveState(store,state))notice("ΣΦΑΛΜΑ ΑΠΟΘΗΚΕΥΣΗΣ")}
function notice(t){document.getElementById("notice").textContent=t}
function current(){return workouts[state.activeMode]}
function session(){return state.sessions[state.activeMode]}
function item(i){return current().items[i]}
function val(i){return S.value(session(),item(i),i)}
function setVal(i,v){S.changeValue(session(),item(i),i,v);save();render()}
function weight(i){return state.activeMode==="kb"?S.weight(session(),i):null}
function setWeight(i,v){if(state.activeMode!=="kb")return;S.changeWeight(session(),i,v);save();render()}
function setCount(i){return S.setCount(session(),item(i),i)}
function setProgress(i){return S.setProgress(session(),item(i),i)}
function setSetCount(i,v){S.changeSetCount(session(),item(i),i,v);save();render()}
function advanceSet(i){
 const s=session();
 if(s.done.includes(i)){
   if(!confirm("Μηδενισμός προόδου για «"+selectedExercise(i,item(i)).name+"»;"))return;
   S.resetExercise(s,i);
 }else S.advanceSet(s,item(i),i);
 save();render()
}
function altOn(i){return state.activeMode==="kb"&&!!session().alternatives[i]}
function selectedExercise(i,base){return altOn(i)&&base.alt?Object.assign({},base,base.alt):base}
function setAlternative(i,on){if(state.activeMode!=="kb")return;session().alternatives[i]=!!on;save();render()}
// New calendar day: clear set progress and apply the inactivity HP rule.
function refreshDay(){
 const today=todayKey(),reset=S.resetDailyProgress(state,workouts,today),hpChanged=applyHpDecay(state,today);
 if(reset||hpChanged){save();render()}
}
function cls(t,k){return t.includes(k)?"muscle active":"muscle"}
function muscleMap(t){
 return '<svg viewBox="0 0 430 250" aria-label="Muscle map">'+
 '<text x="91" y="16" class="lab">ΜΠΡΟΣΤΑ</text><text x="295" y="16" class="lab">ΠΙΣΩ</text>'+
 '<circle cx="120" cy="38" r="19" class="body"/><rect x="114" y="54" width="12" height="10" rx="4" class="'+cls(t,"neck")+'"/><path d="M105 60 Q120 54 135 60 L147 106 Q143 126 138 139 L102 139 Q97 125 93 106 Z" class="body"/><rect x="77" y="66" width="17" height="59" rx="8" class="body"/><rect x="146" y="66" width="17" height="59" rx="8" class="body"/><rect x="103" y="139" width="15" height="72" rx="7" class="body"/><rect x="122" y="139" width="15" height="72" rx="7" class="body"/>'+
 '<path d="M99 66 Q120 57 141 66 L137 86 Q120 92 103 86 Z" class="'+cls(t,"chest")+'"/>'+
 '<path d="M103 87 Q120 82 137 87 L136 116 Q120 122 104 116 Z" class="'+cls(t,"core")+'"/>'+
 '<path d="M96 87 Q101 92 104 116 L99 125 Q91 106 93 91 Z" class="'+cls(t,"obliques")+'"/><path d="M144 87 Q139 92 136 116 L141 125 Q149 106 147 91 Z" class="'+cls(t,"obliques")+'"/>'+
 '<ellipse cx="91" cy="72" rx="10" ry="12" class="'+(t.includes("shoulders")||t.includes("frontshoulders")?"muscle active":"muscle")+'"/><ellipse cx="149" cy="72" rx="10" ry="12" class="'+(t.includes("shoulders")||t.includes("frontshoulders")?"muscle active":"muscle")+'"/>'+
 '<path d="M79 81 Q89 77 93 87 L92 101 Q82 104 77 96 Z" class="'+cls(t,"biceps")+'"/><path d="M147 81 Q157 77 161 87 L163 101 Q153 104 148 96 Z" class="'+cls(t,"triceps")+'"/>'+
 '<path d="M102 141 Q111 136 119 141 L118 177 Q109 183 102 176 Z" class="'+cls(t,"quads")+'"/><path d="M121 141 Q130 136 138 141 L137 176 Q129 183 121 177 Z" class="'+cls(t,"quads")+'"/>'+
 '<circle cx="310" cy="38" r="19" class="body"/><rect x="304" y="54" width="12" height="10" rx="4" class="'+cls(t,"neck")+'"/><path d="M295 60 Q310 54 325 60 L337 106 Q333 126 328 139 L292 139 Q287 125 283 106 Z" class="body"/><rect x="267" y="66" width="17" height="59" rx="8" class="body"/><rect x="336" y="66" width="17" height="59" rx="8" class="body"/><rect x="293" y="139" width="15" height="72" rx="7" class="body"/><rect x="312" y="139" width="15" height="72" rx="7" class="body"/>'+
 '<path d="M291 66 Q310 58 329 66 L326 89 Q310 97 294 89 Z" class="'+cls(t,"upperback")+'"/>'+
 '<path d="M294 86 Q302 91 306 118 L292 126 Q284 105 286 86 Z" class="'+cls(t,"lats")+'"/><path d="M326 86 Q318 91 314 118 L328 126 Q336 105 334 86 Z" class="'+cls(t,"lats")+'"/>'+
 '<ellipse cx="281" cy="72" rx="10" ry="12" class="'+(t.includes("shoulders")||t.includes("rearshoulders")?"muscle active":"muscle")+'"/><ellipse cx="339" cy="72" rx="10" ry="12" class="'+(t.includes("shoulders")||t.includes("rearshoulders")?"muscle active":"muscle")+'"/>'+
 '<path d="M269 82 Q279 78 283 88 L282 102 Q272 105 267 97 Z" class="'+cls(t,"triceps")+'"/><path d="M337 82 Q347 78 351 88 L353 102 Q343 105 338 97 Z" class="'+cls(t,"triceps")+'"/>'+
 '<path d="M291 122 Q310 114 329 122 L328 143 Q310 153 292 143 Z" class="'+cls(t,"glutes")+'"/>'+
 '<path d="M292 143 Q301 138 309 143 L308 181 Q300 188 293 180 Z" class="'+cls(t,"hamstrings")+'"/><path d="M311 143 Q320 138 328 143 L327 180 Q319 188 312 181 Z" class="'+cls(t,"hamstrings")+'"/>'+
 '<text x="72" y="232" class="lab">Πράσινο = βασικές περιοχές</text></svg>';
}
function wallGuide(e){
 const g=wallGuides[e.name];if(!g)return "";
 return `<figure class="demo"><figcaption>${g.title}</figcaption><a href="./assets/wall/${g.image}.webp" target="_blank" rel="noopener" aria-label="Μεγέθυνση: ${g.title}"><img src="./assets/wall/${g.image}.webp" alt="${g.title}: 1 αρχική θέση, 2 κίνηση ή κράτημα" loading="lazy" decoding="async"></a><div class="demo-hint">Πάτησε την εικόνα για μεγέθυνση · Εικονογράφηση AI</div><ol>${g.steps.map(t=>`<li>${t}</li>`).join("")}</ol><p class="demo-hint">Κινήσου σε άνετο εύρος. Σταμάτα αν πονάς.</p></figure>`;
}
function stretchGuide(e){
 return '<div class="stretch-card"><div class="stretch-copy"><div><div class="stretch-kicker">RECOVERY / MOBILITY</div><div class="stretch-name">'+e.name+'</div><div class="stretch-note">Ήπια ένταση, αργή αναπνοή, χωρίς πόνο ή αναπηδήσεις.</div></div></div><div class="kb-map"><div class="legend"><b>Πράσινο</b> = κύριες περιοχές</div>'+muscleMap(e.targets)+'</div></div>';
}

function kbVisual(i,e,isAlt){
 if(isAlt)return '<div class="alt-visual"><div class="alt-visual-copy"><div><div class="alt-badge">ALTERNATIVE</div><div class="alt-visual-name">'+e.name+'</div><div class="alt-visual-note">Ίδιος βασικός στόχος, διαφορετική κίνηση. Ακολούθησε τις οδηγίες εκτέλεσης από κάτω.</div></div></div><div class="kb-map"><div class="legend"><b>Πράσινο</b> = κύριοι μύες</div>'+muscleMap(e.targets)+'</div></div>';
 const x=[0,33.333,66.667,100,0,33.333,66.667], y=[0,0,0,0,100,100,100];
 return '<div class="kb-visual"><div class="kb-photo" style="background-position:'+x[i]+'% '+y[i]+'%"></div><div class="kb-map"><div class="legend"><b>Πράσινο</b> = κύριοι μύες</div>'+muscleMap(e.targets)+'</div></div><div class="visual-note">Οπτική αναφορά της άσκησης. Για σωστή τεχνική ακολούθησε τις οδηγίες εκτέλεσης από κάτω.</div>';
}
function render(){
 const w=current(),s=session(),list=document.getElementById("list");
 document.getElementById("questTitle").textContent=w.title;
 document.getElementById("questMeta").textContent=w.meta;
 const today=todayKey(),weekDays=daysThisWeek(state.questDays,today);
 document.getElementById("complete").textContent=xpClaimedToday(state,state.activeMode,today)?"COMPLETE QUEST · XP ΣΗΜΕΡΑ ✓":"COMPLETE QUEST · +"+w.xp+" XP";
 document.querySelectorAll("[data-mode]").forEach(b=>b.classList.toggle("active",b.dataset.mode===state.activeMode));
 const summary=document.getElementById("questSummary");summary.classList.toggle("wall",state.activeMode==="wall");summary.classList.toggle("stretch",state.activeMode==="stretch");document.getElementById("questModeLabel").textContent=state.activeMode==="wall"?"▥ WALL / POSTURE QUEST":state.activeMode==="stretch"?"◌ STRETCHING QUEST":"⚔ KETTLEBELL QUEST";document.getElementById("questProgress").textContent=s.done.length+"/"+w.items.length+" DONE";document.getElementById("dayTrack").innerHTML=Array.from({length:5},(_,i)=>'<span class="day-dot '+(i<Math.min(weekDays,WEEKLY_TARGET_DAYS)?'hit':'')+'"></span>').join("");
 list.innerHTML="";
 w.items.forEach((base,i)=>{
  const isAlt=state.activeMode==="kb"&&altOn(i),e=selectedExercise(i,base);
  const v=val(i),wt=state.activeMode==="kb"?weight(i):null,sc=setCount(i),sp=setProgress(i),d=document.createElement("div");d.className="exercise "+(s.done.includes(i)?"done":"");
  const shownLoad=wt!==null?wt+" kg":e.load;
  d.innerHTML='<div class="ex-head"><div><h3>'+(i+1)+'. '+e.name+'</h3><span class="dose">'+shownLoad+' · '+sc+' × '+v+e.suffix+'</span></div><button class="check" data-check="'+i+'">'+(s.done.includes(i)?("✓ "+sp+"/"+sc):("SET "+sp+"/"+sc))+'</button></div>'+
  (state.activeMode==="kb"?kbVisual(i,e,isAlt):state.activeMode==="stretch"?stretchGuide(e):wallGuide(e))+
  '<div class="tags"><span class="tags-label">Δουλεύουν κυρίως:</span>'+e.muscles.map(m=>'<span class="tag">'+m+'</span>').join("")+'</div>'+
  '<div class="control-panel">'+
  (state.activeMode==="kb"&&base.alt?'<div class="alt-picker"><span>ΑΣΚΗΣΗ</span><button class="alt-chip '+(!isAlt?'active':'')+'" data-alt="'+i+'" data-value="0">ΚΥΡΙΑ</button><button class="alt-chip '+(isAlt?'active':'')+'" data-alt="'+i+'" data-value="1">'+base.alt.name+'</button></div>':'')+
  '<div class="repbox"><span>'+e.control+'</span><button class="repbtn" data-minus="'+i+'">−</button><input class="repinput" data-input="'+i+'" type="number" min="1" value="'+v+'"><button class="repbtn" data-plus="'+i+'">+</button></div>'+
  '<div class="set-picker"><span>ΦΟΡΕΣ</span>'+allowedSets.map(x=>'<button class="set-chip '+(x===sc?'active':'')+'" data-sets="'+i+'" data-value="'+x+'">'+x+'</button>').join("")+'</div><div class="set-progress-note">Ολοκλήρωση: '+sp+' / '+sc+' σετ</div>'+
  (state.activeMode==="kb"?'<div class="weight-picker"><span>ΒΑΡΟΣ</span>'+allowedWeights.map(x=>'<button class="weight-chip '+(x===wt?'active':'')+'" data-weight="'+i+'" data-value="'+x+'">'+x+' KG</button>').join("")+'</div>':'')+'</div>'+
  (state.activeMode==='wall'?'<div class="mapTitle">MUSCLE MAP</div><div class="mapWrap"><div class="legend"><b>Πράσινο</b> = τι δουλεύει περισσότερο</div>'+muscleMap(e.targets)+'</div>':'')+
  '<div class="details"><div><b>Εκτέλεση:</b> '+e.cue+'</div><div><b>Να νιώθεις:</b> '+e.feel+'</div><div><b>Κύριο λάθος:</b> '+e.mistake+'</div></div>';
  list.appendChild(d)
 });
 document.querySelectorAll("[data-check]").forEach(b=>b.onclick=()=>advanceSet(+b.dataset.check));
 document.querySelectorAll("[data-minus]").forEach(b=>b.onclick=()=>{let i=+b.dataset.minus;setVal(i,val(i)-current().items[i].step)});
 document.querySelectorAll("[data-plus]").forEach(b=>b.onclick=()=>{let i=+b.dataset.plus;setVal(i,val(i)+current().items[i].step)});
 document.querySelectorAll("[data-input]").forEach(x=>x.onchange=()=>setVal(+x.dataset.input,x.value));
 document.querySelectorAll("[data-alt]").forEach(b=>b.onclick=()=>setAlternative(+b.dataset.alt,+b.dataset.value===1));
 document.querySelectorAll("[data-sets]").forEach(b=>b.onclick=()=>setSetCount(+b.dataset.sets,+b.dataset.value));
 document.querySelectorAll("[data-weight]").forEach(b=>b.onclick=()=>setWeight(+b.dataset.weight,+b.dataset.value));
 const {level,rem}=levelInfo(state.xp);document.getElementById("level").textContent=level;document.getElementById("xpText").textContent=rem;document.getElementById("xpbar").style.width=(rem/XP_PER_LEVEL*100)+"%";document.getElementById("dayCount").textContent=weekDays+"/"+WEEKLY_TARGET_DAYS;
 const hp=document.getElementById("hpText"),bar=document.getElementById("hpbar"),st=document.getElementById("streakText"),note=document.getElementById("hpNote");
 if(hp)hp.textContent=state.hp;if(bar)bar.style.width=state.hp+"%";if(st)st.textContent=currentStreak(state.questDays,today);
 if(note){const last=latestWorkoutDay(state.questDays);note.textContent=last?"Τελευταία προπόνηση: "+last+" · στις 7 ημέρες αδράνειας χάνεις 10 HP":"Αν περάσουν 7 ημέρες χωρίς ολοκληρωμένο quest, χάνεις 10 HP."}
}
document.querySelectorAll("[data-mode]").forEach(b=>b.onclick=()=>{state.activeMode=b.dataset.mode;save();notice("");render()});
document.getElementById("complete").onclick=()=>{
 refreshDay();
 const w=current(),s=session(),today=todayKey();
 if(s.done.length<w.items.length){notice("QUEST INCOMPLETE");return}
 const gained=awardQuestXp(state,state.activeMode,w.xp,today);
 recordWorkoutDay(state,today);S.clearProgress(s);save();render();
 notice((gained?"QUEST COMPLETE · +"+gained+" XP":"QUEST COMPLETE · XP ΗΔΗ ΣΗΜΕΡΑ")+" · STREAK "+currentStreak(state.questDays,today));
};
document.getElementById("reset").onclick=()=>{if(!confirm("Μηδενισμός όλων των σημερινών sets σε αυτό το mode;"))return;S.clearProgress(session());save();render();notice("")};
applyHpDecay(state,todayKey());save();render();
if(loaded.corrupt)notice("ΤΑ ΑΠΟΘΗΚΕΥΜΕΝΑ ΔΕΔΟΜΕΝΑ ΔΕΝ ΔΙΑΒΑΖΟΝΤΑΝ · ΑΝΤΙΓΡΑΦΟ ΣΤΟ "+CORRUPT_KEY);
document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible")refreshDay()});
setInterval(refreshDay,60000);

const isNative=!!(window.Capacitor&&typeof window.Capacitor.isNativePlatform==="function"&&window.Capacitor.isNativePlatform());
if("serviceWorker" in navigator){
  if(isNative){navigator.serviceWorker.getRegistrations().then(rs=>rs.forEach(r=>r.unregister())).catch(()=>{})}
  else{window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js",{scope:"./"}).catch(()=>{}))}
}
if(isNative&&"caches" in window){caches.keys().then(keys=>Promise.all(keys.map(k=>caches.delete(k)))).catch(()=>{})}
let installPrompt=null;const installBtn=document.getElementById("install");
window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();installPrompt=e;installBtn.style.display="block"});
installBtn.addEventListener("click",async()=>{if(!installPrompt)return;installPrompt.prompt();await installPrompt.userChoice;installPrompt=null;installBtn.style.display="none"});
window.addEventListener("appinstalled",()=>{installBtn.style.display="none";document.getElementById("notice").textContent="APP INSTALLED"});
const backupText=document.getElementById("backupText"),backupStatus=document.getElementById("backupStatus"),importBtn=document.getElementById("importBtn"),downloadBtn=document.getElementById("downloadBtn");
let pendingImport=null;
function describe(p){return "XP "+p.xp+" · LEVEL "+p.level+" · HP "+p.hp+" · "+p.workoutDays+" ημέρες προπόνησης"+(p.lastWorkout?" · τελευταία "+p.lastWorkout:"")}
function clearPending(){pendingImport=null;importBtn.disabled=true}
function exportNow(){save();backupText.value=buildExport(state);clearPending();backupStatus.textContent="Backup έτοιμο · "+describe(summarize(state))}
function checkImport(){
 const r=parseImport(backupText.value);
 if(!r.ok){clearPending();backupStatus.textContent="✗ "+r.error;return}
 pendingImport=r.state;importBtn.disabled=false;
 backupStatus.textContent="✓ Backup: "+describe(r.summary)+" · Πάτησε IMPORT για επαναφορά.";
}
if(isNative)downloadBtn.style.display="none";
document.getElementById("exportBtn").onclick=exportNow;
document.getElementById("copyBtn").onclick=async()=>{
 if(!backupText.value.trim())exportNow();
 try{await navigator.clipboard.writeText(backupText.value)}
 catch{backupText.focus();backupText.select();document.execCommand("copy")}
 backupStatus.textContent="Αντιγράφηκε · επικόλλησέ το κάπου ασφαλές (π.χ. σημειώσεις ή email)";
};
downloadBtn.onclick=()=>{
 if(!backupText.value.trim())exportNow();
 const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([backupText.value],{type:"application/json"}));
 a.download="solo-leveling-backup-"+todayKey()+".json";document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),1000);
};
backupText.oninput=clearPending;
document.getElementById("importFile").onchange=async e=>{const f=e.target.files[0];if(!f)return;backupText.value=await f.text();e.target.value="";checkImport()};
document.getElementById("checkBtn").onclick=checkImport;
importBtn.onclick=()=>{
 if(!pendingImport)return;
 const incoming=summarize(pendingImport);
 if(!confirm("Αντικατάσταση των τωρινών δεδομένων με το backup;\n\nΤΩΡΑ: "+describe(summarize(state))+"\nBACKUP: "+describe(incoming)))return;
 save();
 if(!backupBeforeImport(store)){backupStatus.textContent="✗ Δεν κρατήθηκε αντίγραφο των τωρινών δεδομένων · το Import ακυρώθηκε";return}
 state=S.prepareState(JSON.parse(JSON.stringify(pendingImport)),workouts,todayKey());
 applyHpDecay(state,todayKey());save();clearPending();render();
 backupStatus.textContent="✓ Import ολοκληρώθηκε · τα προηγούμενα δεδομένα κρατήθηκαν στο "+PRE_IMPORT_KEY;
};
