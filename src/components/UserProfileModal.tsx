import React, { useState, useRef, useEffect } from 'react';
import { User, Phone, MapPin, Camera, Upload, X, Check, Sparkles, ShieldCheck, RefreshCw, Trash2 } from 'lucide-react';
import { UserProfile } from '../types';
import { useToast } from './ToastContainer';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  onSaveProfile: (updatedProfile: UserProfile) => void;
}

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200'
];

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  profile,
  onSaveProfile
}) => {
  const [name, setName] = useState(profile.name || '');
  const [phone, setPhone] = useState(profile.phone || '');
  const [wardNo, setWardNo] = useState<number>(profile.wardNo || 1);
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl || '');

  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { addToast } = useToast();

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const startCamera = async () => {
    setIsCameraActive(true);
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setIsCameraActive(false);
      addToast({
        type: 'warning',
        title: 'கேமரா வசதி இல்லை',
        message: 'உங்கள் சாதனத்தில் கேமரா வசதி கண்டறியப்படவில்லை. புகைப்படத்தைப் பதிவேற்றவும்.'
      });
      return;
    }

    try {
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { width: { ideal: 400 }, height: { ideal: 400 }, facingMode: 'user' } 
        });
      } catch {
        // Fallback to simple unconstrained video
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
      }

      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      console.warn("Camera access error:", err);
      setIsCameraActive(false);
      const isNotFound = err?.name === 'NotFoundError' || err?.message?.includes('not found');
      addToast({
        type: 'warning',
        title: isNotFound ? 'கேமரா கண்டறியப்படவில்லை' : 'கேமரா அனுமதி தேவை',
        message: isNotFound 
          ? 'உங்கள் சாதனத்தில் கேமரா இணைக்கப்படவில்லை. புகைப்படத்தைப் பதிவேற்றம் செய்யலாம்.'
          : 'கேமராவைப் பயன்படுத்த உலாவியில் அனுமதி அளிக்கவும் அல்லது புகைப்படத்தைப் பதிவேற்றவும்.'
      });
    }
  };

  useEffect(() => {
    setName(profile.name || '');
    setPhone(profile.phone || '');
    setWardNo(profile.wardNo || 1);
    setAvatarUrl(profile.avatarUrl || '');
  }, [profile, isOpen]);

  // Clean up media stream on unmount or close
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const captureCameraPhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = 300;
    canvas.height = 300;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, 300, 300);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setAvatarUrl(dataUrl);
      stopCamera();
      addToast({
        type: 'success',
        title: 'புகைப்படம் எடுக்கப்பட்டது! 📸',
        message: 'உங்கள் சுயவிவரப் படம் கேமராவிலிருந்து பெறப்பட்டது.'
      });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        addToast({
          type: 'warning',
          title: 'கோப்பு பெரிதாக உள்ளது',
          message: '5MB-க்கு உட்பட்ட புகைப்படத்தைத் தேர்ந்தெடுக்கவும்.'
        });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setAvatarUrl(reader.result);
          addToast({
            type: 'success',
            title: 'புகைப்படம் பதிவேற்றப்பட்டது! 🖼️',
            message: 'உங்கள் புதிய சுயவிவரப் படம் சேமிக்கப்பட்டது.'
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setAvatarUrl('');
    addToast({
      type: 'info',
      title: 'புகைப்படம் அகற்றப்பட்டது',
      message: 'உங்கள் சுயவிவரப் படம் நீக்கப்பட்டது. மாற்றங்களைச் சேமிக்க "சுயவிவரம் சேமி" அழுத்தவும்.'
    });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      addToast({
        type: 'warning',
        title: 'பெயர் தேவை',
        message: 'தயவுசெய்து உங்கள் பெயரை உள்ளிடவும்.'
      });
      return;
    }

    const updated: UserProfile = {
      name: name.trim(),
      phone: phone.trim(),
      wardNo,
      avatarUrl
    };

    onSaveProfile(updated);
    addToast({
      type: 'success',
      title: 'சுயவிவரம் சேமிக்கப்பட்டது! 👤',
      message: 'உங்கள் பெயர் மற்றும் புகைப்படம் இனி உங்கள் மனுக்களில் தோன்றும்.'
    });
    onClose();
  };

  const handleCancel = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    stopCamera();
    onClose();
  };

  // Listen for Escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleCancel(e);
        }
      }}
    >
      <div className="bg-white border border-neutral-200 rounded-2xl max-w-lg w-full my-8 overflow-hidden shadow-2xl relative animate-fadeIn">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-[#4a0000] to-[#380000] text-white p-5 border-b-4 border-[#ffcc00] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#ffcc00] text-[#4a0000] flex items-center justify-center font-black shadow-md">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black tracking-tight">
                குடிமக்கள் சுயவிவர மாற்றம் (Edit Profile)
              </h3>
              <p className="text-xs text-neutral-200">
                மனுக்களில் தோன்றும் உங்கள் பெயர் மற்றும் புகைப்படத்தை மாற்றவும்
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

        {/* Modal Form */}
        <form onSubmit={handleSave} className="p-6 space-y-6">
          
          {/* Avatar Section */}
          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="relative group">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={name || 'Citizen'}
                  className="w-24 h-24 rounded-full object-cover border-4 border-[#ffcc00] shadow-md"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#4a0000] to-[#2b0000] text-[#ffcc00] font-black text-3xl flex items-center justify-center border-4 border-[#ffcc00] shadow-md">
                  {name ? name.charAt(0).toUpperCase() : 'ம'}
                </div>
              )}

              {avatarUrl && (
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="absolute -top-1 -right-1 z-10 bg-red-600 text-white p-1.5 rounded-full shadow-md hover:bg-red-700 active:scale-95 transition-all cursor-pointer flex items-center justify-center border-2 border-white"
                  title="புகைப்படத்தை நீக்கு (Remove Photo)"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Photo Capture or Upload Buttons */}
            {!isCameraActive ? (
              <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={startCamera}
                  className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 border border-neutral-300 cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5 text-[#4a0000]" />
                  <span>கேமரா படம் எடுக்க (Take Photo)</span>
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 border border-neutral-300 cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5 text-[#4a0000]" />
                  <span>புகைப்படம் பதிவேற்ற (Upload)</span>
                </button>

                {avatarUrl && (
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 border border-red-200 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-600" />
                    <span>புகைப்படத்தை அகற்று (Remove Photo)</span>
                  </button>
                )}

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*"
                  className="hidden"
                />
              </div>
            ) : (
              /* Live Camera Stream Viewer */
              <div className="w-full max-w-xs bg-black rounded-xl p-2 relative text-center">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-48 object-cover rounded-lg border border-neutral-700"
                />
                <div className="flex items-center justify-center gap-2 mt-2">
                  <button
                    type="button"
                    onClick={captureCameraPhoto}
                    className="px-4 py-1.5 bg-[#ffcc00] hover:bg-[#ffb700] text-[#4a0000] rounded-lg text-xs font-black flex items-center gap-1 shadow"
                  >
                    <Camera className="w-4 h-4" />
                    <span>படம் எடு (Capture)</span>
                  </button>
                  <button
                    type="button"
                    onClick={stopCamera}
                    className="px-3 py-1.5 bg-neutral-800 text-white rounded-lg text-xs font-bold hover:bg-neutral-700"
                  >
                    ரத்து
                  </button>
                </div>
              </div>
            )}

            {/* Quick Sample Preset Avatars */}
            <div>
              <span className="text-[11px] text-neutral-500 font-bold block mb-1 text-center">
                மாதிரி அவதாரங்களைத் தேர்ந்தெடுக்கலாம்:
              </span>
              <div className="flex items-center justify-center gap-2">
                {PRESET_AVATARS.map((url, idx) => (
                  <img
                    key={idx}
                    src={url}
                    alt={`Preset ${idx + 1}`}
                    onClick={() => setAvatarUrl(url)}
                    className="w-8 h-8 rounded-full object-cover border border-neutral-300 hover:border-[#4a0000] cursor-pointer transition-all hover:scale-105"
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-4 pt-2 border-t border-neutral-100">
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">
                மனுதாரர் பெயர் (Display Name) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="எ.கா: கார்த்திகேயன் M"
                  className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-bold text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#4a0000]"
                  required
                />
                <User className="w-4 h-4 text-neutral-400 absolute right-3.5 top-3" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  கைபேசி எண் (Phone Number)
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="98401 23456"
                    className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-bold text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#4a0000]"
                  />
                  <Phone className="w-4 h-4 text-neutral-400 absolute right-3.5 top-3" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  சொந்த வார்டு (Default Ward)
                </label>
                <div className="relative">
                  <select
                    value={wardNo}
                    onChange={(e) => setWardNo(Number(e.target.value))}
                    className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-bold text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#4a0000]"
                  >
                    {Array.from({ length: 15 }, (_, i) => i + 1).map(w => (
                      <option key={w} value={w}>வார்டு எண் {w}</option>
                    ))}
                  </select>
                  <MapPin className="w-4 h-4 text-neutral-400 absolute right-3.5 top-3 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-neutral-200 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleCancel}
              className="px-5 py-2.5 bg-neutral-100 hover:bg-neutral-200 active:bg-neutral-300 text-neutral-800 font-bold border border-neutral-300 rounded-xl text-xs sm:text-sm transition-all cursor-pointer shadow-xs"
            >
              ரத்து (Cancel)
            </button>

            <button
              type="submit"
              className="px-6 py-2.5 bg-[#4a0000] hover:bg-[#380000] text-[#ffcc00] font-black rounded-xl text-xs shadow-md transition-all flex items-center gap-2 active:scale-95"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>சுயவிவரம் சேமி (Save Profile)</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
