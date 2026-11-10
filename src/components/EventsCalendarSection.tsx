import React, { useState } from 'react';
import { CivicEvent, EventCategory } from '../types';
import { 
  Calendar as CalendarIcon, 
  MapPin, 
  Clock, 
  Users, 
  Phone, 
  PlusCircle, 
  CheckCircle2, 
  Share2, 
  Download, 
  Search, 
  Filter, 
  Sparkles, 
  Trash2, 
  ChevronLeft, 
  ChevronRight,
  UserCheck,
  Building2,
  Droplets,
  HeartPulse,
  Flame,
  X,
  Check
} from 'lucide-react';
import { useToast } from './ToastContainer';
import { downloadEventPDF } from '../utils/pdfGenerator';

const getLocalDateValue = (date = new Date()): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const escapeICSText = (value: string): string =>
  value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');

const getEventTimes = (date: string, timeText: string): { start: string; end: string } => {
  const matches = Array.from(timeText.matchAll(/(\d{1,2}):(\d{2})/g));
  const parseTime = (match: RegExpMatchArray, context: string): number | null => {
    let hours = Number(match[1]);
    const minutes = Number(match[2]);
    if (hours > 23 || minutes > 59) return null;

    const isAfternoon = /பிற்பகல்|மாலை|இரவு/.test(context);
    const isMorning = /காலை|முற்பகல்/.test(context);
    if (hours <= 12 && (isAfternoon || isMorning)) {
      if (isAfternoon && hours < 12) hours += 12;
      if (isMorning && hours === 12) hours = 0;
    }

    return hours * 60 + minutes;
  };

  const first = matches[0];
  const second = matches[1];
  const startMinutes = first
    ? parseTime(first, timeText.slice(0, first.index))
    : null;
  const endContext = second && first
    ? timeText.slice(first.index! + first[0].length, second.index)
    : '';
  const endMinutes = second
    ? parseTime(second, endContext || timeText.slice(0, second.index))
    : null;

  const validDate = /^\d{4}-\d{2}-\d{2}$/.test(date);
  const start = validDate && startMinutes !== null
    ? `${date.replace(/-/g, '')}T${String(Math.floor(startMinutes / 60)).padStart(2, '0')}${String(startMinutes % 60).padStart(2, '0')}00`
    : `${date.replace(/-/g, '')}T090000`;

  let endDate = date;
  let resolvedEndMinutes = endMinutes;
  if (resolvedEndMinutes === null) {
    resolvedEndMinutes = (startMinutes ?? 540) + 60;
  }
  if (startMinutes !== null && resolvedEndMinutes <= startMinutes) {
    const nextDay = new Date(`${date}T00:00:00`);
    nextDay.setDate(nextDay.getDate() + 1);
    endDate = getLocalDateValue(nextDay);
  }

  const end = `${endDate.replace(/-/g, '')}T${String(Math.floor(resolvedEndMinutes / 60) % 24).padStart(2, '0')}${String(resolvedEndMinutes % 60).padStart(2, '0')}00`;
  return { start, end };
};

interface EventsCalendarSectionProps {
  events: CivicEvent[];
  onAddEvent: (newEvent: CivicEvent) => void;
  onToggleRsvp: (eventId: string) => void;
}

export const EventsCalendarSection: React.FC<EventsCalendarSectionProps> = ({
  events,
  onAddEvent,
  onToggleRsvp
}) => {
  const { addToast } = useToast();

  const [selectedCategory, setSelectedCategory] = useState<EventCategory | 'all'>('all');
  const [selectedWard, setSelectedWard] = useState<number>(0); // 0 = all
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
  
  // Date selection in Calendar Grid (YYYY-MM-DD or null)
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Current Calendar Display Month/Year
  const [currentCalendarDate, setCurrentCalendarDate] = useState<Date>(
    () => new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  );

  // Propose New Event Modal
  const [isProposeModalOpen, setIsProposeModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    category: 'ward_meeting' as EventCategory,
    date: getLocalDateValue(),
    time: 'காலை 09:30 - பிற்பகல் 12:30',
    location: '',
    wardNo: 1,
    organizer: '',
    organizerPhone: '',
    description: '',
    badge: 'கிராம சபை'
  });

  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Filter events
  const filteredEvents = events.filter(evt => {
    if (selectedCategory !== 'all' && evt.category !== selectedCategory) return false;
    if (selectedWard !== 0 && evt.wardNo !== 0 && evt.wardNo !== selectedWard) return false;
    if (selectedDate && evt.date !== selectedDate) return false;
    
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchTitle = evt.title.toLowerCase().includes(term);
      const matchLocation = evt.location.toLowerCase().includes(term);
      const matchOrg = evt.organizer.toLowerCase().includes(term);
      if (!matchTitle && !matchLocation && !matchOrg) return false;
    }
    return true;
  });

  // Export event to .ics file for Google / Apple Calendar
  const handleExportICS = (evt: CivicEvent) => {
    const { start, end } = getEventTimes(evt.date, evt.time);
    const description = `${evt.description} | அமைப்பாளர்: ${evt.organizer} (${evt.organizerPhone})`;

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Vilangaadu Civic Events//TA',
      'CALSCALE:GREGORIAN',
      'BEGIN:VEVENT',
      `UID:${escapeICSText(evt.id)}@vilangaadu-civic-events`,
      `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')}`,
      `SUMMARY:${escapeICSText(evt.title)}`,
      `DESCRIPTION:${escapeICSText(description)}`,
      `LOCATION:${escapeICSText(evt.location)}`,
      `DTSTART;TZID=Asia/Kolkata:${start}`,
      `DTEND;TZID=Asia/Kolkata:${end}`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `TVK_Event_${evt.id}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.setTimeout(() => window.URL.revokeObjectURL(link.href), 1000);

    addToast({
      title: 'பதிவிறக்கம் முடிந்தது',
      message: `${evt.title} நாட்காட்டி கோப்பு (.ics) பதிவிறக்கம் செய்யப்பட்டது!`,
      type: 'success'
    });
  };

  const handleExportPDF = async (evt: CivicEvent) => {
    try {
      await downloadEventPDF(evt);
      addToast({
        title: 'PDF பதிவிறக்கம் தொடங்கியது',
        message: `${evt.title} நிகழ்வு PDF தயாராக உள்ளது.`,
        type: 'success'
      });
    } catch (error) {
      addToast({
        title: 'PDF பதிவிறக்கம் தோல்வியடைந்தது',
        message: error instanceof Error ? error.message : 'நிகழ்வு PDF உருவாக்க முடியவில்லை.',
        type: 'warning'
      });
    }
  };

  // Share Event via WhatsApp / Clipboard
  const handleShareEvent = async (evt: CivicEvent) => {
    const text = `📌 *அச்சரப்பாக்கம் வார்டு நிகழ்வு:*
*${evt.title}*
📅 தேதி: ${evt.date} (${evt.time})
📍 இடம்: ${evt.location}
👤 அமைப்பாளர்: ${evt.organizer} (${evt.organizerPhone})

கூடுதல் தகவல்களுக்கு TVK அச்சரப்பாக்கம் மக்கள் குறைதீர்ப்பு மைய இணையதளத்தைப் பார்க்கவும்: ${window.location.origin}`;

    if (!navigator.clipboard?.writeText) {
      addToast({
        title: 'பகிர முடியவில்லை',
        message: 'இந்த உலாவியில் நகலெடுக்கும் வசதி இல்லை.',
        type: 'warning'
      });
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(evt.id);
      setTimeout(() => setCopiedId(null), 2500);
      addToast({
        title: 'நிகழ்வு தகவல் நகலெடுக்கப்பட்டது',
        message: 'நிகழ்வு தகவல்கள் நகலெடுக்கப்பட்டது! (Copied)',
        type: 'info'
      });
    } catch (error) {
      console.error('Event share copy failed:', error);
      addToast({
        title: 'நகலெடுக்க முடியவில்லை',
        message: 'நிகழ்வு தகவலை clipboard-க்கு நகலெடுக்க முடியவில்லை.',
        type: 'warning'
      });
    }
  };

  // Propose New Event Submit
  const handleProposeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.location || !formData.organizer) {
      addToast({
        title: 'விவரங்கள் தேவை',
        message: 'தயவுசெய்து அனைத்து விவரங்களையும் நிரப்பவும்',
        type: 'warning'
      });
      return;
    }

    let badge = 'கிராம சபை';
    if (formData.category === 'sanitation_drive') badge = 'தூய்மைப் பணி';
    else if (formData.category === 'outreach_program') badge = 'மனுநீதி முகாம்';
    else if (formData.category === 'health_camp') badge = 'மருத்துவ முகாம்';
    else if (formData.category === 'water_inspection') badge = 'குடிநீர் ஆய்வு';

    const newEvt: CivicEvent = {
      id: `evt-custom-${Date.now()}`,
      title: formData.title,
      category: formData.category,
      date: formData.date,
      time: formData.time || 'காலை 09:30',
      location: formData.location,
      wardNo: Number(formData.wardNo),
      organizer: formData.organizer,
      organizerPhone: formData.organizerPhone || '91765 93129',
      description: formData.description || 'மக்கள் பங்கேற்புடன் நடைபெறவுள்ள உள்ளூர் நிகழ்வு.',
      attendeesCount: 1,
      userRsvp: true,
      badge: badge,
      status: 'upcoming'
    };

    onAddEvent(newEvt);
    setIsProposeModalOpen(false);
    addToast({
      title: 'நிகழ்வு சேர்க்கப்பட்டது',
      message: 'புதிய நிகழ்வு வெற்றிகரமாகச் சேர்க்கப்பட்டது!',
      type: 'success'
    });

    // Reset Form
    setFormData({
      title: '',
      category: 'ward_meeting',
      date: getLocalDateValue(),
      time: 'காலை 09:30 - பிற்பகல் 12:30',
      location: '',
      wardNo: 1,
      organizer: '',
      organizerPhone: '',
      description: '',
      badge: 'கிராம சபை'
    });
  };

  // Calendar Month Navigation
  const year = currentCalendarDate.getFullYear();
  const month = currentCalendarDate.getMonth(); // 0 = Jan, 6 = July, 7 = Aug

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const monthNamesTa = [
    'ஜனவரி', 'பிப்ரவரி', 'மார்ச்', 'ஏப்ரல்', 'மே', 'ஜூன்',
    'ஜூலை', 'ஆகஸ்ட்', 'செப்டம்பர்', 'அக்டோபர்', 'நவம்பர்', 'டிசம்பர்'
  ];

  const categoryIcons: Record<EventCategory, React.ReactNode> = {
    ward_meeting: <Users className="w-4 h-4 text-amber-600" />,
    sanitation_drive: <Sparkles className="w-4 h-4 text-emerald-600" />,
    outreach_program: <Building2 className="w-4 h-4 text-blue-600" />,
    health_camp: <HeartPulse className="w-4 h-4 text-rose-600" />,
    water_inspection: <Droplets className="w-4 h-4 text-cyan-600" />,
    grievance_camp: <CalendarIcon className="w-4 h-4 text-[#4a0000]" />
  };

  const getCategoryLabelTa = (cat: EventCategory) => {
    switch(cat) {
      case 'ward_meeting': return 'கிராம சபை கூட்டம்';
      case 'sanitation_drive': return 'தூய்மைப் பணி';
      case 'outreach_program': return 'அரசு சேவை முகாம்';
      case 'health_camp': return 'மருத்துவ முகாம்';
      case 'water_inspection': return 'குடிநீர் ஆய்வு';
      case 'grievance_camp': return 'மனுநீதி முகாம்';
      default: return 'பொது நிகழ்வு';
    }
  };

  const getEventStatus = (evt: CivicEvent) => {
    if (evt.status === 'completed' || evt.date < getLocalDateValue()) {
      return { label: 'நிறைவடைந்தது', className: 'bg-neutral-100 text-neutral-600' };
    }
    if (evt.status === 'ongoing' || evt.date === getLocalDateValue()) {
      return { label: 'இன்று நடைபெறுகிறது', className: 'bg-emerald-100 text-emerald-800' };
    }
    return { label: 'வரவுள்ளது', className: 'bg-blue-100 text-blue-800' };
  };

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#4a0000] via-[#380000] to-[#4a0000] border-b-4 border-[#ffcc00] rounded-2xl p-6 sm:p-8 text-white shadow-lg mb-8 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 opacity-10 pointer-events-none flex items-center pr-8">
          <CalendarIcon className="w-64 h-64 text-[#ffcc00]" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-[#ffcc00] text-[#4a0000] font-black text-xs px-3 py-1 rounded-full uppercase tracking-wider shadow-sm flex items-center gap-1.5">
                <CalendarIcon className="w-3.5 h-3.5" />
                <span>உள்ளூர் நிகழ்வுகள் நாட்காட்டி</span>
              </span>
              <span className="bg-white/10 text-neutral-200 text-xs px-2.5 py-0.5 rounded-full border border-white/20">
                அச்சரப்பாக்கம் பேரூராட்சி
              </span>
            </div>

            <h2 className="text-2xl sm:text-4xl font-black text-white leading-tight mb-2">
              📅 வார்டு கிராம சபைகள் & தூய்மை முகாம்கள்
            </h2>

            <p className="text-sm sm:text-base text-neutral-200 max-w-2xl leading-relaxed">
              அச்சரப்பாக்கம் 15 வார்டுகளிலும் நடைபெறும் மக்கள் குறைதீர்க்கும் கிராம சபை கூட்டங்கள், தூய்மை முகாம்கள் மற்றும் இலவச மருத்துவ முகாம் விவரங்களை அறிந்து பங்கேற்கவும்.
            </p>
          </div>

          <button
            onClick={() => setIsProposeModalOpen(true)}
            className="px-5 py-3 bg-[#ffcc00] hover:bg-[#e6b800] text-[#4a0000] font-black text-sm rounded-xl shadow-md transition-all flex items-center gap-2 shrink-0 border border-[#e6b800] active:scale-95 cursor-pointer"
          >
            <PlusCircle className="w-5 h-5 text-[#4a0000]" />
            <span>புதிய நிகழ்வு முன்மொழிய (Propose Event)</span>
          </button>
        </div>
      </div>

      {/* Filter and View Bar */}
      <div className="bg-white border border-neutral-200 rounded-2xl p-4 sm:p-5 shadow-sm mb-8">
        
        {/* Top Filters & Search */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="நிகழ்வு அல்லது இடம் தேடுக..."
              className="w-full pl-10 pr-4 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-[#4a0000] focus:ring-1 focus:ring-[#4a0000]"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>

          {/* Ward Select Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-[#4a0000] shrink-0" />
            <select
              value={selectedWard}
              onChange={(e) => setSelectedWard(Number(e.target.value))}
              className="w-full py-2 px-3 bg-neutral-50 border border-neutral-200 rounded-xl text-xs sm:text-sm font-semibold text-neutral-800 focus:outline-none focus:border-[#4a0000]"
            >
              <option value={0}>அனைத்து 15 வார்டுகளும் (All Wards)</option>
              {Array.from({ length: 15 }, (_, i) => i + 1).map((w) => (
                <option key={w} value={w}>
                  வார்டு {w} நிகழ்வுகள்
                </option>
              ))}
            </select>
          </div>

          {/* View Mode Switch */}
          <div className="flex items-center justify-end gap-2 bg-neutral-100 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('grid')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                viewMode === 'grid'
                  ? 'bg-[#4a0000] text-white shadow-2xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              <span>நாட்காட்டி (Grid)</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                viewMode === 'list'
                  ? 'bg-[#4a0000] text-white shadow-2xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>பட்டியல் ({filteredEvents.length})</span>
            </button>
          </div>

        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-t border-neutral-100 pt-3">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
              selectedCategory === 'all'
                ? 'bg-[#4a0000] text-white border-[#4a0000]'
                : 'bg-neutral-50 text-neutral-700 border-neutral-200 hover:bg-neutral-100'
            }`}
          >
            🌟 அனைத்து நிகழ்வுகளும்
          </button>
          <button
            onClick={() => setSelectedCategory('ward_meeting')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border flex items-center gap-1.5 ${
              selectedCategory === 'ward_meeting'
                ? 'bg-amber-600 text-white border-amber-600'
                : 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>கிராம சபை</span>
          </button>
          <button
            onClick={() => setSelectedCategory('sanitation_drive')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border flex items-center gap-1.5 ${
              selectedCategory === 'sanitation_drive'
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-emerald-50 text-emerald-900 border-emerald-200 hover:bg-emerald-100'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>தூய்மைப் பணி</span>
          </button>
          <button
            onClick={() => setSelectedCategory('outreach_program')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border flex items-center gap-1.5 ${
              selectedCategory === 'outreach_program'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-blue-50 text-blue-900 border-blue-200 hover:bg-blue-100'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>அரசு சேவை முகாம்</span>
          </button>
          <button
            onClick={() => setSelectedCategory('health_camp')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border flex items-center gap-1.5 ${
              selectedCategory === 'health_camp'
                ? 'bg-rose-600 text-white border-rose-600'
                : 'bg-rose-50 text-rose-900 border-rose-200 hover:bg-rose-100'
            }`}
          >
            <HeartPulse className="w-3.5 h-3.5" />
            <span>மருத்துவ முகாம்</span>
          </button>
          <button
            onClick={() => setSelectedCategory('water_inspection')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border flex items-center gap-1.5 ${
              selectedCategory === 'water_inspection'
                ? 'bg-cyan-600 text-white border-cyan-600'
                : 'bg-cyan-50 text-cyan-900 border-cyan-200 hover:bg-cyan-100'
            }`}
          >
            <Droplets className="w-3.5 h-3.5" />
            <span>குடிநீர் ஆய்வு</span>
          </button>
        </div>

        {/* Selected Date Filter Banner (if date clicked on calendar) */}
        {selectedDate && (
          <div className="mt-3 p-2.5 bg-[#4a0000]/10 border border-[#4a0000]/20 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-[#4a0000]">
              <CalendarIcon className="w-4 h-4" />
              <span>தேர்ந்தெடுக்கப்பட்ட தேதி: {selectedDate} ({filteredEvents.length} நிகழ்வுகள்)</span>
            </div>
            <button
              onClick={() => setSelectedDate(null)}
              className="text-xs font-bold text-neutral-600 hover:text-[#4a0000] underline cursor-pointer"
            >
              அனைத்து நாட்களையும் காட்டு (Clear Filter)
            </button>
          </div>
        )}

      </div>

      {/* Calendar Grid View */}
      {viewMode === 'grid' && (
        <div className="bg-white border border-neutral-200 rounded-2xl shadow-sm overflow-hidden mb-8">
          
          {/* Calendar Month Header Navigation */}
          <div className="bg-neutral-900 text-white p-4 flex items-center justify-between">
            <button
              onClick={() => setCurrentCalendarDate(new Date(year, month - 1, 1))}
              className="p-1.5 hover:bg-neutral-800 rounded-lg transition-all text-neutral-300 hover:text-white"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="text-center">
              <h3 className="text-lg font-black text-[#ffcc00]">
                {monthNamesTa[month]} {year}
              </h3>
              <p className="text-[11px] text-neutral-400 font-semibold">
                அச்சரப்பாக்கம் உள்ளூர் நிகழ்வுகள் நாட்காட்டி
              </p>
            </div>

            <button
              onClick={() => setCurrentCalendarDate(new Date(year, month + 1, 1))}
              className="p-1.5 hover:bg-neutral-800 rounded-lg transition-all text-neutral-300 hover:text-white"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Days of the Week Header */}
          <div className="grid grid-cols-7 bg-neutral-100 text-center py-2 border-b border-neutral-200 text-xs font-bold text-neutral-700">
            <span>ஞாயிறு</span>
            <span>திங்கள்</span>
            <span>செவ்வாய்</span>
            <span>புதன்</span>
            <span>வியாழன்</span>
            <span>வெள்ளி</span>
            <span>சனி</span>
          </div>

          {/* Calendar Day Grid Cells */}
          <div className="grid grid-cols-7 auto-rows-fr bg-neutral-200 gap-px">
            {/* Empty Offset Days */}
            {Array.from({ length: firstDayOfMonth }).map((_, idx) => (
              <div key={`empty-${idx}`} className="bg-neutral-50/50 min-h-[80px] p-1.5"></div>
            ))}

            {/* Days of Month */}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const dayNum = idx + 1;
              const formattedDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
              
              const dayEvents = events.filter(e => e.date === formattedDate);
              const isSelected = selectedDate === formattedDate;

              return (
                <div
                  key={dayNum}
                  onClick={() => {
                    if (dayEvents.length > 0) {
                      setSelectedDate(selectedDate === formattedDate ? null : formattedDate);
                    }
                  }}
                  className={`bg-white min-h-[90px] p-2 transition-all flex flex-col justify-between ${
                    dayEvents.length > 0 ? 'cursor-pointer hover:bg-amber-50/80' : ''
                  } ${isSelected ? 'ring-2 ring-[#4a0000] bg-amber-100/50' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-extrabold ${
                      dayEvents.length > 0 ? 'text-[#4a0000] bg-[#ffcc00] w-6 h-6 rounded-full flex items-center justify-center shadow-2xs' : 'text-neutral-700'
                    }`}>
                      {dayNum}
                    </span>
                    {dayEvents.length > 0 && (
                      <span className="text-[10px] font-black text-white bg-[#4a0000] px-1.5 py-0.2 rounded-full">
                        {dayEvents.length} நிகழ்வு
                      </span>
                    )}
                  </div>

                  <div className="mt-1 space-y-1">
                    {dayEvents.map(evt => (
                      <div
                        key={evt.id}
                        className="text-[10px] p-1 rounded bg-[#4a0000]/10 text-[#4a0000] font-bold truncate border-l-2 border-[#4a0000]"
                        title={evt.title}
                      >
                        {evt.badge}: {evt.title}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* Events List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredEvents.length === 0 ? (
          <div className="col-span-full bg-white border border-neutral-200 rounded-2xl p-12 text-center">
            <CalendarIcon className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-neutral-800 mb-1">நிகழ்வுகள் எதுவும் காணப்படவில்லை</h3>
            <p className="text-xs text-neutral-500 max-w-md mx-auto mb-4">
              நீங்கள் தேர்ந்தெடுத்த வார்டு அல்லது பிரிவில் வரவிருக்கும் நிகழ்வுகள் எதுவும் இல்லை.
            </p>
            <button
              onClick={() => {
                setSelectedCategory('all');
                setSelectedWard(0);
                setSelectedDate(null);
                setSearchTerm('');
              }}
              className="px-4 py-2 bg-[#4a0000] text-white font-bold text-xs rounded-xl"
            >
              அனைத்து நிகழ்வுகளையும் காட்டு
            </button>
          </div>
        ) : (
          filteredEvents.map((evt) => {
            const dateObj = new Date(evt.date);
            const dayNum = dateObj.getDate();
            const monthStr = dateObj.toLocaleDateString('ta-IN', { month: 'short' });
            const eventStatus = getEventStatus(evt);

            return (
              <div
                key={evt.id}
                className="bg-white border border-neutral-200 rounded-2xl shadow-sm hover:shadow-md transition-all p-5 sm:p-6 flex flex-col justify-between relative overflow-hidden group"
              >
                {/* Accent Top Border Bar */}
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#4a0000] via-[#ffcc00] to-[#4a0000]"></div>

                <div>
                  {/* Top Badge & Date Row */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    
                    {/* Date Stamp Pill */}
                    <div className="bg-[#4a0000] text-white rounded-xl p-2.5 text-center min-w-[64px] shrink-0 border border-[#ffcc00]/40 shadow-2xs">
                      <div className="text-xl font-black leading-none text-[#ffcc00]">{dayNum}</div>
                      <div className="text-[10px] font-bold uppercase tracking-wider mt-0.5">{monthStr}</div>
                    </div>

                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-1.5 mb-1">
                        <span className="bg-[#4a0000]/10 text-[#4a0000] border border-[#4a0000]/20 text-[11px] font-extrabold px-2.5 py-0.5 rounded-md flex items-center gap-1">
                          {categoryIcons[evt.category]}
                          <span>{evt.badge}</span>
                        </span>

                        <span className="bg-amber-100 text-amber-900 text-[11px] font-bold px-2.5 py-0.5 rounded-md">
                          {evt.wardNo === 0 ? 'அனைத்து வார்டுகளும்' : `வார்டு ${evt.wardNo}`}
                        </span>

                        <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-md ${eventStatus.className}`}>
                          {eventStatus.label}
                        </span>
                      </div>

                      <h3 className="text-base sm:text-lg font-extrabold text-neutral-900 leading-snug group-hover:text-[#4a0000] transition-colors">
                        {evt.title}
                      </h3>
                    </div>

                  </div>

                  {/* Time & Location Meta */}
                  <div className="space-y-2 text-xs text-neutral-700 mb-4 bg-neutral-50 p-3 rounded-xl border border-neutral-100">
                    <div className="flex items-center gap-2 font-medium">
                      <Clock className="w-4 h-4 text-[#4a0000] shrink-0" />
                      <span>{evt.time}</span>
                    </div>

                    <div className="flex items-start gap-2 font-semibold text-neutral-900">
                      <MapPin className="w-4 h-4 text-[#4a0000] shrink-0 mt-0.5" />
                      <span>{evt.location}</span>
                    </div>

                    <div className="flex items-center gap-2 font-medium text-neutral-600">
                      <UserCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span>அமைப்பாளர்: {evt.organizer} (<a href={`tel:${evt.organizerPhone}`} className="text-[#4a0000] underline font-bold">{evt.organizerPhone}</a>)</span>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed mb-4">
                    {evt.description}
                  </p>
                </div>

                {/* Footer Action Controls */}
                <div className="pt-3 border-t border-neutral-100 flex flex-wrap items-center justify-between gap-3">
                  
                  {/* RSVP Counter & Button */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onToggleRsvp(evt.id)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer ${
                        evt.userRsvp
                          ? 'bg-emerald-600 text-white'
                          : 'bg-[#ffcc00] hover:bg-[#e6b800] text-[#4a0000] border border-[#e6b800]'
                      }`}
                    >
                      {evt.userRsvp ? (
                        <>
                          <Check className="w-4 h-4" />
                          <span>பதிவு செய்யப்பட்டுள்ளது</span>
                        </>
                      ) : (
                        <>
                          <Users className="w-4 h-4 text-[#4a0000]" />
                          <span>நான் பங்கேற்கிறேன் (RSVP)</span>
                        </>
                      )}
                    </button>

                    <span className="text-xs font-extrabold text-neutral-700 bg-neutral-100 px-2.5 py-1.5 rounded-lg">
                      👥 {evt.attendeesCount} மக்கள்
                    </span>
                  </div>

                  {/* Export & Share Controls */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleExportICS(evt)}
                      className="p-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-xl transition-all"
                      title="நாட்காட்டி கோப்பு (.ics) பதிவிறக்கம்"
                      aria-label={`${evt.title} நாட்காட்டி கோப்பைப் பதிவிறக்கு`}
                    >
                      <Download className="w-4 h-4 text-[#4a0000]" />
                    </button>

                    <button
                      onClick={() => void handleExportPDF(evt)}
                      className="p-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-xl transition-all"
                      title="நிகழ்வு PDF பதிவிறக்கம்"
                      aria-label={`${evt.title} நிகழ்வு PDF-ஐப் பதிவிறக்கு`}
                    >
                      <Download className="w-4 h-4 text-rose-700" />
                    </button>

                    <button
                      onClick={() => handleShareEvent(evt)}
                      className="p-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-xl transition-all flex items-center gap-1 text-xs font-bold"
                      title="பகிர்க (Share Event)"
                    >
                      {copiedId === evt.id ? (
                        <Check className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Share2 className="w-4 h-4 text-[#4a0000]" />
                      )}
                    </button>
                  </div>

                </div>

              </div>
            );
          })
        )}
      </div>

      {/* Propose Event Modal */}
      {isProposeModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl relative border-2 border-[#4a0000] animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            
            <button
              onClick={() => setIsProposeModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 text-neutral-400 hover:text-neutral-700 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-[#4a0000] text-[#ffcc00] rounded-xl">
                <CalendarIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-[#4a0000]">புதிய உள்ளூர் நிகழ்வு முன்மொழிதல்</h3>
                <p className="text-xs text-neutral-500">கிராம சபை, தூய்மைப் பணி அல்லது சேவை முகாம் விவரங்களைப் பதிவு செய்க</p>
              </div>
            </div>

            <form onSubmit={handleProposeSubmit} className="space-y-4">
              
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  நிகழ்வின் தலைப்பு (Event Title) *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="எ.கா: வார்டு 8 சாக்கடை தூர்வாரும் கூட்டுப் பணி"
                  className="w-full px-3 py-2 border border-neutral-300 rounded-xl text-xs sm:text-sm font-medium focus:border-[#4a0000] focus:ring-1 focus:ring-[#4a0000]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    நிகழ்வு வகை (Category)
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as EventCategory })}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-xl text-xs font-medium focus:border-[#4a0000]"
                  >
                    <option value="ward_meeting">கிராம சபை கூட்டம்</option>
                    <option value="sanitation_drive">தூய்மைப் பணி</option>
                    <option value="outreach_program">அரசு சேவை முகாம்</option>
                    <option value="health_camp">மருத்துவ முகாம்</option>
                    <option value="water_inspection">குடிநீர் ஆய்வு</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    வார்டு எண் (Ward No)
                  </label>
                  <select
                    value={formData.wardNo}
                    onChange={(e) => setFormData({ ...formData, wardNo: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-xl text-xs font-medium focus:border-[#4a0000]"
                  >
                    <option value={0}>அனைத்து வார்டுகளும் (All)</option>
                    {Array.from({ length: 15 }, (_, i) => i + 1).map((w) => (
                      <option key={w} value={w}>வார்டு {w}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    தேதி (Date) *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-xl text-xs font-medium focus:border-[#4a0000]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    நேரம் (Time)
                  </label>
                  <input
                    type="text"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    placeholder="எ.கா: காலை 09:30 - பிற்பகல் 12:30"
                    className="w-full px-3 py-2 border border-neutral-300 rounded-xl text-xs font-medium focus:border-[#4a0000]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  நடைபெறும் இடம் (Location Venue) *
                </label>
                <input
                  type="text"
                  required
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="எ.கா: சமுதாயக்கூடம், வார்டு 8, அச்சரப்பாக்கம்"
                  className="w-full px-3 py-2 border border-neutral-300 rounded-xl text-xs font-medium focus:border-[#4a0000]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    அமைப்பாளர் பெயர் (Organizer) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.organizer}
                    onChange={(e) => setFormData({ ...formData, organizer: e.target.value })}
                    placeholder="எ.கா: TVK வார்டு 8 கிளை"
                    className="w-full px-3 py-2 border border-neutral-300 rounded-xl text-xs font-medium focus:border-[#4a0000]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    தொடர்பு எண் (Phone)
                  </label>
                  <input
                    type="tel"
                    value={formData.organizerPhone}
                    onChange={(e) => setFormData({ ...formData, organizerPhone: e.target.value })}
                    placeholder="எ.கா: 94441 23008"
                    className="w-full px-3 py-2 border border-neutral-300 rounded-xl text-xs font-medium focus:border-[#4a0000]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  விளக்கம் (Event Description)
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="நிகழ்வின் நோக்கங்கள் மற்றும் பொதுமக்கள் கொண்டுவர வேண்டிய ஆவணங்கள்..."
                  className="w-full px-3 py-2 border border-neutral-300 rounded-xl text-xs font-medium focus:border-[#4a0000]"
                ></textarea>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsProposeModalOpen(false)}
                  className="px-4 py-2 border border-neutral-300 text-neutral-700 text-xs font-bold rounded-xl hover:bg-neutral-100"
                >
                  ரத்து செய்க
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#4a0000] hover:bg-[#380000] text-[#ffcc00] text-xs font-black rounded-xl shadow-md cursor-pointer"
                >
                  நிகழ்வைச் சேர்
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
