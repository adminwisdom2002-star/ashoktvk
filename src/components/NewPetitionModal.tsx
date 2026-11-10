import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Sparkles, Upload, AlertCircle, CheckCircle2, Save, Trash2, Mic, MicOff, Volume2, Square, RefreshCw, Radio, Camera, Image as ImageIcon, Plus, Eye } from 'lucide-react';
import { getIssueCategoryLabel, ISSUE_CATEGORIES, IssueCategory, WardInfo } from '../types';

interface NewPetitionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitPetition: (petitionData: any) => void;
  wards: WardInfo[];
  prefilledDraft?: string;
  prefilledTitle?: string;
  prefilledWardNo?: number;
  prefilledCategory?: string;
}

const MODAL_DRAFT_KEY = 'tvk_modal_petition_draft';

export const NewPetitionModal: React.FC<NewPetitionModalProps> = ({
  isOpen,
  onClose,
  onSubmitPetition,
  wards,
  prefilledDraft = '',
  prefilledTitle = '',
  prefilledWardNo = 2,
  prefilledCategory = 'water'
}) => {
  if (!isOpen) return null;

  // Read saved user profile from localStorage if present
  const savedProfile = React.useMemo(() => {
    try {
      const raw = localStorage.getItem('tvk_user_profile');
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }, []);

  // Read saved modal draft from localStorage if present
  const savedModalDraft = React.useMemo(() => {
    try {
      const raw = localStorage.getItem(MODAL_DRAFT_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }, []);

  const [citizenName, setCitizenName] = useState(savedProfile?.name || savedModalDraft?.citizenName || '');
  const [phone, setPhone] = useState(savedProfile?.phone || savedModalDraft?.phone || '');
  const [wardNo, setWardNo] = useState<number>(prefilledWardNo || savedModalDraft?.wardNo || savedProfile?.wardNo || 2);
  const [avatarUrl, setAvatarUrl] = useState(savedProfile?.avatarUrl || '');
  const [streetName, setStreetName] = useState(savedModalDraft?.streetName || '');
  const [category, setCategory] = useState<IssueCategory>((prefilledCategory as IssueCategory) || savedModalDraft?.category || 'water');
  const [title, setTitle] = useState(prefilledTitle || savedModalDraft?.title || '');
  const [description, setDescription] = useState(savedModalDraft?.description || '');
  const [formalDraft, setFormalDraft] = useState(prefilledDraft || savedModalDraft?.formalDraft || '');
  const [imageUrl, setImageUrl] = useState(savedModalDraft?.imageUrl || '');
  const [photos, setPhotos] = useState<string[]>(() => {
    if (savedModalDraft?.images && Array.isArray(savedModalDraft.images)) {
      return savedModalDraft.images;
    }
    if (savedModalDraft?.imageUrl) {
      return [savedModalDraft.imageUrl];
    }
    return [];
  });

  // Camera & Photo evidence states
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);

  // Voice recording & AI conversion states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [isProcessingVoiceAi, setIsProcessingVoiceAi] = useState(false);
  const [voiceSuccessMsg, setVoiceSuccessMsg] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const timerIntervalRef = useRef<any>(null);

  const selectedWardObj = wards.find(w => w.wardNo === wardNo);

  // Cleanup speech recognition, camera, and timers on unmount or close
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // ignore
        }
      }
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Camera Handlers
  const startCamera = async () => {
    setCameraError(null);
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError("உங்கள் உலாவியில் நேரடி கேமரா ஆதரவு இல்லை. கோப்பு பதிவேற்றம் வழியாக படத்தைச் சேர்க்கலாம்.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false
      });
      streamRef.current = stream;
      setIsCameraActive(true);
    } catch (err) {
      console.warn("Camera permission or stream error:", err);
      setCameraError("கேமரா அனுமதி மறுக்கப்பட்டது அல்லது கிடைக்கவில்லை. கோப்பு பதிவேற்றம் பொத்தானைப் பயன்படுத்தவும்.");
      setIsCameraActive(false);
    }
  };

  useEffect(() => {
    if (isCameraActive && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [isCameraActive]);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const capturePhotoFromCamera = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 800;
    canvas.height = video.videoHeight || 600;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const photoDataUrl = canvas.toDataURL('image/jpeg', 0.82);
      setPhotos(prev => [...prev, photoDataUrl]);
      stopCamera();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file: File) => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setPhotos(prev => [...prev, event.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
    if (e.target) {
      e.target.value = '';
    }
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  // Voice Recording Toggle Handler
  const startVoiceRecording = () => {
    setErrorMsg(null);
    setVoiceSuccessMsg(null);

    const SpeechAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechAPI) {
      try {
        const recognition = new SpeechAPI();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'ta-IN'; // Tamil language recognition

        recognition.onstart = () => {
          setIsRecording(true);
          setRecordingSeconds(0);
          setVoiceTranscript('');

          timerIntervalRef.current = setInterval(() => {
            setRecordingSeconds(prev => prev + 1);
          }, 1000);
        };

        recognition.onresult = (event: any) => {
          let currentTrans = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            currentTrans += event.results[i][0].transcript;
          }
          if (currentTrans.trim()) {
            setVoiceTranscript(currentTrans);
            // Append or update description field live
            setDescription(prev => {
              if (!prev.trim()) return currentTrans;
              // Avoid repeating if interim
              return currentTrans;
            });
          }
        };

        recognition.onerror = (err: any) => {
          console.warn("Speech recognition error:", err);
          stopVoiceRecording(true);
        };

        recognition.onend = () => {
          setIsRecording(false);
          if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
          }
        };

        recognitionRef.current = recognition;
        recognition.start();
      } catch (e) {
        console.warn("Error starting speech recognition, fallback to timer mode", e);
        startFallbackVoiceRecording();
      }
    } else {
      startFallbackVoiceRecording();
    }
  };

  const startFallbackVoiceRecording = () => {
    setIsRecording(true);
    setRecordingSeconds(0);
    setVoiceTranscript('');

    timerIntervalRef.current = setInterval(() => {
      setRecordingSeconds(prev => prev + 1);
    }, 1000);
  };

  const stopVoiceRecording = async (isError: boolean = false) => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.warn("Error stopping speech recognition", e);
      }
    }

    setIsRecording(false);

    if (isError) {
      setErrorMsg("குரல் உணர்வியில் பிழை ஏற்பட்டது. தயவுசெய்து புகாரை தட்டச்சு செய்யவும்.");
      return;
    }

    const finalSpeakerText = voiceTranscript.trim() || description.trim();

    if (!finalSpeakerText) {
      setErrorMsg("குரல் பதிவு எதுவும் கண்டறியப்படவில்லை. பேசத் தொடங்கி மீண்டும் முயற்சிக்கவும்.");
      return;
    }

    // Convert recorded voice text to Formal Petition Template via AI
    setIsProcessingVoiceAi(true);
    try {
      const res = await fetch('/api/generate-draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userPrompt: finalSpeakerText,
          wardNo,
          category,
          citizenName: citizenName || 'மனுதாரர்',
          streetName
        })
      });

      const data = await res.json();
      if (res.ok && data.draft) {
        setFormalDraft(data.draft);
        if (!title.trim()) {
          setTitle(`வார்டு ${wardNo} ${getIssueCategoryLabel(category)} குறித்த மனு`);
        }
        setVoiceSuccessMsg('✨ குரல் பதிவு வெற்றி! AI மூலம் உங்கள் புகார் அரசு மனுவாக மாற்றப்பட்டது.');
      } else {
        setErrorMsg('AI மனு உருவாக்குவதில் பிழைப்பட்டது.');
      }
    } catch (err) {
      console.error("AI Voice processing error", err);
      // Fallback local template formatting
      const localTemplate = `அனுப்புநர்:\n${citizenName || 'பொதுமக்கள்'},\n${streetName || 'அச்சரப்பாக்கம்'}, வார்டு ${wardNo},\nஅச்சரப்பாக்கம் பேரூராட்சி.\n\nபெறுநர்:\nஉயர்திரு. செயல் அலுவலர் அவர்கள்,\nபேரூராட்சி அலுவலகம், அச்சரப்பாக்கம்.\n\nபொருள்: ${getIssueCategoryLabel(category)} தொடர்பான அவசரக் கோரிக்கை மனு.\n\nஐயா/அம்மா,\nவணக்கம். குரல் பதிவு மூலம் பெறப்பட்ட பொதுமக்கள் கோரிக்கை:\n"${finalSpeakerText}"\n\nமேற்கண்ட பிரச்சனை குறித்து நேரில் ஆய்வு செய்து நடவடிக்கை எடுக்க வேண்டுமாய் தாழ்மையுடன் கேட்டுக்கொள்கிறோம்.\n\nநன்றி!`;
      setFormalDraft(localTemplate);
      setVoiceSuccessMsg('✨ குரல் பதிவு பெறப்பட்டு அரசு மனு வடிவமாக மாற்றப்பட்டது.');
    } finally {
      setIsProcessingVoiceAi(false);
    }
  };

  // Autosave modal draft
  useEffect(() => {
    if (title.trim() || description.trim() || formalDraft.trim() || photos.length > 0) {
      const now = new Date();
      const draftData = {
        citizenName,
        phone,
        wardNo,
        streetName,
        category,
        title,
        description,
        formalDraft,
        imageUrl: photos[0] || imageUrl,
        images: photos,
        savedAt: now.toISOString()
      };
      try {
        localStorage.setItem(MODAL_DRAFT_KEY, JSON.stringify(draftData));
        setLastSavedTime(now.toLocaleTimeString('ta-IN', { hour: '2-digit', minute: '2-digit' }));
      } catch (e) {
        console.warn("Error autosaving modal draft", e);
      }
    }
  }, [citizenName, phone, wardNo, streetName, category, title, description, formalDraft, imageUrl, photos]);

  const handleClearModalDraft = () => {
    setTitle('');
    setDescription('');
    setFormalDraft('');
    setStreetName('');
    setImageUrl('');
    setPhotos([]);
    stopCamera();
    setLastSavedTime(null);
    try {
      localStorage.removeItem(MODAL_DRAFT_KEY);
    } catch (e) {
      console.warn("Error clearing modal draft", e);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!citizenName.trim() || !phone.trim() || !title.trim() || !description.trim()) {
      setErrorMsg('தயவுசெய்து நட்சத்திரக் குறிமிட்ட (*) அனைத்து விவரங்களையும் பூர்த்தி செய்யவும்');
      return;
    }

    if (phone.replace(/\D/g, '').length < 10) {
      setErrorMsg('சரியான 10 இலக்க கைபேசி எண்ணை உள்ளிடவும்');
      return;
    }

    setErrorMsg(null);
    setIsSubmitting(true);

    // Save profile for future prefilling
    try {
      localStorage.setItem('tvk_user_profile', JSON.stringify({
        name: citizenName.trim(),
        phone: phone.trim(),
        wardNo,
        avatarUrl
      }));
      localStorage.removeItem(MODAL_DRAFT_KEY);
    } catch (e) {
      console.warn("Error saving profile or clearing draft", e);
    }

    onSubmitPetition({
      citizenName: citizenName.trim(),
      phone: phone.trim(),
      wardNo,
      avatarUrl: avatarUrl || undefined,
      streetName: streetName.trim() || selectedWardObj?.keyStreets[0] || `வார்டு ${wardNo}`,
      category,
      title,
      description,
      formalDraft: formalDraft.trim() || undefined,
      imageUrl: photos[0] || imageUrl || undefined,
      images: photos.length > 0 ? photos : (imageUrl ? [imageUrl] : undefined)
    });

    setIsSubmitting(false);
  };

  const handleCancel = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    onClose();
  };

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

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
      <div className="bg-white border border-neutral-200 rounded-xl max-w-2xl w-full my-8 overflow-hidden shadow-xl relative animate-fadeIn max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="bg-[#4a0000] p-5 border-b-2 border-[#ffcc00] flex items-center justify-between sticky top-0 z-10 text-white">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-extrabold text-white flex items-center gap-2">
                📋 புதிய குறைதீர்ப்பு மனுப் படிவம்
              </h3>
            </div>
            <p className="text-xs text-neutral-200">
              அச்சரப்பாக்கம் பேரூராட்சி மக்களுக்கான அதிகாரப்பூர்வ மனு தாக்கல் முகப்பு
            </p>
          </div>

          <div className="flex items-center gap-2">
            {lastSavedTime && (
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] bg-emerald-950/80 text-emerald-300 px-2.5 py-1 rounded border border-emerald-800 font-medium">
                <Save className="w-3 h-3 text-emerald-400 animate-pulse" />
                <span>சேமிக்கப்பட்டது ({lastSavedTime})</span>
              </span>
            )}

            {(title.trim() || description.trim() || formalDraft.trim()) && (
              <button
                type="button"
                onClick={handleClearModalDraft}
                className="p-1.5 bg-[#330000] text-neutral-300 hover:bg-red-900 hover:text-white rounded-lg transition-all cursor-pointer text-xs flex items-center gap-1"
                title="வரைவை அழி"
              >
                <Trash2 className="w-4 h-4" />
                <span className="hidden sm:inline">வரைவை நீக்கு</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleCancel}
              className="p-1.5 bg-[#330000] text-neutral-200 hover:bg-[#ffcc00] hover:text-[#4a0000] rounded-lg transition-all cursor-pointer"
              title="மூடுக (Close)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-sm text-neutral-800">
          
          {errorMsg && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-xs font-medium">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Name & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">
                முழு பெயர் <span className="text-red-500">*</span>:
              </label>
              <input
                type="text"
                required
                value={citizenName}
                onChange={(e) => setCitizenName(e.target.value)}
                placeholder="உங்கள் பெயரை உள்ளிடவும்"
                className="w-full bg-neutral-50 text-neutral-900 border border-neutral-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#4a0000]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">
                கைபேசி எண் <span className="text-red-500">*</span>:
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="94459XXXXX"
                className="w-full bg-neutral-50 text-neutral-900 border border-neutral-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#4a0000]"
              />
            </div>
          </div>

          {/* Ward & Street */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">
                வார்டு எண் (1 - 15) <span className="text-red-500">*</span>:
              </label>
              <select
                required
                value={wardNo}
                onChange={(e) => setWardNo(Number(e.target.value))}
                className="w-full bg-neutral-50 text-neutral-900 border border-neutral-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#4a0000]"
              >
                {wards.map((w) => (
                  <option key={w.wardNo} value={w.wardNo}>
                    வார்டு எண் {w.wardNo} - {w.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">
                தெரு / நகரின் பெயர்:
              </label>
              <input
                type="text"
                value={streetName}
                onChange={(e) => setStreetName(e.target.value)}
                list={`ward-streets-${wardNo}`}
                placeholder={selectedWardObj?.keyStreets[0] || "எ.கா. தேரடி வீதி"}
                className="w-full bg-neutral-50 text-neutral-900 border border-neutral-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#4a0000]"
              />
              <datalist id={`ward-streets-${wardNo}`}>
                {selectedWardObj?.keyStreets.map((street) => (
                  <option key={street} value={street} />
                ))}
              </datalist>
            </div>
          </div>

          {/* Issue Category */}
          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1">
              பிரச்சினையின் வகை <span className="text-red-500">*</span>:
            </label>
            <select
              required
              value={category}
              onChange={(e) => setCategory(e.target.value as IssueCategory)}
              className="w-full bg-neutral-50 text-neutral-900 border border-neutral-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#4a0000]"
            >
              {ISSUE_CATEGORIES.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1">
              மனுவின் சுருக்கமான தலைப்பு <span className="text-red-500">*</span>:
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="எ.கா. வார்டு 2 தேரடி வீதியில் 4 நாட்களாக குடிநீர் விநியோகம் தடை"
              className="w-full bg-neutral-50 text-neutral-900 border border-neutral-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#4a0000]"
            />
          </div>

          {/* Voice Input Assistance Card Banner */}
          <div className="bg-gradient-to-r from-[#fffbeb] to-amber-50 border border-amber-200 rounded-xl p-4 shadow-2xs">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all ${
                  isRecording 
                    ? 'bg-red-600 text-white animate-pulse shadow-md' 
                    : 'bg-[#4a0000] text-[#ffcc00]'
                }`}>
                  {isRecording ? <Mic className="w-5 h-5 animate-bounce" /> : <Volume2 className="w-5 h-5" />}
                </div>

                <div>
                  <h4 className="text-xs sm:text-sm font-extrabold text-[#4a0000] flex items-center gap-1.5">
                    <span>🎙️ குரல் மூலம் மனு கூற (Speak Your Petition)</span>
                    <span className="text-[10px] bg-amber-200 text-amber-900 font-bold px-2 py-0.5 rounded-full">
                      AI Powered
                    </span>
                  </h4>
                  <p className="text-[11px] text-amber-900 mt-0.5">
                    எழுதத் தெரியாவிட்டாலும் பரவாயில்லை! மைக் பொத்தானை அழுத்தி பேசினால் AI தானாக அரசு மனுவாக்கும்.
                  </p>
                </div>
              </div>

              <div className="w-full sm:w-auto flex items-center gap-2">
                {!isRecording ? (
                  <button
                    type="button"
                    onClick={startVoiceRecording}
                    disabled={isProcessingVoiceAi}
                    className="w-full sm:w-auto px-4 py-2 bg-[#4a0000] hover:bg-[#380000] active:scale-95 text-[#ffcc00] font-black text-xs rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer border border-[#ffcc00]/40"
                  >
                    <Mic className="w-4 h-4 text-[#ffcc00]" />
                    <span>குரல் பதிவு தொடங்கு (Record Voice)</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => stopVoiceRecording(false)}
                    className="w-full sm:w-auto px-4 py-2 bg-red-600 hover:bg-red-700 active:scale-95 text-white font-extrabold text-xs rounded-lg shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer animate-pulse"
                  >
                    <Square className="w-4 h-4 text-white fill-white" />
                    <span>நிறுத்து & மனுவாக்கு (Stop & AI Format)</span>
                  </button>
                )}
              </div>
            </div>

            {/* Active Recording Wave Status Bar */}
            {isRecording && (
              <div className="mt-3 pt-3 border-t border-amber-200/80 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-red-900 bg-red-50 p-2.5 rounded-lg border border-red-200 animate-fadeIn">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping shrink-0" />
                  <span className="font-extrabold text-red-700">
                    🔴 குரல் பதிவாகிறது... ({recordingSeconds}s) - உங்கள் புகாரைப் பேசுங்கள்!
                  </span>
                </div>

                {voiceTranscript && (
                  <p className="text-[11px] italic font-serif text-neutral-800 bg-white px-2 py-1 rounded border border-neutral-200 max-w-xs truncate">
                    "{voiceTranscript}"
                  </p>
                )}
              </div>
            )}

            {/* Processing State */}
            {isProcessingVoiceAi && (
              <div className="mt-3 pt-2.5 flex items-center justify-center gap-2 text-xs text-[#4a0000] font-bold bg-amber-100 p-2 rounded-lg border border-amber-300">
                <RefreshCw className="w-4 h-4 animate-spin text-[#4a0000]" />
                <span>AI உங்கள் குரல் பதிவை ஆய்வு செய்து அரசு மனுவாக மாற்றுகிறது...</span>
              </div>
            )}

            {/* Success Toast Banner */}
            {voiceSuccessMsg && (
              <div className="mt-3 p-2.5 bg-emerald-50 border border-emerald-300 rounded-lg text-xs font-bold text-emerald-800 flex items-center justify-between gap-2 animate-fadeIn">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{voiceSuccessMsg}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setVoiceSuccessMsg(null)}
                  className="text-emerald-700 hover:text-emerald-950 text-[10px] underline cursor-pointer"
                >
                  சரி
                </button>
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-neutral-700">
                பிரச்சினையின் விரிவான விவரம் <span className="text-red-500">*</span>:
              </label>

              <button
                type="button"
                onClick={isRecording ? () => stopVoiceRecording(false) : startVoiceRecording}
                className={`text-[11px] font-bold px-2 py-0.5 rounded flex items-center gap-1 transition-all cursor-pointer ${
                  isRecording
                    ? 'bg-red-100 text-red-800 border border-red-300 animate-pulse'
                    : 'bg-neutral-100 text-neutral-700 hover:bg-[#4a0000] hover:text-[#ffcc00]'
                }`}
              >
                <Mic className="w-3 h-3" />
                <span>{isRecording ? 'பதிவை நிறுத்து' : 'குரல் மூலம் பேசு'}</span>
              </button>
            </div>

            <textarea
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="இங்கு உங்கள் புகாரை விரிவாக எழுதவும் அல்லது மேலே உள்ள மைக் பொத்தானை அழுத்தி பேசவும்..."
              className="w-full bg-neutral-50 text-neutral-900 border border-neutral-200 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-[#4a0000]"
            />
          </div>

          {/* Photo Evidence / Camera Section */}
          <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-4 space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div>
                <label className="block text-xs font-bold text-[#4a0000] flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-[#4a0000]" />
                  <span>புகைப்பட ஆதாரம் / Photo Evidence (விருப்பப்பட்டால்):</span>
                </label>
                <p className="text-[11px] text-neutral-600 mt-0.5">
                  பிரச்சினையின் நேரடிப் புகைப்படத்தை கேமரா மூலமாகப் பிடிக்கவும் அல்லது கேலரியில் இருந்து பதிவேற்றவும்.
                </p>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                {!isCameraActive ? (
                  <button
                    type="button"
                    onClick={startCamera}
                    className="flex-1 sm:flex-none px-3 py-1.5 bg-[#4a0000] hover:bg-[#380000] text-[#ffcc00] font-extrabold text-xs rounded-lg shadow-2xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>கேமரா இயக்கு</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={stopCamera}
                    className="flex-1 sm:flex-none px-3 py-1.5 bg-neutral-700 hover:bg-neutral-800 text-white font-extrabold text-xs rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>கேமராவை மூடு</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 sm:flex-none px-3 py-1.5 bg-white hover:bg-neutral-100 text-neutral-800 border border-neutral-300 font-extrabold text-xs rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Upload className="w-3.5 h-3.5 text-neutral-600" />
                  <span>கோப்பு / கேலரி</span>
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  capture="environment"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            </div>

            {/* Camera Viewport Container */}
            {isCameraActive && (
              <div className="relative bg-black rounded-lg overflow-hidden border-2 border-[#ffcc00] shadow-md animate-fadeIn">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-56 sm:h-64 object-cover"
                />
                <div className="absolute bottom-3 inset-x-0 flex items-center justify-center gap-3 bg-gradient-to-t from-black/80 to-transparent p-3">
                  <button
                    type="button"
                    onClick={capturePhotoFromCamera}
                    className="px-5 py-2 bg-[#ffcc00] hover:bg-[#ffb700] text-[#4a0000] font-black text-xs sm:text-sm rounded-full shadow-lg transition-all flex items-center gap-2 cursor-pointer active:scale-95"
                  >
                    <Camera className="w-4 h-4 fill-current" />
                    <span>புகைப்படம் பிடி (Capture Snapshot)</span>
                  </button>

                  <button
                    type="button"
                    onClick={stopCamera}
                    className="px-3 py-2 bg-neutral-800/80 hover:bg-neutral-900 text-white font-bold text-xs rounded-full cursor-pointer"
                  >
                    ரத்து
                  </button>
                </div>
              </div>
            )}

            {cameraError && (
              <p className="text-xs text-amber-800 bg-amber-50 p-2 rounded border border-amber-200">
                ⚠️ {cameraError}
              </p>
            )}

            {/* Photo Evidence Thumbnails Grid */}
            {photos.length > 0 && (
              <div className="pt-2">
                <span className="text-[11px] font-bold text-neutral-700 block mb-1.5">
                  இணைக்கப்பட்ட புகைப்பட ஆதாரங்கள் ({photos.length}):
                </span>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {photos.map((photo, idx) => (
                    <div key={idx} className="relative group rounded-lg overflow-hidden border border-neutral-300 aspect-video bg-neutral-900 shadow-2xs">
                      <img
                        src={photo}
                        alt={`Photo Evidence ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(idx)}
                        className="absolute top-1 right-1 p-1 bg-red-600/90 text-white rounded-full hover:bg-red-700 transition-all cursor-pointer shadow-md"
                        title="புகைப்படத்தை நீக்கு"
                      >
                        <X className="w-3 h-3" />
                      </button>
                      <span className="absolute bottom-1 left-1 bg-black/70 text-white text-[9px] px-1.5 py-0.5 rounded font-mono">
                        #{idx + 1}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Formal Draft prefill if available */}
          {formalDraft && (
            <div>
              <label className="block text-xs font-bold text-emerald-800 mb-1 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>இணைக்கப்பட்டுள்ள AI அரசு வடிவ மனு:</span>
              </label>
              <textarea
                rows={3}
                value={formalDraft}
                onChange={(e) => setFormalDraft(e.target.value)}
                className="w-full bg-neutral-50 text-neutral-800 border border-neutral-200 rounded-md p-3 text-xs font-mono"
              />
            </div>
          )}

          {/* Submit & Cancel Actions */}
          <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 mt-6 pt-3 border-t border-neutral-100">
            <button
              type="button"
              onClick={handleCancel}
              className="w-full sm:w-auto px-5 py-2.5 bg-neutral-100 hover:bg-neutral-200 active:bg-neutral-300 text-neutral-800 font-bold border border-neutral-300 rounded-lg text-xs sm:text-sm transition-all cursor-pointer"
            >
              ரத்து (Cancel)
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto flex-1 py-2.5 bg-[#ffcc00] hover:bg-[#ffb700] active:scale-[0.99] text-[#4a0000] font-extrabold text-xs sm:text-sm rounded-lg shadow-sm transition-all flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span>மனுவைச் சமர்ப்பிக்கவும் (Submit Petition)</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
