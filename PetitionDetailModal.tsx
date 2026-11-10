import React, { useState } from 'react';
import { Petition } from '../types';
import { X, ThumbsUp, MapPin, Phone, Calendar, CheckCircle2, Clock, Send, MessageSquare, Copy, Printer, Download, ShieldCheck, User, Share2, Check, QrCode, FileText, Loader2, Camera, ZoomIn, Maximize2 } from 'lucide-react';
import { PetitionTimeline } from './PetitionTimeline';
import { QRCodeCanvas } from 'qrcode.react';
import { downloadPetitionPDF } from '../utils/pdfGenerator';
import { useToast } from './ToastContainer';
import tvkLogo from '../assets/images/tvk_official_logo_1785141164838.jpg';
import vijayPortrait from '../assets/images/leader_thalapathy_vijay_1785141183549.jpg';

interface PetitionDetailModalProps {
  petition: Petition | null;
  onClose: () => void;
  onUpvote: (id: string, e: React.MouseEvent) => void;
  onAddComment: (petitionId: string, author: string, text: string) => void;
  onOpenPrintableQr?: (petitionId: string) => void;
}

const PetitionDetailModalContent: React.FC<PetitionDetailModalProps & { petition: Petition }> = ({
  petition,
  onClose,
  onUpvote,
  onAddComment,
  onOpenPrintableQr
}) => {
  const { addToast } = useToast();
  const [commentText, setCommentText] = useState('');
  const [commenterName, setCommenterName] = useState('');
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showQrCode, setShowQrCode] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [activeLightboxImage, setActiveLightboxImage] = useState<string | null>(null);

  // Gather all photos attached to this petition
  const allPhotos = React.useMemo(() => {
    if (!petition) return [];
    const list: string[] = [];
    if (petition.images && Array.isArray(petition.images)) {
      petition.images.forEach(img => {
        if (img && !list.includes(img)) list.push(img);
      });
    }
    if (petition.imageUrl && !list.includes(petition.imageUrl)) {
      list.push(petition.imageUrl);
    }
    return list;
  }, [petition]);

  // Generate unique shareable link for this petition
  const shareUrl = `${window.location.origin}${window.location.pathname}?petition=${encodeURIComponent(petition.id)}`;

  const handleDownloadQR = () => {
    const canvas = document.getElementById(`qr-canvas-${petition.id}`) as HTMLCanvasElement;
    if (canvas) {
      const pngUrl = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.href = pngUrl;
      downloadLink.download = `TVK_Petition_QR_${petition.trackingNo}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    }
  };
  
  const shareText = `📌 TVK அச்சரப்பாக்கம் மக்கள் குறைதீர்ப்பு மையம்\n\nமனு எண்: ${petition.trackingNo}\nதலைப்பு: ${petition.title}\nவார்டு: வார்டு ${petition.wardNo} (${petition.streetName})\n\nபொதுமக்கள் கோரிக்கைக்கு இணைய வழியில் ஆதரவு அளித்து பிரச்சனை தீர்க்க உதவுங்கள்! 🙏\nநேரடி இணைப்பு: ${shareUrl}`;

  const handleShareWhatsApp = () => {
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
    window.open(waUrl, '_blank');
  };

  const handleShareFacebook = () => {
    const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`;
    window.open(fbUrl, '_blank');
  };

  const handleShareTwitter = () => {
    const twUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
    window.open(twUrl, '_blank');
  };

  const handleShareTelegram = () => {
    const tgUrl = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(`📌 TVK மனு: ${petition.title}`)}`;
    window.open(tgUrl, '_blank');
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `TVK மனு: ${petition.title}`,
          text: `மனு எண்: ${petition.trackingNo} - ${petition.title}`,
          url: shareUrl,
        });
      } catch (err) {
        console.warn("Native share error or dismissed:", err);
      }
    } else {
      handleCopyLink();
    }
  };

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    onAddComment(petition.id, commenterName.trim() || 'அச்சரப்பாக்கம் குடிமகன்', commentText.trim());
    setCommentText('');
  };

  const handleCopyDraft = () => {
    const textToCopy = petition.formalDraft || petition.description;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadPDF = async () => {
    setIsGeneratingPdf(true);
    try {
      const generated = await downloadPetitionPDF(petition);
      if (!generated) throw new Error('PDF generation did not complete');
      addToast({
        type: 'success',
        title: 'PDF பதிவிறக்கம் தொடங்கியது',
        message: `${petition.trackingNo} மனு PDF தயாராக உள்ளது.`
      });
    } catch (err) {
      console.error("PDF generation failed:", err);
      addToast({
        type: 'warning',
        title: 'மனு PDF உருவாக்க முடியவில்லை',
        message: err instanceof Error ? err.message : 'அச்சு சாளரத்தைத் திறக்கிறது.'
      });
      handlePrint();
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const today = new Date(petition.createdAt).toLocaleDateString('ta-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8" />
            <title>மனு_${petition.trackingNo}_TVK_Acharapakkam</title>
            <style>
              @page { size: A4; margin: 18mm; }
              body {
                font-family: Arial, 'Helvetica Neue', 'Latha', 'Noto Sans Tamil', sans-serif;
                color: #111;
                line-height: 1.6;
                padding: 24px;
                background-color: #fff;
              }
              .header {
                text-align: center;
                border-bottom: 3px double #4a0000;
                padding-bottom: 12px;
                margin-bottom: 20px;
              }
              .party-name {
                color: #4a0000;
                font-size: 24px;
                font-weight: 900;
                margin: 0;
                letter-spacing: 0.5px;
              }
              .sub-header {
                color: #8b0000;
                font-size: 15px;
                font-weight: 800;
                margin-top: 4px;
              }
              .center-tag {
                background: #ffcc00;
                color: #4a0000;
                display: inline-block;
                padding: 4px 14px;
                font-size: 12px;
                font-weight: 900;
                border-radius: 4px;
                margin-top: 8px;
              }
              .meta-table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 20px;
                font-size: 13px;
                background: #fbfbfb;
              }
              .meta-table td {
                padding: 8px 12px;
                border: 1px solid #e0e0e0;
              }
              .section-title {
                font-size: 13px;
                font-weight: 800;
                color: #4a0000;
                border-bottom: 2px solid #4a0000;
                padding-bottom: 3px;
                margin-top: 20px;
                margin-bottom: 10px;
              }
              .content-box {
                background: #fafafa;
                border: 1px solid #ddd;
                padding: 12px 16px;
                border-radius: 6px;
                font-size: 13px;
                white-space: pre-wrap;
              }
              .draft-box {
                background: #f5f9f5;
                border: 1px solid #b2dfdb;
                padding: 14px 18px;
                border-radius: 6px;
                font-family: monospace, sans-serif;
                font-size: 12px;
                white-space: pre-wrap;
                line-height: 1.7;
              }
              .footer-signature {
                margin-top: 45px;
                display: flex;
                justify-content: space-between;
                align-items: flex-end;
                font-size: 12px;
              }
              .sig-box {
                text-align: center;
                min-width: 180px;
              }
              .sig-line {
                border-top: 1px dashed #333;
                margin-top: 45px;
                padding-top: 5px;
                font-weight: bold;
              }
            </style>
          </head>
          <body>
            <div class="header" style="display: flex; align-items: center; justify-content: space-between; border-bottom: 3px double #4a0000; padding-bottom: 12px; margin-bottom: 20px;">
              <!-- Left Side: TVK Official Logo -->
              <div style="display: flex; align-items: center; gap: 10px; text-align: left; width: 170px;">
                <img src="${tvkLogo}" alt="TVK Official Logo" style="width: 56px; height: 56px; border-radius: 50%; border: 2px solid #ffcc00; object-fit: cover; flex-shrink: 0;" />
                <div>
                  <div style="font-size: 12px; font-weight: 900; color: #4a0000; text-transform: uppercase;">தவெக</div>
                  <div style="font-size: 9.5px; font-weight: 700; color: #555;">கட்சிச் சின்னம்</div>
                </div>
              </div>

              <!-- Center Title -->
              <div style="text-align: center; flex: 1;">
                <h1 class="party-name" style="color: #4a0000; font-size: 21px; font-weight: 900; margin: 0; line-height: 1.2;">தமிழக வெற்றிக் கழகம் (TVK)</h1>
                <div class="sub-header" style="color: #8b0000; font-size: 13.5px; font-weight: 800; margin-top: 2px;">அச்சரப்பாக்கம் மக்கள் குறைதீர்ப்பு மையம்</div>
                <div class="center-tag" style="background: #ffcc00; color: #4a0000; display: inline-block; padding: 3px 12px; font-size: 10.5px; font-weight: 900; border-radius: 4px; margin-top: 6px;">அரசு அதிகாரப்பூர்வ மனு படிவம் (Official Petition Copy)</div>
              </div>

              <!-- Right Side: Leader Thalapathy Vijay -->
              <div style="display: flex; align-items: center; justify-content: flex-end; gap: 10px; text-align: right; width: 170px;">
                <div>
                  <div style="font-size: 12px; font-weight: 900; color: #4a0000;">தலைவர் விஜய்</div>
                  <div style="font-size: 9.5px; font-weight: 700; color: #555;">Thalapathy Vijay</div>
                </div>
                <img src="${vijayPortrait}" alt="Thalapathy Vijay" style="width: 56px; height: 56px; border-radius: 50%; border: 2px solid #ffcc00; object-fit: cover; flex-shrink: 0;" />
              </div>
            </div>

            <table class="meta-table">
              <tr>
                <td><strong>மனு எண்:</strong> <span style="color: #4a0000; font-weight: bold;">${petition.trackingNo}</span></td>
                <td><strong>வார்டு எண்:</strong> வார்டு ${petition.wardNo}</td>
                <td><strong>தேதி:</strong> ${today}</td>
              </tr>
              <tr>
                <td><strong>மனுதாரர்:</strong> ${petition.citizenName}</td>
                <td><strong>தெரு / நகர்:</strong> ${petition.streetName}</td>
                <td><strong>தொடர்பு எண்:</strong> ${petition.phone}</td>
              </tr>
            </table>

            <div class="section-title">மனுவின் முதன்மைத் தலைப்பு:</div>
            <div class="content-box"><strong>${petition.title}</strong></div>

            <div class="section-title">புகார் / கோரிக்கை விரிவான விவரம்:</div>
            <div class="content-box">${petition.description}</div>

            ${petition.formalDraft ? `
              <div class="section-title">அரசு அதிகாரிகளுக்கான முறையான மனு வடிவம் (Formal Government Draft):</div>
              <div class="draft-box">${petition.formalDraft}</div>
            ` : ''}

            <div class="footer-signature">
              <div class="sig-box">
                <div>இடம்: அச்சரப்பாக்கம்</div>
                <div>தேதி: ${today}</div>
              </div>
              <div class="sig-box">
                <div class="sig-line">மனுதாரர் கையொப்பம்</div>
              </div>
            </div>

            <div style="margin-top: 30px; text-align: center; font-size: 11px; color: #666; border-top: 1px solid #eee; padding-top: 8px;">
              * தவெக அச்சரப்பாக்கம் மக்கள் சேவை மையம் டிஜிட்டல் சான்றளிக்கப்பட்ட மனு படிவம்.
            </div>

            <script>
              window.onload = function() {
                window.print();
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const handleCancel = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    onClose();
  };

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div 
      className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleCancel(e);
        }
      }}
    >
      <div className="bg-white border border-neutral-200 rounded-xl max-w-3xl w-full my-8 overflow-hidden shadow-xl relative animate-fadeIn max-h-[90vh] flex flex-col">
        
        {/* Modal Header */}
        <div className="bg-[#4a0000] p-5 border-b-2 border-[#ffcc00] flex items-center justify-between sticky top-0 z-10 text-white">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-[#ffcc00] text-[#4a0000] text-xs font-extrabold px-2.5 py-0.5 rounded-md font-mono">
                {petition.trackingNo}
              </span>
              <span className="text-xs text-neutral-200 font-medium">
                வார்டு எண் {petition.wardNo}
              </span>
            </div>
            <h3 className="text-lg sm:text-xl font-extrabold text-white mt-1 leading-snug">
              {petition.title}
            </h3>
          </div>

          <button
            type="button"
            onClick={handleCancel}
            className="p-1.5 bg-[#330000] text-neutral-200 hover:bg-[#ffcc00] hover:text-[#4a0000] rounded-lg transition-all cursor-pointer"
            title="மூடுக (Close)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-neutral-800">
          
          {/* Visual Petition Timeline */}
          <PetitionTimeline 
            status={petition.status} 
            createdAt={petition.createdAt} 
            updatedAt={petition.updatedAt} 
          />

          {/* Citizen Meta Info */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-neutral-50 p-4 rounded-lg border border-neutral-200 text-xs">
            <div className="flex items-center gap-2">
              {petition.avatarUrl ? (
                <img
                  src={petition.avatarUrl}
                  alt={petition.citizenName}
                  className="w-8 h-8 rounded-full object-cover border border-[#ffcc00] shadow-xs"
                />
              ) : (
                <User className="w-4 h-4 text-[#4a0000]" />
              )}
              <div>
                <span className="text-neutral-500 block">மனுதாரர்:</span>
                <span className="font-bold text-neutral-900">{petition.citizenName}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#4a0000]" />
              <div>
                <span className="text-neutral-500 block">இடம் / தெரு:</span>
                <span className="font-bold text-neutral-900">{petition.streetName} (வார்டு {petition.wardNo})</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#4a0000]" />
              <div>
                <span className="text-neutral-500 block">தாக்கல் செய்த தேதி:</span>
                <span className="font-bold text-neutral-900">
                  {new Date(petition.createdAt).toLocaleDateString('ta-IN')}
                </span>
              </div>
            </div>
          </div>

          {/* Full Description */}
          <div>
            <h4 className="text-xs font-bold text-neutral-700 mb-2 uppercase tracking-wider">
              புகார் / கோரிக்கை விவரம்:
            </h4>
            <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4 text-sm leading-relaxed whitespace-pre-wrap font-sans text-neutral-800">
              {petition.description}
            </div>
          </div>

          {/* Photo Evidence Gallery */}
          {allPhotos.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-[#4a0000] mb-2 uppercase tracking-wider flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-[#4a0000]" />
                <span>புகைப்பட ஆதாரங்கள் / Photo Evidence ({allPhotos.length}):</span>
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {allPhotos.map((photoUrl, idx) => (
                  <div
                    key={idx}
                    onClick={() => setActiveLightboxImage(photoUrl)}
                    className="relative group rounded-xl overflow-hidden border border-neutral-200 aspect-video bg-neutral-900 cursor-pointer shadow-2xs hover:shadow-md transition-all hover:border-[#ffcc00]"
                  >
                    <img
                      src={photoUrl}
                      alt={`Photo Evidence ${idx + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white gap-1.5 font-bold text-xs">
                      <ZoomIn className="w-4 h-4 text-[#ffcc00]" />
                      <span>பெரிதாக்கு</span>
                    </div>
                    <span className="absolute bottom-2 left-2 bg-black/75 text-white text-[10px] font-mono px-2 py-0.5 rounded-md font-bold">
                      சான்று #{idx + 1}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Formal Draft Preview if available */}
          {petition.formalDraft && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>அரசு அதிகாரப்பூர்வ மனு மாதிரி (Formal Government Draft):</span>
                </h4>
                <button
                  onClick={handleCopyDraft}
                  className="text-xs font-bold bg-white hover:bg-neutral-100 text-neutral-800 border border-neutral-300 px-2.5 py-1 rounded-md flex items-center gap-1 shadow-2xs"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copied ? 'நகலெடுக்கப்பட்டது' : 'நகலெடு'}</span>
                </button>
              </div>
              <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4 font-mono text-xs sm:text-sm text-neutral-800 whitespace-pre-wrap leading-relaxed shadow-inner">
                {petition.formalDraft}
              </div>
            </div>
          )}

          {/* Official Update Note */}
          {petition.officialNote && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
              <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wider mb-1 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>TVK மக்கள் சேவை மைய அதிகாரப்பூர்வ குறிப்பு (Official Update):</span>
              </h4>
              <p className="text-sm text-emerald-800 font-medium">
                {petition.officialNote}
              </p>
            </div>
          )}

          {/* Upvote & Action Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-neutral-50 border border-neutral-200 rounded-xl p-4 gap-3 shadow-2xs">
            <div>
              <span className="text-xs font-bold text-neutral-500 block">மக்களின் ஆதரவு எண்ணிக்கை:</span>
              <span className="text-lg font-extrabold text-[#4a0000]">{petition.upvotes} ஆதரவுகள்</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={(e) => onUpvote(petition.id, e)}
                className="px-4 py-2 bg-[#ffcc00] hover:bg-[#ffb700] text-[#4a0000] font-extrabold rounded-lg text-xs sm:text-sm shadow-2xs transition-all flex items-center gap-2 active:scale-95 cursor-pointer"
              >
                <ThumbsUp className="w-4 h-4" />
                <span>ஆதரவு அளி</span>
              </button>

              {/* Quick WhatsApp Share Button in Toolbar */}
              <button
                type="button"
                onClick={handleShareWhatsApp}
                className="px-3.5 py-2 bg-[#25D366] hover:bg-[#1ebe5d] text-white font-extrabold text-xs rounded-lg shadow-2xs transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
                title="வாட்ஸ்அப்பில் பகிர்க (Share on WhatsApp)"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                </svg>
                <span>வாட்ஸ்அப்</span>
              </button>

              {/* Quick Facebook Share Button in Toolbar */}
              <button
                type="button"
                onClick={handleShareFacebook}
                className="px-3.5 py-2 bg-[#1877F2] hover:bg-[#1266d4] text-white font-extrabold text-xs rounded-lg shadow-2xs transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
                title="பேஸ்புக்கில் பகிர்க (Share on Facebook)"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                <span>பேஸ்புக்</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadPDF}
                disabled={isGeneratingPdf}
                className="px-3.5 py-2 bg-[#4a0000] hover:bg-[#380000] disabled:bg-[#4a0000]/60 text-white rounded-lg text-xs font-extrabold transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
                title="அரசு அதிகாரியிடம் சமர்ப்பிக்க PDF பதிவிறக்கம் செய் (Download PDF for Submission)"
              >
                {isGeneratingPdf ? (
                  <>
                    <Loader2 className="w-4 h-4 text-[#ffcc00] animate-spin" />
                    <span>PDF உருவாகிறது...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 text-[#ffcc00]" />
                    <span>PDF பதிவிறக்கம்</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="px-3 py-2 bg-white hover:bg-neutral-100 text-neutral-800 border border-neutral-300 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
                title="அச்சிடு (Print Copy)"
              >
                <Printer className="w-4 h-4 text-neutral-600" />
                <span className="hidden sm:inline">அச்சிடு</span>
              </button>
            </div>
          </div>

          {/* Social Media Share Box */}
          <div className="bg-gradient-to-r from-amber-50/70 via-[#fffdf0] to-amber-50/70 border border-[#ffcc00] rounded-xl p-4 shadow-2xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-xs sm:text-sm font-extrabold text-[#4a0000] flex items-center gap-1.5 uppercase tracking-wider">
                  <Share2 className="w-4 h-4 text-[#4a0000]" />
                  <span>மனுவை சமூக வலைதளங்களில் பகிர்க (Share Petition):</span>
                </h4>
                <p className="text-[11px] text-neutral-700 mt-0.5">
                  வார்டு {petition.wardNo} ({petition.streetName}) குறைதீர்ப்பு மனுவைப் பகிர்ந்து மக்களின் பேராதரவைப் பெறுங்கள்!
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* WhatsApp Share Button */}
                <button
                  type="button"
                  onClick={handleShareWhatsApp}
                  className="px-4 py-2 bg-[#25D366] hover:bg-[#1ebe5d] text-white font-extrabold text-xs rounded-lg shadow-sm transition-all flex items-center gap-2 active:scale-95 cursor-pointer border border-emerald-600"
                  title="WhatsApp-ல் பகிர்க"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                  </svg>
                  <span>வாட்ஸ்அப் (WhatsApp)</span>
                </button>

                {/* Facebook Share Button */}
                <button
                  type="button"
                  onClick={handleShareFacebook}
                  className="px-4 py-2 bg-[#1877F2] hover:bg-[#1266d4] text-white font-extrabold text-xs rounded-lg shadow-sm transition-all flex items-center gap-2 active:scale-95 cursor-pointer border border-blue-600"
                  title="Facebook-ல் பகிர்க"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  <span>பேஸ்புக் (Facebook)</span>
                </button>

                {/* Twitter / X Share Button */}
                <button
                  type="button"
                  onClick={handleShareTwitter}
                  className="px-4 py-2 bg-black hover:bg-neutral-800 text-white font-extrabold text-xs rounded-lg shadow-sm transition-all flex items-center gap-2 active:scale-95 cursor-pointer border border-neutral-700"
                  title="Twitter / X-ல் பகிர்க"
                >
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                  <span>ட்விட்டர் (X)</span>
                </button>

                {/* Telegram Share Button */}
                <button
                  type="button"
                  onClick={handleShareTelegram}
                  className="px-4 py-2 bg-[#229ED9] hover:bg-[#1d8ec4] text-white font-extrabold text-xs rounded-lg shadow-sm transition-all flex items-center gap-2 active:scale-95 cursor-pointer border border-sky-600"
                  title="Telegram-ல் பகிர்க"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.96 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.831-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                  </svg>
                  <span>டெலிகிராம்</span>
                </button>

                {/* Native / System Share */}
                <button
                  type="button"
                  onClick={handleNativeShare}
                  className="px-3 py-2 bg-[#4a0000] hover:bg-[#380000] text-[#ffcc00] font-extrabold text-xs rounded-lg shadow-2xs transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
                  title="பகிர்க"
                >
                  <Share2 className="w-3.5 h-3.5 text-[#ffcc00]" />
                  <span>பகிர்</span>
                </button>

                {/* QR Code Toggle Button */}
                <button
                  type="button"
                  onClick={() => setShowQrCode(prev => !prev)}
                  className={`px-3 py-2 font-extrabold text-xs rounded-lg shadow-2xs transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer ${
                    showQrCode
                      ? 'bg-[#ffcc00] text-[#4a0000]'
                      : 'bg-[#4a0000] text-[#ffcc00] hover:bg-[#380000]'
                  }`}
                  title="ஆஃப்லைன் துண்டுப்பிரசுரம் / சுவரொட்டிகளுக்கான QR குறியீடு"
                >
                  <QrCode className="w-3.5 h-3.5 text-[#ffcc00]" />
                  <span>QR குறியீடு</span>
                </button>
              </div>
            </div>

            {/* Direct Shareable Link Box */}
            <div className="flex items-center gap-2 bg-white border border-neutral-300 rounded-lg p-1.5 pl-3">
              <span className="text-[10px] uppercase tracking-wider font-extrabold text-[#4a0000] whitespace-nowrap hidden xs:inline">
                நேரடி லிங்க்:
              </span>
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="flex-1 text-xs text-neutral-700 bg-transparent border-none outline-none font-mono truncate select-all"
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  copiedLink 
                    ? 'bg-emerald-600 text-white' 
                    : 'bg-[#ffcc00] hover:bg-[#e6b800] text-[#4a0000]'
                }`}
              >
                {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'நகலெடுக்கப்பட்டது!' : 'நகலெடு'}</span>
              </button>
            </div>

            {/* QR Code Offline Poster Card */}
            {showQrCode && (
              <div className="mt-3 p-4 bg-white border-2 border-[#ffcc00] rounded-xl shadow-xs flex flex-col sm:flex-row items-center gap-4">
                <div className="p-2 bg-white border border-neutral-300 rounded-lg shadow-2xs flex flex-col items-center">
                  <QRCodeCanvas
                    id={`qr-canvas-${petition.id}`}
                    value={shareUrl}
                    size={140}
                    bgColor="#ffffff"
                    fgColor="#4a0000"
                    level="H"
                    includeMargin={true}
                  />
                  <span className="text-[10px] font-mono font-extrabold text-[#4a0000] mt-1">
                    {petition.trackingNo}
                  </span>
                </div>

                <div className="flex-1 text-center sm:text-left space-y-2">
                  <div>
                    <h5 className="text-xs sm:text-sm font-extrabold text-[#4a0000] flex items-center justify-center sm:justify-start gap-1.5">
                      <QrCode className="w-4 h-4 text-[#ffcc00]" />
                      <span>ஆஃப்லைன் துண்டுப்பிரசுரம் & சுவரொட்டி QR குறியீடு</span>
                    </h5>
                    <p className="text-xs text-neutral-600 mt-1 leading-relaxed">
                      இந்த QR குறியீட்டை அச்சிட்டு உங்கள் பகுதியில் அறிவிப்புப் பலகைகள் மற்றும் துண்டுப்பிரசுரங்களில் பயன்படுத்தலாம். பொதுமக்கள் மொபைலில் ஸ்கேன் செய்து सीधे இந்த மனுவிற்கு ஆதரவு அளிக்கலாம்!
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                    {onOpenPrintableQr && (
                      <button
                        type="button"
                        onClick={() => onOpenPrintableQr(petition.id)}
                        className="px-3.5 py-1.5 bg-[#ffcc00] hover:bg-[#e6b800] text-[#4a0000] font-black text-xs rounded-md shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer border border-[#e6b800]"
                      >
                        <Printer className="w-3.5 h-3.5 text-[#4a0000]" />
                        <span>களப்பணி QR அட்டை அச்சிடுக (Print)</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={handleDownloadQR}
                      className="px-3.5 py-1.5 bg-[#4a0000] hover:bg-[#380000] text-[#ffcc00] font-extrabold text-xs rounded-md shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>QR படம் பதிவிறக்கு (PNG)</span>
                    </button>
                    
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-bold text-xs rounded-md transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedLink ? 'நகலெடுக்கப்பட்டது' : 'இணைப்பு நகலெடு'}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Comments Section */}
          <div className="border-t border-neutral-200 pt-6">
            <h4 className="text-sm font-bold text-[#4a0000] mb-4 flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              <span>கருத்துகள் & பதிவுகள் ({petition.comments.length})</span>
            </h4>

            {/* Existing Comments */}
            <div className="space-y-3 mb-6">
              {petition.comments.length === 0 ? (
                <p className="text-xs text-neutral-500 italic">இன்னும் கருத்துகள் பதிவிடப்படவில்லை. உங்கள் கருத்தை முதல் நபராக எழுதுங்கள்.</p>
              ) : (
                petition.comments.map((comment) => (
                  <div key={comment.id} className="bg-neutral-50 border border-neutral-200 rounded-lg p-3 text-xs">
                    <div className="flex items-center justify-between text-neutral-500 mb-1">
                      <span className="font-bold text-[#4a0000]">{comment.author}</span>
                      <span>{new Date(comment.timestamp).toLocaleDateString('ta-IN')}</span>
                    </div>
                    <p className="text-neutral-800">{comment.text}</p>
                  </div>
                ))
              )}
            </div>

            {/* Add Comment Form */}
            <form onSubmit={handleCommentSubmit} className="space-y-3">
              <input
                type="text"
                value={commenterName}
                onChange={(e) => setCommenterName(e.target.value)}
                placeholder="உங்கள் பெயர் (எ.கா. முரளி, வார்டு 2)"
                className="w-full bg-neutral-50 border border-neutral-200 rounded-md p-2 text-xs text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#4a0000]"
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="உங்கள் கருத்து அல்லது கூடுதல் தகவலை எழுதவும்..."
                  className="flex-1 bg-neutral-50 border border-neutral-200 rounded-md p-2 text-xs text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#4a0000]"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#4a0000] hover:bg-[#380000] text-white font-bold rounded-md text-xs transition-all flex items-center gap-1 shadow-2xs"
                >
                  <Send className="w-3.5 h-3.5 text-[#ffcc00]" />
                  <span>அனுப்பு</span>
                </button>
              </div>
            </form>
          </div>

        </div>

      </div>

      {/* Lightbox Fullscreen Modal for Photo Evidence */}
      {activeLightboxImage && (
        <div
          className="fixed inset-0 z-[120] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setActiveLightboxImage(null)}
        >
          <div className="relative max-w-4xl w-full max-h-[90vh] flex flex-col items-center justify-center">
            <button
              type="button"
              onClick={() => setActiveLightboxImage(null)}
              className="absolute -top-12 right-0 bg-white/20 hover:bg-white/40 text-white p-2 rounded-full transition-all cursor-pointer shadow-lg"
              title="மூடுக (Close)"
            >
              <X className="w-6 h-6" />
            </button>

            <img
              src={activeLightboxImage}
              alt="Photo Evidence Preview"
              className="max-w-full max-h-[80vh] object-contain rounded-lg border-2 border-[#ffcc00] shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />

            <p className="text-white text-xs mt-3 bg-black/60 px-4 py-1.5 rounded-full border border-neutral-700">
              📌 புகைப்படச் சான்று - அச்சரப்பாக்கம் மக்கள் குறைதீர்ப்பு மையம்
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export const PetitionDetailModal: React.FC<PetitionDetailModalProps> = (props) => {
  if (!props.petition) return null;
  return <PetitionDetailModalContent {...props} petition={props.petition} />;
};
