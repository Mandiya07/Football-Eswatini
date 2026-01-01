
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from '@google/genai';
import { Card, CardContent } from './ui/Card';
import Button from './ui/Button';
import SparklesIcon from './icons/SparklesIcon';
import SendIcon from './icons/SendIcon';
import ThumbsUpIcon from './icons/ThumbsUpIcon';
import ThumbsDownIcon from './icons/ThumbsDownIcon';
// Added missing GlobeIcon import
import GlobeIcon from './icons/GlobeIcon';
import { fetchCompetition, fetchNews } from '../services/api';
import Spinner from './ui/Spinner';
import BookIcon from './icons/BookIcon';
import TrendingUpIcon from './icons/TrendingUpIcon';
import BarChartIcon from './icons/BarChartIcon';
import NewspaperIcon from './icons/NewspaperIcon';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';

interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  feedback?: 'good' | 'bad';
  sources?: { uri: string; title: string }[];
}

const AIAssistantPage: React.FC = () => {
  const { user, isLoggedIn } = useAuth();
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([{
      role: 'model',
      text: "Hello, Administrator. I am your specialized AI Pundit. I have access to the site's live news and league data, as well as Google Search. How can I help you develop content or scan for updates today?"
  }]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Security Check
  if (!isLoggedIn || user?.role !== 'super_admin') {
      return <Navigate to="/" replace />;
  }

  useEffect(() => {
    chatContainerRef.current?.scrollTo({ top: chatContainerRef.current.scrollHeight, behavior: 'smooth' });
  }, [chatHistory]);

  const handleSendMessage = async (customMessage?: string) => {
    const text = customMessage || inputValue;
    if (!text.trim() || isLoading) return;

    const newHistory: ChatMessage[] = [...chatHistory, { role: 'user', text }];
    setChatHistory(newHistory);
    setInputValue('');
    setIsLoading(true);

    try {
      // 1. Fetch site context to ground the AI
      const [news, leagueData] = await Promise.all([
          fetchNews(),
          fetchCompetition('mtn-premier-league')
      ]);

      const siteContext = {
          recentNews: news.slice(0, 10).map(n => ({ title: n.title, date: n.date, summary: n.summary })),
          standings: leagueData?.teams?.slice(0, 10).map(t => ({ name: t.name, points: t.stats.pts, form: t.stats.form }))
      };

      const systemInstruction = `You are an internal administrator's AI tool for Football Eswatini. 
      Your task is to help develop articles, social media posts, and scan for external updates.
      
      SITE CONTEXT (Your Primary Source):
      ${JSON.stringify(siteContext, null, 2)}
      
      RULES:
      1. Prioritize information from the SITE CONTEXT provided above for internal facts.
      2. Use Google Search for external validation, finding latest news from other sources, or checking international results.
      3. If a user asks to "develop an article", use the site news as a base but add depth.
      4. If a user asks to "scan for updates", use Google Search to find recent mentions of Eswatini football in the last 24-48 hours.
      5. Always provide source URLs for any information found via web search.
      6. Maintain a professional, high-level editorial tone.`;

      // 2. Initialize AI with Google Search grounding
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
          model: 'gemini-3-pro-preview',
          contents: text,
          config: {
              systemInstruction,
              tools: [{ googleSearch: {} }]
          }
      });

      // 3. Extract grounding sources
      const sources: { uri: string; title: string }[] = [];
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (chunks) {
          chunks.forEach((chunk: any) => {
              if (chunk.web) {
                  sources.push({ uri: chunk.web.uri, title: chunk.web.title });
              }
          });
      }

      setChatHistory([...newHistory, { 
          role: 'model', 
          text: response.text || 'I analyzed the data but could not formulate a response.',
          sources: sources.length > 0 ? Array.from(new Map(sources.map(s => [s.uri, s])).values()) : undefined
      }]);
    } catch (error) {
      console.error(error);
      setChatHistory([...newHistory, { role: 'model', text: 'An error occurred while reaching the AI brain. Please check your API configuration.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gray-50 py-6">
        <div className="container mx-auto px-4 max-w-5xl animate-fade-in">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-purple-600 rounded-xl shadow-lg">
                        <SparklesIcon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-display font-extrabold text-gray-900">Admin AI Command Center</h1>
                        <p className="text-xs text-gray-500 uppercase font-bold tracking-widest">Grounded in Site Data + Google Search</p>
                    </div>
                </div>
                <div className="hidden md:flex gap-2">
                    <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-[10px] font-black uppercase flex items-center gap-1 border border-green-200">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div> Site Data Connected
                    </div>
                    <div className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-[10px] font-black uppercase flex items-center gap-1 border border-blue-200">
                        <GlobeIcon className="w-3 h-3" /> Web Search Active
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <button 
                    onClick={() => handleSendMessage("Scan the web for the latest international news involving Eswatini football clubs or the national team from the last 24 hours.")}
                    className="p-4 bg-white border border-gray-200 rounded-xl shadow-sm hover:border-purple-400 transition-all text-left group"
                >
                    <GlobeIcon className="w-6 h-6 mb-2 text-blue-600 group-hover:scale-110 transition-transform" />
                    <p className="text-xs font-bold uppercase text-gray-400">Web Scan</p>
                    <p className="text-xs font-semibold mt-1">Latest Global Mentions</p>
                </button>
                <button 
                    onClick={() => handleSendMessage("Draft a 300-word feature article based on our recent site news. Make it engaging for the homepage.")}
                    className="p-4 bg-white border border-gray-200 rounded-xl shadow-sm hover:border-purple-400 transition-all text-left group"
                >
                    <NewspaperIcon className="w-6 h-6 mb-2 text-purple-600 group-hover:scale-110 transition-transform" />
                    <p className="text-xs font-bold uppercase text-gray-400">Article Draft</p>
                    <p className="text-xs font-semibold mt-1">Develop New Feature</p>
                </button>
                <button 
                    onClick={() => handleSendMessage("Analyze the current league standings and form from our site context and predict the outcome of the next matchday.")}
                    className="p-4 bg-white border border-gray-200 rounded-xl shadow-sm hover:border-purple-400 transition-all text-left group"
                >
                    <TrendingUpIcon className="w-6 h-6 mb-2 text-green-600 group-hover:scale-110 transition-transform" />
                    <p className="text-xs font-bold uppercase text-gray-400">Data Insights</p>
                    <p className="text-xs font-semibold mt-1">Standings Analysis</p>
                </button>
                <button 
                    onClick={() => handleSendMessage("Research the history of Sihlangu Semnikati's biggest wins for an upcoming anniversary article.")}
                    className="p-4 bg-white border border-gray-200 rounded-xl shadow-sm hover:border-purple-400 transition-all text-left group"
                >
                    <BookIcon className="w-6 h-6 mb-2 text-orange-600 group-hover:scale-110 transition-transform" />
                    <p className="text-xs font-bold uppercase text-gray-400">Research</p>
                    <p className="text-xs font-semibold mt-1">Historical Archive</p>
                </button>
            </div>

            <Card className="shadow-2xl overflow-hidden flex flex-col h-[550px] border-0 ring-1 ring-black/5 rounded-2xl">
                <div 
                    ref={chatContainerRef}
                    className="flex-grow overflow-y-auto p-6 space-y-6 bg-white custom-scrollbar"
                >
                    {chatHistory.map((msg, i) => (
                        <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] p-4 rounded-2xl ${msg.role === 'user' ? 'bg-primary text-white rounded-tr-none' : 'bg-gray-100 text-gray-800 rounded-tl-none border border-gray-200 shadow-sm'}`}>
                                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                                
                                {msg.sources && msg.sources.length > 0 && (
                                    <div className="mt-4 pt-3 border-t border-gray-200">
                                        <p className="text-[10px] font-black uppercase text-gray-400 mb-2">Web Sources Found:</p>
                                        <div className="flex flex-wrap gap-2">
                                            {msg.sources.map((s, idx) => (
                                                <a key={idx} href={s.uri} target="_blank" rel="noopener noreferrer" className="text-[10px] bg-white border border-gray-200 px-2 py-1 rounded hover:bg-blue-50 text-blue-600 font-bold max-w-[150px] truncate">
                                                    {s.title || s.uri}
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {msg.role === 'model' && i > 0 && (
                                    <div className="flex gap-2 mt-3 pt-3 border-t border-gray-200">
                                        <button className="text-gray-400 hover:text-green-600 transition-colors" title="Helpful"><ThumbsUpIcon className="w-4 h-4"/></button>
                                        <button className="text-gray-400 hover:text-red-600 transition-colors" title="Not Helpful"><ThumbsDownIcon className="w-4 h-4"/></button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex justify-start">
                            <div className="bg-gray-50 p-4 rounded-2xl rounded-tl-none border border-gray-200 flex items-center gap-3">
                                <Spinner className="h-4 w-4 border-2 border-purple-600" />
                                <span className="text-xs font-bold text-purple-600 animate-pulse uppercase tracking-widest">AI Brain Computing...</span>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-4 bg-gray-50 border-t">
                    <form 
                        onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
                        className="flex gap-3 bg-white p-1 rounded-full shadow-lg ring-1 ring-black/5"
                    >
                        <input 
                            type="text" 
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder="ground me with your command..."
                            className="flex-grow px-5 bg-transparent outline-none text-sm font-medium"
                        />
                        <Button 
                            type="submit" 
                            disabled={!inputValue.trim() || isLoading}
                            className="bg-primary text-white h-10 w-10 flex items-center justify-center rounded-full p-0 shadow-md hover:scale-105 transition-all disabled:opacity-50 disabled:scale-100"
                        >
                            <SendIcon className="w-5 h-5" />
                        </Button>
                    </form>
                </div>
            </Card>
        </div>
    </div>
  );
};

export default AIAssistantPage;
