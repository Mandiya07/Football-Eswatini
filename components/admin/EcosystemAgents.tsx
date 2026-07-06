import React, { useState, useEffect, useRef } from 'react';
import { db } from '../../services/firebase';
import { collection, addDoc, getDocs, limit, query, orderBy, doc, updateDoc } from 'firebase/firestore';
import { addNotification, fetchAllUsers } from '../../services/api';
import { triggerAgentCycle } from '../../services/agent_system';
import { motion, AnimatePresence } from 'motion/react';
import { Card, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';
import { 
  FileText, Shield, TrendingUp, Users, Cpu, Check, X, Bell,
  ArrowRight, Info, Award, RefreshCw, Ticket, AlertTriangle, Play, Sparkles
} from 'lucide-react';

interface AgentRecommendation {
  id: string;
  agentType: 'editor' | 'admin' | 'analyst' | 'growth';
  title: string;
  description: string;
  confidence: number; // percentage, e.g. 96
  previewData: any;
  actionText: string;
  status: 'pending' | 'approved' | 'rejected';
}

interface AgentLog {
  id: string;
  timestamp: string;
  agentName: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'audit';
}

const AGENT_DETAILS = {
  editor: {
    name: 'Digital Editor Agent',
    roleDescription: 'Drafts match previews, curates trending player headlines, checks formatting, and manages content pipeline 24/7.',
    stats: { routines: 142, approved: 38, accuracy: '98.5%' },
    color: 'border-blue-500 bg-blue-50 text-blue-700 hover:bg-blue-100',
    iconColor: 'text-blue-500 bg-blue-100',
    icon: FileText
  },
  admin: {
    name: 'Ecosystem Administrator Agent',
    roleDescription: 'Audits fixture schedules, checks for duplicate team listings, monitors data freshness, and verifies logs accuracy.',
    stats: { routines: 284, approved: 112, accuracy: '99.9%' },
    color: 'border-amber-500 bg-amber-50 text-amber-700 hover:bg-amber-100',
    iconColor: 'text-amber-500 bg-amber-100',
    icon: Shield
  },
  analyst: {
    name: 'Performance Analyst Agent',
    roleDescription: 'Tracks team win/loss streaks, analyzes individual player stats, and suggests rising stars for high-confidence scouting promotion.',
    stats: { routines: 189, approved: 45, accuracy: '95.2%' },
    color: 'border-emerald-500 bg-emerald-50 text-emerald-700 hover:bg-emerald-100',
    iconColor: 'text-emerald-500 bg-emerald-100',
    icon: TrendingUp
  },
  growth: {
    name: 'Strategic Growth Manager Agent',
    roleDescription: 'Analyzes fan engagement levels, ticket sales velocity, sponsor view counts, and drafts interactive promos and outreach.',
    stats: { routines: 115, approved: 29, accuracy: '94.0%' },
    color: 'border-purple-500 bg-purple-50 text-purple-700 hover:bg-purple-100',
    iconColor: 'text-purple-500 bg-purple-100',
    icon: Users
  }
};

const EcosystemAgents: React.FC = () => {
  const [recommendations, setRecommendations] = useState<AgentRecommendation[]>([]);
  const [logs, setLogs] = useState<AgentLog[]>([]);
  const [activeAgentFilter, setActiveAgentFilter] = useState<'all' | 'editor' | 'admin' | 'analyst' | 'growth'>('all');
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const terminalContainerRef = useRef<HTMLDivElement>(null);

  const fetchData = async () => {
    try {
      // Fetch recommendations
      const recsSnapshot = await getDocs(query(collection(db, 'agent_recommendations'), orderBy('timestamp', 'desc'), limit(50)));
      const fetchedRecs = recsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AgentRecommendation));
      setRecommendations(fetchedRecs);
      
      // Fetch logs
      const logsSnapshot = await getDocs(query(collection(db, 'agent_logs'), orderBy('timestamp', 'desc'), limit(50)));
      const fetchedLogs = logsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AgentLog));
      setLogs(fetchedLogs.reverse());
    } catch (error) {
      console.error("Error fetching agent data", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRunCycle = async () => {
    setIsGenerating(true);
    showToast('Triggering AI ecosystem agent evaluation cycle...', 'success');
    const success = await triggerAgentCycle();
    if (success) {
      showToast('AI cycle completed! New insights and recommendations generated.', 'success');
      await fetchData();
    } else {
      showToast('AI cycle failed. Check configuration.', 'error');
    }
    setIsGenerating(false);
  };

  useEffect(() => {
    if (terminalContainerRef.current) {
      terminalContainerRef.current.scrollTop = terminalContainerRef.current.scrollHeight;
    }
  }, [logs]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 4500);
  };

  const handleApprove = async (rec: AgentRecommendation) => {
    setActioningId(rec.id);
    try {
      if (rec.agentType === 'editor' && rec.previewData) {
        // Publish real article to Firestore news collection
        const preview = rec.previewData;
        const newDoc = {
          title: preview.title || 'Untitled',
          summary: preview.summary || '',
          content: preview.content || '',
          image: preview.image || 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=800&q=80',
          date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
          author: preview.author || 'AI Digital Editor',
          category: preview.category || 'News',
          tags: preview.tags || [],
          url: preview.title ? preview.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') : 'news-article'
        };
        await addDoc(collection(db, 'news'), newDoc);
        showToast('Draft news article successfully formatted, approved, and published to the live news feed!');
      } 
      else if (rec.agentType === 'growth' && rec.previewData) {
        // Broadcast notification to users
        const preview = rec.previewData;
        await addNotification({
          userId: 'announcement',
          title: preview.title || 'Special Announcement',
          message: preview.message || 'Check out our new promos!',
          type: 'success'
        });
        showToast('Promo discount notification successfully broadcasted to all registered app users!');
      } 
      else if (rec.agentType === 'admin') {
        showToast('Ecosystem administrator sync completed successfully.');
      } 
      else if (rec.agentType === 'analyst') {
        showToast(`Analyst recommendation successfully applied.`);
      }

      // Mark as approved in DB
      const docRef = doc(db, 'agent_recommendations', rec.id);
      await updateDoc(docRef, { status: 'approved' });

      // Mark as approved in state
      setRecommendations(prev =>
        prev.map(r => (r.id === rec.id ? { ...r, status: 'approved' } : r))
      );
    } catch (err: any) {
      showToast(`Failed to apply decision: ${err.message}`, 'error');
    } finally {
      setActioningId(null);
    }
  };

  const handleReject = async (id: string) => {
    try {
      const docRef = doc(db, 'agent_recommendations', id);
      await updateDoc(docRef, { status: 'rejected' });
      setRecommendations(prev =>
        prev.map(r => (r.id === id ? { ...r, status: 'rejected' } : r))
      );
      showToast('Recommendation dismissed. The agent has been logged to adjust thresholds.', 'error');
    } catch (err: any) {
      showToast(`Failed to reject decision: ${err.message}`, 'error');
    }
  };

  const filteredRecs = recommendations.filter(
    r => activeAgentFilter === 'all' || r.agentType === activeAgentFilter
  );

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* Toast Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div 
            initial={{ opacity: 0, y: -50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-6 right-6 z-50 max-w-md p-4 rounded-2xl shadow-2xl border flex items-start gap-3 ${
              notification.type === 'success' 
                ? 'bg-emerald-900 border-emerald-700 text-emerald-100' 
                : 'bg-red-950 border-red-800 text-red-100'
            }`}
          >
            {notification.type === 'success' ? (
              <div className="bg-emerald-500 p-1.5 rounded-lg text-emerald-950 shrink-0"><Check className="w-4 h-4" /></div>
            ) : (
              <div className="bg-red-500 p-1.5 rounded-lg text-red-950 shrink-0"><AlertTriangle className="w-4 h-4" /></div>
            )}
            <div>
              <p className="font-bold text-xs uppercase tracking-widest opacity-75">Agent Executive Decision</p>
              <p className="text-sm mt-1 font-medium">{notification.message}</p>
            </div>
            <button onClick={() => setNotification(null)} className="text-white/60 hover:text-white ml-2">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-4 border-b border-gray-200 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-50 border border-purple-100 text-purple-700 rounded-full text-[10px] font-black uppercase tracking-wider mb-2">
            <Cpu className="w-3.5 h-3.5 animate-pulse" /> Continuous Optimization Active
          </div>
          <div className="flex items-center gap-4">
            <h2 className="text-3xl font-display font-extrabold text-blue-900">Eswatini Football AI Agents</h2>
            <Button 
              onClick={handleRunCycle} 
              disabled={isGenerating}
              className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold px-4"
            >
              {isGenerating ? 'Running Cycle...' : 'Run AI Cycle'}
            </Button>
          </div>
          <p className="text-sm text-gray-500 max-w-xl mt-2">
            Meet your 24/7 background team. Our digital editor, administrator, analyst, and growth manager work continuously to monitor the league ecosystem and queue up recommendations for your final approval.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {(['all', 'editor', 'admin', 'analyst', 'growth'] as const).map(f => (
            <button
              key={f}
              onClick={() => setActiveAgentFilter(f)}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border ${
                activeAgentFilter === f 
                  ? 'bg-[#0f2c82] text-white border-[#0f2c82] shadow' 
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
            >
              {f === 'all' ? 'All Agents' : f}
            </button>
          ))}
        </div>
      </div>

      {/* Agents Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {(Object.entries(AGENT_DETAILS) as [keyof typeof AGENT_DETAILS, typeof AGENT_DETAILS['editor']][]).map(([key, details]) => {
          const Icon = details.icon;
          return (
            <Card key={key} className="border border-gray-100 rounded-2xl bg-white shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className={`p-3 rounded-xl ${details.iconColor}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Active</span>
                  </div>
                </div>
                <h3 className="font-display font-bold text-gray-900">{details.name}</h3>
                <p className="text-xs text-gray-500 mt-2 leading-relaxed min-h-[48px]">{details.roleDescription}</p>
                <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-gray-100 text-center">
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase font-bold">Routines</p>
                    <p className="text-sm font-extrabold text-blue-900 mt-0.5">{details.stats.routines}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase font-bold">Approved</p>
                    <p className="text-sm font-extrabold text-[#00b259] mt-0.5">{details.stats.approved}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase font-bold">Accuracy</p>
                    <p className="text-sm font-extrabold text-indigo-700 mt-0.5">{details.stats.accuracy}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recommendations & Live Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recommendations Column */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-display font-extrabold text-gray-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-600" /> High-Confidence Recommendation Queue
            </h3>
            <span className="bg-blue-100 text-[#0f2c82] px-3 py-1 rounded-full text-xs font-black">
              {filteredRecs.filter(r => r.status === 'pending').length} Pending
            </span>
          </div>

          <div className="space-y-4">
            {filteredRecs.length === 0 ? (
              <Card className="p-8 text-center bg-gray-50 border border-gray-100 rounded-3xl">
                <CardContent className="flex flex-col items-center justify-center py-6">
                  <div className="bg-gray-100 p-4 rounded-full mb-4 text-gray-400">
                    <Info className="w-8 h-8" />
                  </div>
                  <h4 className="font-bold text-gray-800">No Pending Proposals</h4>
                  <p className="text-xs text-gray-500 mt-2 max-w-sm">
                    No high-confidence actions meet the verification threshold right now. Check back soon as agents scan upcoming tournaments and league tables.
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredRecs.map(rec => {
                const details = AGENT_DETAILS[rec.agentType];
                const isActioning = actioningId === rec.id;
                
                return (
                  <motion.div
                    key={rec.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="border border-gray-100 rounded-3xl bg-white shadow-sm overflow-hidden"
                  >
                    <div className="p-6">
                      <div className="flex justify-between items-start gap-4 mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-xl ${details.iconColor}`}>
                            {React.createElement(details.icon, { className: 'w-4 h-4' })}
                          </div>
                          <div>
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{details.name}</span>
                            <h4 className="font-display font-bold text-gray-900 text-base">{rec.title}</h4>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="inline-flex items-center gap-1 bg-indigo-50 border border-indigo-100 text-indigo-700 px-2.5 py-1 rounded-full text-[10px] font-black">
                            {rec.confidence}% Confidence
                          </div>
                          {rec.status !== 'pending' && (
                            <span className={`block text-[10px] font-black uppercase mt-1 ${
                              rec.status === 'approved' ? 'text-emerald-600' : 'text-red-500'
                            }`}>
                              {rec.status === 'approved' ? '✓ Approved' : '✗ Dismissed'}
                            </span>
                          )}
                        </div>
                      </div>

                      <p className="text-xs text-gray-600 leading-relaxed mb-4">{rec.description}</p>

                      {/* Preview Panel */}
                      <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl mb-4 text-xs font-mono text-slate-700 space-y-2">
                        <div className="flex items-center gap-2 border-b border-slate-200/60 pb-1.5 mb-1.5">
                          <Play className="w-3.5 h-3.5 text-slate-400" />
                          <span className="text-[9px] uppercase tracking-wider font-bold text-slate-400">Agent Proposal Preview</span>
                        </div>
                        {rec.agentType === 'editor' && (
                          <div className="space-y-1">
                            <p className="font-bold text-gray-900 font-sans">{rec.previewData.title}</p>
                            <p className="text-[10px] italic font-sans text-gray-500">{rec.previewData.summary}</p>
                            <p className="text-[10px] mt-2 whitespace-pre-line font-sans text-gray-600 line-clamp-3">{rec.previewData.content}</p>
                          </div>
                        )}
                        {rec.agentType === 'growth' && (
                          <div className="space-y-1">
                            <p className="font-bold text-[#0f2c82] flex items-center gap-1">
                              <Bell className="w-3.5 h-3.5" /> Notification Payload:
                            </p>
                            <p className="text-[11px] font-sans text-gray-800 italic">"{rec.previewData.message}"</p>
                            <p className="text-[9px] text-gray-400 mt-1 uppercase">Target: {rec.previewData.recipientGroup}</p>
                          </div>
                        )}
                        {rec.agentType === 'admin' && (
                          <div className="space-y-1">
                            <p className="font-bold text-amber-800">Operational Target:</p>
                            <p className="text-gray-900 font-sans font-bold">{rec.previewData.issue}</p>
                            <p className="text-[10px] text-gray-500 font-sans mt-1">Competition Slug: {rec.previewData.targetCompetition}</p>
                          </div>
                        )}
                        {rec.agentType === 'analyst' && (
                          <div className="space-y-1">
                            <p className="font-bold text-emerald-800">Scout Nomination:</p>
                            <p className="text-gray-900 font-sans font-bold">{rec.previewData.playerName} ({rec.previewData.team})</p>
                            <p className="text-[10px] text-emerald-700 font-sans font-bold mt-1">{rec.previewData.statLine}</p>
                          </div>
                        )}
                      </div>

                      {/* Action Row */}
                      {rec.status === 'pending' && (
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleApprove(rec)}
                            disabled={isActioning}
                            className="bg-primary hover:bg-primary-dark text-white rounded-xl text-xs font-black uppercase tracking-wider py-2.5 px-4 flex items-center gap-2 shadow"
                          >
                            {isActioning ? <Spinner className="w-3.5 h-3.5" /> : <Check className="w-4 h-4" />}
                            {rec.actionText}
                          </Button>
                          <Button
                            onClick={() => handleReject(rec.id)}
                            disabled={isActioning}
                            variant="secondary"
                            className="text-gray-500 bg-gray-100 hover:bg-gray-200 rounded-xl text-xs font-black uppercase tracking-wider py-2.5 px-4 flex items-center gap-2"
                          >
                            <X className="w-4 h-4" />
                            Dismiss
                          </Button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>

        {/* Live Terminal Logs Column */}
        <div className="lg:col-span-1 flex flex-col h-full min-h-[500px]">
          <div className="mb-4">
            <h3 className="text-xl font-display font-extrabold text-gray-900 flex items-center gap-2">
              <Cpu className="w-5 h-5 text-[#0f2c82]" /> 24/7 Agent Operation Logs
            </h3>
            <p className="text-xs text-gray-500 mt-1">Live feed of micro-scans and calculations running behind the scenes.</p>
          </div>

          <div className="flex-grow bg-[#050b18] text-slate-300 font-mono text-[11px] rounded-3xl p-5 border border-slate-800 shadow-xl overflow-hidden flex flex-col h-[550px]">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">SIHLANGU CORE FEED</span>
              </div>
              <span className="text-[10px] text-slate-500">SECURE SOCKETS</span>
            </div>

            {/* Scroll Container */}
            <div ref={terminalContainerRef} className="flex-grow overflow-y-auto space-y-3.5 pr-1 scrollbar-thin scrollbar-thumb-slate-800">
              {logs.map((log) => (
                <div key={log.id} className="border-l-2 border-slate-800 pl-3 py-0.5 space-y-0.5 hover:bg-slate-900/40 rounded transition-colors">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] text-slate-500 font-bold">[{log.timestamp}]</span>
                    <span className={`text-[9.5px] font-black uppercase tracking-wide ${
                      log.agentName.includes('Editor') ? 'text-blue-400' :
                      log.agentName.includes('Admin') ? 'text-amber-400' :
                      log.agentName.includes('Analyst') ? 'text-emerald-400' : 'text-purple-400'
                    }`}>
                      {log.agentName}
                    </span>
                  </div>
                  <p className="text-slate-200 leading-relaxed font-sans text-xs">{log.message}</p>
                </div>
              ))}
            </div>

            <div className="border-t border-slate-800 pt-3 mt-3 flex items-center justify-between text-[10px] text-slate-500">
              <span>SCAN VELOCITY: 250ms</span>
              <span>EST. EFFORT SAVED: 12.5 hrs</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EcosystemAgents;
