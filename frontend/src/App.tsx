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
import { Activity, ShieldAlert } from 'lucide-react';

const MainLayout: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('dashboard');

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
    <div className="flex min-h-screen bg-darkBg overflow-hidden">
      {/* Sidebar Navigation */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Primary Dashboard Content Frame */}
      <main className="flex-1 min-h-screen ml-64 p-6 relative overflow-y-auto">
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
