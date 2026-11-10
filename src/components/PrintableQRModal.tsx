import React, { useState } from 'react';
import { getIssueCategoryShortLabel, Petition } from '../types';
import { QRCodeCanvas } from 'qrcode.react';
import { X, Printer, Download, QrCode, CheckCircle2, Clock, AlertCircle, MapPin, Phone, User, Tag, Search, Filter, Layers, FileText } from 'lucide-react';
import tvkLogo from '../assets/images/tvk_official_logo_1785141164838.jpg';

interface PrintableQRModalProps {
  petitions: Petition[];
  initialPetitionId?: string;
  onClose: () => void;
}

export const PrintableQRModal: React.FC<PrintableQRModalProps> = ({
  petitions,
  initialPetitionId,
  onClose
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>(() => {
    if (initialPetitionId) return [initialPetitionId];
    return petitions.slice(0, 4).map(p => p.id); // Default to first 4 for batch
  });

  const [layoutMode, setLayoutMode] = useState<'single' | 'grid2' | 'grid4'>('grid2');
  const [filterWard, setFilterWard] = useState<number | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPetitions = petitions.filter(p => {
    const matchesSearch = p.trackingNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.citizenName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.streetName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesWard = filterWard === 'all' || p.wardNo === filterWard;
    return matchesSearch && matchesWard;
  });

  const selectedPetitions = petitions.filter(p => selectedIds.includes(p.id));

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredPetitions.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredPetitions.map(p => p.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'resolved': return { text: 'தீர்க்கப்பட்டது', bg: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
      case 'action_taken': return { text: 'நடவடிக்கை எடுக்கப்பட்டது', bg: 'bg-amber-100 text-amber-800 border-amber-300' };
      case 'in_progress': return { text: 'பரிசீலனையில்', bg: 'bg-sky-100 text-sky-800 border-sky-300' };
      default: return { text: 'புதிய மனு', bg: 'bg-yellow-100 text-yellow-800 border-yellow-300' };
    }
  };

  const getCategoryLabel = (cat: string) => getIssueCategoryShortLabel(cat);

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      {/* Print Specific CSS Override */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-qr-section, #printable-qr-section * {
            visibility: visible;
          }
          #printable-qr-section {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white !important;
            padding: 10px !important;
          }
          .no-print {
            display: none !important;
          }
          .print-card {
            break-inside: avoid;
            page-break-inside: avoid;
            border: 2px solid #4a0000 !important;
          }
        }
      ` }} />

      <div className="bg-neutral-50 rounded-2xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-neutral-300 overflow-hidden my-auto">
        
        {/* Header (Hidden on Print) */}
        <div className="no-print bg-[#4a0000] text-white p-4 sm:p-5 flex items-center justify-between shrink-0 border-b border-[#ffcc00]/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/10 p-1 border border-[#ffcc00]/40 flex items-center justify-center shrink-0">
              <img src={tvkLogo} alt="TVK Logo" className="w-full h-full object-cover rounded-full" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-[#ffcc00] flex items-center gap-2">
                <QrCode className="w-5 h-5 text-[#ffcc00]" />
                <span>மனுக்கள் களப்பணி அச்சிடும் மையம் (Printable Field QR Cards)</span>
              </h3>
              <p className="text-xs text-white/80 mt-0.5">
                களப்பணியாளர்கள் மொபைலில் ஸ்கேன் செய்து நேரலை நிலையை அறிய அச்சிடக்கூடிய QR அட்டைகள்.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top Controls Bar (Hidden on Print) */}
        <div className="no-print bg-white border-b border-neutral-200 p-3 sm:p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shrink-0">
          {/* Search & Filters */}
          <div className="flex flex-wrap items-center gap-2 flex-1">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="மனு எண், பெயர், தெரு தேடுக..."
                className="w-full pl-9 pr-3 py-1.5 bg-neutral-50 border border-neutral-300 rounded-lg text-xs outline-none focus:border-[#4a0000]"
              />
            </div>

            <select
              value={filterWard}
              onChange={(e) => setFilterWard(e.target.value === 'all' ? 'all' : Number(e.target.value))}
              className="py-1.5 px-3 bg-neutral-50 border border-neutral-300 rounded-lg text-xs font-bold text-neutral-700 outline-none focus:border-[#4a0000]"
            >
              <option value="all">அனைத்து வார்டுகளும் (1 - 15)</option>
              {Array.from({ length: 15 }, (_, i) => i + 1).map(w => (
                <option key={w} value={w}>வார்டு {w}</option>
              ))}
            </select>

            <button
              onClick={toggleSelectAll}
              className="py-1.5 px-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-extrabold text-xs rounded-lg border border-neutral-300 transition-all"
            >
              {selectedIds.length === filteredPetitions.length ? 'அனைத்தும் நீக்கு' : `அனைத்தும் தேர்ந்தெடு (${filteredPetitions.length})`}
            </button>
          </div>

          {/* Layout Mode & Print Button */}
          <div className="flex items-center gap-2 self-end md:self-auto">
            <div className="flex items-center bg-neutral-100 p-1 rounded-lg border border-neutral-300 text-xs font-bold">
              <button
                onClick={() => setLayoutMode('grid2')}
                className={`px-2.5 py-1 rounded-md transition-all ${layoutMode === 'grid2' ? 'bg-[#4a0000] text-[#ffcc00]' : 'text-neutral-600'}`}
                title="2 அட்டைகள் (நடுத்தர வடிவம்)"
              >
                2 அட்டை
              </button>
              <button
                onClick={() => setLayoutMode('grid4')}
                className={`px-2.5 py-1 rounded-md transition-all ${layoutMode === 'grid4' ? 'bg-[#4a0000] text-[#ffcc00]' : 'text-neutral-600'}`}
                title="4 அட்டைகள் (A4 அச்சிடுதல்)"
              >
                4 அட்டை
              </button>
              <button
                onClick={() => setLayoutMode('single')}
                className={`px-2.5 py-1 rounded-md transition-all ${layoutMode === 'single' ? 'bg-[#4a0000] text-[#ffcc00]' : 'text-neutral-600'}`}
                title="1 அட்டை (முழு விவரங்கள்)"
              >
                1 அட்டை
              </button>
            </div>

            <button
              onClick={handlePrint}
              disabled={selectedPetitions.length === 0}
              className="px-4 py-2 bg-[#ffcc00] hover:bg-[#e6b800] text-[#4a0000] font-black text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 active:scale-95 border border-[#e6b800]"
            >
              <Printer className="w-4 h-4 text-[#4a0000]" />
              <span>அச்சிடுக ({selectedPetitions.length})</span>
            </button>
          </div>
        </div>

        {/* Scrollable Main Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-neutral-100">
          
          {selectedPetitions.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-neutral-300 p-8 max-w-md mx-auto">
              <QrCode className="w-12 h-12 text-neutral-300 mx-auto mb-3 animate-pulse" />
              <h4 className="text-base font-bold text-neutral-800">அச்சிட எந்த மனுவும் தேர்ந்தெடுக்கப்படவில்லை</h4>
              <p className="text-xs text-neutral-500 mt-1">
                தயவுசெய்து மேலே உள்ள பட்டியலில் இருந்து களப்பணி அச்சிடலுக்கு மனுக்களை தேர்ந்தெடுக்கவும்.
              </p>
            </div>
          ) : (
            <div id="printable-qr-section">
              
              {/* Printable Header Banner */}
              <div className="bg-[#4a0000] text-white p-3 rounded-t-xl mb-4 text-center border-b-2 border-[#ffcc00] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <img src={tvkLogo} alt="TVK Logo" className="w-8 h-8 rounded-full border border-[#ffcc00]" />
                  <div className="text-left">
                    <h2 className="text-xs sm:text-sm font-black text-[#ffcc00] uppercase tracking-wider">
                      தமிழக வெற்றிக் கழகம் - அச்சரப்பாக்கம் தொகுதி
                    </h2>
                    <p className="text-[10px] text-white/90">மனுக்கள் களம் ஆய்வு & கண்காணிப்பு பாஸ் (TVK Field QR Inspection Sheet)</p>
                  </div>
                </div>
                <div className="text-right text-[10px] text-[#ffcc00] font-extrabold hidden sm:block">
                  தேதி: {new Date().toLocaleDateString('ta-IN')}
                </div>
              </div>

              {/* Cards Grid Container */}
              <div className={`grid gap-4 ${
                layoutMode === 'single' ? 'grid-cols-1 max-w-2xl mx-auto' :
                layoutMode === 'grid4' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2' :
                'grid-cols-1 md:grid-cols-2'
              }`}>
                {selectedPetitions.map((petition) => {
                  const statusInfo = getStatusLabel(petition.status);
                  const qrUrl = `${window.location.origin}?petition=${petition.id}`;

                  return (
                    <div
                      key={petition.id}
                      className="print-card bg-white border-2 border-[#4a0000] rounded-xl p-4 shadow-sm flex flex-col justify-between relative overflow-hidden"
                    >
                      {/* Top Header Badge */}
                      <div className="flex items-start justify-between gap-2 border-b border-neutral-200 pb-2.5 mb-3">
                        <div>
                          <span className="text-[10px] font-black uppercase text-white bg-[#4a0000] px-2 py-0.5 rounded-md inline-block mb-1">
                            {petition.trackingNo}
                          </span>
                          <h4 className="text-xs sm:text-sm font-extrabold text-neutral-900 leading-snug line-clamp-2">
                            {petition.title}
                          </h4>
                        </div>

                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border shrink-0 ${statusInfo.bg}`}>
                          {statusInfo.text}
                        </span>
                      </div>

                      {/* Main Body with Large QR Code */}
                      <div className="flex items-center gap-4">
                        {/* QR Code Canvas */}
                        <div className="p-2 bg-white border-2 border-[#ffcc00] rounded-xl shadow-2xs flex flex-col items-center shrink-0">
                          <QRCodeCanvas
                            value={qrUrl}
                            size={110}
                            bgColor="#ffffff"
                            fgColor="#4a0000"
                            level="H"
                            includeMargin={true}
                          />
                          <span className="text-[9px] font-mono font-extrabold text-[#4a0000] mt-1">
                            SCAN FOR LIVE STATUS
                          </span>
                        </div>

                        {/* Details Metadata */}
                        <div className="flex-1 min-w-0 space-y-1.5 text-xs text-neutral-700">
                          <div className="flex items-center gap-1.5 font-bold text-neutral-900">
                            <User className="w-3.5 h-3.5 text-[#4a0000] shrink-0" />
                            <span className="truncate">{petition.citizenName} ({petition.phone})</span>
                          </div>

                          <div className="flex items-center gap-1.5 text-neutral-600">
                            <MapPin className="w-3.5 h-3.5 text-[#4a0000] shrink-0" />
                            <span className="truncate">வார்டு {petition.wardNo}, {petition.streetName}</span>
                          </div>

                          <div className="flex items-center gap-1.5 text-neutral-600">
                            <Tag className="w-3.5 h-3.5 text-[#4a0000] shrink-0" />
                            <span>வகை: {getCategoryLabel(petition.category)}</span>
                          </div>

                          <div className="flex items-center gap-1.5 text-neutral-500 text-[11px]">
                            <Clock className="w-3 h-3 text-neutral-400 shrink-0" />
                            <span>தேதி: {new Date(petition.createdAt).toLocaleDateString('ta-IN')}</span>
                          </div>

                          {petition.description && (
                            <p className="text-[11px] text-neutral-600 line-clamp-2 bg-neutral-50 p-1.5 rounded-md border border-neutral-200 mt-1">
                              "{petition.description}"
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Bottom Footer Note for Field Worker */}
                      <div className="mt-3 pt-2 border-t border-dashed border-neutral-300 flex items-center justify-between text-[10px] text-neutral-500 font-semibold">
                        <span className="text-[#4a0000] font-bold flex items-center gap-1">
                          <img src={tvkLogo} alt="TVK" className="w-3.5 h-3.5 rounded-full inline" />
                          <span>தவெக களப்பணி கையேடு</span>
                        </span>
                        <span>மொபைல் கேமராவில் ஸ்கேன் செய்க 📱</span>
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          )}

          {/* Quick Selection List (Hidden on Print) */}
          <div className="no-print mt-8 bg-white border border-neutral-200 rounded-xl p-4 shadow-2xs">
            <h4 className="text-xs font-extrabold text-[#4a0000] mb-3 flex items-center justify-between">
              <span>மனுக்கள் தேர்வுப் பட்டியல் ({filteredPetitions.length} மனுக்கள்)</span>
              <span className="text-neutral-500 font-normal">தேர்ந்தெடுக்கப்பட்டது: {selectedIds.length}</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1">
              {filteredPetitions.map(p => {
                const isSel = selectedIds.includes(p.id);
                return (
                  <label
                    key={p.id}
                    onClick={() => toggleSelectOne(p.id)}
                    className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer transition-all select-none ${
                      isSel ? 'bg-[#ffcc00]/20 border-[#4a0000] font-bold text-[#4a0000]' : 'bg-neutral-50 border-neutral-200 text-neutral-700 hover:bg-neutral-100'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSel}
                      onChange={() => {}}
                      className="accent-[#4a0000] rounded-xs"
                    />
                    <div className="truncate flex-1">
                      <span className="font-mono text-[10px] block opacity-80">{p.trackingNo}</span>
                      <span className="truncate block">{p.title}</span>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
