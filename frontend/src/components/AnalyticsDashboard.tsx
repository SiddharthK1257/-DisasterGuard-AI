import React, { useEffect, useState } from 'react';
import api, { API_BASE_URL } from '../services/api';
import { Alert, Resource, RiskReport } from '../types';
import { 
  CloudSun, 
  Wind, 
  Droplets, 
  Download, 
  MapPin, 
  Skull, 
  CheckCircle, 
  TrendingUp, 
  AlertTriangle,
  BrainCircuit,
  Search,
  Activity
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';

export const AnalyticsDashboard: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  // Weather state (Default: San Francisco)
  const [weather, setWeather] = useState<any>(null);
  const [coords, setCoords] = useState({ lat: 37.7749, lng: -122.4194 });
  const [weatherLoc, setWeatherLoc] = useState('San Francisco, CA');

  // AI Prediction search input
  const [predictCity, setPredictCity] = useState('San Francisco, CA');
  const [predictCoords, setPredictCoords] = useState({ lat: 37.7749, lng: -122.4194 });
  const [riskReport, setRiskReport] = useState<RiskReport | null>(null);
  const [riskLoading, setRiskLoading] = useState(false);

  useEffect(() => {
    fetchCoreData();
    fetchWeather(coords.lat, coords.lng);
    runAIPrediction(coords.lat, coords.lng, weatherLoc);
  }, []);

  const fetchCoreData = async (sync = false) => {
    setLoading(true);
    try {
      const alertRes = await api.get(`/alerts${sync ? '?sync=true' : ''}`);
      setAlerts(alertRes.data);
      const resRes = await api.get('/resources');
      setResources(resRes.data);
    } catch (err) {
      console.error('Failed to retrieve core metrics', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchWeather = async (lt: number, lg: number) => {
    try {
      // Simulate/Fetch Open-Meteo forecast through backend or direct
      const response = await api.get(`/alerts?sync=true`); // Trigger sync on backend which triggers Weather fallback or live
      // We can also call Open-Meteo directly
      const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lt}&longitude=${lg}&current_weather=true&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,windspeed_10m_max&timezone=auto`;
      const weatherRes = await fetch(weatherUrl);
      const data = await weatherRes.json();
      setWeather(data);
    } catch (err) {
      console.warn('Weather API failed, relying on mock telemetry.', err);
    }
  };

  const runAIPrediction = async (lt: number, lg: number, name: string) => {
    setRiskLoading(true);
    try {
      const res = await api.post('/predictions/risk', { lat: lt, lng: lg, locationName: name });
      setRiskReport(res.data);
    } catch (err) {
      console.error('AI risk assessment failed', err);
    } finally {
      setRiskLoading(false);
    }
  };

  const handleCitySearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setRiskLoading(true);
    try {
      // Search coordinates with free Nominatim OpenStreetMap API
      const osmUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(predictCity)}&format=json&limit=1`;
      const response = await fetch(osmUrl);
      const data = await response.json();
      
      if (data && data.length > 0) {
        const targetLat = parseFloat(data[0].lat);
        const targetLng = parseFloat(data[0].lon);
        const displayName = data[0].display_name.split(',')[0] + ', ' + (data[0].display_name.split(',')[2] || '');
        
        setPredictCoords({ lat: targetLat, lng: targetLng });
        setCoords({ lat: targetLat, lng: targetLng });
        setWeatherLoc(displayName);
        
        await fetchWeather(targetLat, targetLng);
        await runAIPrediction(targetLat, targetLng, displayName);
      } else {
        alert('Location not found. Try entering a larger city.');
      }
    } catch (err) {
      console.error(err);
      alert('Geocoding service error. Attempting in local Demo Mode.');
      // Mock search change
      await runAIPrediction(37.7749, -122.4194, predictCity + ' (Demo Coords)');
    } finally {
      setRiskLoading(false);
    }
  };

  const handleSyncData = async () => {
    setSyncing(true);
    await fetchCoreData(true);
    setSyncing(false);
  };

  // PDF Report Downloader
  const handleDownloadPDF = () => {
    const token = localStorage.getItem('disasterguard_token');
    if (!token) return;
    
    // Trigger direct browser download stream
    window.open(`${API_BASE_URL}/pdf/situation-report?authorization=Bearer ${token}`, '_blank');
  };

  // Prepare Chart Data
  const getHazardBreakdownData = () => {
    const counts: Record<string, number> = { Flood: 0, Cyclone: 0, Earthquake: 0, Wildfire: 0, Landslide: 0, Drought: 0 };
    alerts.forEach(a => {
      if (a.isActive && counts[a.type] !== undefined) {
        counts[a.type]++;
      }
    });
    return Object.keys(counts).map(key => ({ name: key, count: counts[key] }));
  };

  const getResourceOccupancyData = () => {
    return resources.slice(0, 5).map(r => ({
      name: r.name.length > 15 ? r.name.slice(0, 15) + '...' : r.name,
      Capacity: r.capacity.total,
      Available: r.capacity.available,
      Occupied: r.capacity.total - r.capacity.available
    }));
  };

  const getRadarRiskData = () => {
    if (!riskReport) return [];
    return riskReport.hazards.map(h => ({
      subject: h.name,
      probability: h.probability,
      fullMark: 100
    }));
  };

  const hazardChartData = getHazardBreakdownData();
  const resourceChartData = getResourceOccupancyData();
  const radarChartData = getRadarRiskData();

  // COLORS for charts
  const HAZARD_COLORS: Record<string, string> = {
    Earthquake: '#8b5cf6', // Violet
    Wildfire: '#f43f5e',   // Rose
    Flood: '#3b82f6',      // Blue
    Cyclone: '#00f2fe',    // Cyan
    Landslide: '#f59e0b',  // Amber
    Drought: '#10b981'     // Emerald
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Control Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-6 rounded-xl border border-white/5">
        <div>
          <h1 className="text-2xl font-bold tracking-wider font-orbitron bg-gradient-to-r from-brandCyan to-brandIndigo bg-clip-text text-transparent">
            THREAT ANALYTICS SYSTEM
          </h1>
          <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest font-orbitron">
            Sensor Arrays & Satellite Feed Integrator
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSyncData}
            disabled={syncing}
            className={`flex items-center gap-2 px-4 py-2 border rounded-lg text-xs font-orbitron transition-all border-brandCyan/30 hover:border-brandCyan bg-brandCyan/5 hover:bg-brandCyan/15 text-brandCyan ${syncing ? 'animate-pulse' : ''}`}
          >
            <Activity className="w-4 h-4" />
            {syncing ? 'SYNCING API ARRAYS...' : 'SYNC LIVE NASA/USGS'}
          </button>
          
          <button
            onClick={handleDownloadPDF}
            className="flex items-center gap-2 px-4 py-2 border border-brandRose/30 hover:border-brandRose bg-brandRose/5 hover:bg-brandRose/15 text-brandRose rounded-lg text-xs font-orbitron transition-all shadow-rose-glow"
          >
            <Download className="w-4 h-4" />
            GENERATE BRIEFING PDF
          </button>
        </div>
      </div>

      {/* Grid of Key Info Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="glass-panel p-5 rounded-xl border border-white/5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-brandRose/10 border border-brandRose/30 flex items-center justify-center text-brandRose">
            <AlertTriangle className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] uppercase text-slate-400 font-orbitron tracking-wider">Active Alerts</span>
            <h3 className="text-2xl font-bold text-white font-orbitron">{alerts.filter(a => a.isActive).length}</h3>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="glass-panel p-5 rounded-xl border border-white/5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-brandAmber/10 border border-brandAmber/30 flex items-center justify-center text-brandAmber">
            <Skull className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] uppercase text-slate-400 font-orbitron tracking-wider">Critical Threats</span>
            <h3 className="text-2xl font-bold text-white font-orbitron">
              {alerts.filter(a => a.severity === 'Critical' && a.isActive).length}
            </h3>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="glass-panel p-5 rounded-xl border border-white/5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-brandEmerald/10 border border-brandEmerald/30 flex items-center justify-center text-brandEmerald">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] uppercase text-slate-400 font-orbitron tracking-wider">Shelter Beds Free</span>
            <h3 className="text-2xl font-bold text-white font-orbitron font-sans">
              {resources.filter(r => r.type === 'Shelter').reduce((acc, curr) => acc + curr.capacity.available, 0)}
            </h3>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="glass-panel p-5 rounded-xl border border-white/5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-brandCyan/10 border border-brandCyan/30 flex items-center justify-center text-brandCyan">
            <CloudSun className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] uppercase text-slate-400 font-orbitron tracking-wider">Local Temperature</span>
            <h3 className="text-2xl font-bold text-white font-orbitron">
              {weather ? `${weather.current_weather.temperature}°C` : '24.5°C'}
            </h3>
          </div>
        </div>
      </div>

      {/* Main Charts Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Chart 1: Active Alerts Breakdown */}
        <div className="glass-panel p-5 rounded-xl border border-white/5 lg:col-span-1">
          <h2 className="text-sm font-semibold tracking-wider font-orbitron text-slate-300 uppercase mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-brandCyan" /> Live Alerts Distribution
          </h2>
          <div className="h-64">
            {loading ? (
              <div className="h-full flex items-center justify-center"><Activity className="w-8 h-8 animate-spin text-brandCyan" /></div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hazardChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', color: '#f1f5f9' }}
                    labelStyle={{ color: '#00f2fe', fontFamily: 'Orbitron' }}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {hazardChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={HAZARD_COLORS[entry.name] || '#6366f1'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Chart 2: Emergency Resources Occupancy */}
        <div className="glass-panel p-5 rounded-xl border border-white/5 lg:col-span-2">
          <h2 className="text-sm font-semibold tracking-wider font-orbitron text-slate-300 uppercase mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-brandIndigo" /> Shelter Occupancy Rates
          </h2>
          <div className="h-64">
            {loading ? (
              <div className="h-full flex items-center justify-center"><Activity className="w-8 h-8 animate-spin text-brandCyan" /></div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={resourceChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={9} />
                  <YAxis stroke="#64748b" fontSize={10} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', color: '#f1f5f9' }}
                  />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Bar dataKey="Available" stackId="a" fill="#10b981" />
                  <Bar dataKey="Occupied" stackId="a" fill="#f43f5e" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* AI Disaster Prediction & Weather Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Live Weather forecasts */}
        <div className="glass-panel p-6 rounded-xl border border-white/5 lg:col-span-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold tracking-wider font-orbitron text-slate-300 uppercase flex items-center gap-2">
                <CloudSun className="w-4.5 h-4.5 text-brandCyan" /> Weather Telemetry
              </h2>
              <span className="text-[10px] text-brandCyan bg-brandCyan/10 px-2 py-0.5 rounded font-orbitron uppercase border border-brandCyan/20">
                {weatherLoc}
              </span>
            </div>
            
            {weather ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between bg-white/5 p-4 rounded-xl border border-white/5">
                  <div className="flex items-center gap-3">
                    <CloudSun className="w-10 h-10 text-brandCyan" />
                    <div>
                      <span className="text-xs text-slate-400">Current Conditions</span>
                      <h4 className="text-base font-semibold font-orbitron">Cloudy Skies</h4>
                    </div>
                  </div>
                  <h3 className="text-3xl font-extrabold text-white font-orbitron">{weather.current_weather.temperature}°C</h3>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-white/5 p-3 rounded-lg border border-white/5 flex items-center gap-2.5">
                    <Wind className="w-4 h-4 text-brandIndigo" />
                    <div>
                      <span className="block text-[10px] text-slate-500 font-orbitron">WIND SPEED</span>
                      <span className="font-semibold">{weather.current_weather.windspeed} km/h</span>
                    </div>
                  </div>
                  <div className="bg-white/5 p-3 rounded-lg border border-white/5 flex items-center gap-2.5">
                    <Droplets className="w-4 h-4 text-brandCyan" />
                    <div>
                      <span className="block text-[10px] text-slate-500 font-orbitron">PRECIPITATION</span>
                      <span className="font-semibold">{weather.daily.precipitation_probability_max[0]}% Probability</span>
                    </div>
                  </div>
                </div>

                {/* 3 Day Outlook */}
                <div className="pt-2">
                  <span className="block text-[10px] text-slate-400 font-orbitron uppercase tracking-wider mb-2">3-Day Forecast Outlook</span>
                  <div className="grid grid-cols-3 gap-2">
                    {weather.daily.time.slice(0, 3).map((day: string, idx: number) => (
                      <div key={day} className="bg-white/5 p-2 rounded border border-white/5 text-center">
                        <span className="block text-[9px] text-slate-400 font-orbitron">{day.slice(5)}</span>
                        <span className="block font-bold text-xs mt-1 text-brandCyan">
                          {weather.daily.temperature_2m_max[idx]}° / {weather.daily.temperature_2m_min[idx]}°
                        </span>
                        <span className="block text-[9px] text-slate-500 mt-0.5">Rain: {weather.daily.precipitation_probability_max[idx]}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-slate-500">Loading Weather telemetry...</div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-white/5 text-[9px] text-slate-500 flex justify-between uppercase font-orbitron">
            <span>Update interval: 1 hour</span>
            <span>API: Open-Meteo public</span>
          </div>
        </div>

        {/* Right Column: AI Disaster Prediction Matrix */}
        <div className="glass-panel p-6 rounded-xl border border-white/5 lg:col-span-7 flex flex-col">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
            <h2 className="text-sm font-semibold tracking-wider font-orbitron text-slate-300 uppercase flex items-center gap-2">
              <BrainCircuit className="w-4.5 h-4.5 text-brandCyan" /> AI Disaster Risk Predictor
            </h2>

            {/* Geocode Search */}
            <form onSubmit={handleCitySearch} className="flex items-center bg-white/5 rounded-lg border border-white/10 px-2 py-1 max-w-xs w-full">
              <input
                type="text"
                placeholder="Analyze city (e.g. Tokyo)..."
                value={predictCity}
                onChange={(e) => setPredictCity(e.target.value)}
                className="bg-transparent text-xs w-full focus:outline-none px-2 py-0.5"
              />
              <button type="submit" disabled={riskLoading} className="text-brandCyan bg-transparent">
                <Search className="w-4.5 h-4.5" />
              </button>
            </form>
          </div>

          {riskLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center py-12 gap-3 text-brandCyan">
              <Activity className="w-8 h-8 animate-spin" />
              <span className="text-xs font-orbitron uppercase">Querying AI Multi-Agents...</span>
            </div>
          ) : riskReport ? (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 flex-1">
              
              {/* Radar Assessment Plot */}
              <div className="md:col-span-5 h-48 md:h-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarChartData}>
                    <PolarGrid stroke="rgba(255,255,255,0.05)" />
                    <PolarAngleAxis dataKey="subject" stroke="#94a3b8" fontSize={9} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#475569" fontSize={8} />
                    <Radar name="Risk Index %" dataKey="probability" stroke="#00f2fe" fill="#00f2fe" fillOpacity={0.2} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              {/* Hazards probabilities breakdown list */}
              <div className="md:col-span-7 space-y-3 max-h-64 overflow-y-auto pr-1">
                <div className="p-3 bg-brandCyan/5 border border-brandCyan/10 rounded-lg text-xs">
                  <span className="font-semibold text-brandCyan block mb-1">AI Agent Summary</span>
                  <p className="text-slate-400 leading-relaxed text-[11px]">{riskReport.summary}</p>
                </div>

                <div className="space-y-1.5">
                  {riskReport.hazards.map((hazard) => {
                    const barColor = hazard.level === 'Critical' ? 'bg-brandRose' :
                                     hazard.level === 'High' ? 'bg-brandAmber' :
                                     hazard.level === 'Medium' ? 'bg-brandIndigo' : 'bg-brandEmerald';
                    const textColor = hazard.level === 'Critical' ? 'text-brandRose' :
                                     hazard.level === 'High' ? 'text-brandAmber' :
                                     hazard.level === 'Medium' ? 'text-brandIndigo' : 'text-brandEmerald';

                    return (
                      <div key={hazard.name} className="bg-white/5 border border-white/5 rounded p-2 flex flex-col gap-1.5">
                        <div className="flex items-center justify-between text-xs font-semibold">
                          <span className="font-orbitron">{hazard.name}</span>
                          <span className={`${textColor} text-[10px] font-orbitron uppercase`}>
                            {hazard.probability}% ({hazard.level})
                          </span>
                        </div>
                        {/* Progress Bar */}
                        <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                          <div className={`h-full ${barColor}`} style={{ width: `${hazard.probability}%` }}></div>
                        </div>
                        {/* Recommendations */}
                        <p className="text-[9px] text-slate-500 italic font-sans leading-tight">
                          💡 Suggestion: {hazard.recommendations}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-xs text-slate-500 py-12">
              Select or search a location coordinates to trigger hazard forecasts.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
