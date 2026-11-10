import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { CivicEvent, getIssueCategoryLabel, Petition } from '../types';
import tvkLogo from '../assets/images/tvk_official_logo_1785141164838.jpg';
import vijayPortrait from '../assets/images/leader_thalapathy_vijay_1785141183549.jpg';

const escapeHtml = (value: string | number): string =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const getSafeImageSource = (source: string): string => {
  if (/^data:image\/(?:png|jpe?g|webp);base64,/i.test(source)) return source;
  try {
    const url = new URL(source, window.location.origin);
    return url.origin === window.location.origin ? url.href : '';
  } catch {
    return '';
  }
};

const addCanvasToPdfPages = (pdf: jsPDF, canvas: HTMLCanvasElement): void => {
  const imageData = canvas.toDataURL('image/jpeg', 0.94);
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const imageHeight = (canvas.height * pageWidth) / canvas.width;
  const pageCount = Math.max(1, Math.ceil(imageHeight / pageHeight));

  for (let pageIndex = 0; pageIndex < pageCount; pageIndex += 1) {
    if (pageIndex > 0) pdf.addPage();
    pdf.addImage(imageData, 'JPEG', 0, -pageIndex * pageHeight, pageWidth, imageHeight);
  }
};

export const downloadEventPDF = async (event: CivicEvent): Promise<void> => {
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-10000px';
  container.style.top = '0';
  container.style.width = '794px';
  container.style.padding = '36px';
  container.style.boxSizing = 'border-box';
  container.style.backgroundColor = '#ffffff';
  container.style.color = '#111827';
  container.style.fontFamily = "'Noto Sans Tamil', 'Mukta Malar', 'Segoe UI', system-ui, sans-serif";

  const eventDate = new Date(`${event.date}T00:00:00`).toLocaleDateString('ta-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  container.innerHTML = `
    <div style="border: 2px solid #4a0000; padding: 28px;">
      <header style="background: #4a0000; color: #ffffff; padding: 20px; margin: -28px -28px 24px;">
        <div style="font-size: 13px; color: #ffcc00; font-weight: 700;">விளங்காடு கிராமம் மக்கள் குறைதீர்வு மையம்</div>
        <h1 style="font-size: 24px; margin: 10px 0 0;">நிகழ்வு விவரம்</h1>
      </header>
      <div style="font-size: 13px; color: #4a0000; font-weight: 700;">${escapeHtml(event.badge)} · ${event.wardNo === 0 ? 'அனைத்து வார்டுகளும்' : `வார்டு ${event.wardNo}`}</div>
      <h2 style="font-size: 22px; line-height: 1.5; margin: 8px 0 20px;">${escapeHtml(event.title)}</h2>
      <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
        <tbody>
          <tr><th style="text-align: left; vertical-align: top; width: 150px; padding: 10px; border: 1px solid #d1d5db;">தேதி</th><td style="padding: 10px; border: 1px solid #d1d5db;">${escapeHtml(eventDate)}</td></tr>
          <tr><th style="text-align: left; vertical-align: top; padding: 10px; border: 1px solid #d1d5db;">நேரம்</th><td style="padding: 10px; border: 1px solid #d1d5db;">${escapeHtml(event.time)}</td></tr>
          <tr><th style="text-align: left; vertical-align: top; padding: 10px; border: 1px solid #d1d5db;">இடம்</th><td style="padding: 10px; border: 1px solid #d1d5db;">${escapeHtml(event.location)}</td></tr>
          <tr><th style="text-align: left; vertical-align: top; padding: 10px; border: 1px solid #d1d5db;">அமைப்பாளர்</th><td style="padding: 10px; border: 1px solid #d1d5db;">${escapeHtml(event.organizer)}</td></tr>
          <tr><th style="text-align: left; vertical-align: top; padding: 10px; border: 1px solid #d1d5db;">தொடர்பு எண்</th><td style="padding: 10px; border: 1px solid #d1d5db;">${escapeHtml(event.organizerPhone)}</td></tr>
        </tbody>
      </table>
      <h3 style="font-size: 16px; margin: 24px 0 8px;">விளக்கம்</h3>
      <p style="font-size: 14px; line-height: 1.8; white-space: pre-wrap; margin: 0;">${escapeHtml(event.description)}</p>
      <p style="font-size: 10px; color: #6b7280; text-align: center; margin-top: 30px; border-top: 1px solid #e5e7eb; padding-top: 12px;">உள்ளூர் நிகழ்வு தகவல் · ${escapeHtml(eventDate)}</p>
    </div>
  `;

  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, {
      scale: 1.5,
      logging: false,
      backgroundColor: '#ffffff'
    });
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    addCanvasToPdfPages(pdf, canvas);
    const safeEventId = event.id.replace(/[^a-zA-Z0-9_-]/g, '_') || 'event';
    pdf.save(`Vilangaadu_Event_${safeEventId}.pdf`);
  } catch (err) {
    console.error('Event PDF generation error:', err);
    throw new Error('நிகழ்வு PDF உருவாக்க முடியவில்லை. மீண்டும் முயற்சிக்கவும்.', { cause: err });
  } finally {
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
  }
};

/**
 * Generates and downloads a structured, formal Tamil Petition PDF
 * suitable for physical submission to Government Authorities (BDO/Panchayat)
 */
export const downloadPetitionPDF = async (petition: Petition): Promise<boolean> => {
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '-9999px';
  container.style.width = '794px'; // Standard A4 width at 96 DPI
  container.style.backgroundColor = '#ffffff';
  container.style.color = '#111827';
  container.style.fontFamily = "'Noto Sans Tamil', 'Mukta Malar', 'Segoe UI', system-ui, sans-serif";
  container.style.padding = '0';
  container.style.boxSizing = 'border-box';

  const shareUrl = `${window.location.origin}${window.location.pathname}?petition=${encodeURIComponent(petition.id)}`;

  // Try to grab existing QR canvas if available
  let qrDataUrl = '';
  const existingQrCanvas = document.getElementById(`qr-canvas-${petition.id}`) as HTMLCanvasElement;
  if (existingQrCanvas) {
    try {
      qrDataUrl = existingQrCanvas.toDataURL('image/png');
    } catch {
      qrDataUrl = '';
    }
  }

  let statusTextTa = 'புதிய மனு (PENDING)';
  let statusBg = '#fef3c7';
  let statusColor = '#92400e';
  if (petition.status === 'resolved') {
    statusTextTa = 'தீர்க்கப்பட்டது (RESOLVED)';
    statusBg = '#dcfce7';
    statusColor = '#166534';
  } else if (petition.status === 'action_taken') {
    statusTextTa = 'நடவடிக்கை எடுக்கப்பட்டது (ACTION TAKEN)';
    statusBg = '#dbeafe';
    statusColor = '#1e40af';
  } else if (petition.status === 'in_progress') {
    statusTextTa = 'பரிசீலனையில் உள்ளது (IN PROGRESS)';
    statusBg = '#ffedd5';
    statusColor = '#c2410c';
  }

  const formattedCategory = getIssueCategoryLabel(petition.category);
  const createdDateStr = new Date(petition.createdAt).toLocaleDateString('ta-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const formalText = petition.formalDraft || petition.description;
  const photoSources = (petition.images?.length ? petition.images : petition.imageUrl ? [petition.imageUrl] : [])
    .map(getSafeImageSource)
    .filter(Boolean)
    .slice(0, 4);

  container.innerHTML = `
    <div style="width: 100%; border: 3px solid #4a0000; box-sizing: border-box; background: #ffffff; padding: 0;">
      
      <!-- Top Maroon Header Banner with Left TVK Logo & Right Thalapathy Vijay Leader Avatar -->
      <div style="background-color: #4a0000; color: #ffffff; padding: 18px 24px; position: relative;">
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px;">
          
          <!-- LEFT SIDE: TVK Official Logo (தவெக கட்சிச் சின்னம்) -->
          <div style="display: flex; align-items: center; gap: 10px; width: 170px;">
            <img src="${tvkLogo}" alt="TVK Official Logo" style="width: 52px; height: 52px; border-radius: 50%; border: 2.5px solid #ffcc00; object-fit: cover; flex-shrink: 0;" />
            <div style="text-align: left;">
              <div style="font-size: 11px; font-weight: 900; color: #ffcc00; text-transform: uppercase;">தவெக</div>
              <div style="font-size: 9px; font-weight: 800; color: #ffffff; line-height: 1.2;">கட்சிச் சின்னம்</div>
            </div>
          </div>

          <!-- CENTER: Party Name & Center Info -->
          <div style="text-align: center; flex: 1;">
            <h1 style="margin: 0; font-size: 20px; font-weight: 900; letter-spacing: 0.5px; color: #ffffff; line-height: 1.2;">தமிழக வெற்றிக் கழகம் (TVK)</h1>
            <h2 style="margin: 3px 0 0 0; font-size: 13.5px; color: #ffcc00; font-weight: 800;">அச்சரப்பாக்கம் தொகுதி மக்கள் குறைதீர்ப்பு மையம்</h2>
            <p style="margin: 4px 0 0 0; font-size: 10px; color: #f3f4f6; letter-spacing: 0.3px; font-weight: 600;">
              அரசு துறை சமர்ப்பிப்புக்கான அதிகாரப்பூர்வ குடிமக்கள் மனு | OFFICIAL PUBLIC PETITION FOR GOVERNMENT SUBMISSION
            </p>
          </div>

          <!-- RIGHT SIDE: Leader Thalapathy Vijay (தலைவர் விஜய்) -->
          <div style="display: flex; align-items: center; justify-content: flex-end; gap: 10px; width: 170px;">
            <div style="text-align: right;">
              <div style="font-size: 11px; font-weight: 900; color: #ffcc00;">தலைவர் விஜய்</div>
              <div style="font-size: 9px; font-weight: 800; color: #ffffff; line-height: 1.2;">Thalapathy Vijay</div>
            </div>
            <img src="${vijayPortrait}" alt="Thalapathy Vijay" style="width: 52px; height: 52px; border-radius: 50%; border: 2.5px solid #ffcc00; object-fit: cover; flex-shrink: 0;" />
          </div>

        </div>
      </div>
      <div style="height: 6px; background-color: #ffcc00; width: 100%;"></div>

      <div style="padding: 28px 32px;">
        
        <!-- Document Title Badge -->
        <div style="text-align: center; margin-bottom: 22px;">
          <span style="background-color: #4a0000; color: #ffffff; font-size: 14px; font-weight: 800; padding: 6px 20px; border-radius: 6px; text-transform: uppercase; letter-spacing: 0.5px; border: 1px solid #ffcc00;">
            அரசு அதிகாரிக்கு சமர்ப்பிக்கப்படும் மனு விண்ணப்பம்
          </span>
        </div>

        <!-- Tracking & Verification Header Card -->
        <div style="background-color: #f9fafb; border: 1.5px solid #d1d5db; border-radius: 10px; padding: 14px 18px; margin-bottom: 22px; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <div style="font-size: 10px; color: #6b7280; font-weight: 700; text-transform: uppercase;">மனு எண்கட்டுப்பாடு (Tracking ID)</div>
            <div style="font-size: 18px; font-weight: 900; color: #4a0000; font-family: monospace; margin-top: 2px;">${escapeHtml(petition.trackingNo)}</div>
            <div style="font-size: 11.5px; color: #374151; font-weight: 700; margin-top: 4px;">
              வார்டு: வார்டு ${petition.wardNo} | பகுதி: ${escapeHtml(petition.streetName)}
            </div>
          </div>

          <div style="text-align: right; display: flex; align-items: center; gap: 14px;">
            <div>
              <div style="font-size: 10.5px; color: #6b7280;">பதிவு தேதி: ${createdDateStr}</div>
              <div style="display: inline-block; margin-top: 5px; padding: 4px 12px; border-radius: 9999px; font-size: 11px; font-weight: 800; background-color: ${statusBg}; color: ${statusColor}; border: 1px solid ${statusColor}40;">
                ${statusTextTa}
              </div>
            </div>

            ${qrDataUrl ? `
            <div style="border: 1px solid #d1d5db; padding: 4px; background: #fff; border-radius: 6px; text-align: center;">
              <img src="${qrDataUrl}" alt="QR Code" style="width: 58px; height: 58px; display: block;" />
              <div style="font-size: 7px; font-weight: 800; color: #4a0000; margin-top: 2px;">SCAN TO VERIFY</div>
            </div>
            ` : ''}
          </div>
        </div>

        <!-- Formal Header: To & From -->
        <div style="display: flex; justify-content: space-between; gap: 20px; margin-bottom: 20px; font-size: 12.5px; line-height: 1.6;">
          
          <!-- From -->
          <div style="flex: 1; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px 16px; background-color: #fafafa;">
            <div style="font-weight: 800; color: #4a0000; border-b: 1px solid #e5e7eb; padding-bottom: 4px; margin-bottom: 6px;">
              அனுப்புநர் (PETITIONER):
            </div>
            <div><strong>பெயர்:</strong> ${escapeHtml(petition.citizenName)}</div>
            <div><strong>முகவரி:</strong> ${escapeHtml(petition.streetName)}, வார்டு எண் ${petition.wardNo}</div>
            <div>அச்சரப்பாக்கம் பேரூராட்சி, செங்கல்பட்டு மாவட்டம்.</div>
            <div><strong>தொடர்பு எண்:</strong> ${escapeHtml(petition.phone)}</div>
          </div>

          <!-- To -->
          <div style="flex: 1; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px 16px; background-color: #fafafa;">
            <div style="font-weight: 800; color: #4a0000; border-b: 1px solid #e5e7eb; padding-bottom: 4px; margin-bottom: 6px;">
              பெறுநர் (RECIPIENT):
            </div>
            <div><strong>உயர்திரு. பேரூராட்சி செயல் அலுவலர் / வட்டார வளர்ச்சி அலுவலர் (BDO)</strong></div>
            <div>அச்சரப்பாக்கம் பேரூராட்சி அலுவலகம் / ஊராட்சி ஒன்றியம்,</div>
            <div>செங்கல்பட்டு மாவட்டம், தமிழ்நாடு.</div>
            <div style="color: #6b7280; font-size: 11px; margin-top: 2px;">துறை: ${formattedCategory}</div>
          </div>

        </div>

        <!-- Subject Line -->
        <div style="background-color: #fffbeb; border: 1.5px solid #fef08a; border-radius: 8px; padding: 12px 16px; margin-bottom: 20px;">
          <div style="font-size: 13px; font-weight: 900; color: #78350f;">
            பொருள் (SUBJECT): <span style="color: #111827;">${escapeHtml(petition.title)}</span>
          </div>
        </div>

        <!-- Salutation & Petition Body Text -->
        <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 18px; margin-bottom: 22px; background-color: #ffffff;">
          <div style="font-weight: 800; font-size: 13px; color: #111827; margin-bottom: 10px;">
            ஐயா / அம்மையீர்,
          </div>

          <div style="font-size: 12px; color: #1f2937; line-height: 1.8; white-space: pre-wrap; margin-bottom: 14px;">
${escapeHtml(formalText)}
          </div>

          <div style="font-size: 12px; color: #111827; font-weight: 700; background-color: #f3f4f6; padding: 10px 14px; border-radius: 6px; border-left: 4px solid #4a0000;">
            பிரார்த்தனை: எனவே, தாங்கள் இக்கோரிக்கையின் அவசியத்தைக் கருத்தில் கொண்டு உடனடியாக நேரில் கள ஆய்வு செய்து உரிய நடவடிக்கை எடுக்குமாறு பணிவன்புடன் கேட்டுக்கொள்கிறேன்.
          </div>
        </div>

        <!-- Public Endorsement Badge -->
        ${photoSources.length > 0 ? `
        <div style="margin-bottom: 20px; background-color: #fafafa; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px 16px;">
          <div style="font-size: 11px; font-weight: 800; color: #4a0000; margin-bottom: 8px; text-transform: uppercase;">
            📷 புகைப்பட ஆதார இணைப்புகள் / Attached Photo Evidence (${photoSources.length}):
          </div>
          <div style="display: flex; flex-wrap: wrap; gap: 10px;">
            ${photoSources.map((photoSrc, pIdx) => `
              <div style="width: 160px; height: 100px; border: 1px solid #d1d5db; border-radius: 6px; overflow: hidden; background-color: #111827;">
                <img src="${escapeHtml(photoSrc)}" style="width: 100%; height: 100%; object-fit: cover;" alt="Photo Evidence ${pIdx + 1}" />
              </div>
            `).join('')}
          </div>
        </div>
        ` : ''}

        <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 10px 16px; margin-bottom: 24px; display: flex; align-items: center; justify-content: space-between;">
          <div style="font-size: 11.5px; font-weight: 800; color: #166534;">
            👍 பொதுமக்கள் ஆதரவுச் சான்று:
          </div>
          <div style="font-size: 11.5px; font-weight: 700; color: #15803d;">
            அச்சரப்பாக்கம் பகுதியில் <strong>${petition.upvotes} குடிமக்கள்</strong> இந்த மனுவிற்கு இணைய வழியில் ஆதரவு அளித்துள்ளனர்.
          </div>
        </div>

        <!-- Signatures & Verification Stamp -->
        <div style="margin-top: 32px; padding-top: 18px; border-top: 2px dashed #9ca3af; display: flex; justify-content: space-between; align-items: flex-end;">
          
          <!-- Left: Place, Date & Petitioner Signature -->
          <div style="width: 220px; font-size: 12px; color: #374151;">
            <div><strong>இடம்:</strong> அச்சரப்பாக்கம்</div>
            <div style="margin-top: 2px;"><strong>தேதி:</strong> ${new Date().toLocaleDateString('ta-IN')}</div>
            
            <div style="margin-top: 45px; border-top: 1px solid #4b5563; padding-top: 6px; text-align: center; font-weight: 700; color: #111827;">
              மனுதாரர் கையொப்பம்<br/>
              <span style="font-size: 10px; font-weight: 400; color: #6b7280;">(Petitioner Signature)</span>
            </div>
          </div>

          <!-- Middle: Official Verification Seal -->
          <div style="text-align: center;">
            <div style="width: 86px; height: 86px; border-radius: 50%; border: 3px double #4a0000; background: #fffbeb; display: flex; flex-direction: column; align-items: center; justify-content: center; margin: 0 auto;">
              <div style="font-size: 11px; font-weight: 900; color: #4a0000; letter-spacing: 1px;">TVK</div>
              <div style="font-size: 7.5px; font-weight: 800; color: #b45309; margin: 1px 0;">VERIFIED</div>
              <div style="font-size: 7px; color: #4a0000; font-weight: 700;">அச்சரப்பாக்கம்</div>
            </div>
          </div>

          <!-- Right: Representative Signature -->
          <div style="width: 220px; text-align: center; font-size: 12px; color: #374151;">
            <div style="height: 52px;"></div>
            <div style="border-top: 1px solid #4b5563; padding-top: 6px; font-weight: 700; color: #111827;">
              TVK தொகுதி ஒருங்கிணைப்பாளர்<br/>
              <span style="font-size: 10px; font-weight: 400; color: #6b7280;">(TVK Representative Seal & Sign)</span>
            </div>
          </div>

        </div>

        <!-- Document Footer -->
        <div style="margin-top: 24px; text-align: center; font-size: 10px; color: #9ca3af; font-style: italic; border-top: 1px solid #f3f4f6; padding-top: 10px;">
          * இது தமிழக வெற்றிக் கழகம் (TVK) அச்சரப்பாக்கம் மக்கள் குறைதீர்ப்பு மையத்தின் மின்-மனு விண்ணப்ப ஆவணம் ஆகும்.
        </div>

      </div>
    </div>
  `;

  document.body.appendChild(container);

  try {
    await Promise.all(Array.from(container.querySelectorAll('img')).map(image => {
      const img = image as HTMLImageElement;
      if (img.complete) {
        return img.naturalWidth > 0
          ? Promise.resolve()
          : Promise.reject(new Error('PDF image failed to load'));
      }
      return new Promise<void>((resolve, reject) => {
        img.addEventListener('load', () => resolve(), { once: true });
        img.addEventListener('error', () => reject(new Error('PDF image failed to load')), { once: true });
      });
    }));
    const canvas = await html2canvas(container, {
      scale: 1.5,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    addCanvasToPdfPages(pdf, canvas);
    pdf.save(`TVK_Petition_${petition.trackingNo}.pdf`);
    return true;
  } catch (err) {
    console.error("PDF generation error:", err);
    throw new Error('மனு PDF உருவாக்க முடியவில்லை. மீண்டும் முயற்சிக்கவும்.', { cause: err });
  } finally {
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
  }
};

/**
 * Generates and downloads a compiled summary PDF report of filtered petitions
 * formatted as an official memorandum for submission to Government / BDO offices.
 */
export const downloadFilteredPetitionsPDF = async (
  petitions: Petition[],
  filterInfo: {
    ward: number | 'all';
    category: string;
    status: string;
    searchTerm: string;
  }
): Promise<boolean> => {
  if (petitions.length === 0) {
    throw new Error('PDF அறிக்கையில் சேர்க்க மனுக்கள் இல்லை.');
  }

  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '-9999px';
  container.style.width = '800px'; // Standard width for high-dpi snapshot
  container.style.backgroundColor = '#ffffff';
  container.style.color = '#111827';
  container.style.fontFamily = "'Noto Sans Tamil', 'Mukta Malar', 'Segoe UI', system-ui, sans-serif";
  container.style.padding = '0';
  container.style.boxSizing = 'border-box';

  const statusMap: Record<string, string> = {
    pending: 'புதிய மனு (Pending)',
    in_progress: 'பரிசீலனையில் (In Progress)',
    action_taken: 'நடவடிக்கை (Action Taken)',
    resolved: 'தீர்க்கப்பட்டது (Resolved)',
    all: 'அனைத்து நிலைகளும்'
  };

  const wardText = filterInfo.ward === 'all' ? 'அனைத்து 15 வார்டுகளும்' : `வார்டு எண் ${filterInfo.ward}`;
  const categoryText = filterInfo.category === 'all'
    ? 'அனைத்து பிரிவுகளும்'
    : getIssueCategoryLabel(filterInfo.category);
  const statusText = statusMap[filterInfo.status] || 'அனைத்து நிலைகளும்';
  const reportDateStr = new Date().toLocaleDateString('ta-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const totalUpvotesSum = petitions.reduce((sum, p) => sum + p.upvotes, 0);

  const tableRowsHtml = petitions.map((p, idx) => {
    let stBg = '#fef3c7';
    let stCol = '#92400e';
    let stTxt = 'புதிய மனு';
    if (p.status === 'resolved') {
      stBg = '#dcfce7';
      stCol = '#166534';
      stTxt = 'தீர்க்கப்பட்டது';
    } else if (p.status === 'action_taken') {
      stBg = '#dbeafe';
      stCol = '#1e40af';
      stTxt = 'நடவடிக்கை';
    } else if (p.status === 'in_progress') {
      stBg = '#ffedd5';
      stCol = '#c2410c';
      stTxt = 'பரிசீலனையில்';
    }

    const cDate = new Date(p.createdAt).toLocaleDateString('ta-IN', {
      day: 'numeric',
      month: 'short'
    });

    return `
      <tr style="background-color: ${idx % 2 === 0 ? '#ffffff' : '#f9fafb'}; border-bottom: 1px solid #e5e7eb;">
        <td style="padding: 10px 8px; text-align: center; font-size: 11px; font-weight: 700; color: #6b7280;">${idx + 1}</td>
        <td style="padding: 10px 8px; font-size: 11px; font-weight: 900; color: #4a0000; font-family: monospace; white-space: nowrap;">
          ${escapeHtml(p.trackingNo)}
          <div style="font-size: 9px; font-weight: 600; color: #6b7280; font-family: sans-serif;">${cDate}</div>
        </td>
        <td style="padding: 10px 8px; font-size: 11px; font-weight: 800; color: #111827;">
          வார்டு ${p.wardNo}
          <div style="font-size: 10px; font-weight: 500; color: #4b5563;">${escapeHtml(p.streetName)}</div>
        </td>
        <td style="padding: 10px 8px; font-size: 11px; color: #1f2937;">
          <div style="font-weight: 800; color: #111827;">${escapeHtml(p.title)}</div>
          <div style="font-size: 10px; color: #6b7280; margin-top: 2px;">மனுதாரர்: ${escapeHtml(p.citizenName)} (${escapeHtml(p.phone)})</div>
        </td>
        <td style="padding: 10px 8px; text-align: center; font-size: 11px; font-weight: 800; color: #166534; white-space: nowrap;">
          👍 ${p.upvotes}
        </td>
        <td style="padding: 10px 8px; text-align: center; white-space: nowrap;">
          <span style="display: inline-block; padding: 3px 8px; border-radius: 9999px; font-size: 10px; font-weight: 800; background-color: ${stBg}; color: ${stCol}; border: 1px solid ${stCol}30;">
            ${stTxt}
          </span>
        </td>
      </tr>
    `;
  }).join('');

  container.innerHTML = `
    <div style="width: 100%; border: 3px solid #4a0000; box-sizing: border-box; background: #ffffff; padding: 0;">
      
      <!-- Top Maroon Banner Header with Left TVK Logo & Right Thalapathy Vijay Portrait -->
      <div style="background-color: #4a0000; color: #ffffff; padding: 18px 24px; position: relative;">
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px;">
          
          <!-- LEFT SIDE: TVK Official Logo (தவெக கட்சிச் சின்னம்) -->
          <div style="display: flex; align-items: center; gap: 10px; width: 170px;">
            <img src="${tvkLogo}" alt="TVK Official Logo" style="width: 52px; height: 52px; border-radius: 50%; border: 2.5px solid #ffcc00; object-fit: cover; flex-shrink: 0;" />
            <div style="text-align: left;">
              <div style="font-size: 11px; font-weight: 900; color: #ffcc00; text-transform: uppercase;">தவெக</div>
              <div style="font-size: 9px; font-weight: 800; color: #ffffff; line-height: 1.2;">கட்சிச் சின்னம்</div>
            </div>
          </div>

          <!-- CENTER: Party Name & Center Info -->
          <div style="text-align: center; flex: 1;">
            <h1 style="margin: 0; font-size: 20px; font-weight: 900; color: #ffffff; line-height: 1.2;">தமிழக வெற்றிக் கழகம் (TVK)</h1>
            <h2 style="margin: 3px 0 0 0; font-size: 13.5px; color: #ffcc00; font-weight: 800;">அச்சரப்பாக்கம் தொகுதி மக்கள் குறைதீர்ப்பு மையம்</h2>
            <p style="margin: 4px 0 0 0; font-size: 10px; color: #f3f4f6; font-weight: 600;">
              அரசு அதிகாரிகளிடம் நேரடியாகக் கையளிக்கத் தொகுக்கப்பட்ட மனுக்கள் பட்டியல் அறிக்கை (OFFICIAL MEMORANDUM)
            </p>
          </div>

          <!-- RIGHT SIDE: Leader Thalapathy Vijay (தலைவர் விஜய்) -->
          <div style="display: flex; align-items: center; justify-content: flex-end; gap: 10px; width: 170px;">
            <div style="text-align: right;">
              <div style="font-size: 11px; font-weight: 900; color: #ffcc00;">தலைவர் விஜய்</div>
              <div style="font-size: 9px; font-weight: 800; color: #ffffff; line-height: 1.2;">Thalapathy Vijay</div>
            </div>
            <img src="${vijayPortrait}" alt="Thalapathy Vijay" style="width: 52px; height: 52px; border-radius: 50%; border: 2.5px solid #ffcc00; object-fit: cover; flex-shrink: 0;" />
          </div>

        </div>
      </div>
      <div style="height: 5px; background-color: #ffcc00; width: 100%;"></div>

      <div style="padding: 24px 28px;">
        
        <!-- Header Memorandum Info Box -->
        <div style="background-color: #fffbeb; border: 1.5px solid #fde68a; border-radius: 10px; padding: 14px 18px; margin-bottom: 20px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; border-bottom: 1px solid #fef08a; padding-bottom: 8px;">
            <div>
              <span style="background-[#4a0000]; color: #4a0000; font-weight: 900; font-size: 14px;">
                📌 அரசு அலுவலகச் சமர்ப்பிப்பு அறிக்கை
              </span>
            </div>
            <div style="font-size: 11px; font-weight: 800; color: #78350f;">
              அறிக்கை தயாரித்த தேதி: ${reportDateStr}
            </div>
          </div>

          <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; font-size: 11.5px; color: #1f2937;">
            <div>
              <span style="color: #6b7280; font-weight: 600;">தேர்ந்தெடுக்கப்பட்ட வார்டு:</span>
              <div style="font-weight: 800; color: #4a0000; font-size: 12px;">${wardText}</div>
            </div>
            <div>
              <span style="color: #6b7280; font-weight: 600;">பிரச்சனை வகை:</span>
              <div style="font-weight: 800; color: #111827; font-size: 12px;">${categoryText}</div>
            </div>
            <div>
              <span style="color: #6b7280; font-weight: 600;">மனு நிலைப்பாடு:</span>
              <div style="font-weight: 800; color: #111827; font-size: 12px;">${statusText}</div>
            </div>
            <div>
              <span style="color: #6b7280; font-weight: 600;">மொத்த மனுக்கள் / ஆதரவு:</span>
              <div style="font-weight: 900; color: #166534; font-size: 12px;">${petitions.length} மனுக்கள் (${totalUpvotesSum} ஆதரவு)</div>
            </div>
          </div>
        </div>

        <!-- Recipient Note -->
        <div style="font-size: 12px; color: #111827; line-height: 1.6; margin-bottom: 16px; background: #f9fafb; padding: 12px 16px; border-radius: 8px; border-left: 4px solid #4a0000;">
          <strong>பெறுநர்:</strong> உயர்திரு. பேரூராட்சி செயல் அலுவலர் / வட்டார வளர்ச்சி அலுவலர் (BDO), அச்சரப்பாக்கம் பேரூராட்சி / ஊராட்சி ஒன்றியம்.<br/>
          <strong>பொருள்:</strong> பொதுமக்கள் நேரடியாக மற்றும் TVK டிஜிட்டல் குறைதீர்ப்பு தளம் மூலமாகப் பதிவு செய்த அவசரக் கோரிக்கை மனுக்களின் விவரப்பட்டியல் சமர்ப்பித்தல் சார்பாக.
        </div>

        <!-- Table of Petitions -->
        <table style="width: 100%; border-collapse: collapse; border: 1px solid #d1d5db; margin-bottom: 24px;">
          <thead>
            <tr style="background-color: #4a0000; color: #ffffff; font-size: 11px; text-transform: uppercase;">
              <th style="padding: 10px 8px; border: 1px solid #380000; text-align: center; width: 30px;">வரிசை</th>
              <th style="padding: 10px 8px; border: 1px solid #380000; text-align: left; width: 90px;">மனு எண்</th>
              <th style="padding: 10px 8px; border: 1px solid #380000; text-align: left; width: 110px;">வார்டு & இடம்</th>
              <th style="padding: 10px 8px; border: 1px solid #380000; text-align: left;">கோரிக்கை தலைப்பு & மனுதாரர்</th>
              <th style="padding: 10px 8px; border: 1px solid #380000; text-align: center; width: 50px;">ஆதரவு</th>
              <th style="padding: 10px 8px; border: 1px solid #380000; text-align: center; width: 85px;">தற்போதைய நிலை</th>
            </tr>
          </thead>
          <tbody>
            ${tableRowsHtml}
          </tbody>
        </table>

        <!-- Public Endorsement Statement -->
        <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 10px 14px; margin-bottom: 24px; font-size: 11px; color: #166534; font-weight: 700; text-align: center;">
          ✅ மேற்கண்ட ${petitions.length} மனுக்களுக்கும் அச்சரப்பாக்கம் தொகுதி பொதுமக்கள் மொத்தம் ${totalUpvotesSum} ஆதரவளித்துள்ளனர். உடனடியாக அரசு துறை அதிகாரிகள் கள ஆய்வு செய்து நடவடிக்கை எடுக்க வேண்டுமாய் கேட்டுக்கொள்ளப்படுகிறது.
        </div>

        <!-- Official Signatures -->
        <div style="margin-top: 36px; padding-top: 18px; border-top: 2px dashed #9ca3af; display: flex; justify-content: space-between; align-items: flex-end;">
          <div style="width: 220px; font-size: 11.5px; color: #374151;">
            <div><strong>இடம்:</strong> அச்சரப்பாக்கம்</div>
            <div style="margin-top: 2px;"><strong>தேதி:</strong> ${reportDateStr}</div>
            <div style="margin-top: 40px; border-top: 1px solid #4b5563; padding-top: 6px; text-align: center; font-weight: 700; color: #111827;">
              TVK தொகுதி ஒருங்கிணைப்பாளர் கையொப்பம்
            </div>
          </div>

          <div style="text-align: center;">
            <div style="width: 80px; height: 80px; border-radius: 50%; border: 3px double #4a0000; background: #fffbeb; display: flex; flex-direction: column; align-items: center; justify-content: center; margin: 0 auto;">
              <div style="font-size: 11px; font-weight: 900; color: #4a0000;">TVK</div>
              <div style="font-size: 7px; font-weight: 800; color: #b45309;">அச்சரப்பாக்கம்</div>
            </div>
          </div>

          <div style="width: 220px; text-align: center; font-size: 11.5px; color: #374151;">
            <div style="height: 48px;"></div>
            <div style="border-top: 1px solid #4b5563; padding-top: 6px; font-weight: 700; color: #111827;">
              அரசு அதிகாரி ஒப்புதல் கையொப்பம் & முத்திரை<br/>
              <span style="font-size: 9.5px; font-weight: 400; color: #6b7280;">(Government Officer Acknowledgment Seal)</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  `;

  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, {
      scale: 1.5,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    addCanvasToPdfPages(pdf, canvas);

    const wardSlug = filterInfo.ward === 'all' ? 'All_Wards' : `Ward_${filterInfo.ward}`;
    pdf.save(`TVK_Petitions_Summary_${wardSlug}_${new Date().toISOString().slice(0,10)}.pdf`);
    return true;
  } catch (err) {
    console.error("Filtered PDF generation error:", err);
    throw new Error('மனுக்கள் PDF அறிக்கையை உருவாக்க முடியவில்லை. மீண்டும் முயற்சிக்கவும்.', { cause: err });
  } finally {
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
  }
};
