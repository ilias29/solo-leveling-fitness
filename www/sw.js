const CACHE="solo-fitness-v7-wall-photo-guides";
const ASSETS=["./","./index.html","./manifest.webmanifest","./icon-192.png","./icon-512.png","./assets/wall/wall-sit.webp","./assets/wall/wall-squat.webp","./assets/wall/hip-abduction.webp","./assets/wall/hip-hinge.webp","./assets/wall/wall-slide.webp","./assets/wall/wall-w-hold.webp","./assets/wall/chin-tuck.webp"];
self.addEventListener("install",e=>{self.skipWaiting();e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)))});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener("fetch",e=>{
 if(e.request.method!=="GET")return;
 if(e.request.mode==="navigate"){
   e.respondWith(fetch(e.request).then(resp=>{const copy=resp.clone();caches.open(CACHE).then(c=>c.put("./index.html",copy));return resp}).catch(()=>caches.match("./index.html")));
   return;
 }
 e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).then(resp=>{const copy=resp.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));return resp})));
});