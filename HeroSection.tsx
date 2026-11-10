import React from 'react';
import { Search, PenTool, Sparkles, CheckCircle2, Clock, ThumbsUp, FileText, ArrowRight, ShieldAlert, Calendar, UserRound, MapPin, Phone } from 'lucide-react';
import homeBanner from '../assets/images/ashok_logo.png';

interface HeroSectionProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  onOpenNewPetition: () => void;
  onOpenAIGenerator: () => void;
  onOpenEventsCalendar?: () => void;
  onSearchSubmit: () => void;
  stats: {
    total: number;
    resolved: number;
    pending: number;
    inProgress: number;
    totalUpvotes: number;
  };
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  searchTerm,
  setSearchTerm,
  onOpenNewPetition,
  onOpenAIGenerator,
  onOpenEventsCalendar,
  onSearchSubmit,
  stats
}) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSearchSubmit();
    }
  };

  return (
    <div className="bg-gradient-to-b from-[#4a0000] via-[#3d0000] to-[#2b0000] text-white py-10 sm:py-14 px-4 sm:px-6 lg:px-8 border-b-4 border-[#ffcc00] shadow-md">
      
      <div className="max-w-4xl mx-auto text-center relative z-10">
        
        <div className="flex flex-col items-center mb-6">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-2 border-[#ffcc00] bg-[#2b0000] text-[#ffcc00] flex items-center justify-center shadow-2xl ring-4 ring-[#ffcc00]/20">
            <UserRound className="w-11 h-11 sm:w-14 sm:h-14" aria-hidden="true" />
          </div>
          <span className="text-sm sm:text-base font-extrabold text-[#ffcc00] mt-2">அசோக் (ASHOK)</span>
          <span className="text-xs sm:text-sm font-semibold text-neutral-200">சமூக ஆர்வலர்</span>
        </div>

        <div className="inline-flex items-center gap-2 bg-[#ffcc00]/15 border border-[#ffcc00]/40 rounded-full px-4 py-1 mb-3">
          <span className="w-2 h-2 rounded-full bg-[#ffcc00] animate-pulse" />
          <p className="text-[#ffcc00] font-bold text-xs sm:text-sm tracking-wider uppercase">
            பொதுநலன் மற்றும் மக்கள் உரிமைகள் பாதுகாப்புப் பணி
          </p>
        </div>

        {/* Main Heading */}
        <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-white leading-tight tracking-tight mb-3">
          விளங்காடு கிராமம் மக்கள் குறைதீர்வு மையம்
        </h1>

        <p className="text-sm sm:text-base text-neutral-200 leading-relaxed max-w-2xl mx-auto mb-8 font-normal">
          குடிநீர், சாலைகள், தெருவிளக்குகள், சுகாதாரம் மற்றும் அரசு நலத்திட்ட கோரிக்கை மனுக்களை நேரடியாகப் பதிவேற்றுங்கள். AI உதவி மூலம் அரசு வடிவ மனுவை உருவாக்கி கண்காணிக்கலாம்.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-5 text-xs sm:text-sm text-neutral-200 mb-8">
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-[#ffcc00]" aria-hidden="true" />
            விளங்காடு கிராமம், அச்சரப்பாக்கம் வட்டம், செங்கல்பட்டு மாவட்டம்
          </span>
          <a href="tel:8807757529" className="inline-flex items-center gap-1.5 text-[#ffcc00] font-bold hover:underline">
            <Phone className="w-4 h-4" aria-hidden="true" />
            8807757529
          </a>
        </div>

        <figure className="max-w-sm mx-auto mb-8">
          <img
            src={homeBanner}
            alt="பயனர் வழங்கிய அரசியல் கருப்பொருள் விளக்கப் படம்"
            className="w-full max-h-[28rem] rounded-2xl border border-[#ffcc00]/50 object-cover object-center shadow-2xl"
          />
          <figcaption className="mt-2 text-xs text-neutral-300">
            C. Joseph Vijay · Chief Minister of Tamil Nadu
          </figcaption>
        </figure>

        {/* Search Bar */}
        <div className="relative max-w-2xl mx-auto mb-8">
          <div className="relative flex items-center">
            <Search className="absolute left-4 w-5 h-5 text-neutral-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="மனு எண் (MS-ACH-2026-1001) அல்லது தெரு/வார்டு பெயர் உள்ளிடுக..."
              className="w-full pl-11 pr-28 py-3.5 bg-white text-neutral-900 placeholder-neutral-400 text-sm sm:text-base rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-[#ffcc00] shadow-md transition-all font-medium"
            />
            <button
              onClick={onSearchSubmit}
              className="absolute right-2 top-1.5 bottom-1.5 px-4 bg-[#ffcc00] hover:bg-[#ffb700] text-[#4a0000] font-bold text-xs sm:text-sm rounded-lg transition-all flex items-center gap-1 shadow-sm"
            >
              <span>தேடுக</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-10">
          <button
            onClick={onOpenNewPetition}
            className="w-full sm:w-auto px-6 py-3.5 bg-[#ffcc00] hover:bg-[#ffb700] text-[#4a0000] font-extrabold text-sm sm:text-base rounded-lg shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <PenTool className="w-5 h-5 text-[#4a0000]" />
            <span>புதிய மனு தாக்கல் செய்க</span>
          </button>

          <button
            onClick={onOpenAIGenerator}
            className="w-full sm:w-auto px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm sm:text-base rounded-lg shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-5 h-5 text-[#ffcc00]" />
            <span>✨ AI மூலம் மனுவை உருவாக்கு</span>
          </button>

          {onOpenEventsCalendar && (
            <button
              onClick={onOpenEventsCalendar}
              className="w-full sm:w-auto px-6 py-3.5 bg-[#2b0000] hover:bg-[#380000] text-white border border-[#ffcc00]/50 font-bold text-sm sm:text-base rounded-lg shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Calendar className="w-5 h-5 text-[#ffcc00]" />
              <span>📅 வார்டு நிகழ்வுகள் & தூய்மை முகாம்கள்</span>
            </button>
          )}
        </div>

        {/* Live Stats Overview - Professional Crisp Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 max-w-4xl mx-auto text-neutral-800">
          
          <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-sm hover:shadow-md transition-all text-left">
            <p className="text-neutral-500 text-xs font-bold uppercase tracking-wider mb-1">மொத்த மனுக்கள்</p>
            <p className="text-2xl sm:text-3xl font-extrabold text-[#4a0000]">{stats.total}</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-sm hover:shadow-md transition-all text-left">
            <p className="text-neutral-500 text-xs font-bold uppercase tracking-wider mb-1">தீர்க்கப்பட்டவை</p>
            <p className="text-2xl sm:text-3xl font-extrabold text-emerald-600">{stats.resolved}</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-sm hover:shadow-md transition-all text-left">
            <p className="text-neutral-500 text-xs font-bold uppercase tracking-wider mb-1">பரிசீலனையில்</p>
            <p className="text-2xl sm:text-3xl font-extrabold text-amber-600">{stats.pending + stats.inProgress}</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-sm hover:shadow-md transition-all text-left">
            <p className="text-neutral-500 text-xs font-bold uppercase tracking-wider mb-1">மக்களின் ஆதரவு</p>
            <p className="text-2xl sm:text-3xl font-extrabold text-[#4a0000]">{stats.totalUpvotes}</p>
          </div>

        </div>

      </div>
    </div>
  );
};
