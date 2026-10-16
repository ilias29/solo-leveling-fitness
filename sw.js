const CACHE="solo-fitness-v16";
const ASSETS=["./","./index.html","./manifest.webmanifest","./icon-192.png","./icon-512.png","./assets/wall/wall-sit.webp","./assets/wall/wall-squat.webp","./assets/wall/hip-abduction.webp","./assets/wall/hip-hinge.webp","./assets/wall/wall-slide.webp","./assets/wall/wall-w-hold.webp","./assets/wall/chin-tuck.webp",
 "./src/ui/app.js","./src/data/workouts.js","./src/data/guides.js","./src/logic/dates.js","./src/logic/xp.js","./src/logic/hp.js","./src/logic/streak.js","./src/state/state.js","./src/state/migrations.js","./src/storage/storage.js","./src/backup/backup.js"];
self.addEventListener("install",e=>{self.skipWaiting();e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS.map(u=>new Request(u,{cache:"reload"})))))});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
// Network first so HTML and JS modules always stay in sync; cache is the offline fallback.
self.addEventListener("fetch",e=>{
 if(e.request.method!=="GET"||new URL(e.request.url).origin!==self.location.origin)return;
 const key=e.request.mode==="navigate"?"./index.html":e.request;
 e.respondWith(fetch(e.request).then(resp=>{if(resp.ok){const copy=resp.clone();caches.open(CACHE).then(c=>c.put(key,copy))}return resp}).catch(()=>caches.match(key).then(r=>r||caches.match(e.request))));
});
