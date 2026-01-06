
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from '@google/genai';
import { Card, CardContent } from './ui/Card';
import Button from './ui/Button';
import SparklesIcon from './icons/SparklesIcon';
import SendIcon from './icons/SendIcon';
import ThumbsUpIcon from './icons/ThumbsUpIcon';
import ThumbsDownIcon from './icons/ThumbsDownIcon';
import GlobeIcon from './icons/GlobeIcon';
import { fetchCompetition, fetchNews } from '../services/api';
import Spinner from './ui/Spinner';
import BookIcon from './icons/BookIcon';
import TrendingUpIcon from './icons/TrendingUpIcon';
import BarChartIcon from './icons/BarChartIcon';
import NewspaperIcon from './icons/NewspaperIcon';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import CopyIcon from './icons/CopyIcon';
// Added missing import for FileTextIcon
import FileTextIcon from './icons/FileTextIcon';

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
      text: "Hello, Editor. I am your specialized Article Development Assistant. I have access to our site's live data and Google Search. Tell me what kind of article you want to develop today."
  }]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
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
      const [news, leagueData] = await Promise.all([
          fetchNews(),
          fetchCompetition('mtn-premier-league')
      ]);

      const siteContext = {
          recentNews: news.slice(0, 15).map(n => ({ title: n.title, date: n.date, summary: n.summary })),
          standings: leagueData?.teams?.slice(0, 15).map(t => ({ name: t.name, points: t.stats.pts, form: t.stats.form }))
      };

      const systemInstruction = `You are a high-level Editor and Article Developer for Football Eswatini. 
      Your goal is to write professional, engaging, and accurate articles for the website.
      
      SITE CONTEXT (Our data):
      ${JSON.stringify(siteContext, null, 2)}
      
      YOUR CAPABILITIES:
      1. Write full feature articles (300-800 words).
      2. Develop match previews using site standings and recent form.
      3. Use Google Search to find latest external news, player transfers, or international results involving Eswatini.
      4. Suggest catchy headlines and subheadings.
      
      RULES:
      1. Always prioritize site context for internal league facts.
      2. If drafting an article, use Markdown for clear formatting.
      3. If sourcing from the internet, list the source URLs clearly at the bottom.
      4. Maintain a journalistic tone: professional, unbiased, and passionate about the sport.`;

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
          model: 'gemini-3-pro-preview',
          contents: text,
          config: {
              systemInstruction,
              tools: [{ googleSearch: {} }]
          }
      });

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
          text: response.text || 'Error generating draft.',
          sources: sources.length > 0 ? Array.from(new Map(sources.map(s => [s.uri, s])).values()) : undefined
      }]);
    } catch (error) {
      console.error(error);
      setChatHistory([...newHistory, { role: 'model', text: 'Connection error. Please try again.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gray-50 py-6 min-h-screen">
        <div className="container mx-auto px-4 max-w-5xl animate-fade-in">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-purple-600 rounded-xl shadow-lg">
                        <SparklesIcon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-display font-extrabold text-gray-900">Article Development AI</h1>
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Editor's Research & Drafting Tool</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <button onClick={() => handleSendMessage("Research the latest news on Eswatini international players abroad and draft a 400-word feature article.")} className="p-4 bg-white border border-gray-200 rounded-xl shadow-sm hover:border-purple-400 transition-all text-left group">
                    <GlobeIcon className="w-6 h-6 mb-2 text-blue-600 group-hover:scale-110 transition-transform" />
                    <p className="text-[10px] font-black uppercase text-gray-400">Global Research</p>
                    <p className="text-xs font-bold mt-1">International Feature</p>
                </button>
                <button onClick={() => handleSendMessage("Create an engaging match preview for the next MTN Premier League weekend based on our current standings.")} className="p-4 bg-white border border-gray-200 rounded-xl shadow-sm hover:border-purple-400 transition-all text-left group">
                    <NewspaperIcon className="w-6 h-6 mb-2 text-purple-600 group-hover:scale-110 transition-transform" />
                    <p className="text-[10px] font-black uppercase text-gray-400">Match Preview</p>
                    <p className="text-xs font-bold mt-1">Weekend Analysis</p>
                </button>
                <button onClick={() => handleSendMessage("Write a 500-word deep-dive article about the growth of the Eswatini Women's League this season.")} className="p-4 bg-white border border-gray-200 rounded-xl shadow-sm hover:border-purple-400 transition-all text-left group">
                    <FileTextIcon className="w-6 h-6 mb-2 text-pink-600 group-hover:scale-110 transition-transform" />
                    <p className="text-[10px] font-black uppercase text-gray-400">Deep Dive</p>
                    <p className="text-xs font-bold mt-1">Women's Football</p>
                </button>
                <button onClick={() => handleSendMessage("Analyze the current top 4 of the MTN Premier League and write a summary article about the title race.")} className="p-4 bg-white border border-gray-200 rounded-xl shadow-sm hover:border-purple-400 transition-all text-left group">
                    <TrendingUpIcon className="w-6 h-6 mb-2 text-green-600 group-hover:scale-110 transition-transform" />
                    <p className="text-[10px] font-black uppercase text-gray-400">Data Draft</p>
                    <p className="text-xs font-bold mt-1">League Title Analysis</p>
                </button>
            </div>

            <Card className="shadow-2xl overflow-hidden flex flex-col h-[600px] border-0 ring-1 ring-black/5 rounded-3xl">
                <div ref={chatContainerRef} className="flex-grow overflow-y-auto p-6 space-y-6 bg-white custom-scrollbar">
                    {chatHistory.map((msg, i) => (
                        <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[90%] p-5 rounded-2xl ${msg.role === 'user' ? 'bg-primary text-white rounded-tr-none' : 'bg-gray-50 text-gray-800 rounded-tl-none border border-gray-200 shadow-sm'}`}>
                                <div className="prose prose-sm max-w-none text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</div>
                                {msg.sources && msg.sources.length > 0 && (
                                    <div className="mt-4 pt-3 border-t border-gray-200">
                                        <p className="text-[10px] font-black uppercase text-gray-400 mb-2">Grounding Sources:</p>
                                        <div className="flex flex-wrap gap-2">
                                            {msg.sources.map((s, idx) => (
                                                <a key={idx} href={s.uri} target="_blank" rel="noopener noreferrer" className="text-[10px] bg-white border border-gray-200 px-2 py-1 rounded hover:bg-blue-50 text-blue-600 font-bold truncate max-w-[200px]">
                                                    {s.title || s.uri}
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {msg.role === 'model' && i > 0 && (
                                    <div className="flex gap-4 mt-4 pt-4 border-t border-gray-100">
                                        <button onClick={() => { navigator.clipboard.writeText(msg.text); alert("Article copied!"); }} className="flex items-center gap-1 text-[10px] font-bold text-gray-500 hover:text-primary transition-colors">
                                            <CopyIcon className="w-3.5 h-3.5" /> Copy Draft
                                        </button>
                                        <div className="flex gap-2">
                                            <button className="text-gray-400 hover:text-green-600 transition-colors"><ThumbsUpIcon className="w-4 h-4"/></button>
                                            <button className="text-gray-400 hover:text-red-600 transition-colors"><ThumbsDownIcon className="w-4 h-4"/></button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex justify-start">
                            <div className="bg-gray-50 p-4 rounded-2xl rounded-tl-none border border-gray-200 flex items-center gap-3">
                                <Spinner className="h-4 w-4 border-2 border-purple-600" />
                                <span className="text-xs font-bold text-purple-600 animate-pulse uppercase tracking-widest">Generating Editorial Content...</span>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-4 bg-gray-50 border-t">
                    <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="flex gap-3 bg-white p-1 rounded-full shadow-lg border border-gray-200">
                        <input type="text" value={inputValue} onChange={(e) => setInputValue(e.target.value)} placeholder="Type a command or article request..." className="flex-grow px-5 bg-transparent outline-none text-sm font-medium h-12" />
                        <Button type="submit" disabled={!inputValue.trim() || isLoading} className="bg-primary text-white h-10 w-10 flex items-center justify-center rounded-full p-0 shadow-md hover:scale-105 transition-all">
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
