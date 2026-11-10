import React from 'react';
import { Shield, Phone, MapPin } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#4a0000] border-t-2 border-[#ffcc00] text-neutral-200 py-10 px-4 sm:px-6 lg:px-8 mt-16">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Brand Column */}
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full border border-[#ffcc00] bg-[#2b0000] text-[#ffcc00] flex items-center justify-center">
              <Shield className="w-6 h-6" aria-hidden="true" />
            </div>
            <div>
              <span className="text-xs font-extrabold text-[#ffcc00] tracking-wider block">அசோக் (ASHOK) · சமூக ஆர்வலர்</span>
              <h3 className="text-sm sm:text-base font-extrabold text-white">விளங்காடு கிராமம் மக்கள் குறைதீர்வு மையம்</h3>
            </div>
          </div>
          <p className="text-xs text-neutral-300 leading-relaxed italic">
            பொதுநலன் மற்றும் மக்கள் உரிமைகள் பாதுகாப்புப் பணி.
          </p>
        </div>

        {/* Quick Location & Office Info */}
        <div className="text-xs space-y-2">
          <h4 className="font-extrabold text-[#ffcc00] text-xs uppercase tracking-wider mb-2">சேவைப் பகுதி:</h4>
          <p className="flex items-center gap-2 text-neutral-200">
            <MapPin className="w-4 h-4 text-[#ffcc00] flex-shrink-0" />
            <span>விளங்காடு கிராமம், அச்சரப்பாக்கம் வட்டம், செங்கல்பட்டு மாவட்டம்.</span>
          </p>
          <p className="flex items-center gap-2 text-neutral-200">
            <Phone className="w-4 h-4 text-[#ffcc00] flex-shrink-0" />
            <span>தொடர்பு எண்: <a href="tel:8807757529" className="font-bold text-[#ffcc00] hover:underline">8807757529</a></span>
          </p>
        </div>

        {/* Credits */}
        <div className="text-xs text-neutral-300 space-y-2 md:text-right">
          <h4 className="font-extrabold text-[#ffcc00] text-xs uppercase tracking-wider mb-2">டிஜிட்டல் குரல்:</h4>
          <p>AI தொழில்நுட்பத்துடன் வடிவமைக்கப்பட்ட நவீன மக்கள் குறைகேட்பு மையம்.</p>
          <p className="text-[11px] text-neutral-400 pt-2 border-t border-[#600000]">
            © 2026 விளங்காடு கிராமம் மக்கள் குறைதீர்வு மையம்.
          </p>
        </div>

      </div>
    </footer>
  );
};
