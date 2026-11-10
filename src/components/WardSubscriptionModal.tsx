import React, { useState, useEffect } from 'react';
import { Bell, X, Check, ShieldCheck, MapPin, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';
import { WARD_COORDINATES } from './PetitionsMap';

interface WardSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  subscribedWards: number[];
  onSaveSubscriptions: (wards: number[]) => void;
}

export const WardSubscriptionModal: React.FC<WardSubscriptionModalProps> = ({
  isOpen,
  onClose,
  subscribedWards,
  onSaveSubscriptions
}) => {
  const [selectedWards, setSelectedWards] = useState<number[]>(subscribedWards);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    setSelectedWards(subscribedWards);
  }, [subscribedWards, isOpen]);

  const handleCancel = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    onClose();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const toggleWard = (wardNo: number) => {
    setSelectedWards(prev => 
      prev.includes(wardNo) ? prev.filter(w => w !== wardNo) : [...prev, wardNo]
    );
  };

  const handleSelectAll = () => {
    setSelectedWards(Array.from({ length: 15 }, (_, i) => i + 1));
  };

  const handleClearAll = () => {
    setSelectedWards([]);
  };

  const handleSave = () => {
    onSaveSubscriptions(selectedWards);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  return (
    <div 
      className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleCancel(e);
        }
      }}
    >
      <div className="bg-white border border-neutral-200 rounded-2xl max-w-xl w-full my-8 overflow-hidden shadow-2xl relative animate-fadeIn">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-[#4a0000] to-[#380000] text-white p-5 border-b-4 border-[#ffcc00] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#ffcc00] text-[#4a0000] flex items-center justify-center font-bold shadow-md">
              <Bell className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black tracking-tight">
                வார்டு நேரலை அறிவிப்புகள் சந்தா (Ward Alert Preferences)
              </h3>
              <p className="text-xs text-neutral-200">
                உங்கள் பகுதி வார்டைத் தேர்ந்தெடுத்து நேரலைச் செய்திகளை உடனுக்குடன் பெறுங்கள்
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCancel}
            className="p-2 text-neutral-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
            title="மூடுக (Close)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-5">
          
          {/* Info Card */}
          <div className="bg-[#fffdf0] border border-[#ffcc00] rounded-xl p-3.5 flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-[#4a0000] flex-shrink-0 mt-0.5" />
            <div className="text-xs text-neutral-800 leading-relaxed">
              <strong className="text-[#4a0000] font-bold block mb-0.5">பிரத்யேக வார்டு அறிவிப்புகள்:</strong>
              நீங்கள் சந்தா செய்துள்ள வார்டுகளில் மட்டுமே புதிய மனுக்கள் பதிவாகும் போதோ அல்லது அரசு நடவடிக்கைகள் எடுக்கும் போதோ திரையில் உடனடி நேரலை அறிவிப்பு (Push Toast) தோன்றும்.
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs font-bold text-neutral-600">
              தேர்ந்தெடுக்கப்பட்டவை: <strong className="text-[#4a0000]">{selectedWards.length} / 15 வார்டுகள்</strong>
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-xs font-bold text-[#4a0000] hover:underline px-2 py-1 rounded bg-neutral-100"
              >
                அனைத்தும் (Select All)
              </button>
              <button
                type="button"
                onClick={handleClearAll}
                className="text-xs font-bold text-neutral-500 hover:underline px-2 py-1 rounded bg-neutral-100"
              >
                நீக்கு (Clear)
              </button>
            </div>
          </div>

          {/* Wards Selector Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[280px] overflow-y-auto pr-1">
            {Array.from({ length: 15 }, (_, i) => i + 1).map((wNum) => {
              const isSelected = selectedWards.includes(wNum);
              const wardMeta = WARD_COORDINATES[wNum];

              return (
                <div
                  key={wNum}
                  onClick={() => toggleWard(wNum)}
                  className={`p-3 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-3 ${
                    isSelected
                      ? 'bg-gradient-to-r from-[#fffdf0] to-white border-[#4a0000] shadow-xs'
                      : 'bg-white border-neutral-200 hover:border-neutral-300 opacity-75'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${
                    isSelected ? 'bg-[#4a0000] border-[#4a0000] text-[#ffcc00]' : 'border-neutral-300 bg-neutral-50'
                  }`}>
                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className={`text-xs font-black ${isSelected ? 'text-[#4a0000]' : 'text-neutral-700'}`}>
                        வார்டு {wNum}
                      </span>
                      {isSelected && (
                        <span className="text-[10px] bg-[#ffcc00] text-[#4a0000] font-black px-1.5 py-0.2 rounded">
                          சந்தாவில்
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-neutral-500 truncate mt-0.5">
                      {wardMeta?.name || `அச்சரப்பாக்கம் பகுதி ${wNum}`}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Success Banner */}
          {savedSuccess && (
            <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 p-3 rounded-xl text-xs font-bold flex items-center gap-2 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>உங்கள் வார்டு சந்தா விருப்பங்கள் வெற்றிகரமாகச் சேமிக்கப்பட்டன!</span>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-neutral-50 border-t border-neutral-200 flex items-center justify-between">
          <button
            type="button"
            onClick={handleCancel}
            className="px-5 py-2.5 bg-neutral-100 hover:bg-neutral-200 active:bg-neutral-300 text-neutral-800 font-bold border border-neutral-300 rounded-xl text-xs sm:text-sm transition-all cursor-pointer shadow-xs"
          >
            மூடுக (Close)
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="px-6 py-2.5 bg-[#4a0000] hover:bg-[#380000] text-[#ffcc00] font-black rounded-xl text-xs shadow-md transition-all flex items-center gap-2 active:scale-95"
          >
            <Bell className="w-4 h-4 fill-current" />
            <span>சந்தா விருப்பங்களைச் சேமி (Save Preferences)</span>
          </button>
        </div>

      </div>
    </div>
  );
};
