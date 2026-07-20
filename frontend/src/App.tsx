import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { Sidebar } from './components/Sidebar';
import { LoginScreen } from './components/LoginScreen';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { MapView } from './components/MapView';
import { EvacuationPlanner } from './components/EvacuationPlanner';
import { ChatBot } from './components/ChatBot';
import { VolunteerDashboard } from './components/VolunteerDashboard';
import { AdminPanel } from './components/AdminPanel';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, ShieldAlert, Menu, Shield } from 'lucide-react';

const MainLayout: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-darkBg text-brandCyan">
        <Activity className="w-12 h-12 animate-spin mb-4" />
        <span className="text-sm font-orbitron uppercase tracking-widest animate-pulse">Initializing Threat Grid...</span>
      </div>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  // Content tab switching router
  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <AnalyticsDashboard />;
      case 'map':
        return <MapView />;
      case 'evacuation':
        return <EvacuationPlanner />;
      case 'chatbot':
        return <ChatBot />;
      case 'volunteer':
        return <VolunteerDashboard />;
      case 'admin':
        return <AdminPanel />;
      default:
        return <AnalyticsDashboard />;
    }
  };

  return (
    <div className="flex min-h-screen bg-darkBg overflow-hidden text-slate-100">
      {/* Mobile Top Navigation Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-slate-900/80 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-4 z-20">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 -ml-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 focus:outline-none"
            aria-label="Open Sidebar"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brandIndigo to-brandCyan flex items-center justify-center shadow-cyan-glow">
              <Shield className="w-4.5 h-4.5 text-darkBg" />
            </div>
            <h1 className="text-xs font-bold tracking-wider font-orbitron bg-gradient-to-r from-brandCyan to-brandIndigo bg-clip-text text-transparent">
              DISASTERGUARD
            </h1>
          </div>
        </div>
        <div className="w-2.5 h-2.5 rounded-full bg-brandEmerald animate-pulse"></div>
      </header>

      {/* Mobile Sidebar Backdrop Drawer Overlay */}
      {isSidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-20 transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={(tab) => {
          setActiveTab(tab);
          setIsSidebarOpen(false);
        }} 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Primary Dashboard Content Frame */}
      <main className="flex-1 min-h-screen lg:ml-64 p-4 md:p-6 pt-20 lg:pt-6 relative overflow-y-auto w-full max-w-full">
        {/* Decorative Grid Mesh */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-[0.03] pointer-events-none"></div>
        
        {/* Animated Page Transitions wrapper */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.35, ease: 'easeInOut' }}
            className="relative z-10"
          >
            {renderTabContent()}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <MainLayout />
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
