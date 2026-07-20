import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { 
  LayoutDashboard, 
  Map, 
  Compass, 
  Bot, 
  Users, 
  Settings, 
  LogOut,
  Shield, 
  Wifi, 
  WifiOff 
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const { user, logout } = useAuth();
  const { isConnected } = useSocket();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['Citizen', 'Responder', 'Admin'] },
    { id: 'map', label: 'Disaster Map', icon: Map, roles: ['Citizen', 'Responder', 'Admin'] },
    { id: 'evacuation', label: 'Evac Routes', icon: Compass, roles: ['Citizen', 'Responder', 'Admin'] },
    { id: 'chatbot', label: 'AI Chatbot', icon: Bot, roles: ['Citizen', 'Responder', 'Admin'] },
    { id: 'volunteer', label: 'Volunteer Portal', icon: Users, roles: ['Citizen', 'Responder', 'Admin'] },
    { id: 'admin', label: 'Admin Terminal', icon: Settings, roles: ['Admin'] }
  ];

  const visibleMenuItems = menuItems.filter(item => user && item.roles.includes(user.role));

  return (
    <aside className="w-64 glass-panel border-r border-white/5 flex flex-col h-screen fixed left-0 top-0 z-20 text-slate-300">
      {/* Brand Header */}
      <div className="p-6 border-b border-white/5 flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-brandIndigo to-brandCyan flex items-center justify-center shadow-cyan-glow">
          <Shield className="w-5 h-5 text-darkBg" />
        </div>
        <div>
          <h1 className="text-sm font-bold tracking-wider font-orbitron bg-gradient-to-r from-brandCyan to-brandIndigo bg-clip-text text-transparent">
            DISASTERGUARD
          </h1>
          <span className="text-[9px] uppercase tracking-widest text-slate-500 font-orbitron">
            Security Core
          </span>
        </div>
      </div>

      {/* User Session card */}
      <div className="p-4 mx-4 my-4 rounded-xl bg-white/5 border border-white/5 flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-brandCyan font-orbitron">
            {user?.name?.slice(0, 2).toUpperCase() || 'DG'}
          </div>
          <div className="overflow-hidden">
            <h2 className="text-xs font-semibold truncate">{user?.name || 'Citizen User'}</h2>
            <span className={`inline-block text-[9px] px-1.5 py-0.5 rounded font-orbitron mt-0.5 ${
              user?.role === 'Admin' ? 'bg-brandRose/20 text-brandRose' :
              user?.role === 'Responder' ? 'bg-brandAmber/20 text-brandAmber' :
              'bg-brandEmerald/20 text-brandEmerald'
            }`}>
              {user?.role || 'Citizen'}
            </span>
          </div>
        </div>

        {/* Network Connection Status */}
        <div className="flex items-center gap-1.5 mt-1 pt-2 border-t border-white/5 text-[9px] font-orbitron uppercase text-slate-400">
          {isConnected ? (
            <>
              <Wifi className="w-3.5 h-3.5 text-brandEmerald animate-pulse" />
              <span className="text-brandEmerald">Grid Online (Demo Mode)</span>
            </>
          ) : (
            <>
              <WifiOff className="w-3.5 h-3.5 text-brandRose" />
              <span className="text-brandRose">Grid Offline</span>
            </>
          )}
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
        {visibleMenuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-lg text-sm transition-all duration-200 font-orbitron tracking-wider ${
                isActive 
                  ? 'bg-gradient-to-r from-brandIndigo/20 to-brandCyan/20 border-l-2 border-brandCyan text-brandCyan' 
                  : 'hover:bg-white/5 hover:text-white text-slate-400'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-brandCyan' : ''}`} />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Logout Footer */}
      <div className="p-4 border-t border-white/5">
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-white/10 hover:border-brandRose/50 hover:bg-brandRose/5 text-slate-400 hover:text-brandRose text-xs font-orbitron transition-all duration-300"
        >
          <LogOut className="w-3.5 h-3.5" />
          TERMINATE CORE SESSION
        </button>
      </div>
    </aside>
  );
};
