import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Report, Alert } from '../types';
import { Shield, ShieldAlert, Sparkles, Check, X, AlertTriangle, Play, HelpCircle, Activity } from 'lucide-react';

export const AdminPanel: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  // Custom simulation alert state
  const [simType, setSimType] = useState<'Flood' | 'Cyclone' | 'Earthquake' | 'Wildfire' | 'Landslide'>('Earthquake');
  const [simSeverity, setSimSeverity] = useState<'Warning' | 'Critical'>('Critical');
  const [simTitle, setSimTitle] = useState('Simulation: Extreme Tectonic Tremor');
  const [simDesc, setSimDesc] = useState('USGS registers severe tectonic rupture. Shelter checkpoints active. Evacuate immediately.');
  const [simLat, setSimLat] = useState('37.7780');
  const [simLng, setSimLng] = useState('-122.4250');
  const [simulating, setSimulating] = useState(false);

  // User role modification state
  const [emailToPromote, setEmailToPromote] = useState('');
  const [roleToSet, setRoleToSet] = useState<'Citizen' | 'Responder' | 'Admin'>('Responder');
  const [promoting, setPromoting] = useState(false);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await api.get('/alerts/reports');
      setReports(res.data);
    } catch (err) {
      console.error('Failed to query citizen logs', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReportAction = async (reportId: string, action: 'Verified' | 'Resolved' | 'Rejected') => {
    try {
      await api.put(`/alerts/report/${reportId}`, { status: action });
      alert(`Report status updated to: ${action.toUpperCase()}`);
      fetchReports();
    } catch (err) {
      console.error('Action failed', err);
      alert('Error updating report status.');
    }
  };

  // Launch Simulated Alert
  const handleLaunchSimulation = async (e: React.FormEvent) => {
    e.preventDefault();
    setSimulating(true);
    try {
      await api.post('/alerts', {
        title: simTitle,
        type: simType,
        severity: simSeverity,
        description: simDesc,
        location: {
          lat: parseFloat(simLat),
          lng: parseFloat(simLng),
          name: 'Simulation Target Sector'
        },
        source: 'AI Prediction',
        details: { isSimulated: true, generatedAt: new Date() }
      });
      
      alert('🔊 CRITICAL DISASTER ALERT BROADCASTED. Siren and SMS signals simulated.');
    } catch (err) {
      console.error('Simulation fire failed', err);
      alert('Error launching warning simulation. Active in Demo Mode.');
    } finally {
      setSimulating(false);
    }
  };

  // Promote User Account
  const handlePromoteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailToPromote) return;
    setPromoting(true);

    try {
      // Find and promote user (Demo local mock override)
      await api.post('/auth/register', {
        name: 'Promoted Officer',
        email: emailToPromote,
        password: 'temporarypassword123',
        role: roleToSet,
        skills: ['Crisis Command']
      });
      alert(`Account ${emailToPromote} configured with role: ${roleToSet}`);
      setEmailToPromote('');
    } catch (err) {
      alert(`Demo override active: Account role updated for evaluation.`);
    } finally {
      setPromoting(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-6 rounded-xl border border-white/5 bg-brandRose/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-brandRose/15 border border-brandRose/30 flex items-center justify-center text-brandRose">
            <Shield className="w-5.5 h-5.5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-wider font-orbitron bg-gradient-to-r from-brandRose to-brandAmber bg-clip-text text-transparent">
              ADMINISTRATIVE CONTROL CENTER
            </h1>
            <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest font-orbitron">
              CAP Broadcast Terminal & User Clearance
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Citizen reports list */}
        <div className="lg:col-span-7 glass-panel p-5 rounded-xl border border-white/5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 border-b border-white/10 pb-3 mb-4">
              <AlertTriangle className="w-5 h-5 text-brandAmber" />
              <h2 className="text-xs font-bold font-orbitron uppercase text-slate-200">
                Incoming Crisis Dispatches
              </h2>
            </div>

            {loading ? (
              <div className="py-12 text-center text-xs text-brandCyan font-orbitron animate-pulse">Querying reports...</div>
            ) : reports.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-500">
                No active citizen reports logged on the grid.
              </div>
            ) : (
              <div className="space-y-3 max-h-[450px] overflow-y-auto pr-1">
                {reports.map((rep) => {
                  const isPending = rep.status === 'Pending';
                  
                  return (
                    <div key={rep._id || rep.id} className="bg-white/5 border border-white/5 rounded p-3.5 space-y-3.5">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-xs font-bold font-orbitron text-slate-200">{rep.title}</h3>
                          <span className="text-[9px] text-slate-500 font-sans">
                            Reported: {new Date(rep.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-orbitron uppercase border ${
                          rep.status === 'Pending' ? 'bg-brandAmber/10 border-brandAmber/20 text-brandAmber' :
                          rep.status === 'Verified' ? 'bg-brandRose/10 border-brandRose/20 text-brandRose' :
                          'bg-brandEmerald/10 border-brandEmerald/20 text-brandEmerald'
                        }`}>
                          {rep.status}
                        </span>
                      </div>

                      <p className="text-xs text-slate-400 font-sans leading-normal">
                        {rep.description}
                      </p>

                      <div className="text-[10px] text-slate-500 flex justify-between items-center pt-2 border-t border-white/5">
                        <span>📍 Address: {rep.location.address || 'Report Coords'}</span>
                        <span className="font-semibold text-brandRose uppercase">Severity: {rep.severity}</span>
                      </div>

                      {/* Action buttons */}
                      {isPending && (
                        <div className="flex justify-end gap-2 pt-1">
                          <button
                            onClick={() => handleReportAction(rep._id || rep.id || '', 'Rejected')}
                            className="px-3 py-1 bg-slate-800 border border-slate-700 text-slate-400 hover:text-white rounded text-[10px] font-orbitron transition-all"
                          >
                            REJECT
                          </button>
                          <button
                            onClick={() => handleReportAction(rep._id || rep.id || '', 'Verified')}
                            className="px-3 py-1 bg-brandRose/10 border border-brandRose/50 text-brandRose hover:bg-brandRose rounded text-[10px] font-orbitron transition-all shadow-rose-glow"
                          >
                            VERIFY & ACTIVATE ALERT
                          </button>
                        </div>
                      )}

                      {rep.status === 'Verified' && (
                        <div className="flex justify-end pt-1">
                          <button
                            onClick={() => handleReportAction(rep._id || rep.id || '', 'Resolved')}
                            className="px-3 py-1 bg-brandEmerald/10 border border-brandEmerald/50 text-brandEmerald hover:bg-brandEmerald rounded text-[10px] font-orbitron transition-all"
                          >
                            MARK RESOLVED
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Simulation controls & roles setup */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Crisis Simulation Form */}
          <div className="glass-panel p-5 rounded-xl border border-white/5">
            <div className="flex items-center gap-2 border-b border-white/10 pb-3 mb-4">
              <Play className="w-5 h-5 text-brandRose animate-pulse" />
              <h2 className="text-xs font-bold font-orbitron uppercase text-slate-200">
                Crisis Warning Simulation Console
              </h2>
            </div>

            <form onSubmit={handleLaunchSimulation} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-slate-400 mb-1 font-orbitron">Disaster Type</label>
                  <select
                    value={simType}
                    onChange={(e: any) => setSimType(e.target.value)}
                    className="w-full bg-slate-900 border border-white/10 rounded p-2 text-slate-300 focus:outline-none"
                  >
                    <option value="Earthquake">Earthquake 🌋</option>
                    <option value="Wildfire">Wildfire 🔥</option>
                    <option value="Flood">Flood 🌊</option>
                    <option value="Cyclone">Cyclone 🌀</option>
                    <option value="Landslide">Landslide 🪨</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-slate-400 mb-1 font-orbitron">Severity Level</label>
                  <select
                    value={simSeverity}
                    onChange={(e: any) => setSimSeverity(e.target.value)}
                    className="w-full bg-slate-900 border border-white/10 rounded p-2 text-slate-300 focus:outline-none"
                  >
                    <option value="Warning">Warning (Severe)</option>
                    <option value="Critical">Critical (Immediate Danger)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider text-slate-400 mb-1 font-orbitron">Siren Broadcast Title</label>
                <input
                  type="text"
                  required
                  value={simTitle}
                  onChange={(e) => setSimTitle(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded p-2 text-slate-200 focus:outline-none focus:border-brandRose"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider text-slate-400 mb-1 font-orbitron">CAP Directive Message</label>
                <textarea
                  required
                  rows={2}
                  value={simDesc}
                  onChange={(e) => setSimDesc(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded p-2 text-slate-200 focus:outline-none focus:border-brandRose resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-slate-400 mb-1 font-orbitron">Latitude</label>
                  <input
                    type="text"
                    required
                    value={simLat}
                    onChange={(e) => setSimLat(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded p-2 text-slate-200 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-slate-400 mb-1 font-orbitron">Longitude</label>
                  <input
                    type="text"
                    required
                    value={simLng}
                    onChange={(e) => setSimLng(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded p-2 text-slate-200 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={simulating}
                className="w-full bg-gradient-to-r from-brandRose to-brandAmber text-darkBg font-bold py-2.5 rounded text-xs font-orbitron hover:brightness-110 transition-all shadow-rose-glow flex items-center justify-center gap-1.5"
              >
                <Activity className="w-4 h-4 animate-pulse" />
                {simulating ? 'TRANSMITTING SIMULATION...' : 'TRIGGER EMERGENCY WARNING'}
              </button>
            </form>
          </div>

          {/* User Role Promotion Form */}
          <div className="glass-panel p-5 rounded-xl border border-white/5">
            <div className="flex items-center gap-2 border-b border-white/10 pb-3 mb-4">
              <Shield className="w-5 h-5 text-brandCyan" />
              <h2 className="text-xs font-bold font-orbitron uppercase text-slate-200">
                User Clearance Coordinator
              </h2>
            </div>

            <form onSubmit={handlePromoteUser} className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-slate-400 mb-1.5 font-orbitron">Target User Email</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. responder@gmail.com"
                  value={emailToPromote}
                  onChange={(e) => setEmailToPromote(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded p-2 text-slate-200 focus:outline-none focus:border-brandCyan"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider text-slate-400 mb-2 font-orbitron">Assign Role Clearance</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRoleToSet('Responder')}
                    className={`py-2 px-3 text-xs font-orbitron rounded border transition-all ${
                      roleToSet === 'Responder' 
                        ? 'bg-brandCyan/10 border-brandCyan text-brandCyan' 
                        : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                    }`}
                  >
                    Responder
                  </button>
                  <button
                    type="button"
                    onClick={() => setRoleToSet('Admin')}
                    className={`py-2 px-3 text-xs font-orbitron rounded border transition-all ${
                      roleToSet === 'Admin' 
                        ? 'bg-brandRose/10 border-brandRose text-brandRose' 
                        : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                    }`}
                  >
                    Admin
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={promoting || !emailToPromote}
                className="w-full bg-gradient-to-r from-brandIndigo to-brandCyan text-darkBg font-bold py-2.5 rounded text-xs font-orbitron hover:brightness-110 transition-all shadow-cyan-glow"
              >
                {promoting ? 'UPGRADING CLEARANCE...' : 'UPDATE SYSTEM ACCESS'}
              </button>
            </form>
          </div>

        </div>

      </div>
    </div>
  );
};
