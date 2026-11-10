import React from 'react';
import { Home, FileText, MapPin, BarChart3, Phone, Bell, Sparkles, PlusCircle, Shield, Award, User, Calendar } from 'lucide-react';
import { UserProfile } from '../types';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenNewPetition: () => void;
  onOpenAIGenerator: () => void;
  onOpenWardSubscription: () => void;
  subscribedWardsCount: number;
  petitionCount: number;
  userProfile?: UserProfile;
  onOpenProfile?: () => void;
  staticPreview?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenNewPetition,
  onOpenAIGenerator,
  onOpenWardSubscription,
  subscribedWardsCount,
  petitionCount,
  userProfile,
  onOpenProfile,
  staticPreview = false
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#4a0000] border-b-4 border-[#ffcc00] shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Service center identity */}
          <div 
            onClick={() => setActiveTab('home')}
            className="flex items-center gap-2 sm:gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full border-2 border-[#ffcc00] bg-[#2b0000] text-[#ffcc00] flex items-center justify-center shadow-md group-hover:scale-105 transition-transform flex-shrink-0">
              <Shield className="w-6 h-6" aria-hidden="true" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] sm:text-xs font-extrabold text-[#ffcc00] tracking-wider">அசோக் · சமூக ஆர்வலர்</span>
                <span className="bg-[#ffcc00]/20 border border-[#ffcc00]/40 text-[#ffcc00] text-[9px] font-bold px-1.5 py-0.2 rounded">விளங்காடு</span>
              </div>
              <h1 className="text-sm sm:text-base md:text-lg font-extrabold text-white leading-tight tracking-tight">
                விளங்காடு கிராமம் மக்கள் குறைதீர்வு மையம்
              </h1>
            </div>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
            <button
              onClick={() => setActiveTab('home')}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-semibold transition-all ${
                activeTab === 'home'
                  ? 'bg-[#ffcc00] text-[#4a0000] font-bold shadow-sm'
                  : 'text-neutral-200 hover:text-[#ffcc00] hover:bg-[#2b0000]/50'
              }`}
            >
              <Home className="w-4 h-4" />
              <span>முகப்பு</span>
            </button>

            <button
              onClick={() => setActiveTab('my_petitions')}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-semibold transition-all ${
                activeTab === 'my_petitions'
                  ? 'bg-[#ffcc00] text-[#4a0000] font-bold shadow-sm'
                  : 'text-[#ffcc00] hover:bg-[#2b0000]/50'
              }`}
            >
              <User className="w-4 h-4" />
              <span>என் மனுக்கள்</span>
            </button>

            <button
              onClick={() => setActiveTab('petitions')}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-semibold transition-all relative ${
                activeTab === 'petitions'
                  ? 'bg-[#ffcc00] text-[#4a0000] font-bold shadow-sm'
                  : 'text-neutral-200 hover:text-[#ffcc00] hover:bg-[#2b0000]/50'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>மனுக்கள்</span>
              {petitionCount > 0 && (
                <span className="bg-[#ffcc00] text-[#4a0000] text-xs px-1.5 py-0.2 rounded-full font-bold">
                  {petitionCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('wards')}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-semibold transition-all ${
                activeTab === 'wards'
                  ? 'bg-[#ffcc00] text-[#4a0000] font-bold shadow-sm'
                  : 'text-neutral-200 hover:text-[#ffcc00] hover:bg-[#2b0000]/50'
              }`}
            >
              <MapPin className="w-4 h-4" />
              <span>வார்டுகள்</span>
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-semibold transition-all ${
                activeTab === 'analytics'
                  ? 'bg-[#ffcc00] text-[#4a0000] font-bold shadow-sm'
                  : 'text-neutral-200 hover:text-[#ffcc00] hover:bg-[#2b0000]/50'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>பகுப்பாய்வு</span>
            </button>

            <button
              onClick={() => setActiveTab('events')}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-semibold transition-all ${
                activeTab === 'events'
                  ? 'bg-[#ffcc00] text-[#4a0000] font-bold shadow-sm'
                  : 'text-neutral-200 hover:text-[#ffcc00] hover:bg-[#2b0000]/50'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>நிகழ்வுகள்</span>
            </button>

            <button
              onClick={() => setActiveTab('helplines')}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-semibold transition-all ${
                activeTab === 'helplines'
                  ? 'bg-[#ffcc00] text-[#4a0000] font-bold shadow-sm'
                  : 'text-neutral-200 hover:text-[#ffcc00] hover:bg-[#2b0000]/50'
              }`}
            >
              <Phone className="w-4 h-4" />
              <span>உதவி எண்கள்</span>
            </button>

            {!staticPreview && <button
              onClick={() => setActiveTab('admin')}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-semibold transition-all ${
                activeTab === 'admin'
                  ? 'bg-[#ffcc00] text-[#4a0000] font-bold shadow-sm'
                  : 'text-neutral-200 hover:text-[#ffcc00] hover:bg-[#2b0000]/50'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>நிர்வாகம்</span>
            </button>}

            <button
              onClick={onOpenWardSubscription}
              className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-semibold transition-all relative text-[#ffcc00] hover:bg-[#2b0000]/50"
              title="வார்டு நேரலை சந்தா அமைப்புகள்"
            >
              <Bell className="w-4 h-4 text-[#ffcc00] fill-current" />
              <span>வார்டு சந்தா</span>
              <span className="bg-[#ffcc00] text-[#4a0000] text-xs px-1.5 py-0.2 rounded-full font-black">
                {subscribedWardsCount}
              </span>
            </button>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            {onOpenProfile && (
              <button
                onClick={onOpenProfile}
                className="flex items-center gap-1.5 bg-[#2b0000] hover:bg-[#380000] text-white px-2.5 py-1.5 rounded-lg text-xs font-bold border border-[#ffcc00]/40 transition-all"
                title="சுயவிவரப் படம் மற்றும் பெயர் மாற்றுக"
              >
                {userProfile?.avatarUrl ? (
                  <img
                    src={userProfile.avatarUrl}
                    alt={userProfile.name}
                    className="w-6 h-6 rounded-full object-cover border border-[#ffcc00]"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-[#ffcc00] text-[#4a0000] font-black text-[10px] flex items-center justify-center">
                    {userProfile?.name ? userProfile.name.charAt(0).toUpperCase() : 'ம'}
                  </div>
                )}
                <span className="hidden md:inline text-xs font-bold text-[#ffcc00] max-w-[100px] truncate">
                  {userProfile?.name || 'சுயவிவரம்'}
                </span>
              </button>
            )}

            {!staticPreview && <>
            <button
              onClick={onOpenAIGenerator}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 sm:px-3.5 sm:py-2 rounded-lg text-xs sm:text-sm font-bold shadow-sm transition-all"
            >
              <Sparkles className="w-4 h-4 text-[#ffcc00]" />
              <span className="hidden sm:inline">✨ AI மனு உதவி</span>
              <span className="sm:hidden">✨ AI</span>
            </button>

            <button
              onClick={onOpenNewPetition}
              className="flex items-center gap-1.5 bg-[#ffcc00] hover:bg-[#ffb700] text-[#4a0000] px-3.5 py-2 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-extrabold shadow-sm transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>மனு தாக்கல்</span>
            </button>
            </>}
          </div>

        </div>

        {/* Mobile Navigation Tabs */}
        <div className="lg:hidden flex items-center gap-1 overflow-x-auto py-2 border-t border-[#ffcc00]/20 scrollbar-none">
          <button
            onClick={() => setActiveTab('home')}
            className={`px-3 py-1 rounded-md text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === 'home' ? 'bg-[#ffcc00] text-[#4a0000]' : 'text-neutral-200'
            }`}
          >
            முகப்பு
          </button>
          <button
            onClick={() => setActiveTab('my_petitions')}
            className={`px-3 py-1 rounded-md text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === 'my_petitions' ? 'bg-[#ffcc00] text-[#4a0000]' : 'text-[#ffcc00]'
            }`}
          >
            👤 என் மனுக்கள்
          </button>
          <button
            onClick={() => setActiveTab('petitions')}
            className={`px-3 py-1 rounded-md text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === 'petitions' ? 'bg-[#ffcc00] text-[#4a0000]' : 'text-neutral-200'
            }`}
          >
            மனுக்கள் ({petitionCount})
          </button>
          <button
            onClick={() => setActiveTab('wards')}
            className={`px-3 py-1 rounded-md text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === 'wards' ? 'bg-[#ffcc00] text-[#4a0000]' : 'text-neutral-200'
            }`}
          >
            வார்டுகள்
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-3 py-1 rounded-md text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === 'analytics' ? 'bg-[#ffcc00] text-[#4a0000]' : 'text-neutral-200'
            }`}
          >
            பகுப்பாய்வு
          </button>
          <button
            onClick={() => setActiveTab('events')}
            className={`px-3 py-1 rounded-md text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === 'events' ? 'bg-[#ffcc00] text-[#4a0000]' : 'text-[#ffcc00]'
            }`}
          >
            📅 நிகழ்வுகள்
          </button>
          <button
            onClick={() => setActiveTab('helplines')}
            className={`px-3 py-1 rounded-md text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === 'helplines' ? 'bg-[#ffcc00] text-[#4a0000]' : 'text-neutral-200'
            }`}
          >
            உதவி எண்கள்
          </button>
          <button
            onClick={() => setActiveTab('announcements')}
            className={`px-3 py-1 rounded-md text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === 'announcements' ? 'bg-[#ffcc00] text-[#4a0000]' : 'text-neutral-200'
            }`}
          >
            அறிவிப்புகள்
          </button>
          {!staticPreview && <button
            onClick={() => setActiveTab('admin')}
            className={`px-3 py-1 rounded-md text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === 'admin' ? 'bg-[#ffcc00] text-[#4a0000]' : 'text-neutral-200'
            }`}
          >
            நிர்வாகம்
          </button>}
          <button
            onClick={onOpenWardSubscription}
            className="px-3 py-1 rounded-md text-xs font-bold whitespace-nowrap transition-all bg-[#ffcc00]/20 text-[#ffcc00] border border-[#ffcc00]/30 flex items-center gap-1"
          >
            🔔 சந்தா ({subscribedWardsCount})
          </button>
        </div>

      </div>
    </header>
  );
};
