import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { Message } from '../types';
import { Bot, Send, User, Sparkles, CloudSun, BrainCircuit, Newspaper, Globe, Navigation, Users, ShieldAlert, Package, Trash2, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const agentDetails = [
  { id: 'weather', name: 'Weather Agent', icon: CloudSun, desc: 'Atmospheric alerts & hurricane forecasting', color: 'text-sky-400 border-sky-400/20 bg-sky-400/5', prompt: 'Is there a storm forecast for my coordinates today?' },
  { id: 'prediction', name: 'Prediction Agent', icon: BrainCircuit, desc: 'Risk probability assessments', color: 'text-purple-400 border-purple-400/20 bg-purple-400/5', prompt: 'Evaluate earthquake risk profiles near active faults.' },
  { id: 'news', name: 'News Agent', icon: Newspaper, desc: 'Aggregated & verified alert news logs', color: 'text-emerald-400 border-emerald-400/20 bg-emerald-400/5', prompt: 'Retrieve active news logs for nearby sectors.' },
  { id: 'satellite', name: 'Satellite Agent', icon: Globe, desc: 'Sensor anomaly & thermal hotspots', color: 'text-indigo-400 border-indigo-400/20 bg-indigo-400/5', prompt: 'What anomalies did Landsat-9 capture recently?' },
  { id: 'evacuation', name: 'Evacuation Agent', icon: Navigation, desc: 'Safe shelter routing directives', color: 'text-cyan-400 border-cyan-400/20 bg-cyan-400/5', prompt: 'What items belong in a survival Go-Bag checklist?' },
  { id: 'volunteer', name: 'Volunteer Agent', icon: Users, desc: 'Coordinator & deployment assigner', color: 'text-amber-400 border-amber-400/20 bg-amber-400/5', prompt: 'How do I deploy search & rescue shifts?' },
  { id: 'resource', name: 'Resource Agent', icon: Package, desc: 'Inventory capacities & stockpile levels', color: 'text-yellow-400 border-yellow-400/20 bg-yellow-400/5', prompt: 'Where is the nearest shelter with beds and water?' },
  { id: 'alert', name: 'Alert Agent', icon: ShieldAlert, desc: 'Common Alerting Protocol (CAP) drafts', color: 'text-rose-400 border-rose-400/20 bg-rose-400/5', prompt: 'Draft a critical Flash Flood warning CAP template.' }
];

export const ChatBot: React.FC = () => {
  const [selectedAgent, setSelectedAgent] = useState(agentDetails[0]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [demoBanner, setDemoBanner] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  useEffect(() => {
    // Scroll to bottom on new messages
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const fetchHistory = async () => {
    try {
      const res = await api.get('/chat/history');
      setMessages(res.data);
    } catch (err) {
      console.error('Failed to load chat history', err);
    }
  };

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    setLoading(true);
    setInputText('');

    const newMsg: Message = {
      sender: 'User',
      message: textToSend,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, newMsg]);

    try {
      // Build history context matching Gemini API expects
      const historyContext = messages.map(m => ({
        role: m.sender === 'User' ? ('user' as const) : ('model' as const),
        parts: m.message
      })).slice(-10); // Keep last 10 dialogues for prompt safety

      const res = await api.post('/chat', {
        message: textToSend,
        agentName: selectedAgent.id,
        history: historyContext
      });

      const responseText = res.data.response;
      setDemoBanner(res.data.isDemoMode);

      setMessages(prev => [...prev, {
        sender: 'AI',
        agentName: selectedAgent.name,
        message: responseText,
        timestamp: new Date().toISOString()
      }]);
    } catch (err) {
      console.error('Chat bot error', err);
      // Fallback
      setMessages(prev => [...prev, {
        sender: 'AI',
        agentName: selectedAgent.name,
        message: `[Demo Mode] Connecting with ${selectedAgent.name} failed. Telemetry indicates offline state. Mock: Advising on secure procedures for "${textToSend}".`,
        timestamp: new Date().toISOString()
      }]);
      setDemoBanner(true);
    } finally {
      setLoading(false);
    }
  };

  const clearChatLogs = () => {
    if (window.confirm('Delete local terminal conversation history?')) {
      setMessages([]);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-100px)] overflow-hidden">
      
      {/* Left Hand: 8 Multi-Agent Control Selection Console */}
      <div className="lg:w-1/3 flex flex-col gap-4 max-h-[30%] lg:max-h-full overflow-y-auto pr-1">
        <div className="glass-panel p-4 rounded-xl border border-white/5 bg-brandIndigo/5">
          <h2 className="text-xs font-bold font-orbitron uppercase text-brandIndigo tracking-widest mb-1">
            Multi-Agent Command Console
          </h2>
          <p className="text-[10px] text-slate-400">
            Route instructions to specialized neural nodes managing distinct emergency profiles.
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-1 gap-2 flex-1">
          {agentDetails.map((agent) => {
            const Icon = agent.icon;
            const isSelected = selectedAgent.id === agent.id;
            return (
              <button
                key={agent.id}
                onClick={() => setSelectedAgent(agent)}
                className={`text-left p-3 rounded-xl border transition-all flex items-center gap-3.5 ${
                  isSelected 
                    ? 'bg-gradient-to-r from-brandIndigo/20 to-brandCyan/20 border-brandCyan shadow-cyan-glow' 
                    : 'bg-white/5 border-white/5 hover:border-white/10'
                }`}
              >
                <div className={`p-2 rounded-lg ${agent.color}`}>
                  <Icon className="w-4.5 h-4.5" />
                </div>
                <div className="overflow-hidden">
                  <h3 className={`text-xs font-bold font-orbitron ${isSelected ? 'text-brandCyan' : 'text-slate-200'}`}>
                    {agent.name}
                  </h3>
                  <p className="text-[9px] text-slate-400 truncate hidden lg:block">{agent.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right Hand: AI Chat Interface panel */}
      <div className="flex-1 glass-panel rounded-xl border border-white/5 flex flex-col h-[70%] lg:h-full justify-between relative overflow-hidden">
        
        {/* Terminal Header */}
        <div className="p-4 border-b border-white/5 flex items-center justify-between bg-slate-900/60 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-brandCyan animate-pulse"></div>
            <h2 className="text-xs font-bold font-orbitron uppercase text-slate-300">
              Terminal Interface: <span className="text-brandCyan">{selectedAgent.name}</span>
            </h2>
          </div>

          <button onClick={clearChatLogs} className="text-slate-500 hover:text-brandRose transition-colors bg-transparent border-0">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Demo Mode alert bar if active */}
        {demoBanner && (
          <div className="bg-brandAmber/10 border-b border-brandAmber/20 py-1 px-4 text-[10px] text-center text-brandAmber font-orbitron uppercase tracking-widest flex items-center justify-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> Demo Mode active (Gemini simulation backup responding) <Sparkles className="w-3.5 h-3.5" />
          </div>
        )}

        {/* Messages Body */}
        <div ref={scrollRef} className="flex-1 p-5 overflow-y-auto space-y-4 max-h-[calc(100vh-280px)]">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center py-20 text-center space-y-4">
              <Bot className="w-12 h-12 text-brandCyan/40 animate-bounce" />
              <div>
                <h3 className="text-sm font-semibold font-orbitron text-slate-300">TERMINAL ESTABLISHED</h3>
                <p className="text-xs text-slate-500 max-w-xs mt-1">
                  Type an emergency query below or click a template recommendation to evaluate safety protocols.
                </p>
              </div>
            </div>
          ) : (
            messages.map((m, index) => {
              const isAi = m.sender === 'AI';
              return (
                <div key={index} className={`flex items-start gap-3.5 ${!isAi ? 'flex-row-reverse' : ''}`}>
                  {/* User/Bot Icon */}
                  <div className={`p-1.5 rounded-lg border text-xs flex items-center justify-center ${
                    isAi 
                      ? 'bg-brandIndigo/10 border-brandIndigo/20 text-brandIndigo' 
                      : 'bg-brandCyan/10 border-brandCyan/20 text-brandCyan'
                  }`}>
                    {isAi ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                  </div>

                  {/* Message Bubble */}
                  <div className="flex flex-col max-w-[75%] gap-1">
                    <span className={`text-[9px] uppercase font-orbitron text-slate-500 ${!isAi ? 'text-right' : ''}`}>
                      {isAi ? m.agentName || 'DisasterGuard AI' : 'USER TERMINAL'} • {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <div className={`p-3.5 rounded-xl border text-xs leading-relaxed ${
                      isAi 
                        ? 'bg-slate-900/80 border-white/5 text-slate-200 rounded-tl-none' 
                        : 'bg-brandCyan/10 border-brandCyan/20 text-brandCyan rounded-tr-none text-right'
                    }`}>
                      <p className="whitespace-pre-wrap">{m.message}</p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Suggested Queries Tray & Form input */}
        <div className="p-4 border-t border-white/5 bg-slate-900/40 backdrop-blur-md">
          {/* Quick Query suggestion */}
          <div className="flex items-center gap-2 mb-3 overflow-x-auto pb-1 text-[10px] whitespace-nowrap scrollbar-none">
            <span className="font-orbitron text-slate-500 uppercase">Suggested:</span>
            <button
              onClick={() => handleSend(selectedAgent.prompt)}
              className="py-1 px-2.5 rounded border border-white/5 bg-white/5 hover:border-brandCyan/50 hover:bg-brandCyan/5 text-slate-300 hover:text-brandCyan transition-all flex items-center gap-1 cursor-pointer"
            >
              {selectedAgent.prompt}
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); handleSend(inputText); }} className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg p-1.5 focus-within:border-brandCyan focus-within:ring-1 focus-within:ring-brandCyan transition-all">
            <input
              type="text"
              placeholder={`Send message to ${selectedAgent.name}...`}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="bg-transparent text-xs w-full focus:outline-none px-2 py-1.5 text-slate-200"
            />
            <button
              type="submit"
              disabled={loading || !inputText.trim()}
              className="p-2 bg-gradient-to-r from-brandIndigo to-brandCyan rounded-lg text-darkBg hover:brightness-110 transition-all cursor-pointer disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};
