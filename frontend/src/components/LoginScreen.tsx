import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, Mail, Lock, User as UserIcon, Activity, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

export const LoginScreen: React.FC = () => {
  const { login, register } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'Citizen' | 'Responder'>('Citizen');
  const [skills, setSkills] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        const skillsArray = skills
          .split(',')
          .map(s => s.trim())
          .filter(s => s.length > 0);
        await register(name, email, password, role, skillsArray);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Preset demo account login helper
  const handleDemoLogin = async (demoRole: 'Admin' | 'Responder' | 'Citizen') => {
    setError(null);
    setLoading(true);
    const credentials = {
      Admin: { email: 'admin@disasterguard.ai', pass: 'adminpassword123' },
      Responder: { email: 'responder@disasterguard.ai', pass: 'responderpassword123' },
      Citizen: { email: 'citizen@disasterguard.ai', pass: 'citizenpassword123' }
    };
    const { email: demoEmail, pass: demoPass } = credentials[demoRole];
    try {
      await login(demoEmail, demoPass);
    } catch (err: any) {
      setError(err.message || 'Demo login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden">
      {/* Background Neon Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brandIndigo/20 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-brandCyan/10 rounded-full blur-[100px] pointer-events-none"></div>

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md glass-panel p-8 rounded-2xl shadow-glass border border-white/10 text-slate-200 z-10"
      >
        <div className="flex flex-col items-center mb-6">
          <div className="w-16 h-16 rounded-xl bg-gradient-to-tr from-brandIndigo to-brandCyan flex items-center justify-center mb-3 shadow-cyan-glow">
            <Shield className="w-8 h-8 text-darkBg" />
          </div>
          <h1 className="text-2xl font-bold tracking-wider font-orbitron bg-gradient-to-r from-brandCyan to-brandIndigo bg-clip-text text-transparent">
            DISASTERGUARD AI
          </h1>
          <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest font-orbitron">
            Multi-Agent Threat Network
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-brandRose/10 border border-brandRose/30 text-brandRose text-sm rounded-lg text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1 font-orbitron">Full Name</label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  required
                  placeholder="Jane Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-brandCyan focus:ring-1 focus:ring-brandCyan transition-all"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1 font-orbitron">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
              <input
                type="email"
                required
                placeholder="citizen@disasterguard.ai"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-brandCyan focus:ring-1 focus:ring-brandCyan transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1 font-orbitron">Security Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-brandCyan focus:ring-1 focus:ring-brandCyan transition-all"
              />
            </div>
          </div>

          {!isLogin && (
            <>
              <div>
                <label className="block text-xs uppercase tracking-wider text-slate-400 mb-2 font-orbitron">Network Role</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole('Citizen')}
                    className={`py-2 px-3 text-xs font-orbitron rounded-lg border transition-all ${
                      role === 'Citizen' 
                        ? 'bg-brandCyan/10 border-brandCyan text-brandCyan shadow-cyan-glow' 
                        : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                    }`}
                  >
                    Citizen Responder
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('Responder')}
                    className={`py-2 px-3 text-xs font-orbitron rounded-lg border transition-all ${
                      role === 'Responder' 
                        ? 'bg-brandIndigo/10 border-brandIndigo text-brandIndigo' 
                        : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                    }`}
                  >
                    Agency Responder
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1 font-orbitron">Skills (Comma-separated)</label>
                <input
                  type="text"
                  placeholder="First Aid, CPR, Ham Radio, Search & Rescue"
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg py-2 px-4 text-sm focus:outline-none focus:border-brandCyan focus:ring-1 focus:ring-brandCyan transition-all"
                />
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-gradient-to-r from-brandIndigo to-brandCyan hover:from-brandCyan hover:to-brandIndigo text-darkBg font-bold py-2.5 rounded-lg text-sm font-orbitron transition-all duration-300 shadow-cyan-glow flex items-center justify-center gap-2"
          >
            {loading ? (
              <Activity className="w-5 h-5 animate-spin" />
            ) : (
              <>
                {isLogin ? 'INITIALIZE INTERFACE' : 'CREATE CORE PROFILE'}
              </>
            )}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError(null);
            }}
            className="text-xs text-brandCyan hover:underline bg-transparent"
          >
            {isLogin ? "Need a responder account? Register here" : "Already registered? Access terminal here"}
          </button>
        </div>

        {/* Demo Accounts Panel */}
        <div className="mt-6 pt-5 border-t border-white/5">
          <p className="text-center text-[10px] text-slate-500 uppercase tracking-widest font-orbitron mb-3 flex items-center justify-center gap-1">
            <Sparkles className="w-3 h-3 text-brandCyan" /> Quick Demo Quick Access Accounts <Sparkles className="w-3 h-3 text-brandCyan" />
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => handleDemoLogin('Admin')}
              className="py-1 px-2 text-[10px] font-orbitron rounded bg-white/5 border border-brandRose/20 text-brandRose hover:bg-brandRose/10 transition-all"
            >
              ADMIN
            </button>
            <button
              onClick={() => handleDemoLogin('Responder')}
              className="py-1 px-2 text-[10px] font-orbitron rounded bg-white/5 border border-brandAmber/20 text-brandAmber hover:bg-brandAmber/10 transition-all"
            >
              RESPONDER
            </button>
            <button
              onClick={() => handleDemoLogin('Citizen')}
              className="py-1 px-2 text-[10px] font-orbitron rounded bg-white/5 border border-brandEmerald/20 text-brandEmerald hover:bg-brandEmerald/10 transition-all"
            >
              CITIZEN
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
