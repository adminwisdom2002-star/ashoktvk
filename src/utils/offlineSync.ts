import { Petition } from '../types';

export interface QueuedPetition {
  id: string;
  tempTrackingNo: string;
  createdAt: string;
  formData: {
    wardNo: number;
    category: string;
    title: string;
    description: string;
    citizenName: string;
    phone: string;
    streetName: string;
    formalDraft?: string;
  };
  retryCount: number;
}

const STORAGE_KEY = 'tvk_offline_petitions_queue';

/**
 * Get all offline queued petitions from LocalStorage
 */
export const getOfflineQueue = (): QueuedPetition[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (err) {
    console.warn("Error reading offline queue from LocalStorage:", err);
  }
  return [];
};

/**
 * Save offline queue to LocalStorage
 */
export const saveOfflineQueue = (queue: QueuedPetition[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
  } catch (err) {
    console.warn("Error writing offline queue to LocalStorage:", err);
  }
};

/**
 * Add a new petition form payload to the offline queue
 */
export const addPetitionToOfflineQueue = (formData: any): QueuedPetition => {
  const queue = getOfflineQueue();
  const timestamp = Date.now();
  const randomNo = Math.floor(1000 + Math.random() * 9000);
  
  const queuedItem: QueuedPetition = {
    id: `offline_${timestamp}_${randomNo}`,
    tempTrackingNo: `TVK-OFFLINE-${randomNo}`,
    createdAt: new Date().toISOString(),
    formData: {
      wardNo: Number(formData.wardNo) || 1,
      category: formData.category || 'others',
      title: formData.title || 'குறைதீர்ப்பு மனு (ஆஃப்லைன்)',
      description: formData.description || '',
      citizenName: formData.citizenName || 'மனுதாரர்',
      phone: formData.phone || '',
      streetName: formData.streetName || '',
      formalDraft: formData.formalDraft || ''
    },
    retryCount: 0
  };

  const updatedQueue = [queuedItem, ...queue];
  saveOfflineQueue(updatedQueue);

  // Also save ID to local petition list so "My Petitions" view lists it
  try {
    const existingIds: string[] = JSON.parse(localStorage.getItem('tvk_my_petition_ids') || '[]');
    if (!existingIds.includes(queuedItem.id)) {
      existingIds.push(queuedItem.id);
      localStorage.setItem('tvk_my_petition_ids', JSON.stringify(existingIds));
    }
    if (formData.phone) {
      localStorage.setItem('tvk_user_phone', formData.phone);
    }
  } catch (e) {
    console.warn("Error writing to my_petition_ids", e);
  }

  return queuedItem;
};

/**
 * Remove a specific petition from offline queue
 */
export const removePetitionFromOfflineQueue = (id: string): void => {
  const queue = getOfflineQueue();
  const updated = queue.filter(item => item.id !== id);
  saveOfflineQueue(updated);
};

/**
 * Convert QueuedPetition to a temporary Petition object for UI display
 */
export const convertQueuedToPetition = (queued: QueuedPetition): Petition => {
  return {
    id: queued.id,
    trackingNo: queued.tempTrackingNo,
    wardNo: queued.formData.wardNo,
    category: queued.formData.category as any,
    title: queued.formData.title,
    description: queued.formData.description,
    citizenName: queued.formData.citizenName,
    phone: queued.formData.phone,
    streetName: queued.formData.streetName,
    formalDraft: queued.formData.formalDraft,
    status: 'pending',
    upvotes: 1,
    createdAt: queued.createdAt,
    updatedAt: queued.createdAt,
    comments: [
      {
        id: `c_off_${Date.now()}`,
        author: 'TVK ஆஃப்லைன் அமைப்பு',
        role: 'admin',
        text: 'இணைய இணைப்பு இல்லாததால் இம்மாதி மனு உள்ளூர் நினைவகத்தில் பத்திரமாகச் சேமிக்கப்பட்டுள்ளது. ஆன்லைன் வந்ததும் சர்வரில் தானாக ஒத்திசைக்கப்படும்.',
        timestamp: queued.createdAt
      }
    ],
    officialNote: 'ஆஃப்லைன் வரிசையில் உள்ளது (Queued for Online Sync)'
  };
};

/**
 * Synchronize all queued offline petitions with the server
 */
export const syncOfflinePetitions = async (
  onSuccessItem?: (syncedPetition: Petition, originalQueuedId: string) => void
): Promise<{ successCount: number; failCount: number }> => {
  const queue = getOfflineQueue();
  if (queue.length === 0) {
    return { successCount: 0, failCount: 0 };
  }

  let successCount = 0;
  let failCount = 0;
  const remainingQueue: QueuedPetition[] = [];

  for (const item of queue) {
    try {
      const res = await fetch('/api/petitions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item.formData)
      });

      if (res.ok) {
        const syncedPetition: Petition = await res.json();
        successCount++;

        // Update my_petition_ids in localStorage to point to real server ID
        try {
          const myIds: string[] = JSON.parse(localStorage.getItem('tvk_my_petition_ids') || '[]');
          const updatedMyIds = myIds.map(id => id === item.id ? syncedPetition.id : id);
          if (!updatedMyIds.includes(syncedPetition.id)) {
            updatedMyIds.push(syncedPetition.id);
          }
          localStorage.setItem('tvk_my_petition_ids', JSON.stringify(updatedMyIds));
        } catch (e) {
          console.warn("My IDs update error during sync:", e);
        }

        if (onSuccessItem) {
          onSuccessItem(syncedPetition, item.id);
        }
      } else {
        failCount++;
        item.retryCount += 1;
        remainingQueue.push(item);
      }
    } catch (err) {
      console.warn(`Sync failed for offline petition ${item.id}:`, err);
      failCount++;
      item.retryCount += 1;
      remainingQueue.push(item);
    }
  }

  saveOfflineQueue(remainingQueue);
  return { successCount, failCount };
};

/**
 * Service Worker Helper for registering SW
 */
export const registerServiceWorker = () => {
  if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').then(
        reg => console.log('ServiceWorker registered:', reg.scope),
        err => console.warn('ServiceWorker registration failed:', err)
      );
    });
  }
};
