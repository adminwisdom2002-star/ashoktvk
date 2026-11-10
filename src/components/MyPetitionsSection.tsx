import React, { useState, useEffect } from 'react';
import { Petition, PetitionStatus, UserProfile } from '../types';
import { PetitionTimeline } from './PetitionTimeline';
import { downloadPetitionPDF } from '../utils/pdfGenerator';
import { useToast } from './ToastContainer';
import { 
  User, 
  Phone, 
  Search, 
  FileText, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  PlusCircle, 
  Share2, 
  Download, 
  Eye, 
  ShieldCheck, 
  Sparkles,
  Filter,
  ArrowRight,
  RefreshCw,
  ThumbsUp,
  Camera,
  Edit3,
  Loader2
} from 'lucide-react';

interface MyPetitionsSectionProps {
  petitions: Petition[];
  onSelectPetition: (petition: Petition) => void;
  onOpenNewPetition: () => void;
  onUpvote: (id: string, e: React.MouseEvent) => void;
  userProfile?: UserProfile;
  onOpenProfile?: () => void;
}

export const MyPetitionsSection: React.FC<MyPetitionsSectionProps> = ({
  petitions,
  onSelectPetition,
  onOpenNewPetition,
  onUpvote,
  userProfile,
  onOpenProfile
}) => {
  const [phoneSearch, setPhoneSearch] = useState<string>(() => {
    return localStorage.getItem('tvk_user_phone') || '';
  });
  const [activeTabStatus, setActiveTabStatus] = useState<PetitionStatus | 'all'>('all');
  const [selectedMyPetition, setSelectedMyPetition] = useState<Petition | null>(null);

  // Save entered phone in localStorage for auto-remembering
  useEffect(() => {
    if (phoneSearch.trim()) {
      localStorage.setItem('tvk_user_phone', phoneSearch.trim());
    }
  }, [phoneSearch]);

  // Saved Petition IDs in localStorage
  const mySavedIds: string[] = JSON.parse(localStorage.getItem('tvk_my_petition_ids') || '[]');

  // Filter petitions matching phone, tracking number, or saved IDs
  const myPetitions = petitions.filter(p => {
    const searchClean = phoneSearch.trim().toLowerCase();
    
    // If user typed a phone or tracking number or name
    if (searchClean) {
      const matchPhone = p.phone && p.phone.replace(/\D/g, '').includes(searchClean.replace(/\D/g, ''));
      const matchTracking = p.trackingNo && p.trackingNo.toLowerCase().includes(searchClean);
      const matchName = p.citizenName && p.citizenName.toLowerCase().includes(searchClean);
      return matchPhone || matchTracking || matchName;
    }

    // Default: match saved IDs or show petitions if phone matches
    if (mySavedIds.includes(p.id)) return true;

    // Default sample view: show top recent user petitions
    return true;
  });

  const filteredByStatus = myPetitions.filter(p => {
    if (activeTabStatus === 'all') return true;
    return p.status === activeTabStatus;
  });

  // Calculate statistics
  const totalCount = myPetitions.length;
  const resolvedCount = myPetitions.filter(p => p.status === 'resolved').length;
  const activeCount = myPetitions.filter(p => p.status === 'pending' || p.status === 'in_progress' || p.status === 'action_taken').length;
  const totalUpvotes = myPetitions.reduce((acc, p) => acc + p.upvotes, 0);

  const [generatingPdfId, setGeneratingPdfId] = useState<string | null>(null);
  const { addToast } = useToast();

  const handleQuickDemoPhone = (phoneNum: string) => {
    setPhoneSearch(phoneNum);
  };

  const handleDownloadPDF = async (petition: Petition) => {
    setGeneratingPdfId(petition.id);
    try {
      const generated = await downloadPetitionPDF(petition);
      if (!generated) throw new Error('PDF generation did not complete');
      addToast({
        type: 'success',
        title: 'PDF பதிவிறக்கம் தொடங்கியது',
        message: `${petition.trackingNo} மனு PDF தயாராக உள்ளது.`
      });
    } catch (err) {
      console.error("PDF generation failed:", err);
      addToast({
        type: 'warning',
        title: 'PDF உருவாக்க முடியவில்லை',
        message: err instanceof Error ? err.message : 'மீண்டும் முயற்சிக்கவும்.'
      });
    } finally {
      setGeneratingPdfId(null);
    }
  };

  const handleShareWhatsApp = (petition: Petition) => {
    const text = `📌 TVK அச்சரப்பாக்கம் மக்கள் குறைதீர்ப்பு மையம்\n\nஎன் மனு எண்: ${petition.trackingNo}\nதலைப்பு: ${petition.title}\nநிலைமை: ${petition.status === 'resolved' ? 'தீர்க்கப்பட்டது ✓' : 'பரிசீலனையில் ⚡'}\n\nபொதுமக்கள் கோரிக்கைக்கு ஆதரவளிக்க இணையப் பக்கத்தைப் பாருங்கள்! 🙏`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      
      {/* Top Banner & Profile Overview */}
      <div className="bg-gradient-to-r from-[#4a0000] via-[#3d0000] to-[#2b0000] rounded-2xl p-6 sm:p-8 text-white shadow-lg border-b-4 border-[#ffcc00] mb-8 relative overflow-hidden">
        
        {/* Subtle Background Badge Pattern */}
        <div className="absolute -right-10 -bottom-10 opacity-10 pointer-events-none">
          <ShieldCheck className="w-64 h-64 text-[#ffcc00]" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 bg-[#ffcc00] text-[#4a0000] px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider">
              <User className="w-3.5 h-3.5" />
              <span>குடிமக்கள் சுயவிவர மையம் (Citizen Profile Portal)</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              என் மனுக்கள் & நேரலை கண்காணிப்பு
            </h2>

            <p className="text-xs sm:text-sm text-neutral-200 max-w-2xl leading-relaxed">
              நீங்கள் சமர்ப்பித்த அனைத்து மனுக்களின் தற்போதைய நிலைப்பாடு, அரசுத்துறை நடவடிக்கைகள் மற்றும் கள ஆய்வுகளின் தகவல்களை நேரலையாகக் கண்காணிக்கலாம்.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {onOpenProfile && (
              <button
                onClick={onOpenProfile}
                className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-[#ffcc00] border border-[#ffcc00]/40 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2"
              >
                <Edit3 className="w-4 h-4 text-[#ffcc00]" />
                <span>சுயவிவரப் படம் & பெயர் மாற்றுக</span>
              </button>
            )}

            <button
              onClick={onOpenNewPetition}
              className="px-5 py-2.5 bg-[#ffcc00] hover:bg-[#ffb700] text-[#4a0000] font-black text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 flex-shrink-0 active:scale-95"
            >
              <PlusCircle className="w-5 h-5 text-[#4a0000]" />
              <span>புதிய மனு தாக்கல் செய்க</span>
            </button>
          </div>
        </div>

        {/* User Profile Overview Card */}
        {userProfile && (
          <div className="mt-6 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-white">
            <div className="flex items-center gap-3.5">
              {userProfile.avatarUrl ? (
                <img
                  src={userProfile.avatarUrl}
                  alt={userProfile.name}
                  className="w-14 h-14 rounded-full object-cover border-2 border-[#ffcc00] shadow-md flex-shrink-0"
                />
              ) : (
                <div className="w-14 h-14 rounded-full bg-[#ffcc00] text-[#4a0000] font-black text-xl flex items-center justify-center border-2 border-white shadow-md flex-shrink-0">
                  {userProfile.name ? userProfile.name.charAt(0).toUpperCase() : 'ம'}
                </div>
              )}

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base font-black text-white">{userProfile.name}</h3>
                  <span className="bg-[#ffcc00] text-[#4a0000] text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                    வார்டு எண் {userProfile.wardNo}
                  </span>
                </div>
                <div className="text-xs text-neutral-200 mt-0.5 flex items-center gap-3">
                  <span>📱 {userProfile.phone || 'கைபேசி எண் சேர்க்கப்படவில்லை'}</span>
                  <span>•</span>
                  <span className="text-[#ffcc00] font-bold">சமர்ப்பித்த மனுக்கள்: {totalCount}</span>
                </div>
              </div>
            </div>

            {onOpenProfile && (
              <button
                onClick={onOpenProfile}
                className="px-3.5 py-1.5 bg-[#ffcc00] hover:bg-[#ffb700] text-[#4a0000] font-black text-xs rounded-lg transition-all flex items-center gap-1.5 shadow-xs self-end sm:self-center"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>புகைப்படம் / பெயர் மாற்றுக</span>
              </button>
            )}
          </div>
        )}

        {/* Citizen Search / Phone Lookup Bar */}
        <div className="mt-6 pt-6 border-t border-white/15 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          <div className="md:col-span-2 relative">
            <label className="text-[11px] text-[#ffcc00] font-bold block mb-1">
              மனுதாரர் கைபேசி எண் அல்லது மனு எண் கொண்டு தேடுக (Phone / Tracking Lookup):
            </label>
            <div className="relative">
              <input
                type="text"
                value={phoneSearch}
                onChange={(e) => setPhoneSearch(e.target.value)}
                placeholder="எ.கா: 98401 23456 அல்லது TVK-ACH-2026-0012"
                className="w-full bg-white/10 text-white placeholder-neutral-400 border border-white/25 rounded-xl pl-10 pr-10 py-2.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#ffcc00] transition-all font-medium"
              />
              <Search className="w-4 h-4 text-[#ffcc00] absolute left-3.5 top-3" />
              {phoneSearch && (
                <button 
                  onClick={() => setPhoneSearch('')}
                  className="absolute right-3 top-2.5 text-neutral-400 hover:text-white text-xs font-bold"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Quick Demo Filter Shortcuts */}
          <div>
            <span className="text-[11px] text-neutral-300 font-bold block mb-1">
              மாதிரி மனுதாரர்கள் (Sample Citizen Shortcuts):
            </span>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => handleQuickDemoPhone('9840123456')}
                className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-[#ffcc00] rounded-md text-[11px] font-bold border border-white/15 transition-all"
              >
                9840123456
              </button>
              <button
                onClick={() => handleQuickDemoPhone('9443210987')}
                className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-[#ffcc00] rounded-md text-[11px] font-bold border border-white/15 transition-all"
              >
                9443210987
              </button>
              <button
                onClick={() => setPhoneSearch('')}
                className="px-2.5 py-1 bg-[#ffcc00]/20 hover:bg-[#ffcc00]/30 text-white rounded-md text-[11px] font-bold border border-[#ffcc00]/30 transition-all"
              >
                அனைத்தும்
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-neutral-500">மொத்த மனுக்கள்</span>
            <div className="w-8 h-8 rounded-lg bg-[#4a0000]/10 flex items-center justify-center">
              <FileText className="w-4 h-4 text-[#4a0000]" />
            </div>
          </div>
          <div className="text-2xl font-black text-[#4a0000]">{totalCount}</div>
          <span className="text-[11px] text-neutral-500">பதிவு செய்யப்பட்ட குறைதீர் மனுக்கள்</span>
        </div>

        <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-neutral-500">செயல்பாட்டில்</span>
            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
              <Clock className="w-4 h-4 text-amber-700" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-700">{activeCount}</div>
          <span className="text-[11px] text-neutral-500">பரிசீலனை & அரசு நடவடிக்கை</span>
        </div>

        <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-neutral-500">தீர்க்கப்பட்டவை</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-700">{resolvedCount}</div>
          <span className="text-[11px] text-emerald-600 font-bold">நிறைவுபெற்ற மனுக்கள்</span>
        </div>

        <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-neutral-500">பெறப்பட்ட ஆதரவுகள்</span>
            <div className="w-8 h-8 rounded-lg bg-[#ffcc00]/20 flex items-center justify-center">
              <ThumbsUp className="w-4 h-4 text-[#4a0000]" />
            </div>
          </div>
          <div className="text-2xl font-black text-[#4a0000]">{totalUpvotes}</div>
          <span className="text-[11px] text-neutral-500">பொதுமக்கள் அளித்த ஆதரவு வாக்குகள்</span>
        </div>
      </div>

      {/* Filter Tabs & Controls */}
      <div className="bg-white border border-neutral-200 rounded-xl p-4 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-xs font-bold text-neutral-500 mr-2 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-[#4a0000]" />
            <span>நிலை வடிகட்டி:</span>
          </span>

          <button
            onClick={() => setActiveTabStatus('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTabStatus === 'all'
                ? 'bg-[#4a0000] text-[#ffcc00]'
                : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
            }`}
          >
            அனைத்தும் ({myPetitions.length})
          </button>

          <button
            onClick={() => setActiveTabStatus('pending')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTabStatus === 'pending'
                ? 'bg-[#4a0000] text-[#ffcc00]'
                : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
            }`}
          >
            புதியது ({myPetitions.filter(p => p.status === 'pending').length})
          </button>

          <button
            onClick={() => setActiveTabStatus('in_progress')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTabStatus === 'in_progress'
                ? 'bg-[#4a0000] text-[#ffcc00]'
                : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
            }`}
          >
            பரிசீலனையில் ({myPetitions.filter(p => p.status === 'in_progress').length})
          </button>

          <button
            onClick={() => setActiveTabStatus('action_taken')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTabStatus === 'action_taken'
                ? 'bg-[#4a0000] text-[#ffcc00]'
                : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
            }`}
          >
            நடவடிக்கை ({myPetitions.filter(p => p.status === 'action_taken').length})
          </button>

          <button
            onClick={() => setActiveTabStatus('resolved')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTabStatus === 'resolved'
                ? 'bg-emerald-700 text-white'
                : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
            }`}
          >
            தீர்க்கப்பட்டது ({myPetitions.filter(p => p.status === 'resolved').length})
          </button>
        </div>

        <div className="text-xs text-neutral-500 font-bold">
          காண்பிக்கப்படுகிறது: <span className="text-[#4a0000] font-extrabold">{filteredByStatus.length}</span> மனுக்கள்
        </div>
      </div>

      {/* Petition Cards Grid */}
      {filteredByStatus.length === 0 ? (
        <div className="bg-white border border-neutral-200 rounded-2xl p-12 text-center shadow-2xs">
          <div className="w-16 h-16 rounded-full bg-neutral-100 text-[#4a0000] mx-auto flex items-center justify-center mb-4">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-black text-neutral-800 mb-2">
            எந்த மனுக்களும் கண்டறியப்படவில்லை
          </h3>
          <p className="text-xs text-neutral-500 max-w-md mx-auto mb-6">
            குறிப்பிட்ட கைபேசி எண் அல்லது மனு எண்ணில் எந்தக் கோரிக்கையும் இல்லை. புதிய மனுவைத் தாக்கல் செய்ய கீழே உள்ள பொத்தானைக் கிளிக் செய்யவும்.
          </p>
          <button
            onClick={onOpenNewPetition}
            className="px-5 py-2.5 bg-[#4a0000] hover:bg-[#380000] text-[#ffcc00] font-black text-xs rounded-xl shadow-md transition-all inline-flex items-center gap-2"
          >
            <PlusCircle className="w-4 h-4" />
            <span>புதிய மனு தாக்கல் செய்க</span>
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredByStatus.map((petition) => {
            return (
              <div
                key={petition.id}
                className="bg-white border border-neutral-200 hover:border-[#4a0000]/40 rounded-2xl p-5 sm:p-6 shadow-xs hover:shadow-md transition-all relative overflow-hidden group"
              >
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-neutral-100">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="bg-[#4a0000] text-[#ffcc00] text-xs font-black font-mono px-2.5 py-1 rounded-md">
                      {petition.trackingNo}
                    </span>
                    <span className="bg-neutral-100 text-neutral-800 text-xs font-bold px-2.5 py-1 rounded-md border border-neutral-200">
                      📍 வார்டு {petition.wardNo} - {petition.streetName}
                    </span>
                    <span className="text-xs text-neutral-400 font-medium">
                      தேதி: {new Date(petition.createdAt).toLocaleDateString('ta-IN')}
                    </span>
                  </div>

                  {/* Status Badge */}
                  <span className={`self-start sm:self-auto text-xs font-black px-3 py-1 rounded-full border ${
                    petition.status === 'resolved'
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : petition.status === 'action_taken'
                      ? 'bg-amber-100 text-amber-800 border-amber-300'
                      : petition.status === 'in_progress'
                      ? 'bg-sky-100 text-sky-800 border-sky-300'
                      : 'bg-neutral-100 text-neutral-700 border-neutral-300'
                  }`}>
                    {petition.status === 'resolved' && '✓ தீர்க்கப்பட்டது'}
                    {petition.status === 'action_taken' && '⚡ அரசு நடவடிக்கை'}
                    {petition.status === 'in_progress' && '🔍 பரிசீலனையில்'}
                    {petition.status === 'pending' && '📋 பதிவாகியுள்ளது'}
                  </span>
                </div>

                {/* Title & Description */}
                <div className="mb-5">
                  <h3 
                    onClick={() => onSelectPetition(petition)}
                    className="text-base sm:text-lg font-extrabold text-neutral-900 hover:text-[#4a0000] cursor-pointer transition-colors mb-2 leading-snug"
                  >
                    {petition.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-neutral-600 line-clamp-2 leading-relaxed">
                    {petition.description}
                  </p>
                </div>

                {/* Integrated Interactive Timeline Progress */}
                <div className="mb-5">
                  <PetitionTimeline 
                    status={petition.status} 
                    createdAt={petition.createdAt} 
                    updatedAt={petition.updatedAt} 
                  />
                </div>

                {/* Action Bar Footer */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-neutral-100">
                  <div className="flex items-center gap-3 text-xs text-neutral-500 font-bold">
                    <div className="flex items-center gap-1.5">
                      {petition.avatarUrl ? (
                        <img
                          src={petition.avatarUrl}
                          alt={petition.citizenName}
                          className="w-5 h-5 rounded-full object-cover border border-[#ffcc00]"
                        />
                      ) : (
                        <span className="w-5 h-5 rounded-full bg-[#4a0000] text-[#ffcc00] font-black text-[10px] flex items-center justify-center">
                          {petition.citizenName.charAt(0).toUpperCase()}
                        </span>
                      )}
                      <span>மனுதாரர்: <strong className="text-neutral-800">{petition.citizenName}</strong></span>
                    </div>
                    <span>•</span>
                    <button
                      onClick={(e) => onUpvote(petition.id, e)}
                      className="hover:text-[#4a0000] flex items-center gap-1 transition-colors"
                    >
                      <ThumbsUp className="w-3.5 h-3.5 text-[#ffcc00] fill-current" />
                      <span>{petition.upvotes} ஆதரவுகள்</span>
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* View Details Modal */}
                    <button
                      onClick={() => onSelectPetition(petition)}
                      className="px-3.5 py-1.5 bg-[#4a0000] hover:bg-[#380000] text-[#ffcc00] rounded-lg text-xs font-black transition-all flex items-center gap-1.5 shadow-2xs"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>விரிவாகக் காண்க</span>
                    </button>

                    {/* PDF Download */}
                    <button
                      onClick={() => handleDownloadPDF(petition)}
                      disabled={generatingPdfId === petition.id}
                      className="px-3 py-1.5 bg-white hover:bg-neutral-100 disabled:opacity-50 text-neutral-800 border border-neutral-300 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
                      title="அரசு அதிகாரியிடம் சமர்ப்பிக்க PDF பதிவிறக்கம் செய்"
                    >
                      {generatingPdfId === petition.id ? (
                        <Loader2 className="w-3.5 h-3.5 text-[#4a0000] animate-spin" />
                      ) : (
                        <Download className="w-3.5 h-3.5 text-[#4a0000]" />
                      )}
                      <span>PDF</span>
                    </button>

                    {/* Share WhatsApp */}
                    <button
                      onClick={() => handleShareWhatsApp(petition)}
                      className="px-3 py-1.5 bg-[#25D366] hover:bg-[#1ebe5d] text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs"
                      title="வாட்ஸ்அப்பில் பகிர்க"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>பகிர்</span>
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
