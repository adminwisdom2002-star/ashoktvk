import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw, CheckCircle2, AlertCircle, CloudOff, ArrowUpRight } from 'lucide-react';
import { getOfflineQueue, syncOfflinePetitions } from '../utils/offlineSync';

interface OfflineSyncBannerProps {
  onSyncComplete?: (successCount: number) => void;
}

export const OfflineSyncBanner: React.FC<OfflineSyncBannerProps> = ({ onSyncComplete }) => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [queueCount, setQueueCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncResult, setLastSyncResult] = useState<string | null>(null);

  // Monitor network status and local offline queue
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Auto-trigger sync when returning online
      triggerAutoSync();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial queue count check
    updateQueueCount();

    // Periodic check for queue count (every 3 seconds)
    const interval = setInterval(() => {
      updateQueueCount();
    }, 3000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  const updateQueueCount = () => {
    const queue = getOfflineQueue();
    setQueueCount(queue.length);
  };

  const triggerAutoSync = async () => {
    const queue = getOfflineQueue();
    if (queue.length === 0) return;

    setIsSyncing(true);
    setLastSyncResult(null);

    try {
      const res = await syncOfflinePetitions();
      updateQueueCount();
      if (res.successCount > 0) {
        setLastSyncResult(`✅ ${res.successCount} ஆஃப்லைன் மனுக்கள் சர்வரில் வெற்றிகரமாக ஒத்திசைக்கப்பட்டன!`);
        if (onSyncComplete) onSyncComplete(res.successCount);
      }
    } catch (err) {
      console.warn("Auto sync error:", err);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleManualSync = async () => {
    if (!navigator.onLine) {
      setLastSyncResult('⚠️ இணைய இணைப்பு இல்லை. தயவுசெய்து இணையத்தைத் தொடர்புபடுத்தவும்.');
      return;
    }
    await triggerAutoSync();
  };

  // If online and no queued petitions, don't show the banner
  if (isOnline && queueCount === 0 && !lastSyncResult) {
    return null;
  }

  return (
    <div className="w-full bg-gradient-to-r from-[#4a0000] via-neutral-900 to-[#380000] text-[#ffcc00] border-b-2 border-[#ffcc00]/50 shadow-md py-2.5 px-4 sticky top-0 z-50 transition-all duration-300">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs sm:text-sm">
        
        {/* Status Indicator & Text */}
        <div className="flex items-center gap-2.5 font-bold">
          {!isOnline ? (
            <div className="flex items-center gap-2 text-amber-300 animate-pulse">
              <CloudOff className="w-5 h-5 text-amber-400 shrink-0" />
              <span>
                🔴 நீங்கள் ஆஃப்லைனில் உள்ளீர்கள் (Offline Mode)
              </span>
            </div>
          ) : queueCount > 0 ? (
            <div className="flex items-center gap-2 text-[#ffcc00]">
              <Wifi className="w-5 h-5 text-emerald-400 shrink-0 animate-bounce" />
              <span>
                🌐 இணைய இணைப்பு கிடைத்தது! {queueCount} மனுக்கள் சர்வரில் ஒத்திசைக்கக் காத்திருக்கின்றன.
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-emerald-300">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>{lastSyncResult}</span>
            </div>
          )}

          {queueCount > 0 && (
            <span className="bg-[#ffcc00] text-[#4a0000] text-xs font-black px-2.5 py-0.5 rounded-full shadow-2xs">
              {queueCount} நிலுவை
            </span>
          )}
        </div>

        {/* Sync Actions & Message */}
        <div className="flex items-center gap-2">
          {queueCount > 0 && isOnline && (
            <button
              onClick={handleManualSync}
              disabled={isSyncing}
              className="px-3.5 py-1.5 bg-[#ffcc00] hover:bg-[#ffb700] active:scale-95 text-[#4a0000] font-black text-xs rounded-lg shadow-sm transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#4a0000] ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'ஒத்திசைக்கப்படுகிறது...' : 'இப்போதே ஒத்திசை (Sync Now)'}</span>
            </button>
          )}

          {!isOnline && (
            <span className="text-[11px] text-amber-200/90 italic font-normal">
              (உங்கள் மனுக்கள் உள்ளூர் நினைவகத்தில் பத்திரமாக உள்ளன. ஆன்லைன் வந்ததும் தானாகச் சேமிக்கப்படும்)
            </span>
          )}

          {lastSyncResult && queueCount === 0 && (
            <button
              onClick={() => setLastSyncResult(null)}
              className="text-xs text-[#ffcc00] underline hover:text-white cursor-pointer ml-2"
            >
              மூடு
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
