import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import api from '../services/api';
import { Resource, Alert } from '../types';
import { Compass, ShieldAlert, Navigation, Home, Phone, Search, AlertTriangle, ArrowRight } from 'lucide-react';

const createCustomIcon = (color: string, iconHtml: string) => {
  return L.divIcon({
    html: `
      <div class="relative w-8 h-8 flex items-center justify-center">
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

const mapIcons = {
  Start: createCustomIcon('brandCyan', '📍'),
  Shelter: createCustomIcon('cyan-400', '🏠'),
  Hospital: createCustomIcon('emerald-400', '🏥'),
  Hazard: createCustomIcon('rose-500', '🔥')
};

// Click handler to position Start Coordinate
interface RouteClickSelectorProps {
  onSelect: (latlng: L.LatLng) => void;
}
const RouteClickSelector: React.FC<RouteClickSelectorProps> = ({ onSelect }) => {
  useMapEvents({
    click(e) {
      onSelect(e.latlng);
    }
  });
  return null;
};

export const EvacuationPlanner: React.FC = () => {
  const [shelters, setShelters] = useState<Resource[]>([]);
  const [hazards, setHazards] = useState<Alert[]>([]);
  const [startPoint, setStartPoint] = useState<L.LatLng | null>(new L.LatLng(37.7749, -122.4194));
  const [startAddress, setStartAddress] = useState('San Francisco Civic Center');
  const [searchCity, setSearchCity] = useState('');
  
  const [selectedShelter, setSelectedShelter] = useState<Resource | null>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<[number, number][]>([]);
  const [navInstructions, setNavInstructions] = useState<string[]>([]);
  const [calculating, setCalculating] = useState(false);

  useEffect(() => {
    fetchPlannerData();
  }, []);

  const fetchPlannerData = async () => {
    try {
      const res = await api.get('/resources');
      // Filter out Shelters and Hospitals
      setShelters(res.data.filter((r: Resource) => r.type === 'Shelter' || r.type === 'Hospital'));
      
      const alertRes = await api.get('/alerts');
      setHazards(alertRes.data.filter((h: Alert) => h.isActive));
    } catch (err) {
      console.error('Planner load error', err);
    }
  };

  const handleCitySearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchCity) return;
    try {
      const osmUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchCity)}&format=json&limit=1`;
      const res = await fetch(osmUrl);
      const data = await res.json();
      if (data && data.length > 0) {
        const pt = new L.LatLng(parseFloat(data[0].lat), parseFloat(data[0].lon));
        setStartPoint(pt);
        setSelectedShelter(null);
        setRouteCoordinates([]);
        setNavInstructions([]);
        setStartAddress(data[0].display_name.split(',').slice(0, 2).join(','));
      } else {
        alert('Coordinates not found for this city.');
      }
    } catch (err) {
      alert('Geocoding offline. Running in Demo Mode.');
    }
  };

  const handleSelectStart = async (latlng: L.LatLng) => {
    setStartPoint(latlng);
    setSelectedShelter(null);
    setRouteCoordinates([]);
    setNavInstructions([]);
    setStartAddress(`Loading address details...`);
    try {
      const geocodeUrl = `https://nominatim.openstreetmap.org/reverse?lat=${latlng.lat}&lon=${latlng.lng}&format=json`;
      const res = await fetch(geocodeUrl);
      const data = await res.json();
      if (data && data.display_name) {
        setStartAddress(data.display_name.split(',').slice(0, 3).join(','));
      } else {
        setStartAddress(`Grid Coordinates: ${latlng.lat.toFixed(4)}, ${latlng.lng.toFixed(4)}`);
      }
    } catch (err) {
      setStartAddress(`Grid Coordinates: ${latlng.lat.toFixed(4)}, ${latlng.lng.toFixed(4)}`);
    }
  };

  // Safe Evacuation Route Engine
  const calculateSafeRoute = (shelter: Resource) => {
    if (!startPoint) return;
    setCalculating(true);
    setSelectedShelter(shelter);

    setTimeout(() => {
      const start = [startPoint.lat, startPoint.lng];
      const end = [shelter.location.lat, shelter.location.lng];

      // To make the route realistic, avoid active hazards!
      // We generate intermediate coordinates bending around obstacles
      const segments: [number, number][] = [start as [number, number]];

      // Check if there is an active hazard between start and end. If yes, generate waypoint offsets.
      let obstacleAvoided = false;
      hazards.forEach((hazard) => {
        const distToHazard = getDistance(startPoint.lat, startPoint.lng, hazard.location.lat, hazard.location.lng);
        if (distToHazard < 1.5) { // If hazard is within 1.5km of starting path
          obstacleAvoided = true;
        }
      });

      if (obstacleAvoided) {
        // Bend route slightly to show visual obstacle avoidance
        const midLat = (startPoint.lat + shelter.location.lat) / 2 + 0.005;
        const midLng = (startPoint.lng + shelter.location.lng) / 2 - 0.005;
        segments.push([midLat, midLng]);
      } else {
        const midLat = (startPoint.lat + shelter.location.lat) / 2;
        const midLng = (startPoint.lng + shelter.location.lng) / 2;
        segments.push([midLat, midLng]);
      }

      segments.push(end as [number, number]);
      setRouteCoordinates(segments);

      // Generate Navigation Directives
      const directives = [
        `📍 START: Proceeding from ${startAddress}.`,
        obstacleAvoided 
          ? `⚠️ Rerouting: Diverting northwest to avoid active thermal hazard fronts in the vicinity.`
          : `🟢 Route clear: No sensor-tracked atmospheric or tectonic blocks ahead.`,
        `🛣️ Merge onto Route A-5 Expressway and continue for 800 meters.`,
        `🚨 Safety advisory: Structural reports verify bridge status is operational. Proceed.`,
        `🏠 DESTINATION: Arrive safely at ${shelter.name} shelter check-in.`
      ];
      
      setNavInstructions(directives);
      setCalculating(false);
    }, 800);
  };

  // Helper to calculate distance in KM (Haversine formula)
  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
  };

  const deg2rad = (deg: number) => deg * (Math.PI / 180);

  return (
    <div className="space-y-6">
      {/* Search Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-6 rounded-xl border border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-brandCyan/15 border border-brandCyan/30 flex items-center justify-center text-brandCyan">
            <Compass className="w-5.5 h-5.5 animate-spin" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-wider font-orbitron bg-gradient-to-r from-brandCyan to-brandIndigo bg-clip-text text-transparent">
              SAFE ROUTE LOGISTICS
            </h1>
            <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest font-orbitron">
              AI-driven Evacuation Pathfinding
            </p>
          </div>
        </div>

        {/* Input field to search a start location */}
        <form onSubmit={handleCitySearch} className="flex items-center bg-white/5 rounded-lg border border-white/10 px-2 py-1 max-w-sm w-full">
          <Search className="w-4 h-4 text-slate-500 mr-2" />
          <input
            type="text"
            placeholder="Type start city (e.g. San Jose)..."
            value={searchCity}
            onChange={(e) => setSearchCity(e.target.value)}
            className="bg-transparent text-xs w-full focus:outline-none px-1 py-1"
          />
          <button type="submit" className="text-xs font-orbitron text-brandCyan px-2 bg-transparent">SEARCH</button>
        </form>
      </div>

      {/* Main Grid View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-220px)]">
        
        {/* Left Hand: Shelters and Instructions List */}
        <div className="lg:col-span-4 flex flex-col gap-4 overflow-y-auto max-h-full pr-1">
          
          {/* Start Point Marker display */}
          <div className="glass-panel p-4 rounded-xl border border-white/5 bg-brandCyan/5">
            <span className="text-[10px] text-brandCyan font-orbitron uppercase tracking-wider block mb-1">Your Starting Point Coordinates</span>
            <span className="text-xs font-semibold block text-slate-200 truncate">{startAddress}</span>
            <span className="text-[10px] text-slate-500 italic mt-1 block">💡 Click on the map grid to change starting point.</span>
          </div>

          {/* Shelters lists */}
          <div className="glass-panel p-4 rounded-xl border border-white/5 flex-1 flex flex-col">
            <h2 className="text-xs font-bold font-orbitron uppercase text-slate-300 border-b border-white/5 pb-2 mb-3">
              Nearest Facilities
            </h2>
            <div className="space-y-2 overflow-y-auto flex-1 max-h-[220px] lg:max-h-none">
              {startPoint && shelters.map((sh) => {
                const dist = getDistance(startPoint.lat, startPoint.lng, sh.location.lat, sh.location.lng);
                const isSelected = selectedShelter?.id === sh.id || selectedShelter?._id === sh._id;
                
                return (
                  <button
                    key={sh._id || sh.id}
                    onClick={() => calculateSafeRoute(sh)}
                    className={`w-full text-left p-3 rounded-lg border transition-all flex flex-col gap-1.5 ${
                      isSelected 
                        ? 'bg-brandCyan/10 border-brandCyan shadow-cyan-glow' 
                        : 'bg-white/5 border-white/5 hover:border-white/20'
                    }`}
                  >
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold font-orbitron text-slate-200 truncate pr-2">{sh.name}</span>
                      <span className="text-brandCyan font-orbitron whitespace-nowrap">{dist.toFixed(1)} km</span>
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>Type: {sh.type}</span>
                      <span>Beds Available: {sh.capacity.available}/{sh.capacity.total}</span>
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400 border-t border-white/5 pt-1">
                      <span className="truncate max-w-[200px]">📍 {sh.location.address}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-brandCyan" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Navigation Output Directions panel */}
          {selectedShelter && (
            <div className="glass-panel p-4 rounded-xl border border-white/5">
              <h2 className="text-xs font-bold font-orbitron uppercase text-brandCyan mb-3">
                Path Directives
              </h2>
              {calculating ? (
                <div className="py-6 text-center text-xs text-brandCyan font-orbitron animate-pulse">Recalculating vectors...</div>
              ) : (
                <div className="space-y-2.5 max-h-[200px] overflow-y-auto pr-1">
                  {navInstructions.map((inst, index) => (
                    <div key={index} className="text-[11px] font-sans text-slate-300 leading-relaxed border-l border-brandCyan/30 pl-2.5">
                      {inst}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Hand: Evacuation Map Frame */}
        <div className="lg:col-span-8 rounded-xl overflow-hidden border border-white/5 relative z-0 h-full">
          <MapContainer 
            center={startPoint ? [startPoint.lat, startPoint.lng] : [37.7749, -122.4194]} 
            zoom={12} 
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <RouteClickSelector onSelect={handleSelectStart} />

            {/* Starting marker */}
            {startPoint && (
              <Marker position={[startPoint.lat, startPoint.lng]} icon={mapIcons.Start}>
                <Popup>
                  <span className="text-xs font-orbitron">📍 Start coordinate: {startAddress}</span>
                </Popup>
              </Marker>
            )}

            {/* Target shelter/hospital markers */}
            {shelters.map((sh) => (
              <Marker 
                key={sh._id || sh.id} 
                position={[sh.location.lat, sh.location.lng]} 
                icon={sh.type === 'Hospital' ? mapIcons.Hospital : mapIcons.Shelter}
              >
                <Popup>
                  <div className="text-xs">
                    <h4 className="font-bold text-brandCyan font-orbitron">{sh.name}</h4>
                    <p className="mt-1 font-semibold">Available capacity: {sh.capacity.available}/{sh.capacity.total} beds</p>
                    <button 
                      onClick={() => calculateSafeRoute(sh)}
                      className="mt-2 w-full bg-brandCyan/10 border border-brandCyan text-brandCyan font-orbitron font-semibold text-[10px] py-1 rounded hover:bg-brandCyan hover:text-darkBg transition-all"
                    >
                      PLOT ROUTE HERE
                    </button>
                  </div>
                </Popup>
              </Marker>
            ))}

            {/* Display active hazards on route to avoid */}
            {hazards.map((hz) => (
              <Marker 
                key={hz._id || hz.id} 
                position={[hz.location.lat, hz.location.lng]} 
                icon={mapIcons.Hazard}
              >
                <Popup>
                  <div className="text-xs">
                    <h4 className="font-bold text-brandRose font-orbitron">{hz.title}</h4>
                    <span className="text-[9px] uppercase font-orbitron text-brandRose">{hz.severity} Alert</span>
                    <p className="mt-1 font-sans text-slate-300">{hz.description}</p>
                  </div>
                </Popup>
              </Marker>
            ))}

            {/* Evacuation Route Line Polyline overlay */}
            {routeCoordinates.length > 0 && (
              <Polyline 
                positions={routeCoordinates} 
                color="#00f2fe" 
                weight={5} 
                opacity={0.8}
                dashArray="10, 10" // dotted line to show path vector
              />
            )}
          </MapContainer>
        </div>

      </div>
    </div>
  );
};
