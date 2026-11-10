import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getIssueCategoryShortLabel, Petition, PetitionStatus, IssueCategory } from '../types';
import { MapPin, Layers, Filter, Eye, Layers3, AlertTriangle, CheckCircle2, Clock, Wrench, RefreshCw, ZoomIn, ZoomOut, Flame } from 'lucide-react';

export const WARD_COORDINATES: Record<number, { lat: number; lng: number; name: string }> = {
  1: { lat: 12.4150, lng: 79.8210, name: "மலைப்பாதை & ரயில்வே ஸ்டேஷன் வீதி" },
  2: { lat: 12.4125, lng: 79.8235, name: "தேரடி வீதி & பஸ் ஸ்டாண்ட் பகுதி" },
  3: { lat: 12.4095, lng: 79.8245, name: "மலையனூர் பாட்டை & காமராஜர் நகர்" },
  4: { lat: 12.4080, lng: 79.8220, name: "மாரியம்மன் கோவில் வீதி" },
  5: { lat: 12.4070, lng: 79.8200, name: "பசும்பொன் நகர் & புதிய குடியிருப்பு" },
  6: { lat: 12.4100, lng: 79.8205, name: "பேரூராட்சி அலுவலக பகுதி & ஜி.எஸ்.டி தெற்கு" },
  7: { lat: 12.4140, lng: 79.8180, name: "சின்னமலை வீதி & இந்திரா நகர்" },
  8: { lat: 12.4115, lng: 79.8170, name: "பெருமாள் கோவில் வீதி" },
  9: { lat: 12.4050, lng: 79.8250, name: "மேல்மருவத்தூர் சாலை இணைப்புகள்" },
  10: { lat: 12.4160, lng: 79.8260, name: "அம்பேத்கர் நகர் & ஏரிக்கரை பகுதி" },
  11: { lat: 12.4130, lng: 79.8280, name: "விஜயநகர் & கூட்டுறவு வங்கி வீதி" },
  12: { lat: 12.4105, lng: 79.8270, name: "பள்ளிவாசல் தெரு & சந்தை தோப்பு" },
  13: { lat: 12.4030, lng: 79.8210, name: "ஆதிதிராவிடர் குடியிருப்பு & புதுநகர்" },
  14: { lat: 12.4020, lng: 79.8240, name: "ஆரம்ப சுகாதார நிலைய வீதி" },
  15: { lat: 12.4000, lng: 79.8270, name: "வேடந்தாங்கல் சாலை சந்திப்பு & தச்சூர் எல்லை" },
};

const ACHARAPAKKAM_CENTER = { lat: 12.4090, lng: 79.8225 };

interface PetitionsMapProps {
  petitions: Petition[];
  selectedWardFilter: number | 'all';
  setSelectedWardFilter: (ward: number | 'all') => void;
  onSelectPetition: (petition: Petition) => void;
  selectedCategoryFilter?: IssueCategory | 'all';
  selectedStatusFilter?: PetitionStatus | 'all';
}

const getCategoryTamilName = (cat: string) => getIssueCategoryShortLabel(cat);

export const PetitionsMap: React.FC<PetitionsMapProps> = ({
  petitions,
  selectedWardFilter,
  setSelectedWardFilter,
  onSelectPetition,
  selectedCategoryFilter = 'all',
  selectedStatusFilter = 'all'
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);
  const wardCirclesGroupRef = useRef<L.LayerGroup | null>(null);
  const heatmapGroupRef = useRef<L.LayerGroup | null>(null);

  const [mapLayerType, setMapLayerType] = useState<'streets' | 'sat'>('streets');
  const [showWardCircles, setShowWardCircles] = useState(true);
  const [showHeatMap, setShowHeatMap] = useState<boolean>(true);
  const [showPins, setShowPins] = useState<boolean>(true);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [ACHARAPAKKAM_CENTER.lat, ACHARAPAKKAM_CENTER.lng],
        zoom: 14,
        zoomControl: false,
        attributionControl: true
      });

      // Default OpenStreetMap Tile
      const streetLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors | TVK Acharapakkam Ward GIS'
      });

      streetLayer.addTo(map);

      // Create Layer Groups
      const heatmapGroup = L.layerGroup().addTo(map);
      const wardCirclesGroup = L.layerGroup().addTo(map);
      const markersGroup = L.layerGroup().addTo(map);

      mapInstanceRef.current = map;
      markersGroupRef.current = markersGroup;
      wardCirclesGroupRef.current = wardCirclesGroup;
      heatmapGroupRef.current = heatmapGroup;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Handle Tile Layer Switching
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    map.eachLayer((layer) => {
      if (layer instanceof L.TileLayer) {
        map.removeLayer(layer);
      }
    });

    if (mapLayerType === 'sat') {
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
      }).addTo(map);
    } else {
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors | TVK Acharapakkam GIS'
      }).addTo(map);
    }
  }, [mapLayerType]);

  // Update Heat Map, Markers & Ward Circles on Data / Filter Change
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersGroupRef.current;
    const wardCirclesGroup = wardCirclesGroupRef.current;
    const heatmapGroup = heatmapGroupRef.current;

    if (!map || !markersGroup || !wardCirclesGroup || !heatmapGroup) return;

    // Clear existing layers
    markersGroup.clearLayers();
    wardCirclesGroup.clearLayers();
    heatmapGroup.clearLayers();

    // 1. Render Ward Background Area Circles
    if (showWardCircles) {
      Object.entries(WARD_COORDINATES).forEach(([wardStr, coord]) => {
        const wardNo = Number(wardStr);
        const wardPetitions = petitions.filter(p => p.wardNo === wardNo);
        const count = wardPetitions.length;
        const isSelected = selectedWardFilter === wardNo;

        let circleColor = '#ffcc00'; // TVK Yellow default
        if (count > 0) {
          const hasUnresolved = wardPetitions.some(p => p.status === 'pending' || p.status === 'in_progress');
          circleColor = hasUnresolved ? '#800000' : '#059669';
        }

        const circle = L.circle([coord.lat, coord.lng], {
          radius: 160,
          color: isSelected ? '#ffcc00' : circleColor,
          weight: isSelected ? 3 : 1.5,
          fillColor: circleColor,
          fillOpacity: isSelected ? 0.35 : 0.12
        });

        const wardLabel = L.marker([coord.lat, coord.lng], {
          icon: L.divIcon({
            className: 'custom-ward-label',
            html: `
              <div style="
                background: ${isSelected ? '#ffcc00' : '#4a0000'};
                color: ${isSelected ? '#4a0000' : '#ffcc00'};
                border: 1.5px solid ${isSelected ? '#4a0000' : '#ffcc00'};
                padding: 2px 6px;
                border-radius: 12px;
                font-size: 10px;
                font-weight: 800;
                white-space: nowrap;
                box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                cursor: pointer;
                text-align: center;
              ">
                வார்டு ${wardNo} (${count})
              </div>
            `,
            iconSize: [70, 20],
            iconAnchor: [35, 10]
          })
        });

        wardLabel.on('click', () => {
          setSelectedWardFilter(wardNo);
        });

        wardCirclesGroup.addLayer(circle);
        wardCirclesGroup.addLayer(wardLabel);
      });
    }

    // 2. Render Heat Map Layer (Hotspot Density Circles)
    if (showHeatMap) {
      Object.entries(WARD_COORDINATES).forEach(([wardStr, coord]) => {
        const wardNo = Number(wardStr);
        const wardPetitions = petitions.filter(p => p.wardNo === wardNo);
        const activePetitions = wardPetitions.filter(p => p.status !== 'resolved');
        const activeCount = activePetitions.length;
        const totalUpvotes = activePetitions.reduce((sum, p) => sum + p.upvotes, 0);

        if (activeCount > 0) {
          // Calculate Category breakdown
          const categoryCounts: Record<string, number> = {};
          activePetitions.forEach(p => {
            categoryCounts[p.category] = (categoryCounts[p.category] || 0) + 1;
          });
          const topCategoryKey = Object.keys(categoryCounts).sort((a,b) => categoryCounts[b] - categoryCounts[a])[0] || 'others';
          const topCatTamil = getCategoryTamilName(topCategoryKey);

          // Heat intensity styling
          let heatColor = '#ef4444'; // Red for High
          let heatBgGradient = 'radial-gradient(circle, rgba(220,38,38,0.7) 0%, rgba(234,88,12,0.45) 50%, rgba(245,158,11,0.15) 80%, transparent 100%)';
          let intensityLabel = 'அதிக செறிவு (High Hotspot)';
          let badgeBg = '#dc2626';
          let circleRadius = 240;

          if (activeCount === 2 || (activeCount === 1 && totalUpvotes >= 15)) {
            heatColor = '#f97316'; // Orange for Medium
            heatBgGradient = 'radial-gradient(circle, rgba(234,88,12,0.65) 0%, rgba(245,158,11,0.35) 50%, rgba(253,224,71,0.1) 80%, transparent 100%)';
            intensityLabel = 'நடுத்தர செறிவு (Medium Hotspot)';
            badgeBg = '#ea580c';
            circleRadius = 190;
          } else if (activeCount === 1) {
            heatColor = '#eab308'; // Yellow for Low
            heatBgGradient = 'radial-gradient(circle, rgba(234,179,8,0.55) 0%, rgba(250,204,21,0.2) 60%, transparent 100%)';
            intensityLabel = 'குறைந்த செறிவு (Low Density)';
            badgeBg = '#d97706';
            circleRadius = 140;
          }

          // Visual glowing Heat Blob Marker
          const heatBlobMarker = L.marker([coord.lat, coord.lng], {
            icon: L.divIcon({
              className: 'custom-heat-blob',
              html: `
                <div style="
                  width: ${circleRadius}px;
                  height: ${circleRadius}px;
                  background: ${heatBgGradient};
                  border-radius: 50%;
                  pointer-events: none;
                  transform: translate(-50%, -50%);
                  filter: blur(4px);
                  opacity: 0.85;
                " class="${activeCount >= 3 ? 'animate-pulse' : ''}"></div>
              `,
              iconSize: [circleRadius, circleRadius],
              iconAnchor: [circleRadius / 2, circleRadius / 2]
            }),
            interactive: false
          });

          // Hotspot Badge Overlay Tag
          const hotspotTagMarker = L.marker([coord.lat + 0.0009, coord.lng], {
            icon: L.divIcon({
              className: 'custom-hotspot-tag',
              html: `
                <div style="
                  background: ${badgeBg};
                  color: #ffffff;
                  border: 1.5px solid #ffcc00;
                  padding: 2px 7px;
                  border-radius: 12px;
                  font-size: 10px;
                  font-weight: 800;
                  white-space: nowrap;
                  box-shadow: 0 3px 6px rgba(0,0,0,0.35);
                  cursor: pointer;
                  display: flex;
                  align-items: center;
                  gap: 3px;
                " class="hover:scale-105 transition-transform">
                  <span>🔥</span>
                  <span>வார்டு ${wardNo}: ${activeCount} நிலுவை</span>
                </div>
              `,
              iconSize: [110, 22],
              iconAnchor: [55, 11]
            })
          });

          const hotspotPopupHtml = `
            <div style="font-family: sans-serif; padding: 4px; max-width: 250px; color: #111;">
              <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 6px; border-bottom: 1px solid #eee; padding-bottom: 4px;">
                <span style="font-size: 14px;">🔥</span>
                <div>
                  <h4 style="font-size: 12px; font-weight: 800; color: #dc2626; margin: 0;">
                    ${intensityLabel}
                  </h4>
                  <span style="font-size: 10px; font-weight: 700; color: #555;">
                    வார்டு ${wardNo}: ${coord.name}
                  </span>
                </div>
              </div>

              <div style="font-size: 11px; color: #333; margin-bottom: 8px; line-height: 1.5;">
                📌 <strong>நிலுவையில் உள்ள மனுக்கள்:</strong> ${activeCount} மனுக்கள்<br/>
                👍 <strong>மொத்த மக்கள் ஆதரவு:</strong> ${totalUpvotes} வாக்குகள்<br/>
                🛠️ <strong>முக்கிய துறை:</strong> ${topCatTamil}
              </div>

              <button
                id="heat-btn-${wardNo}"
                style="
                  width: 100%;
                  background: #4a0000;
                  color: #ffcc00;
                  border: none;
                  padding: 6px 10px;
                  border-radius: 6px;
                  font-size: 11px;
                  font-weight: 800;
                  cursor: pointer;
                "
              >
                வார்டு ${wardNo} மனுக்களை மட்டும் காண்க →
              </button>
            </div>
          `;

          hotspotTagMarker.bindPopup(hotspotPopupHtml, { maxWidth: 270 });
          hotspotTagMarker.on('popupopen', () => {
            setTimeout(() => {
              const btn = document.getElementById(`heat-btn-${wardNo}`);
              if (btn) {
                btn.onclick = () => {
                  setSelectedWardFilter(wardNo);
                };
              }
            }, 50);
          });

          heatmapGroup.addLayer(heatBlobMarker);
          heatmapGroup.addLayer(hotspotTagMarker);
        }
      });
    }

    // 3. Render Petition Pin Markers
    if (showPins) {
      const wardPetitionCounts: Record<number, number> = {};

      petitions.forEach((petition) => {
        const coord = WARD_COORDINATES[petition.wardNo] || ACHARAPAKKAM_CENTER;

        const idx = wardPetitionCounts[petition.wardNo] || 0;
        wardPetitionCounts[petition.wardNo] = idx + 1;

        // Calculate small radial spiral offset so overlapping pins in same ward are separated
        const angle = idx * 1.2;
        const radius = idx * 0.00035;
        const latOffset = Math.sin(angle) * radius;
        const lngOffset = Math.cos(angle) * radius;

        const pinLat = coord.lat + latOffset;
        const pinLng = coord.lng + lngOffset;

        // Color coding based on status
        let pinBg = '#800000'; // Pending (TVK Maroon)
        let pinText = 'புதியது';
        let pinIconSymbol = '📍';

        if (petition.status === 'resolved') {
          pinBg = '#059669'; // Emerald Green
          pinText = 'தீர்க்கப்பட்டது';
          pinIconSymbol = '✓';
        } else if (petition.status === 'action_taken') {
          pinBg = '#d97706'; // Amber
          pinText = 'நடவடிக்கை';
          pinIconSymbol = '⚡';
        } else if (petition.status === 'in_progress') {
          pinBg = '#0284c7'; // Sky Blue
          pinText = 'பரிசீலனையில்';
          pinIconSymbol = '🔍';
        }

        // Custom HTML Marker Icon
        const customIcon = L.divIcon({
          className: 'custom-petition-pin',
          html: `
            <div style="
              background: ${pinBg};
              color: #ffffff;
              border: 2px solid #ffcc00;
              border-radius: 8px;
              padding: 3px 7px;
              font-size: 11px;
              font-weight: 800;
              box-shadow: 0 3px 8px rgba(0,0,0,0.4);
              display: flex;
              align-items: center;
              gap: 4px;
              cursor: pointer;
              transition: transform 0.2s;
              white-space: nowrap;
            " class="hover:scale-110">
              <span>${pinIconSymbol}</span>
              <span>வார்டு ${petition.wardNo}</span>
            </div>
          `,
          iconSize: [85, 26],
          iconAnchor: [42, 13]
        });

        const marker = L.marker([pinLat, pinLng], { icon: customIcon });

        // Create rich HTML popup with Tamil details & View Petition trigger
        const popupHtml = `
          <div style="font-family: sans-serif; padding: 4px; max-width: 260px; color: #111;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; border-bottom: 1px solid #eee; padding-bottom: 4px;">
              <span style="font-family: monospace; font-size: 10px; font-weight: bold; background: #f3f4f6; color: #4a0000; padding: 2px 6px; border-radius: 4px;">
                ${petition.trackingNo}
              </span>
              <span style="font-size: 10px; font-weight: bold; background: ${pinBg}; color: #fff; padding: 2px 8px; border-radius: 12px;">
                ${pinText}
              </span>
            </div>

            <h4 style="font-size: 13px; font-weight: 800; color: #111; margin: 0 0 6px 0; line-height: 1.3;">
              ${petition.title}
            </h4>

            <div style="font-size: 11px; color: #555; margin-bottom: 8px; line-height: 1.4;">
              📍 <strong>வார்டு ${petition.wardNo}:</strong> ${petition.streetName}<br/>
              👤 <strong>மனுதாரர்:</strong> ${petition.citizenName}<br/>
              👍 <strong>ஆதரவு வாக்குகள்:</strong> ${petition.upvotes}
            </div>

            <button
              id="popup-btn-${petition.id}"
              style="
                width: 100%;
                background: #4a0000;
                color: #ffcc00;
                border: none;
                padding: 6px 10px;
                border-radius: 6px;
                font-size: 11px;
                font-weight: 800;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 4px;
              "
            >
              மனுவை விரிவாகக் காண்க →
            </button>
          </div>
        `;

        marker.bindPopup(popupHtml, { maxWidth: 280 });

        // Attach click event for popup view button
        marker.on('popupopen', () => {
          setTimeout(() => {
            const btn = document.getElementById(`popup-btn-${petition.id}`);
            if (btn) {
              btn.onclick = () => {
                onSelectPetition(petition);
              };
            }
          }, 50);
        });

        markersGroup.addLayer(marker);
      });
    }

    // If specific ward is selected, pan map smoothly to that ward
    if (selectedWardFilter !== 'all' && WARD_COORDINATES[selectedWardFilter]) {
      const target = WARD_COORDINATES[selectedWardFilter];
      map.flyTo([target.lat, target.lng], 16, { duration: 0.8 });
    }
  }, [petitions, selectedWardFilter, showWardCircles, showHeatMap, showPins]);

  const handleResetMap = () => {
    setSelectedWardFilter('all');
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([ACHARAPAKKAM_CENTER.lat, ACHARAPAKKAM_CENTER.lng], 14, { duration: 0.8 });
    }
  };

  const handleZoomIn = () => {
    mapInstanceRef.current?.zoomIn();
  };

  const handleZoomOut = () => {
    mapInstanceRef.current?.zoomOut();
  };

  // Count active hotspots
  const activeHotspotWards = Object.keys(WARD_COORDINATES).filter(wNum => {
    const activeCount = petitions.filter(p => p.wardNo === Number(wNum) && p.status !== 'resolved').length;
    return activeCount >= 2;
  }).length;

  return (
    <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-sm mb-8">
      
      {/* Header bar above map */}
      <div className="bg-gradient-to-r from-[#4a0000] to-[#380000] text-white p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-[#ffcc00]">
        <div>
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-[#ffcc00]" />
            <h3 className="text-base sm:text-lg font-extrabold tracking-tight">
              அச்சரப்பாக்கம் 15 வார்டுகள் வரைபடம் (GIS Ward Map)
            </h3>
          </div>
          <p className="text-xs text-neutral-300 mt-0.5">
            வார்டு வாரியாக மக்கள் பிரச்சனைகளின் பரவல் மற்றும் நேரடி கள நிலவரம்
          </p>
        </div>

        {/* Map Control Actions */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Heat Map Toggle Button */}
          <button
            type="button"
            onClick={() => setShowHeatMap(prev => !prev)}
            className={`px-3 py-1.5 rounded-md border font-extrabold transition-all flex items-center gap-1.5 cursor-pointer ${
              showHeatMap 
                ? 'bg-[#ffcc00] text-[#4a0000] border-[#ffcc00] shadow-xs' 
                : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
            }`}
            title="ஹீட் மேப் (Heat Map) மண்டலங்களைக் காட்டு/மறை"
          >
            <Flame className="w-3.5 h-3.5 text-[#dc2626]" />
            <span>🔥 ஹீட் மேப் (Heat Map)</span>
          </button>

          {/* Toggle Individual Pins */}
          <button
            type="button"
            onClick={() => setShowPins(prev => !prev)}
            className={`px-2.5 py-1.5 rounded-md border font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              showPins 
                ? 'bg-white/20 text-white border-white/30' 
                : 'bg-white/5 text-neutral-400 border-white/10'
            }`}
          >
            <MapPin className="w-3.5 h-3.5 text-[#ffcc00]" />
            <span>மனு பின்கள்</span>
          </button>

          {/* Satellite / Street Map Switcher */}
          <button
            type="button"
            onClick={() => setMapLayerType(prev => prev === 'streets' ? 'sat' : 'streets')}
            className="px-2.5 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-md border border-white/20 font-bold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Layers3 className="w-3.5 h-3.5 text-[#ffcc00]" />
            <span>{mapLayerType === 'streets' ? 'செயற்கைக்கோள் (Sat)' : 'தெரு வரைபடம் (Street)'}</span>
          </button>

          {/* Ward Boundaries Toggle */}
          <button
            type="button"
            onClick={() => setShowWardCircles(prev => !prev)}
            className={`px-2.5 py-1.5 rounded-md border font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              showWardCircles 
                ? 'bg-[#ffcc00]/20 text-[#ffcc00] border-[#ffcc00]/40' 
                : 'bg-white/10 text-white border-white/20'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>வார்டு எல்லைகள்</span>
          </button>

          {/* Reset Map View */}
          <button
            type="button"
            onClick={handleResetMap}
            className="px-2.5 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-md border border-white/20 font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            title="அனைத்து வார்டுகளையும் காண்க"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#ffcc00]" />
            <span>மறுசீரமை</span>
          </button>
        </div>
      </div>

      {/* Map Element Container */}
      <div className="relative">
        <div 
          ref={mapContainerRef} 
          className="w-full h-[360px] sm:h-[440px] bg-neutral-100 z-0" 
        />

        {/* Floating Hotspot Summary Chip in Top-Left */}
        {showHeatMap && (
          <div className="absolute top-3 left-3 z-10 bg-white/95 backdrop-blur-xs px-3 py-1.5 rounded-lg border border-[#ffcc00] shadow-md flex items-center gap-2 text-xs font-extrabold text-[#4a0000]">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-600"></span>
            </span>
            <span>🔥 {activeHotspotWards} வார்டுகளில் அதிக மனுக்கள் அடர்வு (Critical Hotspots)</span>
          </div>
        )}

        {/* Floating Custom Zoom Controls */}
        <div className="absolute top-3 right-3 z-10 flex flex-col gap-1.5 bg-white/90 backdrop-blur-xs p-1 rounded-lg border border-neutral-300 shadow-md">
          <button
            type="button"
            onClick={handleZoomIn}
            className="p-1.5 hover:bg-neutral-100 text-neutral-800 rounded-md font-bold cursor-pointer"
            title="பெரிதாக்கு (Zoom In)"
          >
            <ZoomIn className="w-4 h-4 text-[#4a0000]" />
          </button>
          <div className="h-px bg-neutral-200" />
          <button
            type="button"
            onClick={handleZoomOut}
            className="p-1.5 hover:bg-neutral-100 text-neutral-800 rounded-md font-bold cursor-pointer"
            title="சிறிதாக்கு (Zoom Out)"
          >
            <ZoomOut className="w-4 h-4 text-[#4a0000]" />
          </button>
        </div>

        {/* Floating Map Legend Overlay */}
        <div className="absolute bottom-3 left-3 z-10 bg-white/95 backdrop-blur-xs p-2.5 sm:p-3 rounded-lg border border-neutral-200 shadow-lg text-[11px] max-w-[280px]">
          <span className="font-extrabold text-[#4a0000] block mb-1.5 uppercase text-[10px] tracking-wider">
            வரைபடக் குறியீடுகள் (Map Legend):
          </span>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#800000] border border-[#ffcc00] inline-block" />
              <span className="text-neutral-700 font-bold">புதிய மனு (Pending)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#0284c7] border border-[#ffcc00] inline-block" />
              <span className="text-neutral-700 font-bold">பரிசீலனை (Review)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#d97706] border border-[#ffcc00] inline-block" />
              <span className="text-neutral-700 font-bold">நடவடிக்கை (Action)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#059669] border border-[#ffcc00] inline-block" />
              <span className="text-neutral-700 font-bold">தீர்க்கப்பட்டது (Resolved)</span>
            </div>
          </div>

          {showHeatMap && (
            <div className="mt-2.5 pt-2 border-t border-neutral-200">
              <span className="font-extrabold text-[#4a0000] block mb-1 uppercase text-[9px] tracking-wider">
                🔥 ஹீட் மேப் செறிவு (Hotspot Density):
              </span>
              <div className="h-2 w-full rounded-full bg-gradient-to-r from-yellow-400 via-orange-500 to-red-600" />
              <div className="flex justify-between text-[9px] font-bold text-neutral-600 mt-1">
                <span>🟡 குறைந்த செறிவு</span>
                <span>⚡ நடுத்தரம்</span>
                <span>🔥 அதிக செறிவு</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Ward Selector Buttons Bar below Map */}
      <div className="p-3 bg-neutral-50 border-t border-neutral-200 overflow-x-auto">
        <div className="flex items-center gap-1.5 min-w-max">
          <span className="text-xs font-bold text-neutral-600 mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-[#4a0000]" />
            <span>வேக வார்டு தேர்வு:</span>
          </span>

          <button
            type="button"
            onClick={() => setSelectedWardFilter('all')}
            className={`px-3 py-1 rounded-md text-xs font-extrabold transition-all cursor-pointer ${
              selectedWardFilter === 'all'
                ? 'bg-[#4a0000] text-[#ffcc00] shadow-2xs'
                : 'bg-white text-neutral-700 border border-neutral-200 hover:bg-neutral-100'
            }`}
          >
            அனைத்து 15 வார்டுகளும்
          </button>

          {Array.from({ length: 15 }, (_, i) => i + 1).map((wNum) => {
            const count = petitions.filter(p => p.wardNo === wNum).length;
            const activeCount = petitions.filter(p => p.wardNo === wNum && p.status !== 'resolved').length;
            const isSelected = selectedWardFilter === wNum;

            return (
              <button
                key={wNum}
                type="button"
                onClick={() => setSelectedWardFilter(wNum)}
                className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                  isSelected
                    ? 'bg-[#ffcc00] text-[#4a0000] border border-[#4a0000] font-black shadow-2xs'
                    : 'bg-white text-neutral-700 border border-neutral-200 hover:bg-neutral-100'
                }`}
              >
                {activeCount >= 2 && <span className="text-[10px]">🔥</span>}
                <span>வார்டு {wNum}</span>
                {count > 0 && (
                  <span className={`text-[10px] px-1.5 rounded-full ${
                    isSelected ? 'bg-[#4a0000] text-[#ffcc00]' : 'bg-neutral-200 text-neutral-700'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

    </div>
  );
};
