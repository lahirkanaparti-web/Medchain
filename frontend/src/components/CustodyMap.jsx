import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Navigation, Clock, User, ExternalLink } from 'lucide-react';

const STAGE_TITLES = {
  0: 'Origin facility (Manufacturer)',
  1: 'Logistics transit',
  2: 'Wholesale inventory (Distributor)',
  3: 'Dispensing point (Pharmacy)',
  4: 'Final patient handover',
  5: 'Quarantine / Recall point',
};

// Helper component to adjust map bounds dynamically
function MapAutoFit({ positions }) {
  const map = useMap();

  useEffect(() => {
    if (!positions || positions.length === 0) return;

    if (positions.length === 1) {
      map.setView(positions[0], 13);
    } else {
      const bounds = L.latLngBounds(positions);
      map.fitBounds(bounds, { padding: [40, 40] });
    }
  }, [map, positions]);

  return null;
}

// Custom Leaflet DivIcon generator matching design tokens
function createCustomMarkerIcon(sequenceNum, isLatest, stateInt) {
  const isRecalled = stateInt === 5;
  let bgStyle = 'bg-pharma-navy text-white border-pharma-cream';
  if (isRecalled) {
    bgStyle = 'bg-quarantine-crimson text-white border-white';
  } else if (isLatest) {
    bgStyle = 'bg-seal-emerald text-white border-white';
  }

  const html = `
    <div style="transform: translate(-50%, -50%); cursor: pointer;">
      <div class="w-7 h-7 rounded-full ${bgStyle} border-2 flex items-center justify-center font-mono font-bold text-xs shadow-md transition-transform hover:scale-110">
        ${sequenceNum}
      </div>
    </div>
  `;

  return L.divIcon({
    html: html,
    className: 'custom-custody-divicon',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
  });
}

export default function CustodyMap({ history = [] }) {
  const validEvents = React.useMemo(() => {
    if (!Array.isArray(history)) return [];
    return history
      .filter((ev) => {
        if (ev.latitude === undefined || ev.longitude === undefined) return false;
        const lat = parseFloat(ev.latitude);
        const lng = parseFloat(ev.longitude);
        return !isNaN(lat) && !isNaN(lng) && (lat !== 0 || lng !== 0);
      })
      .map((ev, index) => ({
        ...ev,
        latNum: parseFloat(ev.latitude),
        lngNum: parseFloat(ev.longitude),
        sequenceNum: index + 1,
      }));
  }, [history]);

  if (validEvents.length === 0) {
    return (
      <div className="doc-panel bg-white/80 p-6 border border-slate-300 text-center space-y-2">
        <div className="w-10 h-10 bg-slate-100 text-slate-500 flex items-center justify-center mx-auto border border-slate-300">
          <MapPin className="w-5 h-5" />
        </div>
        <h5 className="font-display font-bold text-xs text-pharma-navy">Location data not available for this step</h5>
        <p className="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto">
          Custody transfers for this batch were recorded on-chain without optional GPS coordinates.
        </p>
      </div>
    );
  }

  const positions = validEvents.map((ev) => [ev.latNum, ev.lngNum]);
  const defaultCenter = positions[0];
  const maxRecordedState = Math.max(...validEvents.map((e) => e.state));

  const truncateAddr = (addr) => (addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : '');

  return (
    <div className="doc-panel bg-white/80 p-3 border border-slate-300 space-y-3">
      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
        <div className="flex items-center space-x-2">
          <Navigation className="w-3.5 h-3.5 text-pharma-navy" />
          <h4 className="font-display font-bold text-xs text-pharma-navy">
            Spatial custody route map
          </h4>
        </div>
        <span className="text-[11px] font-mono text-seal-emerald font-semibold bg-emerald-50 border border-emerald-200 px-2 py-0.5">
          {validEvents.length} GPS checkpoint{validEvents.length > 1 ? 's' : ''} mapped
        </span>
      </div>

      <div className="h-64 sm:h-72 w-full overflow-hidden border border-slate-300 relative z-0">
        <MapContainer
          center={defaultCenter}
          zoom={10}
          scrollWheelZoom={false}
          className="h-full w-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MapAutoFit positions={positions} />

          {/* Polyline connecting route checkpoints */}
          {positions.length > 1 && (
            <Polyline
              positions={positions}
              pathOptions={{
                color: '#0D192B',
                weight: 3,
                dashArray: '6, 6',
                opacity: 0.8,
              }}
            />
          )}

          {/* Markers for each custody checkpoint */}
          {validEvents.map((ev, idx) => {
            const isLatest = ev.state === maxRecordedState;
            const dateStr = new Date(ev.timestamp * 1000).toLocaleString();
            const stageName = STAGE_TITLES[ev.state] || `Stage ${ev.state}`;

            return (
              <Marker
                key={ev.state || idx}
                position={[ev.latNum, ev.lngNum]}
                icon={createCustomMarkerIcon(idx + 1, isLatest, ev.state)}
              >
                <Popup className="custom-leaflet-popup">
                  <div className="p-1 space-y-1.5 min-w-[200px]">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                      <span className="font-display font-bold text-xs text-pharma-navy">
                        #{idx + 1}. {stageName}
                      </span>
                    </div>

                    <div className="space-y-1 text-[11px] font-mono text-slate-700">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Timestamp:</span>
                        <span className="text-slate-900 font-semibold">{dateStr}</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Custodian:</span>
                        <span className="text-slate-900 font-semibold">{truncateAddr(ev.custodian)}</span>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-slate-200">
                        <span className="text-slate-500">Coordinates:</span>
                        <a
                          href={`https://www.google.com/maps?q=${ev.latNum},${ev.lngNum}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-seal-emerald hover:underline flex items-center font-bold"
                        >
                          <span>{ev.latNum.toFixed(4)}, {ev.lngNum.toFixed(4)}</span>
                          <ExternalLink className="w-2.5 h-2.5 ml-0.5" />
                        </a>
                      </div>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>

      <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
        <span>Click marker for custody details</span>
        <span>OpenStreetMap tiles</span>
      </div>
    </div>
  );
}
