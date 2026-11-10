import React from 'react';
import { WardInfo } from '../types';
import { MapPin, Phone, User, CheckCircle2, AlertCircle, ArrowRight, Bell, Check } from 'lucide-react';

interface WardsGridProps {
  wards: WardInfo[];
  onSelectWard: (wardNo: number) => void;
  subscribedWards?: number[];
  onToggleSubscription?: (wardNo: number) => void;
}

export const WardsGrid: React.FC<WardsGridProps> = ({ 
  wards, 
  onSelectWard,
  subscribedWards = [],
  onToggleSubscription 
}) => {
  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="mb-8 text-center max-w-3xl mx-auto">
        <span className="text-xs font-bold text-[#4a0000] bg-[#4a0000]/10 border border-[#4a0000]/20 px-3 py-1 rounded-full uppercase tracking-wider">
          அச்சரப்பாக்கம் பேரூராட்சி
        </span>
        <h2 className="text-2xl sm:text-4xl font-extrabold text-[#4a0000] mt-2 mb-2">
          🏘️ வார்டுகள் 1 - 15 வழிகாட்டி (Wards Directory)
        </h2>
        <p className="text-sm sm:text-base text-neutral-600">
          அச்சரப்பாக்கத்தின் 15 வார்டுகளின் பொறுப்பாளர்கள், முக்கிய வீதிகள் மற்றும் மக்கள் பிரச்சினைகளின் நேரடி விவரங்கள்.
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {wards.map((ward) => {
          const resolutionRate = ward.totalIssues > 0 
            ? Math.round((ward.resolvedIssues / ward.totalIssues) * 100) 
            : 100;
          const isSubscribed = subscribedWards.includes(ward.wardNo);

          return (
            <div
              key={ward.wardNo}
              className="bg-white border border-neutral-200 rounded-xl p-5 shadow-sm hover:shadow-md hover:border-[#4a0000]/40 transition-all flex flex-col justify-between group"
            >
              <div>
                
                {/* Ward No Badge & Resolution Rate & Subscription Button */}
                <div className="flex items-center justify-between mb-3 gap-2">
                  <span className="bg-[#4a0000] text-white text-xs font-extrabold px-3 py-1 rounded-md shadow-2xs">
                    வார்டு எண் {ward.wardNo}
                  </span>

                  <div className="flex items-center gap-1.5">
                    {onToggleSubscription && (
                      <button
                        onClick={() => onToggleSubscription(ward.wardNo)}
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-full border transition-all flex items-center gap-1 ${
                          isSubscribed
                            ? 'bg-[#ffcc00] text-[#4a0000] border-[#ffcc00] font-black'
                            : 'bg-neutral-100 text-neutral-600 border-neutral-300 hover:bg-neutral-200'
                        }`}
                        title={isSubscribed ? 'வார்டு சந்தாவிலிருந்து நீக்கு' : 'வார்டு நேரலைச் சந்தா சேர்'}
                      >
                        {isSubscribed ? (
                          <>
                            <Check className="w-3 h-3 stroke-[3]" />
                            <span>சந்தாவில்</span>
                          </>
                        ) : (
                          <>
                            <Bell className="w-3 h-3" />
                            <span>சந்தா</span>
                          </>
                        )}
                      </button>
                    )}

                    <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                      {resolutionRate}%
                    </span>
                  </div>
                </div>

                {/* Ward Name */}
                <h3 className="text-base font-extrabold text-neutral-900 group-hover:text-[#4a0000] transition-colors mb-2 leading-snug">
                  {ward.name}
                </h3>

                {/* Key Streets */}
                <div className="mb-4">
                  <span className="text-xs font-bold text-neutral-700 block mb-1">முக்கிய வீதிகள்:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {ward.keyStreets.map((street, idx) => (
                      <span key={idx} className="bg-neutral-50 text-neutral-700 border border-neutral-200 text-xs px-2 py-0.5 rounded-md font-medium">
                        {street}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Incharge Contact */}
                <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-3 mb-4 text-xs">
                  <div className="flex items-center gap-1.5 text-neutral-700 mb-1">
                    <User className="w-3.5 h-3.5 text-[#4a0000]" />
                    <span className="font-bold text-neutral-900">{ward.inchargeName}</span>
                  </div>
                  <a
                    href={`tel:${ward.inchargePhone.replace(/\s/g, '')}`}
                    className="flex items-center gap-1.5 text-[#4a0000] font-bold hover:underline"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>{ward.inchargePhone}</span>
                  </a>
                </div>

              </div>

              <div>
                {/* Stats & Progress */}
                <div className="pt-3 border-t border-neutral-100 text-xs mb-4">
                  <div className="flex justify-between font-bold text-neutral-600 mb-1">
                    <span>மொத்த புகார்கள்: {ward.totalIssues}</span>
                    <span className="text-emerald-700">தீர்க்கப்பட்டது: {ward.resolvedIssues}</span>
                  </div>

                  <div className="w-full bg-neutral-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-600 h-full transition-all duration-500"
                      style={{ width: `${resolutionRate}%` }}
                    />
                  </div>
                </div>

                {/* View Ward Petitions Button */}
                <button
                  onClick={() => onSelectWard(ward.wardNo)}
                  className="w-full py-2 bg-neutral-50 hover:bg-[#ffcc00] hover:text-[#4a0000] text-neutral-800 border border-neutral-300 font-bold text-xs rounded-md transition-all flex items-center justify-center gap-2 shadow-2xs"
                >
                  <span>வார்டு {ward.wardNo} மனுக்களைக் காண்</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
};
