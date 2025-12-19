
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Chat } from '@google/genai';
import { Card, CardContent } from './ui/Card';
import Button from './ui/Button';
import SparklesIcon from './icons/SparklesIcon';
import SendIcon from './icons/SendIcon';
import ThumbsUpIcon from './icons/ThumbsUpIcon';
import ThumbsDownIcon from './icons/ThumbsDownIcon';
import { fetchCompetition } from '../services/api';
import Spinner from './ui/Spinner';
import BookIcon from './icons/BookIcon';
import TrendingUpIcon from './icons/TrendingUpIcon';
// Added missing BarChartIcon import
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
  const [isGeneratingAnalysis, setIsGeneratingAnalysis] = useState(false);
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
              systemInstruction: "You are an expert football pundit for Football Eswatini. Use a professional yet passionate tone. Analyze matches based on technical data and provide insightful tactical predictions."
          }
      });

      setChatHistory([...newHistory, { role: 'model', text: response.text || 'Sorry, I hit a snag.' }]);
    } catch (error) {
      console.error(error);
      setChatHistory([...newHistory, { role: 'model', text: 'Connection error. Please try again.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const generateTacticalAnalysis = async () => {
      setIsGeneratingAnalysis(true);
      try {
          const mtnData = await fetchCompetition('mtn-premier-league');
          const context = JSON.stringify(mtnData?.teams?.slice(0, 5).map(t => ({ name: t.name, points: t.stats.pts, form: t.stats.form })));
          
          const prompt = `Based on these top league teams: ${context}. Choose the top two teams and write a "Super Sunday Tactical Preview". Discuss their playing styles and who has the advantage.`;
          handleSendMessage(prompt);
      } catch (err) {
          console.error(err);
      } finally {
          setIsGeneratingAnalysis(false);
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
                <p className="text-gray-600">Ask about tactics, player stats, or match history.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card className="hover:border-purple-300 transition-colors cursor-pointer" onClick={generateTacticalAnalysis}>
                    <CardContent className="p-4 text-center">
                        <TrendingUpIcon className="w-6 h-6 mx-auto mb-2 text-purple-600" />
                        <p className="text-xs font-bold uppercase text-gray-500">Tactical Preview</p>
                        <p className="text-sm font-semibold mt-1">Analyze next big match</p>
                    </CardContent>
                </Card>
                <Card className="hover:border-purple-300 transition-colors cursor-pointer" onClick={() => handleSendMessage("Tell me some interesting history about Mbabane Highlanders.")}>
                    <CardContent className="p-4 text-center">
                        <BookIcon className="w-6 h-6 mx-auto mb-2 text-purple-600" />
                        <p className="text-xs font-bold uppercase text-gray-500">History Lesson</p>
                        <p className="text-sm font-semibold mt-1">Club origins & legends</p>
                    </CardContent>
                </Card>
                <Card className="hover:border-purple-300 transition-colors cursor-pointer" onClick={() => handleSendMessage("Who are the top scorers in the league right now?")}>
                    <CardContent className="p-4 text-center">
                        <BarChartIcon className="w-6 h-6 mx-auto mb-2 text-purple-600" />
                        <p className="text-xs font-bold uppercase text-gray-500">Stat Search</p>
                        <p className="text-sm font-semibold mt-1">Goals & Assists</p>
                    </CardContent>
                </Card>
            </div>

            <Card className="shadow-2xl overflow-hidden flex flex-col h-[600px] border-0">
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
                                        <button className="text-gray-400 hover:text-green-600 transition-colors"><ThumbsUpIcon className="w-4 h-4"/></button>
                                        <button className="text-gray-400 hover:text-red-600 transition-colors"><ThumbsDownIcon className="w-4 h-4"/></button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex justify-start animate-pulse">
                            <div className="bg-gray-100 p-4 rounded-2xl rounded-tl-none border border-gray-200">
                                <div className="flex gap-1">
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-75"></div>
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150"></div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-4 bg-gray-50 border-t">
                    <form 
                        onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
                        className="flex gap-3 bg-white p-2 rounded-full shadow-lg ring-1 ring-black/5"
                    >
                        <input 
                            type="text" 
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder="Type your question..."
                            className="flex-grow px-4 bg-transparent outline-none text-sm"
                        />
                        <Button 
                            type="submit" 
                            disabled={!inputValue.trim() || isLoading}
                            className="bg-primary text-white h-10 w-10 flex items-center justify-center rounded-full p-0 shadow-md hover:scale-105 transition-transform"
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