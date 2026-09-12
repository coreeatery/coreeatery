const CACHE='coreeatery-shell-v1'
const APP_SHELL=['/','/login','/cashier','/admin','/manifest.webmanifest']
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(c=>c.addAll(APP_SHELL).catch(()=>null)));self.skipWaiting()})
self.addEventListener('activate',event=>{event.waitUntil(self.clients.claim())})
self.addEventListener('fetch',event=>{
 if(event.request.method!=='GET')return
 event.respondWith(fetch(event.request).catch(()=>caches.match(event.request).then(r=>r||caches.match('/'))))
})
