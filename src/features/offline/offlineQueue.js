const DB_NAME='coreeatery-offline'
const STORE='queue'
const VERSION=1
function openDb(){return new Promise((resolve,reject)=>{const r=indexedDB.open(DB_NAME,VERSION);r.onupgradeneeded=()=>{const db=r.result;if(!db.objectStoreNames.contains(STORE))db.createObjectStore(STORE,{keyPath:'id',autoIncrement:true})};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})}
export async function enqueueOfflineAction(action){const db=await openDb();return new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).add({...action,queuedAt:new Date().toISOString(),status:'pending'});tx.oncomplete=()=>resolve(true);tx.onerror=()=>reject(tx.error)})}
export async function getOfflineQueue(){const db=await openDb();return new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readonly');const r=tx.objectStore(STORE).getAll();r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})}
export async function clearOfflineItem(id){const db=await openDb();return new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).delete(id);tx.oncomplete=()=>resolve(true);tx.onerror=()=>reject(tx.error)})}
export function installOfflineSync(onSync){const h=()=>{if(navigator.onLine)onSync?.()};window.addEventListener('online',h);return()=>window.removeEventListener('online',h)}

