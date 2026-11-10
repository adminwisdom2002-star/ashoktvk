import React, { useState } from 'react';
import { Helpline } from '../types';
import { Phone, PhoneCall, Building2, Zap, Droplets, ShieldAlert, Hospital, Flame, HeartHandshake, MapPin, Clock, Navigation, ExternalLink, Search } from 'lucide-react';

interface HelplineSectionProps {
  helplines: Helpline[];
}

export const HelplineSection: React.FC<HelplineSectionProps> = ({ helplines }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Building2': return Building2;
      case 'Zap': return Zap;
      case 'Droplets': return Droplets;
      case 'ShieldAlert': return ShieldAlert;
      case 'Hospital': return Hospital;
      case 'Flame': return Flame;
      default: return HeartHandshake;
    }
  };

  const filteredHelplines = helplines.filter(item =>
    item.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.phone.includes(searchTerm) ||
    (item.address && item.address.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="mb-8 text-center max-w-3xl mx-auto">
        <span className="text-xs font-bold text-[#4a0000] bg-[#4a0000]/10 border border-[#4a0000]/20 px-3 py-1 rounded-full uppercase tracking-wider">
          அவசரத் தொடர்புகள் & இடங்கள்
        </span>
        <h2 className="text-2xl sm:text-4xl font-extrabold text-[#4a0000] mt-2 mb-2">
          📞 முக்கிய உதவி எண்கள் & வழிப்பாதை (Helpline Directory & Maps)
        </h2>
        <p className="text-sm sm:text-base text-neutral-600">
          அச்சரப்பாக்கம் பேரூராட்சி அரசு அலுவலகங்கள் மற்றும் அவசரத் தேவைகளுக்கான நேரடி அழைப்பு (Quick Dial) மற்றும் வரைபட வழிப்பாதை (Get Directions) வசதி.
        </p>

        {/* Quick Search Bar */}
        <div className="mt-6 max-w-md mx-auto relative">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="துறை பெயர் அல்லது முகவரியை தேடுக..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-neutral-300 focus:border-[#4a0000] focus:ring-2 focus:ring-[#4a0000]/20 rounded-xl text-sm outline-none shadow-xs transition-all"
          />
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredHelplines.map((item) => {
          const Icon = getIcon(item.iconName);
          const mapsQuery = encodeURIComponent(`${item.department}, ${item.address || 'அச்சரப்பாக்கம்'}`);
          const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`;

          return (
            <div
              key={item.id}
              className="bg-white border border-neutral-200 hover:border-[#4a0000]/40 rounded-xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-red-50 border border-red-100 flex items-center justify-center shrink-0 group-hover:bg-[#4a0000] transition-colors">
                    <Icon className="w-5 h-5 text-[#4a0000] group-hover:text-[#ffcc00] transition-colors" />
                  </div>

                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-[#4a0000] bg-[#ffcc00]/20 hover:bg-[#ffcc00] px-2.5 py-1 rounded-md border border-[#ffcc00]/40 transition-all shrink-0"
                    title="வரைபடத்தில் காண்க"
                  >
                    <Navigation className="w-3 h-3" />
                    <span>வரைபடம்</span>
                    <ExternalLink className="w-2.5 h-2.5 opacity-70" />
                  </a>
                </div>

                <h3 className="text-base font-extrabold text-neutral-900 mb-2 leading-snug">
                  {item.department}
                </h3>

                {item.address && (
                  <p className="text-xs text-neutral-600 flex items-start gap-1.5 mb-2">
                    <MapPin className="w-3.5 h-3.5 text-[#4a0000] shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{item.address}</span>
                  </p>
                )}

                <p className="text-xs text-neutral-600 flex items-center gap-1.5 mb-4">
                  <Clock className="w-3.5 h-3.5 text-[#4a0000] shrink-0" />
                  <span>நேரம்: {item.timing}</span>
                </p>
              </div>

              {/* Action CTAs: Quick Dial & Get Directions */}
              <div className="pt-3.5 border-t border-neutral-100 flex flex-col gap-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {/* Quick Dial Button */}
                  <a
                    href={`tel:${item.phone.replace(/[\s-]/g, '')}`}
                    className="w-full py-2.5 px-2 bg-[#ffcc00] hover:bg-[#ffb700] active:scale-[0.98] text-[#4a0000] font-black text-xs rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-2xs border border-[#e6b800]"
                    title={`${item.department} எண்ணிற்கு உடனடியாக அழைக்க`}
                  >
                    <PhoneCall className="w-3.5 h-3.5 text-[#4a0000] shrink-0 animate-bounce" />
                    <span className="whitespace-nowrap">Quick Dial</span>
                  </a>

                  {/* Get Directions Button */}
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 px-2 bg-[#4a0000] hover:bg-[#330000] active:scale-[0.98] text-white font-extrabold text-xs rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-2xs"
                    title={`${item.department} இடத்திற்கான வழிப்பாதையை திறக்கவும்`}
                  >
                    <Navigation className="w-3.5 h-3.5 text-[#ffcc00] shrink-0" />
                    <span className="whitespace-nowrap">Get Directions</span>
                  </a>
                </div>

                {/* Alt Phone Quick Dial if available */}
                {item.altPhone && (
                  <a
                    href={`tel:${item.altPhone.replace(/[\s-]/g, '')}`}
                    className="w-full py-2 px-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-bold text-xs rounded-lg transition-all flex items-center justify-center gap-1.5 border border-neutral-200"
                    title="மாற்று எண்ணிற்கு அழைக்க"
                  >
                    <Phone className="w-3.5 h-3.5 text-neutral-600 shrink-0" />
                    <span>மாற்று எண் (Alt): {item.altPhone}</span>
                  </a>
                )}
              </div>

            </div>
          );
        })}
      </div>

      {filteredHelplines.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl border border-neutral-200 p-6">
          <Building2 className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-neutral-700">எந்த தகவலும் கிடைக்கவில்லை</h3>
          <p className="text-xs text-neutral-500 mt-1">
            "{searchTerm}" என்ற தேடலுக்குப் பொருத்தமான அரசு அலுவலகம் அல்லது உதவி எண்கள் காணப்படவில்லை.
          </p>
        </div>
      )}

    </div>
  );
};

