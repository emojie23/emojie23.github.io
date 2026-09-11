const CACHE='neon-genesis-v35-build-expansion';
// Original generated expansion sprites are also available offline.
const ART=['hero-vanguard','hero-wraith','hero-beast','hero-seraph','hero-motion','boss-cherub','boss-matriarch','boss-hexa','boss-furnace','boss-reaper','boss-sovereign','phase2-cherub','phase2-matriarch','phase2-hexa','phase2-furnace','phase2-reaper','phase2-sovereign','enemies','weapons','items','menu-city','arena-floor'];
const FILES=['./','./index.html','./styles.css','./game.js','./legacy-art.js','./legacy-art.css','./portrait-rig.js','./manifest.webmanifest',...ART.map(id=>'./assets/generated/'+id+'.webp')];
FILES.push('./scene-depth.js','./assets/depth/sunken-chamber-v2.webp');
FILES.push('./boss-guide.js');
FILES.push('./threat-path.js');
FILES.push('./expansion-data.js','./expansion.js','./expansion-bosses.js','./expansion.css',...['fountain','workshop','altar','spider','mirror','relic-icons'].map(id=>'./assets/expansion/'+id+'.png'));
FILES.push('./boss-behavior.js','./boss-art.js',...['worm-head','worm-body','worm-tail','worm-maw','angel-core','angel-open','angel-blade','angel-exposed','frog-idle','frog-crouch','frog-leap','frog-land'].map(id=>'./assets/boss-v3/'+id+'.webp'));
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('neon-genesis-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{if(event.request.method!=='GET'||new URL(event.request.url).origin!==self.location.origin)return;const fresh=()=>fetch(event.request).then(response=>{if(response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy))}return response});event.respondWith(/\.(?:html|js|css)$/.test(new URL(event.request.url).pathname)||event.request.mode==='navigate'?fresh().catch(async()=>await caches.match(event.request)||(event.request.mode==='navigate'?await caches.match('./index.html'):Response.error())):caches.match(event.request).then(hit=>hit||fresh()).catch(()=>Response.error()))});
