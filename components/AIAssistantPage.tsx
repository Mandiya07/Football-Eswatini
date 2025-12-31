
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from '@google/genai';
import { Card, CardContent } from './ui/Card';
import Button from './ui/Button';
import SparklesIcon from './icons/SparklesIcon';
import SendIcon from './icons/SendIcon';
import ThumbsUpIcon from './icons/ThumbsUpIcon';
import ThumbsDownIcon from './icons/ThumbsDownIcon';
import { fetchCompetition, fetchAllCompetitions } from '../services/api';
import Spinner from './ui/Spinner';
import BookIcon from './icons/BookIcon';
import TrendingUpIcon from './icons/TrendingUpIcon';
import BarChartIcon from './icons/BarChartIcon';

interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  feedback?: 'good' | 'bad';
}

const AIAssistantPage: React.FC = () => {
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([{
      role: 'model',
      text: "Hello! I'm your AI Football Pundit. I have access to all the latest stats, league standings, and fixture news. Want a tactical preview of the next big match?"
  }]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

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
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: text,
          config: {
              systemInstruction: "You are an expert football pundit for Football Eswatini. Use a professional yet passionate tone. Analyze matches based on technical data and provide insightful tactical predictions. If asked about current standings, provide the top 3 teams based on provided context."
          }
      });

      setChatHistory([...newHistory, { role: 'model', text: response.text || 'Sorry, I hit a snag in my analysis.' }]);
    } catch (error) {
      console.error(error);
      setChatHistory([...newHistory, { role: 'model', text: 'I am having trouble connecting to the stats server. Please try again in a moment.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const generateTacticalAnalysis = async () => {
      setIsLoading(true);
      try {
          const mtnData = await fetchCompetition('mtn-premier-league');
          const context = JSON.stringify(mtnData?.teams?.slice(0, 5).map(t => ({ 
              name: t.name, 
              points: t.stats.pts, 
              form: t.stats.form,
              matches: t.stats.p
          })));
          
          const prompt = `Based on the current top of the table: ${context}. Write a technical preview for the upcoming matchday. Which of these top teams has the best momentum?`;
          handleSendMessage(prompt);
      } catch (err) {
          console.error(err);
          setIsLoading(false);
      }
  };

  return (
    <div className="bg-gray-50 py-12 min-h-screen">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl animate-fade-in">
            <div className="text-center mb-8">
                <div className="inline-block p-3 bg-purple-100 rounded-full mb-3">
                    <SparklesIcon className="w-8 h-8 text-purple-600" />
                </div>
                <h1 className="text-4xl font-display font-extrabold text-blue-800">AI Football Assistant</h1>
                <p className="text-gray-600">Analyze the beautiful game with data-driven insights.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <button 
                    onClick={generateTacticalAnalysis}
                    className="p-4 bg-white border border-gray-200 rounded-xl shadow-sm hover:border-purple-300 transition-all text-center group"
                >
                    <TrendingUpIcon className="w-6 h-6 mx-auto mb-2 text-purple-600 group-hover:scale-110 transition-transform" />
                    <p className="text-xs font-bold uppercase text-gray-400">Tactical Review</p>
                    <p className="text-sm font-semibold mt-1">Analyze Top Performers</p>
                </button>
                <button 
                    onClick={() => handleSendMessage("Tell me about the most historic football rivalries in Eswatini.")}
                    className="p-4 bg-white border border-gray-200 rounded-xl shadow-sm hover:border-purple-300 transition-all text-center group"
                >
                    <BookIcon className="w-6 h-6 mx-auto mb-2 text-purple-600 group-hover:scale-110 transition-transform" />
                    <p className="text-xs font-bold uppercase text-gray-400">History & Rivalry</p>
                    <p className="text-sm font-semibold mt-1">Legendary Matchups</p>
                </button>
                <button 
                    onClick={() => handleSendMessage("What is the current state of the MTN Premier League title race?")}
                    className="p-4 bg-white border border-gray-200 rounded-xl shadow-sm hover:border-purple-300 transition-all text-center group"
                >
                    <BarChartIcon className="w-6 h-6 mx-auto mb-2 text-purple-600 group-hover:scale-110 transition-transform" />
                    <p className="text-xs font-bold uppercase text-gray-400">Title Race</p>
                    <p className="text-sm font-semibold mt-1">Current Standings Insight</p>
                </button>
            </div>

            <Card className="shadow-2xl overflow-hidden flex flex-col h-[600px] border-0 ring-1 ring-black/5">
                <div 
                    ref={chatContainerRef}
                    className="flex-grow overflow-y-auto p-6 space-y-6 bg-white custom-scrollbar"
                >
                    {chatHistory.map((msg, i) => (
                        <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] p-4 rounded-2xl ${msg.role === 'user' ? 'bg-primary text-white rounded-tr-none' : 'bg-gray-100 text-gray-800 rounded-tl-none border border-gray-200 shadow-sm'}`}>
                                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
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
                            <div className="bg-gray-50 p-4 rounded-2xl rounded-tl-none border border-gray-200">
                                <div className="flex gap-1">
                                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce delay-75"></div>
                                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce delay-150"></div>
                                </div>
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
                            placeholder="Ask about a team, match, or rule..."
                            className="flex-grow px-5 bg-transparent outline-none text-sm"
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
