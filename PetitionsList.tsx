import React, { useState } from 'react';
import { getIssueCategoryShortLabel, ISSUE_CATEGORIES, Petition, IssueCategory, PetitionStatus } from '../types';
import { Search, Filter, MapPin, ThumbsUp, Clock, CheckCircle2, MessageSquare, AlertCircle, Calendar, ArrowUpRight, Droplets, Lightbulb, Construction, HeartPulse, HelpCircle, Map, LayoutGrid, Activity, FileText, CheckCheck, ArrowRight, TrendingUp, Sparkles, ShieldCheck, Printer, QrCode, Download, FileSpreadsheet, Camera } from 'lucide-react';
import { PetitionsMap } from './PetitionsMap';
import { downloadPetitionPDF, downloadFilteredPetitionsPDF } from '../utils/pdfGenerator';
import { useToast } from './ToastContainer';

interface PetitionsListProps {
  petitions: Petition[];
  onSelectPetition: (petition: Petition) => void;
  onUpvote: (id: string, e: React.MouseEvent) => void;
  onOpenNewPetition: () => void;
  selectedWardFilter: number | 'all';
  setSelectedWardFilter: (ward: number | 'all') => void;
  selectedCategoryFilter: IssueCategory | 'all';
  setSelectedCategoryFilter: (cat: IssueCategory | 'all') => void;
  selectedStatusFilter: PetitionStatus | 'all';
  setSelectedStatusFilter: (status: PetitionStatus | 'all') => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  onOpenPrintableQr?: (petitionId?: string) => void;
}

export const PetitionsList: React.FC<PetitionsListProps> = ({
  petitions,
  onSelectPetition,
  onUpvote,
  onOpenNewPetition,
  selectedWardFilter,
  setSelectedWardFilter,
  selectedCategoryFilter,
  setSelectedCategoryFilter,
  selectedStatusFilter,
  setSelectedStatusFilter,
  searchTerm,
  setSearchTerm,
  onOpenPrintableQr
}) => {
  const [showMap, setShowMap] = useState<boolean>(true);
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);
  const [generatingPdfId, setGeneratingPdfId] = useState<string | null>(null);
  const { addToast } = useToast();

  const handleExportPDF = async () => {
    if (petitions.length === 0) return;
    setIsExportingPdf(true);
    try {
      const generated = await downloadFilteredPetitionsPDF(petitions, {
        ward: selectedWardFilter,
        category: selectedCategoryFilter,
        status: selectedStatusFilter,
        searchTerm
      });
      if (!generated) throw new Error('PDF generation did not complete');
      addToast({
        type: 'success',
        title: 'PDF பதிவிறக்கம் தொடங்கியது',
        message: 'வடிகட்டிய மனுக்கள் PDF அறிக்கை தயாராக உள்ளது.'
      });
    } catch (err) {
      console.error("PDF Export error:", err);
      addToast({
        type: 'warning',
        title: 'PDF அறிக்கை உருவாக்க முடியவில்லை',
        message: err instanceof Error ? err.message : 'மீண்டும் முயற்சிக்கவும்.'
      });
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleDownloadPetitionPDF = async (petition: Petition) => {
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
      console.error("Petition PDF export error:", err);
      addToast({
        type: 'warning',
        title: 'மனு PDF உருவாக்க முடியவில்லை',
        message: err instanceof Error ? err.message : 'மீண்டும் முயற்சிக்கவும்.'
      });
    } finally {
      setGeneratingPdfId(null);
    }
  };

  const getCategoryBadge = (category: IssueCategory) => {
    switch (category) {
      case 'water':
        return { label: 'குடிநீர்', color: 'bg-blue-50 text-blue-700 border-blue-200', icon: Droplets };
      case 'road':
        return { label: 'சாலைகள்', color: 'bg-amber-50 text-amber-800 border-amber-200', icon: Construction };
      case 'light':
        return { label: 'தெருவிளக்கு', color: 'bg-yellow-50 text-yellow-800 border-yellow-200', icon: Lightbulb };
      case 'health':
        return { label: 'சுகாதாரம்', color: 'bg-emerald-50 text-emerald-800 border-emerald-200', icon: HeartPulse };
      default:
        return {
          label: getIssueCategoryShortLabel(category),
          color: 'bg-purple-50 text-purple-700 border-purple-200',
          icon: HelpCircle
        };
    }
  };

  const getStatusBadge = (status: PetitionStatus) => {
    switch (status) {
      case 'resolved':
        return { label: 'தீர்க்கப்பட்டது', bg: 'bg-emerald-100 text-emerald-800 border border-emerald-300' };
      case 'action_taken':
        return { label: 'நடவடிக்கை எடுக்கப்பட்டது', bg: 'bg-amber-100 text-amber-800 border border-amber-300' };
      case 'in_progress':
        return { label: 'பரிசீலனையில்', bg: 'bg-sky-100 text-sky-800 border border-sky-300' };
      default:
        return { label: 'புதிய மனு', bg: 'bg-[#ffcc00] text-[#4a0000] border border-[#e6b800]' };
    }
  };

  // Calculate petition lifecycle metrics
  const totalPetitionsCount = petitions.length;
  const pendingCount = petitions.filter(p => p.status === 'pending').length;
  const inProgressCount = petitions.filter(p => p.status === 'in_progress').length;
  const actionTakenCount = petitions.filter(p => p.status === 'action_taken').length;
  const resolvedCount = petitions.filter(p => p.status === 'resolved').length;

  const pendingPct = totalPetitionsCount > 0 ? Math.round((pendingCount / totalPetitionsCount) * 100) : 0;
  const inProgressPct = totalPetitionsCount > 0 ? Math.round((inProgressCount / totalPetitionsCount) * 100) : 0;
  const actionTakenPct = totalPetitionsCount > 0 ? Math.round((actionTakenCount / totalPetitionsCount) * 100) : 0;
  const resolvedPct = totalPetitionsCount > 0 ? Math.round((resolvedCount / totalPetitionsCount) * 100) : 0;

  const lifecycleStages = [
    {
      key: 'pending' as PetitionStatus,
      step: 1,
      title: 'புதிய மனு (Pending)',
      subtitle: 'மக்கள் பதிவு செய்தது',
      count: pendingCount,
      pct: pendingPct,
      bgColor: 'bg-yellow-50 hover:bg-yellow-100',
      borderColor: 'border-yellow-300',
      activeBorder: 'ring-2 ring-yellow-500 border-yellow-500',
      badgeBg: 'bg-yellow-200 text-yellow-900',
      barColor: 'bg-yellow-500',
      textColor: 'text-yellow-900',
      icon: Clock
    },
    {
      key: 'in_progress' as PetitionStatus,
      step: 2,
      title: 'பரிசீலனையில் (In Progress)',
      subtitle: 'TVK ஆய்வு & களம்',
      count: inProgressCount,
      pct: inProgressPct,
      bgColor: 'bg-sky-50 hover:bg-sky-100',
      borderColor: 'border-sky-300',
      activeBorder: 'ring-2 ring-sky-500 border-sky-500',
      badgeBg: 'bg-sky-200 text-sky-900',
      barColor: 'bg-sky-500',
      textColor: 'text-sky-900',
      icon: Activity
    },
    {
      key: 'action_taken' as PetitionStatus,
      step: 3,
      title: 'நடவடிக்கை (Action Taken)',
      subtitle: 'அதிகாரிகள் தொடர்பு',
      count: actionTakenCount,
      pct: actionTakenPct,
      bgColor: 'bg-amber-50 hover:bg-amber-100',
      borderColor: 'border-amber-300',
      activeBorder: 'ring-2 ring-amber-500 border-amber-500',
      badgeBg: 'bg-amber-200 text-amber-900',
      barColor: 'bg-amber-500',
      textColor: 'text-amber-900',
      icon: TrendingUp
    },
    {
      key: 'resolved' as PetitionStatus,
      step: 4,
      title: 'தீர்க்கப்பட்டது (Resolved)',
      subtitle: 'பிரச்சனை தீர்வு',
      count: resolvedCount,
      pct: resolvedPct,
      bgColor: 'bg-emerald-50 hover:bg-emerald-100',
      borderColor: 'border-emerald-300',
      activeBorder: 'ring-2 ring-emerald-500 border-emerald-500',
      badgeBg: 'bg-emerald-200 text-emerald-900',
      barColor: 'bg-emerald-500',
      textColor: 'text-emerald-900',
      icon: CheckCircle2
    }
  ];

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#4a0000] flex items-center gap-3">
            <span>📋 மக்கள் குறைதீர்ப்பு மனுக்கள்</span>
            <span className="text-xs font-bold bg-[#4a0000]/10 text-[#4a0000] border border-[#4a0000]/20 px-3 py-1 rounded-full">
              {petitions.length} மனுக்கள்
            </span>
          </h2>
          <p className="text-sm text-neutral-600 mt-1">
            அச்சரப்பாக்கம் 1-15 வார்டுகளின் மக்களின் குறைகள் மற்றும் தீர்வுகள் குறித்த நேரடி விபரம்.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Export Filtered View to PDF Button */}
          <button
            onClick={handleExportPDF}
            disabled={isExportingPdf || petitions.length === 0}
            className="px-4 py-2.5 bg-[#4a0000] hover:bg-[#380000] text-[#ffcc00] font-extrabold text-xs sm:text-sm rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 border border-[#ffcc00]/30 disabled:opacity-50 cursor-pointer active:scale-95"
            title="அரசு அலுவலகத்தில் நேரடியாகச் சமர்ப்பிக்க தற்போதைய மனுக்களை PDF ஆகப் பதிவிறக்குக"
          >
            <Download className="w-4 h-4 text-[#ffcc00]" />
            <span>{isExportingPdf ? 'PDF உருவாக்கப்படுகிறது...' : '📄 PDF பதிவிறக்கம் (Export PDF)'}</span>
          </button>

          {/* Map View Toggle Button */}
          <button
            onClick={() => setShowMap(!showMap)}
            className={`px-4 py-2.5 rounded-lg text-xs font-extrabold transition-all flex items-center gap-2 border shadow-2xs cursor-pointer ${
              showMap
                ? 'bg-neutral-900 text-white border-neutral-800'
                : 'bg-white text-neutral-800 border-neutral-300 hover:bg-neutral-100'
            }`}
          >
            <Map className="w-4 h-4 text-[#ffcc00]" />
            <span>{showMap ? 'வரைபடம் மறை' : '🗺️ GIS வரைபடம்'}</span>
          </button>

          <button
            onClick={onOpenNewPetition}
            className="px-5 py-2.5 bg-[#ffcc00] hover:bg-[#ffb700] text-[#4a0000] font-extrabold text-xs sm:text-sm rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>✍️ புதிய மனு சமர்ப்பி</span>
          </button>
        </div>
      </div>

      {/* Petition Lifecycle Tracker Visual Flow */}
      <div className="bg-white border border-neutral-200 rounded-xl p-5 mb-8 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-neutral-100 pb-3 mb-4">
          <div>
            <h3 className="text-base font-extrabold text-[#4a0000] flex items-center gap-2">
              <Activity className="w-5 h-5 text-[#ffcc00] bg-[#4a0000] p-1 rounded-md" />
              <span>மனு சுழற்சி கண்காணிப்பு வரைபடம் (Petition Lifecycle Tracker)</span>
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              மனுவின் சமர்ப்பிப்பு முதல் முழுமையான தீர்வு வரையிலான 4 கட்ட நிலைகளின் தற்போதைய புள்ளிவிவரங்கள். (நிலையை கிளிக் செய்து மனுக்களை வடிகட்டலாம்)
            </p>
          </div>

          {selectedStatusFilter !== 'all' && (
            <button
              onClick={() => setSelectedStatusFilter('all')}
              className="text-xs font-bold text-[#4a0000] hover:underline bg-[#4a0000]/10 px-2.5 py-1 rounded-md self-end sm:self-auto"
            >
              அனைத்து நிலைகளும் காட்டு (Show All)
            </button>
          )}
        </div>

        {/* Combined Proportional Progress Visual Bar */}
        <div className="mb-5">
          <div className="flex items-center justify-between text-[11px] font-bold text-neutral-600 mb-1.5">
            <span>மனுக்களின் நிலை பரவல் (Lifecycle Breakdown)</span>
            <span>மொத்தம்: {totalPetitionsCount} மனுக்கள்</span>
          </div>
          <div className="h-3.5 w-full bg-neutral-100 rounded-full overflow-hidden flex p-0.5 border border-neutral-200">
            {pendingPct > 0 && (
              <div
                style={{ width: `${pendingPct}%` }}
                className="bg-yellow-400 h-full rounded-l-full transition-all duration-500"
                title={`புதிய மனு: ${pendingCount} (${pendingPct}%)`}
              />
            )}
            {inProgressPct > 0 && (
              <div
                style={{ width: `${inProgressPct}%` }}
                className="bg-sky-500 h-full transition-all duration-500"
                title={`பரிசீலனையில்: ${inProgressCount} (${inProgressPct}%)`}
              />
            )}
            {actionTakenPct > 0 && (
              <div
                style={{ width: `${actionTakenPct}%` }}
                className="bg-amber-500 h-full transition-all duration-500"
                title={`நடவடிக்கை: ${actionTakenCount} (${actionTakenPct}%)`}
              />
            )}
            {resolvedPct > 0 && (
              <div
                style={{ width: `${resolvedPct}%` }}
                className="bg-emerald-500 h-full rounded-r-full transition-all duration-500"
                title={`தீர்க்கப்பட்டது: ${resolvedCount} (${resolvedPct}%)`}
              />
            )}
          </div>
        </div>

        {/* Stage Cards Flow */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 relative">
          {lifecycleStages.map((stg, idx) => {
            const IconComp = stg.icon;
            const isSelected = selectedStatusFilter === stg.key;

            return (
              <div
                key={stg.key}
                onClick={() => {
                  if (selectedStatusFilter === stg.key) {
                    setSelectedStatusFilter('all');
                  } else {
                    setSelectedStatusFilter(stg.key);
                  }
                }}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer relative flex flex-col justify-between ${
                  stg.bgColor
                } ${stg.borderColor} ${isSelected ? stg.activeBorder + ' shadow-md scale-[1.02]' : 'hover:shadow-xs'}`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`w-6 h-6 rounded-full ${stg.badgeBg} font-extrabold text-xs flex items-center justify-center shrink-0`}>
                      {stg.step}
                    </span>
                    <span className={`text-xs font-extrabold px-2 py-0.5 rounded-full ${stg.badgeBg}`}>
                      {stg.pct}%
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mb-1">
                    <IconComp className={`w-4 h-4 ${stg.textColor} shrink-0`} />
                    <h4 className={`text-xs font-extrabold ${stg.textColor} truncate`}>
                      {stg.title}
                    </h4>
                  </div>

                  <p className="text-[11px] text-neutral-600 font-medium">
                    {stg.subtitle}
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-black/5 flex items-center justify-between">
                  <span className="text-xs font-bold text-neutral-700">
                    {stg.count} மனுக்கள்
                  </span>
                  {idx < 3 && (
                    <ArrowRight className="hidden lg:block w-3.5 h-3.5 text-neutral-400 absolute -right-2.5 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-0.5 border border-neutral-300" />
                  )}
                  <span className="text-[10px] text-neutral-500 font-extrabold underline">
                    {isSelected ? 'தேர்ந்தெடுக்கப்பட்டது' : 'வடிகட்ட கிளிக் செய்க'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Leaflet Interactive Geographic Distribution Map Component */}
      {showMap && (
        <PetitionsMap
          petitions={petitions}
          selectedWardFilter={selectedWardFilter}
          setSelectedWardFilter={setSelectedWardFilter}
          onSelectPetition={onSelectPetition}
          selectedCategoryFilter={selectedCategoryFilter}
          selectedStatusFilter={selectedStatusFilter}
        />
      )}

      {/* Filter Bar */}
      <div className="bg-white border border-neutral-200 rounded-xl p-4 sm:p-5 mb-8 shadow-sm">
        
        {/* Field QR Print Banner Action */}
        {onOpenPrintableQr && (
          <div className="mb-4 pb-3 border-b border-neutral-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-[#4a0000]/5 p-3 rounded-lg border border-[#4a0000]/15">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-[#4a0000] text-[#ffcc00] rounded-md shrink-0">
                <QrCode className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-black text-[#4a0000] block">
                  களப்பணியாளர்களுக்கான QR அட்டைகள் (Printable Field QR Cards)
                </span>
                <span className="text-[11px] text-neutral-600 block">
                  களப்பணியாளர்கள் மொபைலில் ஸ்கேன் செய்து மனுக்களின் நேரலை நிலையை ஆய்வு செய்ய அச்சிடக்கூடிய QR குறியீடுகளை உருவாக்கலாம்.
                </span>
              </div>
            </div>

            <button
              onClick={() => onOpenPrintableQr()}
              className="px-3.5 py-2 bg-[#ffcc00] hover:bg-[#e6b800] text-[#4a0000] font-black text-xs rounded-lg shadow-2xs transition-all flex items-center gap-1.5 shrink-0 border border-[#e6b800] active:scale-95 cursor-pointer"
            >
              <Printer className="w-4 h-4 text-[#4a0000]" />
              <span>QR அட்டைகள் அச்சிடுக</span>
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Search Input */}
          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1.5 uppercase">தேடல்:</label>
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-neutral-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="மனு எண், தெரு பெயர்..."
                className="w-full bg-neutral-50 text-neutral-900 border border-neutral-200 rounded-md pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4a0000]"
              />
            </div>
          </div>

          {/* Ward Filter */}
          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1.5 uppercase">வார்டு தேர்வு:</label>
            <select
              value={selectedWardFilter}
              onChange={(e) => setSelectedWardFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
              className="w-full bg-neutral-50 text-neutral-900 border border-neutral-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4a0000]"
            >
              <option value="all">அனைத்து 15 வார்டுகளும்</option>
              {Array.from({ length: 15 }, (_, i) => i + 1).map((num) => (
                <option key={num} value={num}>வார்டு எண் {num}</option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1.5 uppercase">பிரச்சனை வகை:</label>
            <select
              value={selectedCategoryFilter}
              onChange={(e) => setSelectedCategoryFilter(e.target.value as IssueCategory | 'all')}
              className="w-full bg-neutral-50 text-neutral-900 border border-neutral-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4a0000]"
            >
              <option value="all">அனைத்து பிரிவுகளும்</option>
              {ISSUE_CATEGORIES.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1.5 uppercase">நிலைமை:</label>
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value as PetitionStatus | 'all')}
              className="w-full bg-neutral-50 text-neutral-900 border border-neutral-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4a0000]"
            >
              <option value="all">அனைத்து நிலைகளும்</option>
              <option value="pending">புதிய மனு</option>
              <option value="in_progress">பரிசீலனையில்</option>
              <option value="action_taken">நடவடிக்கை எடுக்கப்பட்டது</option>
              <option value="resolved">தீர்க்கப்பட்டது</option>
            </select>
          </div>

        </div>

        {/* Export Filtered Summary Banner */}
        <div className="mt-4 pt-3 border-t border-neutral-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-neutral-50 p-3 rounded-lg border border-neutral-200">
          <div className="flex items-center gap-2 text-xs text-neutral-700">
            <span className="font-extrabold text-[#4a0000]">
              காண்பிக்கப்படும் மனுக்கள்: {petitions.length}
            </span>
            <span className="text-neutral-300">|</span>
            <span className="text-neutral-600">
              {selectedWardFilter === 'all' ? 'அனைத்து வார்டுகளும்' : `வார்டு ${selectedWardFilter}`} • {selectedCategoryFilter === 'all' ? 'அனைத்து பிரிவுகளும்' : selectedCategoryFilter}
            </span>
          </div>

          <button
            onClick={handleExportPDF}
            disabled={isExportingPdf || petitions.length === 0}
            className="w-full sm:w-auto px-4 py-2 bg-[#4a0000] hover:bg-[#380000] text-[#ffcc00] font-black text-xs rounded-lg shadow-2xs transition-all flex items-center justify-center gap-1.5 border border-[#ffcc00]/40 disabled:opacity-50 cursor-pointer active:scale-95 shrink-0"
            title="அரசு அலுவலகத்தில் நேரடியாகச் சமர்ப்பிக்க தற்போதைய மனுக்களை PDF ஆகப் பதிவிறக்குக"
          >
            <Download className="w-4 h-4 text-[#ffcc00]" />
            <span>{isExportingPdf ? 'PDF உருவாக்கப்படுகிறது...' : '📄 பட்டியலை PDF ஆக பதிவிறக்குக (Export PDF)'}</span>
          </button>
        </div>

      </div>

      {/* Petitions Grid */}
      {petitions.length === 0 ? (
        <div className="bg-white border border-dashed border-neutral-300 rounded-xl p-12 text-center my-8 shadow-2xs">
          <AlertCircle className="w-12 h-12 text-[#4a0000] mx-auto mb-3" />
          <h3 className="text-xl font-bold text-neutral-800 mb-2">மனுக்கள் எதுவும் கிடைக்கவில்லை</h3>
          <p className="text-sm text-neutral-500 mb-6">நீங்கள் தேடிய வார்டு அல்லது பிரிவில் மனுக்கள் எதுவும் இல்லை.</p>
          <button
            onClick={() => {
              setSelectedWardFilter('all');
              setSelectedCategoryFilter('all');
              setSelectedStatusFilter('all');
              setSearchTerm('');
            }}
            className="px-5 py-2 bg-neutral-100 border border-neutral-300 text-neutral-800 rounded-md text-sm font-bold hover:bg-neutral-200 transition-all"
          >
            அனைத்து வடிப்பான்களையும் நீக்கு (Reset Filters)
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {petitions.map((petition) => {
            const catBadge = getCategoryBadge(petition.category);
            const statusBadge = getStatusBadge(petition.status);
            const CatIcon = catBadge.icon;

            return (
              <div
                key={petition.id}
                onClick={() => onSelectPetition(petition)}
                className="bg-white border border-neutral-200 rounded-xl p-5 shadow-sm hover:shadow-md hover:border-[#4a0000]/40 transition-all cursor-pointer flex flex-col justify-between group relative"
              >
                <div>
                  {/* Top Row: Tracking & Status */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-mono text-xs font-bold text-[#4a0000] bg-neutral-100 px-2.5 py-1 rounded-md border border-neutral-200">
                        {petition.trackingNo}
                      </span>

                      {(petition.id.startsWith('offline_') || petition.trackingNo.includes('OFFLINE')) && (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 animate-pulse">
                          📥 ஆஃப்லைன்
                        </span>
                      )}
                    </div>

                    <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${statusBadge.bg}`}>
                      {statusBadge.label}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-base font-extrabold text-neutral-900 group-hover:text-[#4a0000] transition-colors line-clamp-2 mb-2 leading-snug">
                    {petition.title}
                  </h3>

                  {/* Description Preview */}
                  <p className="text-xs text-neutral-600 line-clamp-3 mb-4 leading-relaxed font-sans">
                    {petition.description}
                  </p>
                </div>

                <div>
                  {/* Metadata Tags */}
                  <div className="flex flex-wrap items-center gap-2 mb-4 pt-3 border-t border-neutral-100 text-xs">
                    
                    <span className={`flex items-center gap-1 border px-2 py-0.5 rounded-md font-bold text-[11px] ${catBadge.color}`}>
                      <CatIcon className="w-3.5 h-3.5" />
                      <span>{catBadge.label}</span>
                    </span>

                    <span className="flex items-center gap-1 bg-neutral-100 text-neutral-700 border border-neutral-200 px-2 py-0.5 rounded-md font-bold text-[11px]">
                      <MapPin className="w-3.5 h-3.5 text-[#4a0000]" />
                      <span>வார்டு {petition.wardNo}</span>
                    </span>

                    {(petition.images?.length || petition.imageUrl) ? (
                      <span className="flex items-center gap-1 bg-[#4a0000]/10 text-[#4a0000] border border-[#4a0000]/20 px-2 py-0.5 rounded-md font-bold text-[11px]" title="புகைப்பட ஆதாரம் இணைக்கப்பட்டுள்ளது">
                        <Camera className="w-3.5 h-3.5 text-[#4a0000]" />
                        <span>{petition.images?.length || 1} ஆதாரம்</span>
                      </span>
                    ) : null}

                  </div>

                  {/* Citizen Name & Upvote */}
                  <div className="flex items-center justify-between pt-2 border-t border-neutral-100 text-xs text-neutral-500">
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
                      <span className="font-bold text-neutral-800">{petition.citizenName}</span>
                      <span>•</span>
                      <span className="text-neutral-500">{petition.streetName}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          const pUrl = `${window.location.origin}${window.location.pathname}?petition=${encodeURIComponent(petition.id)}`;
                          const text = `📌 TVK அச்சரப்பாக்கம் மக்கள் குறைதீர்ப்பு மையம்\n\nமனு எண்: ${petition.trackingNo}\nதலைப்பு: ${petition.title}\nவார்டு: வார்டு ${petition.wardNo} (${petition.streetName})\n\nபொதுமக்கள் கோரிக்கைக்கு ஆதரவு அளிக்க கிளிக் செய்யவும்: ${pUrl}`;
                          window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
                        }}
                        className="flex items-center gap-1 px-2.5 py-1 bg-[#25D366] hover:bg-[#1ebe5d] text-white rounded-md font-extrabold transition-all shadow-2xs text-xs cursor-pointer"
                        title="வாட்ஸ்அப்பில் பகிர்க (Share on WhatsApp)"
                      >
                        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                        </svg>
                        <span className="hidden sm:inline">பகிர்</span>
                      </button>

                      <button
                        type="button"
                        onClick={async (e) => {
                          e.stopPropagation();
                          await handleDownloadPetitionPDF(petition);
                        }}
                        disabled={generatingPdfId === petition.id}
                        className="flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-[#4a0000] text-neutral-700 hover:text-white border border-neutral-200 hover:border-[#4a0000] rounded-md font-bold transition-all shadow-2xs text-xs cursor-pointer"
                        title="அரசு மனு PDF பதிவிறக்கம் (Download Formal PDF)"
                      >
                        <Download className="w-3.5 h-3.5 text-[#4a0000] group-hover:text-white" />
                        <span className="hidden sm:inline">PDF</span>
                      </button>

                      <button
                        onClick={(e) => onUpvote(petition.id, e)}
                        className="flex items-center gap-1.5 px-2.5 py-1 bg-neutral-50 hover:bg-[#ffcc00] hover:text-[#4a0000] text-neutral-700 border border-neutral-200 rounded-md font-bold transition-all shadow-2xs text-xs"
                      >
                        <ThumbsUp className="w-3.5 h-3.5 text-[#4a0000]" />
                        <span>{petition.upvotes}</span>
                      </button>
                    </div>
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
