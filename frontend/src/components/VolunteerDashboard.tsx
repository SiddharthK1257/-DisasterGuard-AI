import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Volunteer, Resource } from '../types';
import { Users, Shield, Phone, Activity, Heart, Package, FileCheck, Landmark, Check } from 'lucide-react';

export const VolunteerDashboard: React.FC = () => {
  const { user } = useAuth();
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [myVolStatus, setMyVolStatus] = useState<Volunteer | null>(null);
  
  // Signup state
  const [phone, setPhone] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [registered, setRegistered] = useState(false);
  
  // Task assignment state (for responders)
  const [editingVol, setEditingVol] = useState<string | null>(null);
  const [taskText, setTaskText] = useState('');
  const [taskStatus, setTaskStatus] = useState<'Available' | 'Deployed' | 'Unavailable'>('Available');
  const [updating, setUpdating] = useState(false);

  const skillsList = [
    'First Aid / CPR',
    'Search and Rescue',
    'Food Distribution',
    'Shelter Setup',
    'Ham Radio Operation',
    'Heavy Machinery',
    'Crisis Counseling'
  ];

  useEffect(() => {
    fetchPortalData();
  }, []);

  const fetchPortalData = async () => {
    try {
      // 1. Get resources stockpile levels
      const resRes = await api.get('/resources');
      setResources(resRes.data);

      // 2. Fetch my status
      try {
        const myRes = await api.get('/volunteer/my-status');
        setMyVolStatus(myRes.data);
        setRegistered(true);
      } catch (err) {
        setRegistered(false);
      }

      // 3. Responders/Admins fetch all volunteers
      if (user?.role === 'Responder' || user?.role === 'Admin') {
        const volRes = await api.get('/volunteer');
        setVolunteers(volRes.data);
      }
    } catch (err) {
      console.error('Failed to load volunteer logs', err);
    }
  };

  const handleSkillToggle = (skill: string) => {
    if (selectedSkills.includes(skill)) {
      setSelectedSkills(prev => prev.filter(s => s !== skill));
    } else {
      setSelectedSkills(prev => [...prev, skill]);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedSkills.length === 0) {
      alert('Select at least one skill capability.');
      return;
    }
    
    try {
      const res = await api.post('/volunteer/register', {
        skills: selectedSkills,
        contactPhone: phone
      });
      setMyVolStatus(res.data);
      setRegistered(true);
      alert('Volunteer credentials saved. Standing by for incident assignments.');
      fetchPortalData();
    } catch (err) {
      console.error('Registration failed', err);
      alert('Error registering volunteer profile. Active in Demo Mode.');
    }
  };

  const handleAssignTask = async (volId: string) => {
    setUpdating(true);
    try {
      await api.put('/volunteer/update-task', {
        volunteerId: volId,
        currentTask: taskText,
        status: taskStatus
      });
      alert('Volunteer task vectors updated.');
      setEditingVol(null);
      setTaskText('');
      fetchPortalData();
    } catch (err) {
      console.error('Task assignment failed', err);
      alert('Failed to transmit deployment details.');
    } finally {
      setUpdating(false);
    }
  };

  const isAgencyUser = user?.role === 'Responder' || user?.role === 'Admin';

  return (
    <div className="space-y-6">
      
      {/* Dashboard Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-6 rounded-xl border border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-brandEmerald/15 border border-brandEmerald/30 flex items-center justify-center text-brandEmerald">
            <Users className="w-5.5 h-5.5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-wider font-orbitron bg-gradient-to-r from-brandEmerald to-brandCyan bg-clip-text text-transparent">
              VOLUNTEER & RESOURCE MATRIX
            </h1>
            <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest font-orbitron">
              Community Dispatch & Inventory Logs
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Citizen registration or personal volunteer profile */}
        <div className="lg:col-span-4 space-y-6">
          {!isAgencyUser ? (
            /* Citizen Profile view */
            registered ? (
              <div className="glass-panel p-5 rounded-xl border border-white/5 space-y-4">
                <div className="flex items-center gap-2 border-b border-white/10 pb-3 mb-2">
                  <Heart className="w-5 h-5 text-brandEmerald" />
                  <h2 className="text-xs font-bold font-orbitron uppercase text-slate-200">
                    Your Volunteer Dispatch Badge
                  </h2>
                </div>

                <div className="p-4 bg-brandEmerald/5 border border-brandEmerald/10 rounded-lg space-y-2">
                  <div className="flex justify-between items-center text-xs font-orbitron">
                    <span className="text-slate-400">ASSIGNMENT STATUS:</span>
                    <span className="font-bold text-brandEmerald">{myVolStatus?.status || 'Active'}</span>
                  </div>
                  <div className="text-xs flex flex-col gap-0.5">
                    <span className="text-[10px] text-slate-500 font-orbitron">DEPLOYED TASK DIRECTIVE:</span>
                    <p className="text-slate-200 font-sans italic leading-relaxed text-[11px]">
                      "{myVolStatus?.currentTask || 'Registered. Under standby evaluation. Keep notifications on.'}"
                    </p>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="block text-[10px] uppercase text-slate-400 font-orbitron">Registered Skills</span>
                  <div className="flex flex-wrap gap-1">
                    {myVolStatus?.skills?.map((sk, index) => (
                      <span key={index} className="text-[9px] font-orbitron px-2 py-0.5 rounded bg-white/5 border border-white/5 text-brandCyan">
                        {sk}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="text-[10px] text-slate-500 font-sans leading-relaxed pt-2 border-t border-white/5">
                  📞 Contact Registry: {myVolStatus?.contactPhone}
                  <br />
                  Joined Grid: {myVolStatus?.joinedAt ? new Date(myVolStatus.joinedAt).toLocaleDateString() : new Date().toLocaleDateString()}
                </div>
              </div>
            ) : (
              /* Signup Form */
              <div className="glass-panel p-5 rounded-xl border border-white/5">
                <div className="flex items-center gap-2 border-b border-white/10 pb-3 mb-4">
                  <Heart className="w-5 h-5 text-brandCyan animate-pulse" />
                  <h2 className="text-xs font-bold font-orbitron uppercase text-slate-200">
                    Sign Up to Volunteer
                  </h2>
                </div>

                <form onSubmit={handleRegister} className="space-y-4">
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-slate-400 mb-1.5 font-orbitron">Registry Contact Phone</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                      <input
                        type="tel"
                        required
                        placeholder="+1 555-0199"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded py-2 pl-10 pr-4 text-xs text-slate-200 focus:outline-none focus:border-brandCyan"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-slate-400 mb-2 font-orbitron">Select Skills</label>
                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                      {skillsList.map((skill) => {
                        const active = selectedSkills.includes(skill);
                        return (
                          <button
                            key={skill}
                            type="button"
                            onClick={() => handleSkillToggle(skill)}
                            className={`w-full flex items-center justify-between text-left px-3 py-1.5 rounded border text-[11px] font-sans transition-all ${
                              active 
                                ? 'bg-brandCyan/10 border-brandCyan text-brandCyan' 
                                : 'bg-white/5 border-white/5 hover:border-white/10 text-slate-400'
                            }`}
                          >
                            {skill}
                            {active && <Check className="w-3.5 h-3.5" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-brandEmerald to-brandCyan text-darkBg font-bold py-2.5 rounded text-xs font-orbitron hover:brightness-110 transition-all shadow-emerald-glow"
                  >
                    SUBMIT VOLUNTEER REGISTRY
                  </button>
                </form>
              </div>
            )
          ) : (
            /* Responder Quick Info Box */
            <div className="glass-panel p-5 rounded-xl border border-white/5 space-y-3">
              <div className="flex items-center gap-2 border-b border-white/10 pb-3 mb-2">
                <Shield className="w-5 h-5 text-brandAmber" />
                <h2 className="text-xs font-bold font-orbitron uppercase text-slate-200">
                  Incident Command Desk
                </h2>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                You are authenticated as an emergency responder officer. You have clearance to assign volunteer tasks, redirect medical bedding reserves, and deploy supplies.
              </p>
            </div>
          )}

          {/* Stockpile Inventory Levels */}
          <div className="glass-panel p-5 rounded-xl border border-white/5 space-y-3">
            <h2 className="text-xs font-bold font-orbitron uppercase text-slate-300 border-b border-white/5 pb-2 mb-2 flex items-center gap-2">
              <Package className="w-4 h-4 text-brandCyan" /> Stockpile Inventory
            </h2>
            <div className="space-y-2.5 max-h-60 overflow-y-auto">
              {resources.filter(r => ['Food Supply', 'Water Supply', 'Medical Supplies'].includes(r.type)).map((res) => {
                const stockPercent = Math.round((res.capacity.available / res.capacity.total) * 100);
                
                return (
                  <div key={res._id || res.id} className="bg-white/5 border border-white/5 rounded p-2 text-xs flex flex-col gap-1.5">
                    <div className="flex justify-between items-center font-semibold">
                      <span className="truncate pr-1">{res.name}</span>
                      <span className="text-[10px] text-brandCyan font-orbitron uppercase">
                        {res.capacity.available} {res.capacity.unit} left
                      </span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-1 overflow-hidden">
                      <div className="h-full bg-brandCyan" style={{ width: `${stockPercent}%` }}></div>
                    </div>
                    <span className="text-[9px] text-slate-500 font-sans italic">
                      Updated: {new Date(res.lastUpdated).toLocaleTimeString()}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Side: Volunteer coordination dispatcher table (Admin/Responder only) */}
        <div className="lg:col-span-8">
          {isAgencyUser ? (
            <div className="glass-panel p-5 rounded-xl border border-white/5 h-full flex flex-col">
              <div className="flex items-center gap-2 border-b border-white/10 pb-3 mb-4">
                <FileCheck className="w-5 h-5 text-brandCyan" />
                <h2 className="text-xs font-bold font-orbitron uppercase text-slate-200">
                  Active Responder Volunteer Roster
                </h2>
              </div>

              {volunteers.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-xs text-slate-500 py-12">
                  No volunteers currently registered on the threat grid.
                </div>
              ) : (
                <div className="overflow-x-auto flex-1">
                  <table className="w-full text-xs text-left border-collapse text-slate-300">
                    <thead>
                      <tr className="border-b border-white/10 text-slate-400 font-orbitron text-[10px]">
                        <th className="py-2.5 px-3">Volunteer Name</th>
                        <th className="py-2.5 px-3">Skills</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3">Active Task Assignment</th>
                        <th className="py-2.5 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {volunteers.map((vol) => (
                        <tr key={vol._id || vol.id} className="hover:bg-white/5">
                          <td className="py-3 px-3 font-semibold text-slate-200">
                            {vol.user?.name || 'Jane Doe'}
                            <span className="block text-[9px] font-orbitron text-slate-500">{vol.contactPhone}</span>
                          </td>
                          <td className="py-3 px-3">
                            <div className="flex flex-wrap gap-1 max-w-[200px]">
                              {vol.skills.map((s, idx) => (
                                <span key={idx} className="text-[9px] px-1 bg-white/5 border border-white/5 rounded text-slate-400">
                                  {s}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <span className={`inline-block text-[9px] px-1.5 py-0.5 rounded font-orbitron border ${
                              vol.status === 'Deployed' ? 'bg-brandRose/10 border-brandRose/20 text-brandRose' :
                              vol.status === 'Available' ? 'bg-brandEmerald/10 border-brandEmerald/20 text-brandEmerald' :
                              'bg-slate-800 border-slate-700 text-slate-400'
                            }`}>
                              {vol.status}
                            </span>
                          </td>
                          <td className="py-3 px-3 italic text-slate-400 max-w-[150px] truncate">
                            {editingVol === vol.id || editingVol === vol._id ? (
                              <input
                                type="text"
                                value={taskText}
                                onChange={(e) => setTaskText(e.target.value)}
                                className="bg-slate-900 border border-white/10 rounded px-1.5 py-1 text-xs w-full text-slate-200"
                              />
                            ) : (
                              vol.currentTask || 'Unassigned'
                            )}
                          </td>
                          <td className="py-3 px-3 text-right">
                            {editingVol === vol.id || editingVol === vol._id ? (
                              <div className="flex items-center justify-end gap-1.5">
                                <select
                                  value={taskStatus}
                                  onChange={(e: any) => setTaskStatus(e.target.value)}
                                  className="bg-slate-900 border border-white/10 rounded px-1 py-1 text-[10px]"
                                >
                                  <option value="Available">Available</option>
                                  <option value="Deployed">Deployed</option>
                                  <option value="Unavailable">Unavailable</option>
                                </select>
                                <button
                                  onClick={() => handleAssignTask(vol._id || vol.id || '')}
                                  disabled={updating}
                                  className="px-2 py-1 bg-brandEmerald text-darkBg font-bold text-[9px] rounded font-orbitron"
                                >
                                  SAVE
                                </button>
                                <button
                                  onClick={() => setEditingVol(null)}
                                  className="px-2 py-1 bg-slate-800 text-slate-400 text-[9px] rounded font-orbitron"
                                >
                                  &times;
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => {
                                  setEditingVol(vol._id || vol.id || null);
                                  setTaskText(vol.currentTask || '');
                                  setTaskStatus(vol.status);
                                }}
                                className="px-2 py-1 bg-brandCyan/10 border border-brandCyan text-brandCyan font-semibold text-[9px] rounded font-orbitron hover:bg-brandCyan hover:text-darkBg transition-all"
                              >
                                DISPATCH
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            /* General Volunteer Info Desk for Citizens */
            <div className="glass-panel p-5 rounded-xl border border-white/5 h-full space-y-4">
              <div className="flex items-center gap-2 border-b border-white/10 pb-3 mb-2">
                <Landmark className="w-5 h-5 text-brandCyan" />
                <h2 className="text-xs font-bold font-orbitron uppercase text-slate-200">
                  Grid Volunteer Resources Board
                </h2>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                Emergency shelters, food supply lines, and hospital coordination systems run heavily on volunteer support during active alert crises.
              </p>
              
              <div className="space-y-3 pt-2 text-xs">
                <div className="flex gap-3 items-start border-l border-brandCyan pl-3">
                  <div className="font-orbitron font-semibold text-slate-200">Medical Triage Support</div>
                  <p className="text-slate-400 text-[11px] leading-normal">
                    Hospitals require certified volunteers to support non-critical patients and logistics.
                  </p>
                </div>
                
                <div className="flex gap-3 items-start border-l border-brandCyan pl-3">
                  <div className="font-orbitron font-semibold text-slate-200">Shelter Staff shifts</div>
                  <p className="text-slate-400 text-[11px] leading-normal">
                    Establish bedding setups, register arriving families, and handle food distribution operations.
                  </p>
                </div>

                <div className="flex gap-3 items-start border-l border-brandCyan pl-3">
                  <div className="font-orbitron font-semibold text-slate-200">Debris & Road logistics</div>
                  <p className="text-slate-400 text-[11px] leading-normal">
                    Volunteer clearing groups help responders resolve road blockages after flash storms.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
