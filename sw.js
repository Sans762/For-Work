/* For Work PIA Desk: public shell only; business data stays in localStorage. */
const CACHE = "for-work-pia-v6";
const APP_SHELL = ["./", "./index.html", "./manifest.webmanifest", "./icon.svg", "./xlsx-reader.js", "./google-sync.js"];
self.addEventListener("install",event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(APP_SHELL)).then(()=>self.skipWaiting()))});
self.addEventListener("activate",event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith("for-work-pia-")&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()))});
self.addEventListener("fetch",event=>{const request=event.request;if(request.method!=="GET")return;const url=new URL(request.url);if(url.origin!==self.location.origin)return;event.respondWith(fetch(request).then(response=>{if(response.ok&&APP_SHELL.some(path=>new URL(path,self.registration.scope).pathname===url.pathname)){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(request,copy))}return response}).catch(()=>caches.match(request).then(found=>found||caches.match("./index.html"))))});
