import React from 'react';
import { Announcement } from '../types';
import { Bell, Calendar, AlertTriangle, ShieldCheck } from 'lucide-react';

interface AnnouncementsSectionProps {
  announcements: Announcement[];
}

export const AnnouncementsSection: React.FC<AnnouncementsSectionProps> = ({ announcements }) => {
  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
      
      {/* Header */}
      <div className="mb-8 text-center">
        <span className="text-xs font-bold text-[#4a0000] bg-[#4a0000]/10 border border-[#4a0000]/20 px-3 py-1 rounded-full uppercase tracking-wider">
          முக்கிய அறிவிப்புகள்
        </span>
        <h2 className="text-2xl sm:text-4xl font-extrabold text-[#4a0000] mt-2 mb-2">
          📢 பேரூராட்சி செய்திகள் & நிகழ்வுகள்
        </h2>
        <p className="text-sm sm:text-base text-neutral-600">
          அச்சரப்பாக்கம் மக்கள் குறைதீர்ப்பு முகாம்கள், குடிநீர் விநியோக நேர மாற்றங்கள் மற்றும் TVK செய்திகள்.
        </p>
      </div>

      {/* List */}
      <div className="space-y-4">
        {announcements.map((item) => (
          <div
            key={item.id}
            className={`bg-white border rounded-xl p-6 shadow-sm relative overflow-hidden transition-all hover:shadow-md ${
              item.isImportant ? 'border-amber-400 ring-1 ring-amber-300' : 'border-neutral-200'
            }`}
          >
            {item.isImportant && (
              <div className="bg-amber-500 text-white text-[10px] font-extrabold uppercase px-3 py-1 rounded-bl-lg absolute top-0 right-0 tracking-wider flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                <span>முக்கிய அறிவிப்பு</span>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="bg-[#4a0000] text-white text-xs font-bold px-2.5 py-0.5 rounded-md">
                {item.badge}
              </span>

              <span className="text-xs text-neutral-500 flex items-center gap-1 font-medium">
                <Calendar className="w-3.5 h-3.5 text-[#4a0000]" />
                <span>{item.date}</span>
              </span>
            </div>

            <h3 className="text-base sm:text-lg font-extrabold text-neutral-900 mb-2 leading-snug">
              {item.title}
            </h3>

            <p className="text-sm text-neutral-700 leading-relaxed">
              {item.content}
            </p>
          </div>
        ))}
      </div>

    </div>
  );
};
