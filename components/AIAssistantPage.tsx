import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from '@google/genai';
import { Card, CardContent } from './ui/Card';
import Button from './ui/Button';
import SparklesIcon from './icons/SparklesIcon';
import SendIcon from './icons/SendIcon';
import ThumbsUpIcon from './icons/ThumbsUpIcon';
import ThumbsDownIcon from './icons/ThumbsDownIcon';
import GlobeIcon from './icons/GlobeIcon';
import { fetchAllCompetitions, fetchNews } from '../services/api';
import Spinner from './ui/Spinner';
import TrendingUpIcon from './icons/TrendingUpIcon';
import NewspaperIcon from './icons/NewspaperIcon';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import CopyIcon from './icons/CopyIcon';
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
      text: "Hello, Editor. I am your specialized Elite Article Development Assistant. I provide deep investigative analysis, tactical breakdowns, and long-form features tailored for the Eswatini football landscape. Input your topic below for a comprehensive draft."
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
      const [news, comps] = await Promise.all([
          fetchNews(),
          fetchAllCompetitions()
      ]);

      const premierLeague = comps['mtn-premier-league'];

      const siteContext = {
          currentTime: new Date().toISOString(),
          recentNews: news.slice(0, 10).map(n => ({ title: n.title, date: n.date, summary: n.summary })),
          activeLeagues: Object.entries(comps).map(([id, c]) => ({ id, name: c.name, teamCount: c.teams?.length || 0 })),
          premierLeagueStandings: premierLeague?.teams?.slice(0, 10).map(t => ({ name: t.name, points: t.stats.pts, form: t.stats.form }))
      };

      const systemInstruction = `You are a world-class investigative sports editor and tactical analyst for 'Football Eswatini'. 
      Your goal is to write HIGH-DEPTH, insightful, and authoritative long-form articles.
      
      TONE & STYLE:
      - Professional, engaging, and authoritative. Use sophisticated sports journalism vocabulary (e.g., 'tactical flexibility', 'rejuvenated squad', 'pivotal momentum').
      - Use the 'Inverted Pyramid' structure for news.
      - For features, use a narrative-driven approach with a compelling hook.
      
      MANDATORY SECTIONS:
      1. A bold, journalistic headline.
      2. An engaging lead paragraph.
      3. **Tactical Spotlight**: Deep dive into the "why" and "how" of the subject.
      4. **Expert Perspective**: Simulate quotes from "internal technical analysts" or "club sources" to add color.
      5. **Data Breakdown**: Reference specific standings or form from the SITE CONTEXT.
      6. **SEO Keywords**: A list of tags for the article.
      
      FORMATTING:
      - Use Markdown (H1, H2, Bold, Bullet points) to make it highly readable and ready for publication.
      
      SITE CONTEXT (Use this as your source of truth for local data):
      ${JSON.stringify(siteContext, null, 1)}`;

      if (!process.env.API_KEY) {
          throw new Error("API Key is missing from environment.");
      }

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      let response;
      try {
          response = await ai.models.generateContent({
              model: 'gemini-3-flash-preview',
              contents: [{ parts: [{ text: text }] }],
              config: {
                  systemInstruction,
                  tools: [{ googleSearch: {} }],
                  thinkingConfig: { thinkingBudget: 0 },
                  temperature: 0.8 // Higher temperature for more creative journalism
              }
          });
      } catch (searchError) {
          console.warn("Search failed, falling back to core knowledge:", searchError);
          response = await ai.models.generateContent({
              model: 'gemini-3-flash-preview',
              contents: [{ parts: [{ text: text }] }],
              config: {
                  systemInstruction,
                  thinkingConfig: { thinkingBudget: 0 }
              }
          });
      }

      const textOutput = response.text || 'I encountered an issue generating the deep-dive draft.';
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
          text: textOutput,
          sources: sources.length > 0 ? Array.from(new Map(sources.map(s => [s.uri, s])).values()) : undefined
      }]);
    } catch (error: any) {
      console.error("AI Error:", error);
      const errorMsg = `Article Generation Error: ${error?.message || "Communication failure"}. Please check your connection and API limits.`;
      setChatHistory([...newHistory, { role: 'model', text: errorMsg }]);
    } finally {
      setIsLoading(false);
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
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Journalism & Tactical Analysis Suite</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <button onClick={() => handleSendMessage("Perform an investigative analysis of Eswatini's current World Cup qualification strategy. Focus on tactical gaps and squad depth. Write a 800-word feature article.")} className="p-4 bg-white border border-gray-200 rounded-xl shadow-sm hover:border-indigo-400 transition-all text-left group">
                    <GlobeIcon className="w-6 h-6 mb-2 text-blue-600 group-hover:scale-110 transition-transform" />
                    <p className="text-[10px] font-black uppercase text-gray-400">Investigative</p>
                    <p className="text-xs font-bold mt-1">Deep Global Analysis</p>
                </button>
                <button onClick={() => handleSendMessage("Create a data-driven match preview for the upcoming gameweek. Analyze the current form of top teams and predict tactical matchups. Include simulated quotes from a 'technical director'.")} className="p-4 bg-white border border-gray-200 rounded-xl shadow-sm hover:border-indigo-400 transition-all text-left group">
                    <NewspaperIcon className="w-6 h-6 mb-2 text-purple-600 group-hover:scale-110 transition-transform" />
                    <p className="text-[10px] font-black uppercase text-gray-400">Data & Strategy</p>
                    <p className="text-xs font-bold mt-1">Elite Match Preview</p>
                </button>
                <button onClick={() => handleSendMessage("Draft a long-form editorial (1000 words) on the long-term impact of youth development in Eswatini, citing current academy trends and historical context.")} className="p-4 bg-white border border-gray-200 rounded-xl shadow-sm hover:border-indigo-400 transition-all text-left group">
                    <FileTextIcon className="w-6 h-6 mb-2 text-pink-600 group-hover:scale-110 transition-transform" />
                    <p className="text-[10px] font-black uppercase text-gray-400">Long-form Feature</p>
                    <p className="text-xs font-bold mt-1">Legacy & Growth</p>
                </button>
                <button onClick={() => handleSendMessage("Write a critical assessment of the current MTN Premier League standings. Highlight 'under-the-radar' teams and provide tactical reasons for their current position.")} className="p-4 bg-white border border-gray-200 rounded-xl shadow-sm hover:border-indigo-400 transition-all text-left group">
                    <TrendingUpIcon className="w-6 h-6 mb-2 text-green-600 group-hover:scale-110 transition-transform" />
                    <p className="text-[10px] font-black uppercase text-gray-400">Critical Analysis</p>
                    <p className="text-xs font-bold mt-1">Standings Breakdown</p>
                </button>
            </div>

            <Card className="shadow-2xl overflow-hidden flex flex-col h-[750px] border-0 ring-1 ring-black/5 rounded-3xl">
                <div ref={chatContainerRef} className="flex-grow overflow-y-auto p-8 space-y-8 bg-white custom-scrollbar">
                    {chatHistory.map((msg, i) => (
                        <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[90%] p-6 rounded-2xl ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-gray-50 text-gray-800 rounded-tl-none border border-gray-200 shadow-sm'}`}>
                                <div className="prose prose-sm md:prose-base max-w-none text-sm md:text-base leading-relaxed whitespace-pre-wrap">{msg.text}</div>
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
                                        <button onClick={() => { navigator.clipboard.writeText(msg.text); alert("Article draft copied!"); }} className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-indigo-600 transition-colors">
                                            <CopyIcon className="w-4 h-4" /> Copy Full Draft
                                        </button>
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
                                <span className="text-sm font-bold text-indigo-600 animate-pulse uppercase tracking-widest">Synthesizing Depth...</span>
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
                            placeholder="Draft an elite feature about..." 
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