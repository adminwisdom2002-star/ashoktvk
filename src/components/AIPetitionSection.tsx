import React, { useState, useEffect } from 'react';
import { Sparkles, Copy, Check, Send, Printer, RefreshCw, AlertCircle, FileCheck, Save, Trash2, Clock, CheckCircle2, RotateCcw } from 'lucide-react';
import { ISSUE_CATEGORIES } from '../types';

interface AIPetitionSectionProps {
  onDirectSubmitDraft: (draftText: string, suggestedTitle: string, wardNo: number, category: string) => void;
  initialPrompt?: string;
}

const DRAFT_STORAGE_KEY = 'tvk_ai_petition_draft';

export const AIPetitionSection: React.FC<AIPetitionSectionProps> = ({
  onDirectSubmitDraft,
  initialPrompt = ''
}) => {
  // Load saved draft from localStorage on initial render if present
  const savedDraftData = React.useMemo(() => {
    try {
      const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (e) {
      console.warn("Failed to load saved petition draft", e);
    }
    return null;
  }, []);

  const [userPrompt, setUserPrompt] = useState<string>(() => {
    return savedDraftData?.userPrompt || initialPrompt;
  });
  const [wardNo, setWardNo] = useState<number>(() => {
    return savedDraftData?.wardNo || 2;
  });
  const [citizenName, setCitizenName] = useState<string>(() => {
    return savedDraftData?.citizenName || '';
  });
  const [streetName, setStreetName] = useState<string>(() => {
    return savedDraftData?.streetName || '';
  });
  const [category, setCategory] = useState<string>(() => {
    return savedDraftData?.category || 'water';
  });
  const [generatedDraft, setGeneratedDraft] = useState<string | null>(() => {
    return savedDraftData?.generatedDraft || null;
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(() => {
    if (savedDraftData?.savedAt) {
      return new Date(savedDraftData.savedAt).toLocaleTimeString('ta-IN', { hour: '2-digit', minute: '2-digit' });
    }
    return null;
  });
  const [isRestoredNotice, setIsRestoredNotice] = useState<boolean>(() => {
    return Boolean(savedDraftData && (savedDraftData.userPrompt || savedDraftData.generatedDraft));
  });

  // Autosave mechanism: updates localStorage whenever key fields change
  useEffect(() => {
    if (userPrompt.trim() || generatedDraft) {
      const now = new Date();
      const draftObj = {
        userPrompt,
        wardNo,
        citizenName,
        streetName,
        category,
        generatedDraft,
        savedAt: now.toISOString()
      };
      try {
        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draftObj));
        setLastSavedTime(now.toLocaleTimeString('ta-IN', { hour: '2-digit', minute: '2-digit' }));
      } catch (e) {
        console.warn("Autosave draft error", e);
      }
    } else {
      try {
        localStorage.removeItem(DRAFT_STORAGE_KEY);
        setLastSavedTime(null);
      } catch (e) {
        console.warn("Clear draft error", e);
      }
    }
  }, [userPrompt, wardNo, citizenName, streetName, category, generatedDraft]);

  const handleClearDraft = () => {
    setUserPrompt('');
    setGeneratedDraft(null);
    setCitizenName('');
    setStreetName('');
    setErrorMsg(null);
    setIsRestoredNotice(false);
    try {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
      setLastSavedTime(null);
    } catch (e) {
      console.warn("Clear draft error", e);
    }
  };

  const quickPrompts = [
    { label: "🚰 4 நாட்களாக குடிநீர் விநியோகம் இல்லை", text: "எங்கள் தெருவில்கடந்த 4 நாட்களாக பிரதான குடிநீர் விநியோகக் குழாயில் உடைப்பு ஏற்பட்டு தண்ணீர் வரவில்லை. பொதுமக்கள் மிகவும் சிரமப்படுகின்றனர்." },
    { label: "💡 தெருவிளக்கு எரியவில்லை", text: "எங்கள் வார்டில் 5 தெருவிளக்குகள் எரியாமல் இருட்டாக உள்ளது. இரவு நேரத்தில் பெண்கள் நடந்து செல்ல அச்சப்படுகின்றனர்." },
    { label: "🛣️ தார்ச்சாலையில் பெரிய பள்ளங்கள்", text: "பிரதான சாலையில் மழைநீரால் பெரிய பள்ளங்கள் உருவாகி இருசக்கர வாகன ஓட்டிகள் அடிக்கடி விழுந்து காயம் அடைகின்றனர். உடனடியாக தார்ச்சாலை போட வேண்டும்." },
    { label: "🧹 சாக்கடை அடைப்பு மற்றும் குப்பை", text: "சாக்கடை கால்வாயில் கழிவுநீர் தேங்கி நாற்றம் அடிக்கிறது. கொசுக்கள் உற்பத்தியாகியுள்ளன. குப்பைகளை உடனடியாக அள்ள வேண்டும்." }
  ];

  const handleGenerate = async () => {
    if (!userPrompt.trim()) {
      setErrorMsg("தயவுசெய்து உங்கள் புகாரை தட்டச்சு செய்யுங்கள்");
      return;
    }

    setErrorMsg(null);
    setIsLoading(true);
    setGeneratedDraft(null);

    try {
      const res = await fetch("/api/generate-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userPrompt,
          wardNo,
          category,
          citizenName: citizenName || 'மனுதாரர்',
          streetName
        })
      });

      const data = await res.json();
      if (res.ok && data.draft) {
        setGeneratedDraft(data.draft);
      } else {
        setErrorMsg(data.error || "மனு உருவாக்குவதில் பிழை ஏற்பட்டது.");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("இணைப்பு பிழைப்பட்டது. மீண்டும் முயற்சிக்கவும்.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!generatedDraft) return;
    navigator.clipboard.writeText(generatedDraft);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => {
    if (!generatedDraft) return;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>அரசு மனு மாதிரி - அச்சரப்பாக்கம் பேரூராட்சி</title>
            <style>
              body { font-family: 'Courier New', Courier, monospace; padding: 40px; line-height: 1.8; color: #000; }
              h2 { text-align: center; font-size: 20px; border-bottom: 2px solid #000; padding-bottom: 10px; }
              pre { white-space: pre-wrap; font-size: 15px; font-family: inherit; }
              .footer { margin-top: 50px; font-size: 12px; text-align: center; border-top: 1px solid #ccc; padding-top: 10px; }
            </style>
          </head>
          <body>
            <h2>அச்சரப்பாக்கம் பேரூராட்சி - அதிகாரப்பூர்வ மனு மாதிரி</h2>
            <pre>${generatedDraft}</pre>
            <div class="footer">அச்சரப்பாக்கம் மக்கள் குறைதீர்ப்பு மையம் (TVK) வழியாக உருவாக்கப்பட்டது</div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    }
  };

  return (
    <section id="aiAssistant" className="bg-white border border-neutral-200 rounded-xl p-6 sm:p-8 my-8 shadow-sm relative overflow-hidden">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-neutral-200 pb-4 mb-6 gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-[#4a0000]">
              AI மனு வடிவ உருவாக்குநர் (AI Assistant)
            </h3>
            <p className="text-xs sm:text-sm text-neutral-600 font-normal">
              உங்கள் குறையை சாதாரண தமிழில் தட்டச்சு செய்யுங்கள், AI அதனை அரசு அதிகாரப்பூர்வ மனு வடிவமாக மாற்றித் தரும்.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap self-end sm:self-auto">
          {lastSavedTime && (
            <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 text-[11px] px-2.5 py-1 rounded-md font-bold border border-emerald-200 shadow-2xs">
              <Save className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
              <span>தானாக சேமிக்கப்பட்டது ({lastSavedTime})</span>
            </span>
          )}

          {(userPrompt.trim() || generatedDraft) && (
            <button
              onClick={handleClearDraft}
              title="வரைவை நீக்கு"
              className="inline-flex items-center gap-1 text-[11px] bg-neutral-100 hover:bg-red-50 text-neutral-600 hover:text-red-700 px-2.5 py-1 rounded-md border border-neutral-200 hover:border-red-200 font-semibold transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>வரைவை நீக்கு</span>
            </button>
          )}

          <span className="hidden sm:inline-flex bg-emerald-100 text-emerald-800 text-[11px] px-2.5 py-1 rounded-md font-bold uppercase tracking-wider border border-emerald-200">
            ✨ AI Active
          </span>
        </div>
      </div>

      {/* Restored Draft Notice Banner */}
      {isRestoredNotice && (userPrompt.trim() || generatedDraft) && (
        <div className="mb-6 bg-blue-50/80 border border-blue-200 rounded-lg p-3.5 flex items-start sm:items-center justify-between gap-3 text-xs sm:text-sm text-blue-900 shadow-2xs">
          <div className="flex items-center gap-2">
            <RotateCcw className="w-4 h-4 text-blue-600 shrink-0" />
            <span>
              <strong>முந்தைய வரைவு மீட்டெடுக்கப்பட்டது:</strong> நீங்கள் எழுதிய செய்தி மற்றும் AI உரை பாதுகாப்பாக தானாக சேமிக்கப்பட்டுள்ளது (Autosaved).
            </span>
          </div>
          <button
            onClick={() => setIsRestoredNotice(false)}
            className="text-xs text-blue-700 hover:text-blue-900 font-bold underline shrink-0 px-1"
          >
            சரி
          </button>
        </div>
      )}

      {/* Quick Prompt Chips */}
      <div className="mb-6">
        <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider block mb-2">
          💡 மாதிரி புகார்கள் (மாதிரியைத் தேர்ந்தெடுக்க சொடுக்கவும்):
        </label>
        <div className="flex flex-wrap gap-2">
          {quickPrompts.map((qp, idx) => (
            <button
              key={idx}
              onClick={() => setUserPrompt(qp.text)}
              className="text-xs font-medium bg-neutral-50 hover:bg-neutral-100 text-neutral-800 border border-neutral-200 rounded-lg px-3 py-1.5 transition-all text-left shadow-2xs hover:border-neutral-300"
            >
              {qp.label}
            </button>
          ))}
        </div>
      </div>

      {/* Input Options Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        <div>
          <label className="block text-xs font-bold text-neutral-700 mb-1">வார்டு எண்:</label>
          <select
            value={wardNo}
            onChange={(e) => setWardNo(Number(e.target.value))}
            className="w-full bg-neutral-50 text-neutral-900 border border-neutral-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4a0000]"
          >
            {Array.from({ length: 15 }, (_, i) => i + 1).map((num) => (
              <option key={num} value={num}>வார்டு எண் {num}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-neutral-700 mb-1">பிரச்சினையின் வகை:</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full bg-neutral-50 text-neutral-900 border border-neutral-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4a0000]"
          >
            {ISSUE_CATEGORIES.map((item) => (
              <option key={item.value} value={item.value}>{item.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-neutral-700 mb-1">உங்கள் பெயர் (விருப்பப்பட்டால்):</label>
          <input
            type="text"
            value={citizenName}
            onChange={(e) => setCitizenName(e.target.value)}
            placeholder="எ.கா. அச்சுதன்"
            className="w-full bg-neutral-50 text-neutral-900 border border-neutral-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4a0000]"
          />
        </div>
      </div>

      {/* Casual Text Area */}
      <div className="mb-6">
        <label className="block text-xs font-bold text-neutral-700 mb-1">
          பிரச்சினையின் விரிவான விவரம் (சாதாரண தமிழில்):
        </label>
        <textarea
          rows={4}
          value={userPrompt}
          onChange={(e) => setUserPrompt(e.target.value)}
          placeholder="எ.கா: எங்க தெருவுல மூணு நாளா விளக்கு எரியல, சாக்கடை அடைச்சு தெருவுல தண்ணி ஓடுது..."
          className="w-full bg-neutral-50 text-neutral-900 border border-neutral-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#4a0000] placeholder-neutral-400 font-sans"
        />
      </div>

      {errorMsg && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm font-medium">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Generate Button */}
      <button
        onClick={handleGenerate}
        disabled={isLoading}
        className="w-full py-3 bg-[#4a0000] hover:bg-[#380000] active:scale-[0.99] text-white font-extrabold text-sm sm:text-base rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {isLoading ? (
          <>
            <RefreshCw className="w-5 h-5 animate-spin text-[#ffcc00]" />
            <span>AI அரசு வடிவ மனுவை உருவாக்குகிறது...</span>
          </>
        ) : (
          <>
            <Sparkles className="w-5 h-5 text-[#ffcc00]" />
            <span>அரசு வடிவ மனுவை உருவாக்கு (Generate Formal Petition)</span>
          </>
        )}
      </button>

      {/* Generated Output Preview Section */}
      {generatedDraft && (
        <div className="mt-8 bg-neutral-50 border border-neutral-200 rounded-xl p-6 shadow-sm animate-fadeIn">
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-neutral-200 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-[#4a0000]" />
              <h4 className="text-base font-bold text-[#4a0000]">
                உருவாக்கப்பட்ட அரசு மனு மாதிரி (AI Generated Petition):
              </h4>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={handleCopy}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white hover:bg-neutral-100 text-neutral-800 border border-neutral-300 rounded-md text-xs font-bold transition-all shadow-2xs"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-neutral-600" />}
                <span>{copied ? 'நகலெடுக்கப்பட்டது' : 'நகலெடு'}</span>
              </button>

              <button
                onClick={handlePrint}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white hover:bg-neutral-100 text-neutral-800 border border-neutral-300 rounded-md text-xs font-bold transition-all shadow-2xs"
              >
                <Printer className="w-4 h-4 text-neutral-600" />
                <span>அச்சிடு / PDF</span>
              </button>
            </div>
          </div>

          <div className="bg-white border border-neutral-200 rounded-lg p-5 font-mono text-xs sm:text-sm text-neutral-800 whitespace-pre-wrap leading-relaxed overflow-x-auto shadow-inner">
            {generatedDraft}
          </div>

          {/* Direct Submission Action */}
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white border border-neutral-200 rounded-lg p-4 shadow-2xs">
            <div>
              <h5 className="text-sm font-bold text-[#4a0000]">இந்த மனுவை நேரடியாக அதிகாரிகளுக்கு சமர்ப்பிக்க விரும்புகிறீர்களா?</h5>
              <p className="text-xs text-neutral-600">உங்கள் மனுவிற்கு பிரத்யேக கண்காணிப்பு எண் (MS-ACH-2026-XXXX) உருவாக்கப்படும்.</p>
            </div>

            <button
              onClick={() => {
                handleClearDraft();
                onDirectSubmitDraft(generatedDraft, userPrompt.slice(0, 60), wardNo, category);
              }}
              className="w-full sm:w-auto px-5 py-2.5 bg-[#ffcc00] hover:bg-[#ffb700] text-[#4a0000] font-extrabold text-sm rounded-md shadow-sm transition-all flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <Send className="w-4 h-4" />
              <span>மனுவாக நேரடியாக தாக்கல் செய்</span>
            </button>
          </div>

        </div>
      )}

    </section>
  );
};
