
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import Markdown from 'react-markdown';
import { Card, CardContent } from './ui/Card';
import Button from './ui/Button';
import SparklesIcon from './icons/SparklesIcon';
import SendIcon from './icons/SendIcon';
import ThumbsUpIcon from './icons/ThumbsUpIcon';
import ThumbsDownIcon from './icons/ThumbsDownIcon';
import GlobeIcon from './icons/GlobeIcon';
import ImageIcon from './icons/ImageIcon';
import { fetchAllCompetitions, fetchNews } from '../services/api';
import Spinner from './ui/Spinner';
import TrendingUpIcon from './icons/TrendingUpIcon';
import NewspaperIcon from './icons/NewspaperIcon';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import CopyIcon from './icons/CopyIcon';
import FileTextIcon from './icons/FileTextIcon';
import { calculateStandings } from '../services/utils';

interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  feedback?: 'good' | 'bad';
  sources?: { uri: string; title: string }[];
  imageUrl?: string;
}

const AIAssistantPage: React.FC = () => {
  const { user, isLoggedIn } = useAuth();
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([{
      role: 'model',
      text: "Elite Article Editor initialized. I am ready to draft investigative analysis, tactical breakdowns, and match previews for Football Eswatini. Provide a topic or use a template below."
  }]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState<number | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

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
      const [news, comps] = await Promise.all([
          fetchNews(),
          fetchAllCompetitions()
      ]);

      const premierLeague = comps['mtn-premier-league'];
      const standings = premierLeague ? calculateStandings(premierLeague.teams || [], premierLeague.results || [], premierLeague.fixtures || []) : [];

      const siteContext = {
          currentTime: new Date().toISOString(),
          recentNews: news.slice(0, 10).map(n => ({ title: n.title, date: n.date, summary: n.summary })),
          activeLeagues: Object.entries(comps).map(([id, c]) => ({ id, name: c.name, teamCount: c.teams?.length || 0 })),
          premierLeagueStandings: standings.slice(0, 12).map(t => ({ name: t.name, points: t.stats.pts, form: t.stats.form, played: t.stats.p, gd: t.stats.gd })),
          recentResults: premierLeague?.results?.slice(0, 5).map(r => `${r.teamA} ${r.scoreA}-${r.scoreB} ${r.teamB} (Matchday ${r.matchday})`),
          upcomingFixtures: premierLeague?.fixtures?.slice(0, 5).map(f => `${f.teamA} vs ${f.teamB} (${f.fullDate})`)
      };

      const systemInstruction = `You are a world-class investigative sports journalist for 'Football Eswatini'. 
      Your objective is to write authoritative, engaging, and highly accurate articles about football in the Kingdom.
      
      TONE: Professional, sophisticated, yet accessible. Avoid clichés.
      
      CONSTRAINTS:
      1. USE SITE CONTEXT: Ground your writing in the provided rankings, results, and upcoming matches.
      2. PENALTY SCORES: Recognize scores like "1(4)" as 1 goal in regular time and 4 in a penalty shootout. If a match went to penalties, emphasize the drama.
      3. ZERO FABRICATION: If specific match events (scorers, cards) are not in the context, do not make them up. Focus on the mathematical impact on the standings instead.
      4. DEPTH: Articles must be long-form (at least 500 words) with descriptive headers.
      
      SITE CONTEXT DATA SOURCE:
      ${JSON.stringify(siteContext, null, 1)}`;

      if (!process.env.API_KEY) throw new Error("API Key Missing");

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: text,
          config: {
              systemInstruction,
              tools: [{ googleSearch: {} }],
              thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
              temperature: 0.7
          }
      });

      const textOutput = response.text || 'Synthesis failed.';
      const sources: { uri: string; title: string }[] = [];
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (chunks) {
          chunks.forEach((chunk: any) => { if (chunk.web) sources.push({ uri: chunk.web.uri, title: chunk.web.title }); });
      }

      setChatHistory([...newHistory, { role: 'model', text: textOutput, sources }]);
    } catch (error: any) {
      console.error("AI Error:", error);
      setChatHistory([...newHistory, { role: 'model', text: `Drafting Error: ${error.message}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateImage = async (index: number, prompt: string) => {
    if (isGeneratingImage !== null) return;
    setIsGeneratingImage(index);
    
    try {
      if (!process.env.API_KEY) throw new Error("API Key Missing");
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [{ text: `A professional, high-quality sports journalism editorial illustration for an article titled: "${prompt.split('\n')[0]}". Style: Cinematic, dramatic lighting, vibrant colors, related to Eswatini football.` }]
        },
        config: {
          imageConfig: { aspectRatio: "16:9" }
        }
      });

      let imageUrl = '';
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          imageUrl = `data:image/png;base64,${part.inlineData.data}`;
          break;
        }
      }

      if (imageUrl) {
        setChatHistory(prev => {
          const next = [...prev];
          next[index] = { ...next[index], imageUrl };
          return next;
        });
      }
    } catch (error) {
      console.error("Image Gen Error:", error);
      alert("Failed to generate image.");
    } finally {
      setIsGeneratingImage(null);
    }
  };

  return (
    <div className="bg-gray-50 py-6 min-h-screen">
        <div className="container mx-auto px-4 max-w-5xl animate-fade-in">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-indigo-600 rounded-xl shadow-lg">
                        <SparklesIcon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-display font-extrabold text-gray-900">Elite Article Development AI</h1>
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Journalism & Analysis Suite</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <button onClick={() => handleSendMessage("Draft an investigative feature on Sihlangu Semnikati's tactical evolution over the last 12 months. Reference current FIFA standings and recent match data.")} className="p-4 bg-white border border-gray-200 rounded-xl shadow-sm hover:border-indigo-400 transition-all text-left group">
                    <GlobeIcon className="w-6 h-6 mb-2 text-blue-600 group-hover:scale-110 transition-transform" />
                    <p className="text-[10px] font-black uppercase text-gray-400">Investigative</p>
                    <p className="text-xs font-bold mt-1">Sihlangu Evolution</p>
                </button>
                <button onClick={() => handleSendMessage("Create a data-driven preview for the upcoming MTN Premier League matchday. Use current standings to explain why the top-of-the-table clashes are critical.")} className="p-4 bg-white border border-gray-200 rounded-xl shadow-sm hover:border-indigo-400 transition-all text-left group">
                    <NewspaperIcon className="w-6 h-6 mb-2 text-purple-600 group-hover:scale-110 transition-transform" />
                    <p className="text-[10px] font-black uppercase text-gray-400">Data & Strategy</p>
                    <p className="text-xs font-bold mt-1">League Matchday Preview</p>
                </button>
                <button onClick={() => handleSendMessage("Write a feature article highlighting the rising stars in the Eswatini Youth Leagues, focusing on the impact of academies on the senior national pipeline.")} className="p-4 bg-white border border-gray-200 rounded-xl shadow-sm hover:border-indigo-400 transition-all text-left group">
                    <FileTextIcon className="w-6 h-6 mb-2 text-pink-600 group-hover:scale-110 transition-transform" />
                    <p className="text-[10px] font-black uppercase text-gray-400">Youth Spotlight</p>
                    <p className="text-xs font-bold mt-1">The Academy Pipeline</p>
                </button>
                <button onClick={() => handleSendMessage("Analyze the current standings and explain which teams are in the 'Danger Zone' for relegation. Focus on goal difference and recent form patterns.")} className="p-4 bg-white border border-gray-200 rounded-xl shadow-sm hover:border-indigo-400 transition-all text-left group">
                    <TrendingUpIcon className="w-6 h-6 mb-2 text-green-600 group-hover:scale-110 transition-transform" />
                    <p className="text-[10px] font-black uppercase text-gray-400">Standings Analysis</p>
                    <p className="text-xs font-bold mt-1">Relegation Battle</p>
                </button>
            </div>

            <Card className="shadow-2xl overflow-hidden flex flex-col h-[750px] border-0 ring-1 ring-black/5 rounded-3xl">
                <div ref={chatContainerRef} className="flex-grow overflow-y-auto p-8 space-y-8 bg-white custom-scrollbar">
                    {chatHistory.map((msg, i) => (
                        <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[90%] p-6 rounded-2xl ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-gray-50 text-gray-800 rounded-tl-none border border-gray-200 shadow-sm'}`}>
                                {msg.imageUrl && (
                                    <div className="mb-6 rounded-xl overflow-hidden shadow-lg border border-gray-200">
                                        <img src={msg.imageUrl} alt="Article Header" className="w-full h-auto object-cover" />
                                    </div>
                                )}
                                <div className="markdown-body prose prose-sm md:prose-base max-w-none text-sm md:text-base leading-relaxed">
                                    <Markdown>{msg.text}</Markdown>
                                </div>
                                {msg.sources && msg.sources.length > 0 && (
                                    <div className="mt-6 pt-4 border-t border-gray-200">
                                        <p className="text-[10px] font-black uppercase text-gray-400 mb-2">Grounding Sources:</p>
                                        <div className="flex flex-wrap gap-2">
                                            {msg.sources.map((s, idx) => (
                                                <a key={idx} href={s.uri} target="_blank" rel="noopener noreferrer" className="text-[10px] bg-white border border-gray-200 px-3 py-1.5 rounded hover:bg-indigo-50 text-indigo-600 font-bold truncate max-w-[250px] shadow-sm">
                                                    {s.title || s.uri}
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {msg.role === 'model' && i > 0 && (
                                    <div className="flex gap-4 mt-6 pt-4 border-t border-gray-100">
                                        <button onClick={() => { navigator.clipboard.writeText(msg.text); alert("Draft copied!"); }} className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-indigo-600 transition-colors">
                                            <CopyIcon className="w-4 h-4" /> Copy Draft
                                        </button>
                                        {!msg.imageUrl && (
                                            <button 
                                                onClick={() => handleGenerateImage(i, msg.text)} 
                                                disabled={isGeneratingImage !== null}
                                                className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-indigo-600 transition-colors disabled:opacity-50"
                                            >
                                                {isGeneratingImage === i ? (
                                                    <Spinner className="w-3 h-3 border-indigo-600" />
                                                ) : (
                                                    <ImageIcon className="w-4 h-4" />
                                                )}
                                                Generate Cover
                                            </button>
                                        )}
                                        <div className="flex gap-3">
                                            <button className="text-gray-400 hover:text-green-600 transition-colors"><ThumbsUpIcon className="w-5 h-5"/></button>
                                            <button className="text-gray-400 hover:text-red-600 transition-colors"><ThumbsDownIcon className="w-5 h-5"/></button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex justify-start">
                            <div className="bg-gray-50 p-6 rounded-2xl rounded-tl-none border border-gray-200 flex items-center gap-3">
                                <Spinner className="h-5 w-5 border-2 border-indigo-600" />
                                <span className="text-sm font-bold text-indigo-600 animate-pulse uppercase tracking-widest">Synthesizing Official Report...</span>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-6 bg-gray-50 border-t">
                    <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="flex gap-3 bg-white p-1.5 rounded-full shadow-lg border border-gray-200">
                        <input 
                            type="text" 
                            value={inputValue} 
                            onChange={(e) => setInputValue(e.target.value)} 
                            placeholder="Describe the article you need..." 
                            className="flex-grow px-6 bg-transparent outline-none text-base font-medium h-14" 
                        />
                        <Button type="submit" disabled={!inputValue.trim() || isLoading} className="bg-indigo-600 text-white h-14 w-14 flex items-center justify-center rounded-full p-0 shadow-md hover:scale-105 transition-all">
                            <SendIcon className="w-7 h-7" />
                        </Button>
                    </form>
                </div>
            </Card>
        </div>
    </div>
  );
};

export default AIAssistantPage;
