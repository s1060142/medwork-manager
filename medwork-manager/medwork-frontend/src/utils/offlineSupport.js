// Offline support utilities for MedWork Manager
// Handles IndexedDB caching, background sync, and offline detection

const DB_NAME = 'medwork-offline'
const DB_VERSION = 1
const STORES = {
  APPOINTMENTS: 'appointments',
  MEDICAL_VISITS: 'medical-visits',
  EMPLOYEES: 'employees',
  COMPANIES: 'companies',
  EXAMS: 'exams',
  SYNC_QUEUE: 'sync-queue',
  SETTINGS: 'settings',
}

// Open IndexedDB
export function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result
      
      Object.values(STORES).forEach(storeName => {
        if (!db.objectStoreNames.contains(storeName)) {
          const store = db.createObjectStore(storeName, { keyPath: 'id', autoIncrement: true })
          store.createIndex('synced', 'synced', { unique: false })
          store.createIndex('timestamp', 'timestamp', { unique: false })
        }
      })
    }
  })
}

// Cache data for offline use
export async function cacheData(storeName, data) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite')
    const store = transaction.objectStore(storeName)
    
    const items = Array.isArray(data) ? data : [data]
    items.forEach(item => {
      const record = {
        ...item,
        synced: item.synced ?? false,
        timestamp: item.timestamp ?? Date.now(),
        lastModified: Date.now(),
      }
      store.put(record)
    })
    
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error)
  })
}

// Get cached data
export async function getCachedData(storeName, options = {}) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly')
    const store = transaction.objectStore(storeName)
    
    let request
    if (options.unsyncedOnly) {
      const index = store.index('synced')
      request = index.getAll(false)
    } else if (options.since) {
      const index = store.index('timestamp')
      request = index.getAll(IDBKeyRange.lowerBound(options.since))
    } else {
      request = store.getAll()
    }
    
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

// Add to sync queue
export async function addToSyncQueue(action, payload) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORES.SYNC_QUEUE, 'readwrite')
    const store = transaction.objectStore(STORES.SYNC_QUEUE)
    
    const record = {
      action,
      payload,
      timestamp: Date.now(),
      retries: 0,
      status: 'pending',
    }
    
    const request = store.add(record)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

// Get pending sync items
export async function getPendingSyncItems() {
  return getCachedData(STORES.SYNC_QUEUE, { unsyncedOnly: true })
}

// Mark sync item as completed
export async function markSyncCompleted(id) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORES.SYNC_QUEUE, 'readwrite')
    const store = transaction.objectStore(STORES.SYNC_QUEUE)
    
    const request = store.get(id)
    request.onsuccess = () => {
      const item = request.result
      if (item) {
        item.status = 'completed'
        item.synced = true
        store.put(item)
      }
      resolve()
    }
    request.onerror = () => reject(request.error)
  })
}

// Increment retry count
export async function incrementSyncRetry(id) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORES.SYNC_QUEUE, 'readwrite')
    const store = transaction.objectStore(STORES.SYNC_QUEUE)
    
    const request = store.get(id)
    request.onsuccess = () => {
      const item = request.result
      if (item) {
        item.retries = (item.retries || 0) + 1
        if (item.retries > 5) {
          item.status = 'failed'
        }
        store.put(item)
      }
      resolve()
    }
    request.onerror = () => reject(request.error)
  })
}

// Online/Offline detection
let isOnline = navigator.onLine
let onlineListeners = []

export function isOnlineMode() {
  return isOnline
}

export function addOnlineListener(callback) {
  onlineListeners.push(callback)
  return () => {
    onlineListeners = onlineListeners.filter(cb => cb !== callback)
  }
}

function notifyOnlineChange() {
  onlineListeners.forEach(cb => cb(isOnline))
}

window.addEventListener('online', () => {
  isOnline = true
  notifyOnlineChange()
})

window.addEventListener('offline', () => {
  isOnline = false
  notifyOnlineChange()
})

// Background sync manager
let syncInterval = null

export async function processSyncQueue() {
  if (!isOnline) return
  
  const pending = await getPendingSyncItems()
  if (pending.length === 0) return
  
  for (const item of pending) {
    if (item.status === 'completed' || item.status === 'failed') continue
    
    try {
      // Process based on action type
      switch (item.action) {
        case 'CREATE_MEDICAL_VISIT':
          await apiSend('POST', '/api/medical-visits', item.payload)
          break
        case 'UPDATE_MEDICAL_VISIT':
          await apiSend('PUT', `/api/medical-visits/${item.payload.id}`, item.payload)
          break
        case 'CREATE_EXAM':
          await apiSend('POST', '/api/visit-exams', item.payload)
          break
        case 'CREATE_EMPLOYEE':
          await apiSend('POST', '/api/admin-data/employees', item.payload)
          break
        case 'UPDATE_EMPLOYEE':
          await apiSend('PUT', `/api/admin-data/employees/${item.payload.id}`, item.payload)
          break
        default:
          console.warn('Unknown sync action:', item.action)
      }
      
      await markSyncCompleted(item.id)
    } catch (error) {
      console.error('Sync failed for item:', item.id, error)
      await incrementSyncRetry(item.id)
    }
  }
}

export function startBackgroundSync(intervalMs = 30000) {
  if (syncInterval) clearInterval(syncInterval)
  
  // Initial sync
  processSyncQueue()
  
  // Periodic sync
  syncInterval = setInterval(() => {
    if (isOnline) {
      processSyncQueue()
    }
  }, intervalMs)
  
  // Also sync when coming online
  addOnlineListener((online) => {
    if (online) {
      processSyncQueue()
    }
  })
}

export function stopBackgroundSync() {
  if (syncInterval) {
    clearInterval(syncInterval)
    syncInterval = null
  }
}

// Initialize offline support on app load
export function initOfflineSupport() {
  // Pre-cache essential data
  cacheData(STORES.SETTINGS, { lastSync: Date.now() })
  
  // Start background sync
  startBackgroundSync()
  
  // Listen for service worker messages (if PWA)
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'SYNC_COMPLETE') {
        console.log('Background sync completed:', event.data)
      }
    })
  }
}

// Utility: wrap API calls with offline support
export async function apiCallWithOfflineSupport(method, endpoint, payload, options = {}) {
  const { cacheOnFailure = true, storeName = null } = options
  
  if (!isOnline) {
    // Queue for later sync
    if (cacheOnFailure && method !== 'GET') {
      const action = method === 'POST' ? 'CREATE' : method === 'PUT' ? 'UPDATE' : 'DELETE'
      await addToSyncQueue(`${action}_${endpoint.replace(/\//g, '_')}`, payload)
    }
    
    // Try to return cached data for GET
    if (method === 'GET' && storeName) {
      const cached = await getCachedData(storeName)
      const key = endpoint.split('/').pop()
      return cached.find(item => item.id == key || item.id == parseInt(key))
    }
    
    throw new Error('Offline: request queued for sync')
  }
  
  try {
    const result = await apiSend(method, endpoint, payload)
    
    // Cache successful responses
    if (method === 'GET' && storeName && result) {
      await cacheData(storeName, Array.isArray(result) ? result : [result])
    }
    
    return result
  } catch (error) {
    // Queue for retry if mutation
    if (cacheOnFailure && method !== 'GET') {
      const action = method === 'POST' ? 'CREATE' : method === 'PUT' ? 'UPDATE' : 'DELETE'
      await addToSyncQueue(`${action}_${endpoint.replace(/\//g, '_')}`, payload)
    }
    throw error
  }
}

// Export the main apiClient functions with offline support
export { apiGet, apiSend } from '../services/apiClient'