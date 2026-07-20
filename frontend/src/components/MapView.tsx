import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import api from '../services/api';
import { Alert, Resource, Report } from '../types';
import { useSocket } from '../context/SocketContext';
import { AlertTriangle, Plus, MapPin, CheckCircle, Navigation, Shield, Heart } from 'lucide-react';

// Custom Marker DivIcons with SVG
const createCustomIcon = (color: string, iconHtml: string) => {
  return L.divIcon({
    html: `
      <div class="relative w-8 h-8 flex items-center justify-center">
        <div class="absolute inset-0 bg-${color} opacity-20 rounded-full animate-ping"></div>
        <div class="w-7 h-7 rounded-full bg-slate-900 border border-${color} shadow-lg flex items-center justify-center text-[12px]">
          ${iconHtml}
        </div>
      </div>
    `,
    className: 'custom-div-icon',
    iconSize: [32, 32],
    iconAnchor: [16, 16]
  });
};

const iconMap = {
  Earthquake: createCustomIcon('purple-500', '🌋'),
  Wildfire: createCustomIcon('rose-500', '🔥'),
  Flood: createCustomIcon('blue-400', '🌊'),
  Cyclone: createCustomIcon('cyan-400', '🌀'),
  Landslide: createCustomIcon('amber-500', '🪨'),
  Drought: createCustomIcon('emerald-500', '🏜️'),
  Other: createCustomIcon('slate-400', '🚨'),
  // Resources
  Hospital: createCustomIcon('emerald-400', '🏥'),
  Shelter: createCustomIcon('cyan-500', '🏠'),
  'Police Station': createCustomIcon('indigo-400', '👮'),
  'Fire Station': createCustomIcon('red-500', '🚒'),
  'Food Supply': createCustomIcon('yellow-500', '🍱'),
  'Water Supply': createCustomIcon('sky-400', '💧'),
  'Medical Supplies': createCustomIcon('teal-400', '💊'),
  // Citizen Reports
  PendingReport: createCustomIcon('amber-400', '⚠️'),
  VerifiedReport: createCustomIcon('rose-500', '✅')
};

// Sub-component to capture map click coordinates
interface MapClickSelectorProps {
  onMapClick: (latlng: L.LatLng) => void;
}

const MapClickSelector: React.FC<MapClickSelectorProps> = ({ onMapClick }) => {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng);
    }
  });
  return null;
};

export const MapView: React.FC = () => {
  const { socket } = useSocket();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [reports, setReports] = useState<Report[]>([]);

  // Filter states
  const [showAlerts, setShowAlerts] = useState(true);
  const [showResources, setShowResources] = useState(true);
  const [showReports, setShowReports] = useState(true);

  // New report form drawer
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [reportTitle, setReportTitle] = useState('');
  const [reportDesc, setReportDesc] = useState('');
  const [reportType, setReportType] = useState<'Fire' | 'Flooding' | 'Structural Damage' | 'Blockage' | 'Medical Emergency' | 'Other'>('Other');
  const [reportSeverity, setReportSeverity] = useState<'Low' | 'Medium' | 'High' | 'Critical'>('Medium');
  const [selectedCoords, setSelectedCoords] = useState<L.LatLng | null>(null);
  const [reportAddress, setReportAddress] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchMapData();

    // Listen for WebSocket broadcasts
    if (socket) {
      socket.on('new-alert', (alert: Alert) => {
        setAlerts(prev => [alert, ...prev]);
      });

      socket.on('new-report', (report: Report) => {
        setReports(prev => [report, ...prev]);
      });

      socket.on('alert-updated', (updated: Alert) => {
        setAlerts(prev => prev.map(a => (a._id === updated._id || a.id === updated.id) ? updated : a));
      });
    }

    return () => {
      if (socket) {
        socket.off('new-alert');
        socket.off('new-report');
        socket.off('alert-updated');
      }
    };
  }, [socket]);

  const fetchMapData = async () => {
    try {
      const alertsRes = await api.get('/alerts');
      setAlerts(alertsRes.data);
      const resourcesRes = await api.get('/resources');
      setResources(resourcesRes.data);
      const reportsRes = await api.get('/alerts/reports');
      setReports(reportsRes.data);
    } catch (err) {
      console.error('Failed to load map arrays', err);
    }
  };

  const handleMapClick = async (latlng: L.LatLng) => {
    setSelectedCoords(latlng);
    setIsDrawerOpen(true);
    setReportAddress(`Loading location telemetry...`);

    // Reverse geocode with OSM Nominatim
    try {
      const geocodeUrl = `https://nominatim.openstreetmap.org/reverse?lat=${latlng.lat}&lon=${latlng.lng}&format=json`;
      const res = await fetch(geocodeUrl);
      const data = await res.json();
      if (data && data.display_name) {
        setReportAddress(data.display_name.split(',').slice(0, 3).join(','));
      } else {
        setReportAddress(`Coordinates: ${latlng.lat.toFixed(4)}, ${latlng.lng.toFixed(4)}`);
      }
    } catch (err) {
      setReportAddress(`Coordinates: ${latlng.lat.toFixed(4)}, ${latlng.lng.toFixed(4)}`);
    }
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCoords) return;

    setSubmitting(true);
    try {
      await api.post('/alerts/report', {
        title: reportTitle,
        description: reportDesc,
        type: reportType,
        severity: reportSeverity,
        location: {
          lat: selectedCoords.lat,
          lng: selectedCoords.lng,
          address: reportAddress
        }
      });

      // Clear Form
      setReportTitle('');
      setReportDesc('');
      setReportType('Other');
      setReportSeverity('Medium');
      setSelectedCoords(null);
      setIsDrawerOpen(false);
      alert('Your crisis report has been submitted to responders. Status: PENDING VERIFICATION.');
      fetchMapData();
    } catch (err) {
      console.error('Report submission failed', err);
      alert('Failed to transmit report. Running in offline Demo Mode.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative h-auto lg:h-[calc(100vh-85px)] flex flex-col lg:flex-row gap-4">
      {/* Map View Frame */}
      <div className="flex-1 rounded-xl overflow-hidden border border-white/5 relative z-0 min-h-[400px]">
        
        {/* Float Toggles Overlay */}
        <div className="absolute top-3 right-3 z-10 flex flex-col gap-2 bg-slate-900/90 backdrop-blur border border-white/10 p-3 rounded-lg text-xs font-orbitron">
          <span className="font-bold text-brandCyan border-b border-white/10 pb-1 mb-1.5 uppercase">Sensors overlay</span>
          <label className="flex items-center gap-2 text-slate-300 hover:text-white cursor-pointer py-0.5">
            <input type="checkbox" checked={showAlerts} onChange={() => setShowAlerts(!showAlerts)} className="accent-brandRose" />
            🔥 Satellite Hazards
          </label>
          <label className="flex items-center gap-2 text-slate-300 hover:text-white cursor-pointer py-0.5">
            <input type="checkbox" checked={showResources} onChange={() => setShowResources(!showResources)} className="accent-brandCyan" />
            🏥 Shelters & Hospitals
          </label>
          <label className="flex items-center gap-2 text-slate-300 hover:text-white cursor-pointer py-0.5">
            <input type="checkbox" checked={showReports} onChange={() => setShowReports(!showReports)} className="accent-brandAmber" />
            ⚠️ Citizen Incident Reports
          </label>
        </div>

        {/* Map Click Instructions Box */}
        <div className="absolute bottom-3 left-3 z-10 bg-slate-900/80 backdrop-blur text-[10px] text-slate-400 py-1.5 px-3 rounded border border-white/5 font-sans pointer-events-none">
          ℹ️ Double click or click anywhere on the map grid to report an active local incident.
        </div>

        <MapContainer center={[37.7749, -122.4194]} zoom={13} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapClickSelector onMapClick={handleMapClick} />

          {/* Render Active Warnings */}
          {showAlerts && alerts.filter(a => a.isActive).map((alert) => (
            <Marker 
              key={alert._id || alert.id} 
              position={[alert.location.lat, alert.location.lng]}
              icon={iconMap[alert.type] || iconMap.Other}
            >
              <Popup>
                <div className="text-xs">
                  <h3 className="font-bold text-brandRose font-orbitron">{alert.title}</h3>
                  <span className="text-[9px] uppercase font-orbitron px-1 py-0.2 bg-brandRose/10 border border-brandRose/20 text-brandRose mt-0.5 inline-block">
                    {alert.severity} • {alert.source}
                  </span>
                  <p className="mt-1.5 text-slate-300 font-sans">{alert.description}</p>
                  {alert.details?.containment && (
                    <span className="block mt-1 font-semibold text-brandAmber text-[9px] font-orbitron">
                      Containment: {alert.details.containment} | Area: {alert.details.areaAcres} Acres
                    </span>
                  )}
                  {alert.details?.mag && (
                    <span className="block mt-1 font-semibold text-brandIndigo text-[9px] font-orbitron">
                      Magnitude: {alert.details.mag} | Depth: {alert.details.depth}km
                    </span>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Render shelters & hospitals */}
          {showResources && resources.map((res) => (
            <Marker
              key={res._id || res.id}
              position={[res.location.lat, res.location.lng]}
              icon={iconMap[res.type] || iconMap.Shelter}
            >
              <Popup>
                <div className="text-xs">
                  <h3 className="font-bold text-brandCyan font-orbitron">{res.name}</h3>
                  <span className="text-[9px] uppercase font-orbitron px-1 py-0.2 bg-brandCyan/10 border border-brandCyan/20 text-brandCyan mt-0.5 inline-block">
                    {res.type} • {res.status}
                  </span>
                  <p className="mt-1.5 font-semibold text-slate-300">
                    Capacity: {res.capacity.available}/{res.capacity.total} {res.capacity.unit} free
                  </p>
                  <p className="mt-1 font-sans text-slate-400 text-[10px]">📍 {res.location.address}</p>
                  {res.contactPhone && <p className="mt-1 font-orbitron text-[9px] text-slate-400">📞 {res.contactPhone}</p>}
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Render citizen reports */}
          {showReports && reports.map((rep) => {
            const isPending = rep.status === 'Pending';
            return (
              <Marker
                key={rep._id || rep.id}
                position={[rep.location.lat, rep.location.lng]}
                icon={isPending ? iconMap.PendingReport : iconMap.VerifiedReport}
              >
                <Popup>
                  <div className="text-xs">
                    <h3 className="font-bold text-brandAmber font-orbitron">{rep.title}</h3>
                    <span className={`text-[9px] uppercase font-orbitron px-1 py-0.2 mt-0.5 inline-block border ${
                      isPending 
                        ? 'bg-brandAmber/10 border-brandAmber/20 text-brandAmber' 
                        : 'bg-brandRose/10 border-brandRose/20 text-brandRose'
                    }`}>
                      Report: {rep.status} • {rep.severity}
                    </span>
                    <p className="mt-1.5 text-slate-300 font-sans">{rep.description}</p>
                    <p className="mt-1 text-slate-400 text-[9px] font-sans">Location: {rep.location.address || 'Street'}</p>
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {/* Selected marker placeholder */}
          {selectedCoords && (
            <Marker position={[selectedCoords.lat, selectedCoords.lng]}>
              <Popup>
                <span className="text-xs font-orbitron text-brandCyan">📍 Selection Target Pin</span>
              </Popup>
            </Marker>
          )}

        </MapContainer>
      </div>

      {/* Side Report Drawer Panel */}
      {isDrawerOpen && (
        <div className="w-full lg:w-96 glass-panel p-6 rounded-xl border border-white/5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
              <h2 className="text-base font-bold font-orbitron text-slate-200 uppercase flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-brandAmber" /> Dispatch Report
              </h2>
              <button onClick={() => { setIsDrawerOpen(false); setSelectedCoords(null); }} className="text-slate-400 hover:text-white text-sm bg-transparent border-0 font-orbitron">&times; CANCEL</button>
            </div>

            <form onSubmit={handleReportSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-slate-400 mb-1 font-orbitron">Coordinates</label>
                <div className="p-2.5 bg-white/5 border border-white/10 text-xs rounded text-slate-400 font-orbitron">
                  {selectedCoords?.lat.toFixed(6)}, {selectedCoords?.lng.toFixed(6)}
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider text-slate-400 mb-1 font-orbitron">Address</label>
                <div className="p-2.5 bg-white/5 border border-white/10 text-xs rounded text-slate-400 max-h-16 overflow-y-auto">
                  {reportAddress}
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider text-slate-400 mb-1 font-orbitron">Incident Type</label>
                <select
                  value={reportType}
                  onChange={(e: any) => setReportType(e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 rounded p-2 text-xs text-slate-300 focus:outline-none focus:border-brandCyan"
                >
                  <option value="Fire">🔥 Active Fire / Smoke</option>
                  <option value="Flooding">🌊 Water Flooding / Rising Runoff</option>
                  <option value="Structural Damage">🪨 Landslide / Falling Debris</option>
                  <option value="Blockage">🚧 Blocked Route / Downed Lines</option>
                  <option value="Medical Emergency">🩺 Medical Assistance Required</option>
                  <option value="Other">🚨 Other Emergency Hazard</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider text-slate-400 mb-1 font-orbitron">Severity</label>
                <select
                  value={reportSeverity}
                  onChange={(e: any) => setReportSeverity(e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 rounded p-2 text-xs text-slate-300 focus:outline-none focus:border-brandCyan"
                >
                  <option value="Low">Low (Informative)</option>
                  <option value="Medium">Medium (Action needed)</option>
                  <option value="High">High (Immediate risk)</option>
                  <option value="Critical">Critical (Threat to life)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider text-slate-400 mb-1 font-orbitron">Brief Header</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rising flash water in driveway"
                  value={reportTitle}
                  onChange={(e) => setReportTitle(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded p-2 text-xs text-slate-200 focus:outline-none focus:border-brandCyan"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider text-slate-400 mb-1 font-orbitron">Detailed Description</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Describe the incident, structure damages, road blocks, or people trapped..."
                  value={reportDesc}
                  onChange={(e) => setReportDesc(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded p-2 text-xs text-slate-200 focus:outline-none focus:border-brandCyan resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-gradient-to-r from-brandRose to-brandAmber text-darkBg font-bold py-2.5 rounded text-xs font-orbitron hover:brightness-110 transition-all shadow-rose-glow flex items-center justify-center gap-2"
              >
                {submitting ? 'TRANSMITTING INCIDENT...' : 'DISPATCH CRISIS REPORT'}
              </button>
            </form>
          </div>

          <div className="text-[9px] text-slate-500 text-center uppercase tracking-widest font-orbitron mt-4">
            ⚠️ Sending false reports is a penalizable offense.
          </div>
        </div>
      )}
    </div>
  );
};
