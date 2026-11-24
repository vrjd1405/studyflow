const CACHE='studyflow-warrior-plus-ultimate-v3:'+self.registration.scope;
const CORE=['./','./index.html','./desktop.css','./planner.js','./manifest.webmanifest','./icons/icon-192.png','./icons/icon-512.png','./icons/warrior-1.webp','./icons/warrior-2.webp','./icons/warrior-3.webp'];
self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>
    key!==CACHE&&key.startsWith('studyflow-warrior-plus-ultimate-')&&key.endsWith(':'+self.registration.scope)
  ).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',event=>{
  const {request}=event;
  if(request.method!=='GET'||!request.url.startsWith(self.registration.scope))return;
  if(request.mode==='navigate'){
    event.respondWith(fetch(request).catch(async()=>{const cache=await caches.open(CACHE);return cache.match('./index.html')}));
    return;
  }
  event.respondWith(caches.open(CACHE).then(async cache=>(await cache.match(request))||fetch(request)));
});

