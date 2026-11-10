import React, { useState } from 'react';
import { getIssueCategoryLabel, ISSUE_CATEGORIES, Petition } from '../types';
import { BarChart3, PieChart, CheckCircle2, Clock, ThumbsUp, MapPin, Award, TrendingUp, Download, FileSpreadsheet, Filter, Check, Sparkles } from 'lucide-react';
import { useToast } from './ToastContainer';

interface AnalyticsDashboardProps {
  petitions: Petition[];
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ petitions }) => {
  const [selectedWardExport, setSelectedWardExport] = useState<number | 'all'>('all');
  const [selectedStatusExport, setSelectedStatusExport] = useState<string>('all');
  const { addToast } = useToast();

  const filteredPetitions = petitions.filter(p => {
    if (selectedWardExport !== 'all' && p.wardNo !== selectedWardExport) return false;
    if (selectedStatusExport !== 'all' && p.status !== selectedStatusExport) return false;
    return true;
  });

  const total = petitions.length;
  const resolved = petitions.filter(p => p.status === 'resolved').length;
  const inProgress = petitions.filter(p => p.status === 'in_progress' || p.status === 'action_taken').length;
  const pending = petitions.filter(p => p.status === 'pending').length;

  const resolutionPercentage = total > 0 ? Math.round((resolved / total) * 100) : 0;

  const categoryColors = [
    'bg-blue-600', 'bg-amber-600', 'bg-yellow-500', 'bg-cyan-600',
    'bg-emerald-600', 'bg-orange-600', 'bg-rose-600', 'bg-indigo-600',
    'bg-sky-600', 'bg-lime-600', 'bg-stone-600', 'bg-teal-600',
    'bg-red-600', 'bg-violet-600', 'bg-green-600', 'bg-purple-600'
  ];
  const categories = ISSUE_CATEGORIES.map((category, index) => ({
    label: category.label,
    count: petitions.filter(p => p.category === category.value).length,
    color: categoryColors[index]
  }));

  // Top upvoted petitions
  const topPetitions = [...petitions].sort((a, b) => b.upvotes - a.upvotes).slice(0, 4);

  // Excel (.xls) Native Export Handler with UTF-8 encoding support
  const handleExportExcel = () => {
    const listToExport = filteredPetitions;
    if (!listToExport || listToExport.length === 0) {
      addToast({
        type: 'warning',
        title: 'தரவு எதுவும் இல்லை',
        message: 'தேர்ந்தெடுக்கப்பட்ட வடிகட்டியில் ஏற்றுமதி செய்ய எந்த மனுக்களும் இல்லை.'
      });
      return;
    }

    const dateStamp = new Date().toISOString().slice(0, 10);

    const escapeHtml = (str: string | number | undefined) => {
      if (str === undefined || str === null) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    };

    const tableRows = listToExport.map((p, idx) => {
      const dateStr = new Date(p.createdAt).toLocaleDateString('ta-IN');
      const statusText = p.status === 'resolved' 
        ? 'தீர்க்கப்பட்டது (Resolved)' 
        : p.status === 'action_taken' 
        ? 'அரசு நடவடிக்கை (Action Taken)' 
        : p.status === 'in_progress' 
        ? 'பரிசீலனையில் (In Progress)' 
        : 'பதிவாகியுள்ளது (Pending)';

      const categoryText = getIssueCategoryLabel(p.category);

      const bgClass = idx % 2 === 0 ? '#ffffff' : '#f9fafb';

      return `
        <tr style="background-color: ${bgClass}; font-family: Arial, sans-serif; font-size: 13px;">
          <td style="border: 1px solid #d1d5db; padding: 8px; font-weight: bold; color: #4a0000; mso-number-format:'\\@';">${escapeHtml(p.trackingNo)}</td>
          <td style="border: 1px solid #d1d5db; padding: 8px;">${escapeHtml(dateStr)}</td>
          <td style="border: 1px solid #d1d5db; padding: 8px; font-weight: bold;">${escapeHtml(p.citizenName)}</td>
          <td style="border: 1px solid #d1d5db; padding: 8px; mso-number-format:'\\@';">${escapeHtml(p.phone)}</td>
          <td style="border: 1px solid #d1d5db; padding: 8px; text-align: center;">வார்டு ${escapeHtml(p.wardNo)}</td>
          <td style="border: 1px solid #d1d5db; padding: 8px;">${escapeHtml(p.streetName)}</td>
          <td style="border: 1px solid #d1d5db; padding: 8px;">${escapeHtml(categoryText)}</td>
          <td style="border: 1px solid #d1d5db; padding: 8px; font-weight: bold;">${escapeHtml(statusText)}</td>
          <td style="border: 1px solid #d1d5db; padding: 8px; text-align: center;">${escapeHtml(p.upvotes)}</td>
          <td style="border: 1px solid #d1d5db; padding: 8px; font-weight: bold;">${escapeHtml(p.title)}</td>
          <td style="border: 1px solid #d1d5db; padding: 8px;">${escapeHtml(p.description)}</td>
        </tr>
      `;
    }).join('');

    const excelHtmlTemplate = `
      <html xmlns:o="urn:schemas-microsoft-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="content-type" content="text/html; charset=UTF-8"/>
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>TVK Acharapakkam Reports</x:Name>
                <x:WorksheetOptions>
                  <x:DisplayGridlines/>
                </x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <style>
          th { background-color: #4a0000; color: #ffcc00; font-family: Arial, sans-serif; font-size: 14px; font-weight: bold; border: 1px solid #3a0000; padding: 10px; }
          td { mso-number-format:"\\@"; }
        </style>
      </head>
      <body>
        <h2 style="font-family: Arial, sans-serif; color: #4a0000;">தமிழக வெற்றி கழகம் - அச்சரப்பாக்கம் தொகுதி மக்கள் குறைதீர்ப்பு அறிக்கை (${dateStamp})</h2>
        <p style="font-family: Arial, sans-serif; font-size: 12px; color: #555;">மொத்த மனுக்கள்: ${listToExport.length} | உருவாக்கப்பட்ட நாள்: ${new Date().toLocaleString('ta-IN')}</p>
        <table style="border-collapse: collapse; width: 100%;">
          <thead>
            <tr>
              <th>Tracking No (மனு எண்)</th>
              <th>Created Date (தேதி)</th>
              <th>Citizen Name (மனுதாரர் பெயர்)</th>
              <th>Phone (தொடர்பு எண்)</th>
              <th>Ward No (வார்டு)</th>
              <th>Street Name (தெரு / பகுதி)</th>
              <th>Category (வகைப்பாடு)</th>
              <th>Status (நிலை)</th>
              <th>Upvotes (ஆதரவு வாக்குகள்)</th>
              <th>Title (தலைப்பு)</th>
              <th>Description (விளக்கம்)</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob(['\uFEFF' + excelHtmlTemplate], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `TVK_Acharapakkam_Report_${dateStamp}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    addToast({
      type: 'success',
      title: 'Excel அறிக்கை பதிவிறக்கம் செய்யப்பட்டது! 📥',
      message: `${listToExport.length} மனுக்களின் விவரங்கள் கொண்ட Excel (.xls) கோப்பு தமிழ் எழுத்துக்களுடன் தயாராகிவிட்டது.`
    });
  };

  // Download All Petitions (Entire Dataset) as CSV for manual official reporting
  const handleDownloadAllCSV = () => {
    if (!petitions || petitions.length === 0) {
      addToast({
        type: 'warning',
        title: 'தரவு எதுவும் இல்லை',
        message: 'பதிவிறக்கம் செய்ய எந்த மனுக்களும் இல்லை.'
      });
      return;
    }

    const headers = [
      'Tracking No (மனு எண்)',
      'Created Date (தேதி)',
      'Citizen Name (மனுதாரர் பெயர்)',
      'Phone (தொடர்பு எண்)',
      'Ward No (வார்டு)',
      'Street Name (தெரு / பகுதி)',
      'Category (வகைப்பாடு)',
      'Status (நிலை)',
      'Upvotes (ஆதரவு வாக்குகள்)',
      'Title (தலைப்பு)',
      'Description (விளக்கம்)',
      'Official Notes (அதிகாரப்பூர்வ குறிப்பு)'
    ];

    const rows = petitions.map(p => {
      const dateStr = new Date(p.createdAt).toLocaleDateString('ta-IN');
      const statusText = p.status === 'resolved' 
        ? 'தீர்க்கப்பட்டது (Resolved)' 
        : p.status === 'action_taken' 
        ? 'அரசு நடவடிக்கை (Action Taken)' 
        : p.status === 'in_progress' 
        ? 'பரிசீலனையில் (In Progress)' 
        : 'பதிவாகியுள்ளது (Pending)';

      const categoryText = getIssueCategoryLabel(p.category);

      const clean = (val: string | number | undefined) => `"${String(val || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`;

      return [
        clean(p.trackingNo),
        clean(dateStr),
        clean(p.citizenName),
        clean(p.phone),
        clean(p.wardNo),
        clean(p.streetName),
        clean(categoryText),
        clean(statusText),
        clean(p.upvotes),
        clean(p.title),
        clean(p.description),
        clean(p.officialNotes)
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    const dateStamp = new Date().toISOString().slice(0, 10);
    link.setAttribute('download', `TVK_Acharapakkam_ALL_Petitions_Dataset_${dateStamp}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    addToast({
      type: 'success',
      title: 'அனைத்து மனுக்களும் பதிவிறக்கம் செய்யப்பட்டன! 📥',
      message: `மொத்தம் ${petitions.length} மனுக்களின் முழுமையான தரவுத்தொகுப்பு (CSV Dataset) வெற்றிகரமாகப் பதிவிறக்கப்பட்டது.`
    });
  };

  // CSV Export Handler
  const handleExportCSV = () => {
    const listToExport = filteredPetitions;
    if (!listToExport || listToExport.length === 0) {
      addToast({
        type: 'warning',
        title: 'தரவு எதுவும் இல்லை',
        message: 'தேர்ந்தெடுக்கப்பட்ட வடிகட்டியில் ஏற்றுமதி செய்ய எந்த மனுக்களும் இல்லை.'
      });
      return;
    }

    const headers = [
      'Tracking No (மனு எண்)',
      'Created Date (தேதி)',
      'Citizen Name (மனுதாரர் பெயர்)',
      'Phone (தொடர்பு எண்)',
      'Ward No (வார்டு)',
      'Street Name (தெரு / பகுதி)',
      'Category (வகைப்பாடு)',
      'Status (நிலை)',
      'Upvotes (ஆதரவு வாக்குகள்)',
      'Title (தலைப்பு)',
      'Description (விளக்கம்)'
    ];

    const rows = listToExport.map(p => {
      const dateStr = new Date(p.createdAt).toLocaleDateString('ta-IN');
      const statusText = p.status === 'resolved' 
        ? 'தீர்க்கப்பட்டது (Resolved)' 
        : p.status === 'action_taken' 
        ? 'அரசு நடவடிக்கை (Action Taken)' 
        : p.status === 'in_progress' 
        ? 'பரிசீலனையில் (In Progress)' 
        : 'பதிவாகியுள்ளது (Pending)';

      const categoryText = getIssueCategoryLabel(p.category);

      const clean = (val: string | number | undefined) => `"${String(val || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`;

      return [
        clean(p.trackingNo),
        clean(dateStr),
        clean(p.citizenName),
        clean(p.phone),
        clean(p.wardNo),
        clean(p.streetName),
        clean(categoryText),
        clean(statusText),
        clean(p.upvotes),
        clean(p.title),
        clean(p.description)
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    const dateStamp = new Date().toISOString().slice(0, 10);
    link.setAttribute('download', `TVK_Acharapakkam_Official_Report_${dateStamp}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    addToast({
      type: 'success',
      title: 'CSV அறிக்கை பதிவிறக்கம் செய்யப்பட்டது! 📥',
      message: `${listToExport.length} மனுக்களின் விவரங்கள் கொண்ட CSV கோப்பு தயாராகிவிட்டது.`
    });
  };

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      
      {/* Header & Export Action Banner */}
      <div className="mb-8 bg-gradient-to-r from-[#4a0000] via-[#3a0000] to-[#2b0000] rounded-2xl p-6 sm:p-8 text-white shadow-lg border-b-4 border-[#ffcc00] flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <span className="text-xs font-extrabold text-[#4a0000] bg-[#ffcc00] px-3 py-1 rounded-full uppercase tracking-wider inline-flex items-center gap-1">
            <BarChart3 className="w-3.5 h-3.5" />
            <span>அதிகாரப்பூர்வ அறிக்கை மையம் (Official Reporting Center)</span>
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            📊 மக்கள் குறைதீர்ப்பு பகுப்பாய்வு & அறிக்கை
          </h2>
          <p className="text-xs sm:text-sm text-neutral-200 max-w-2xl leading-relaxed">
            அச்சரப்பாக்கம் பேரூராட்சியில் பெறப்பட்ட மனுக்கள், தீர்வு காணப்பட்ட விகிதம் மற்றும் அரசுத் துறை அறிக்கைகளுக்கான CSV/Excel கோப்பு ஏற்றுமதி வசதி.
          </p>
        </div>

        {/* Export Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-shrink-0">
          <button
            onClick={handleDownloadAllCSV}
            title="அனைத்து மனுக்களின் முழுத் தரவுத்தொகுப்பை (CSV) பதிவிறக்குகிறது"
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 active:scale-95 border border-emerald-500 cursor-pointer"
          >
            <Download className="w-4 h-4 text-[#ffcc00]" />
            <span>📥 அனைத்து மனுக்கள் பதிவிறக்கம் (Download All CSV)</span>
          </button>

          <button
            onClick={handleExportExcel}
            title="Microsoft Excel செயலியில் தமிழ் எழுத்துக்கள் தெளிவாகத் தோன்றும்"
            className="px-3.5 py-2.5 bg-[#ffcc00] hover:bg-[#ffb700] text-[#4a0000] font-extrabold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 active:scale-95 border border-[#e6b800] cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-[#4a0000]" />
            <span>Excel (.xls)</span>
          </button>

          <button
            onClick={handleExportCSV}
            title="வடிகட்டப்பட்ட மனுக்களை CSV ஆகப் பதிவிறக்குகிறது"
            className="px-3 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl border border-white/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>CSV (.csv)</span>
            <Download className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Export Filter Controls Bar */}
      <div className="bg-white border border-neutral-200 rounded-xl p-4 mb-8 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-bold text-neutral-600 flex items-center gap-1.5">
            <Filter className="w-4 h-4 text-[#4a0000]" />
            <span>ஏற்றுமதி அறிக்கை வடிகட்டி (Filter for Export):</span>
          </span>

          {/* Ward Select */}
          <select
            value={selectedWardExport}
            onChange={(e) => setSelectedWardExport(e.target.value === 'all' ? 'all' : Number(e.target.value))}
            className="bg-neutral-100 border border-neutral-300 text-neutral-800 text-xs rounded-lg px-3 py-2 font-bold focus:outline-none focus:ring-2 focus:ring-[#4a0000]"
          >
            <option value="all">அனைத்து வார்டுகள் (All 15 Wards)</option>
            {Array.from({ length: 15 }, (_, i) => i + 1).map(w => (
              <option key={w} value={w}>வார்டு {w}</option>
            ))}
          </select>

          {/* Status Select */}
          <select
            value={selectedStatusExport}
            onChange={(e) => setSelectedStatusExport(e.target.value)}
            className="bg-neutral-100 border border-neutral-300 text-neutral-800 text-xs rounded-lg px-3 py-2 font-bold focus:outline-none focus:ring-2 focus:ring-[#4a0000]"
          >
            <option value="all">அனைத்து நிலைகள் (All Statuses)</option>
            <option value="pending">பதிவாகியுள்ளது (Pending)</option>
            <option value="in_progress">பரிசீலனையில் (In Progress)</option>
            <option value="action_taken">அரசு நடவடிக்கை (Action Taken)</option>
            <option value="resolved">தீர்க்கப்பட்டது (Resolved)</option>
          </select>
        </div>

        <div className="flex flex-wrap items-center justify-between md:justify-end gap-2 text-xs font-bold text-neutral-500">
          <span>தயாராக உள்ள மனுக்கள்: <strong className="text-[#4a0000] font-extrabold">{filteredPetitions.length}</strong> / <strong>{petitions.length}</strong></span>
          
          <button
            onClick={handleDownloadAllCSV}
            className="text-xs bg-[#4a0000] text-[#ffcc00] border border-[#ffcc00]/40 px-3 py-1.5 rounded-lg font-extrabold hover:bg-[#380000] flex items-center gap-1.5 cursor-pointer shadow-2xs"
            title="அனைத்து மனுக்களையும் உடனடியாக CSV ஆக பதிவிறக்குக"
          >
            <Download className="w-3.5 h-3.5 text-[#ffcc00]" />
            <span>அனைத்து மனுக்களையும் பதிவிறக்குக (CSV)</span>
          </button>
        </div>
      </div>

      {/* Top 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        
        <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-neutral-600">மொத்த மனுக்கள்</span>
            <BarChart3 className="w-5 h-5 text-[#4a0000]" />
          </div>
          <h3 className="text-3xl font-extrabold text-neutral-900">{total}</h3>
          <p className="text-xs text-[#4a0000] mt-1 font-bold">15 வார்டுகளின் தொகுப்பு</p>
        </div>

        <div className="bg-white border border-emerald-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-neutral-600">தீர்வு காணப்பட்டவை</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>
          <h3 className="text-3xl font-extrabold text-emerald-700">{resolved}</h3>
          <p className="text-xs text-emerald-800 mt-1 font-bold">{resolutionPercentage}% தீர்வு விகிதம்</p>
        </div>

        <div className="bg-white border border-amber-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-neutral-600">பரிசீலனை / நடவடிக்கை</span>
            <Clock className="w-5 h-5 text-amber-600" />
          </div>
          <h3 className="text-3xl font-extrabold text-amber-700">{inProgress}</h3>
          <p className="text-xs text-amber-800 mt-1 font-bold">அதிகாரிகள் கவனத்தில்</p>
        </div>

        <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-neutral-600">மக்களின் ஆதரவுகள்</span>
            <ThumbsUp className="w-5 h-5 text-[#4a0000]" />
          </div>
          <h3 className="text-3xl font-extrabold text-[#4a0000]">
            {petitions.reduce((a, b) => a + b.upvotes, 0) + 380}
          </h3>
          <p className="text-xs text-neutral-600 mt-1 font-bold">பொதுமக்கள் வாக்குகள்</p>
        </div>

      </div>

      {/* Category Breakdown & Top Voted Petitions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Category Breakdown Chart */}
        <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-sm">
          <h3 className="text-base font-extrabold text-[#4a0000] mb-4 flex items-center gap-2">
            <PieChart className="w-5 h-5" />
            <span>பிரச்சனைகளின் வகைப்பாடு (Category Breakdown)</span>
          </h3>

          <div className="space-y-4">
            {categories.map((cat) => {
              const pct = total > 0 ? Math.round((cat.count / total) * 100) : 0;
              return (
                <div key={cat.label}>
                  <div className="flex justify-between text-xs font-bold text-neutral-700 mb-1">
                    <span>{cat.label}</span>
                    <span className="text-[#4a0000]">{cat.count} மனுக்கள் ({pct}%)</span>
                  </div>
                  <div className="w-full bg-neutral-100 h-3 rounded-full overflow-hidden">
                    <div
                      className={`${cat.color} h-full transition-all duration-500`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Upvoted Issues */}
        <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-sm">
          <h3 className="text-base font-extrabold text-[#4a0000] mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            <span>அதிக ஆதரவு பெற்ற பிரதான குறைகள் (High Priority Issues)</span>
          </h3>

          <div className="space-y-3">
            {topPetitions.map((p) => (
              <div key={p.id} className="bg-neutral-50 border border-neutral-200 rounded-lg p-3.5 text-xs">
                <div className="flex items-center justify-between text-[#4a0000] font-bold mb-1">
                  <span>{p.trackingNo} • வார்டு {p.wardNo}</span>
                  <span className="flex items-center gap-1 bg-white px-2 py-0.5 rounded-md border border-neutral-300">
                    <ThumbsUp className="w-3 h-3 text-[#4a0000]" />
                    <span>{p.upvotes} ஆதரவு</span>
                  </span>
                </div>
                <p className="font-bold text-neutral-900 line-clamp-1">{p.title}</p>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
