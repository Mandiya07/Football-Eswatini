import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Chat } from '@google/genai';
import { Card, CardContent } from './ui/Card';
import Button from './ui/Button';
import SparklesIcon from './icons/SparklesIcon';
import SendIcon from './icons/SendIcon';
import ThumbsUpIcon from './icons/ThumbsUpIcon';
import ThumbsDownIcon from './icons/ThumbsDownIcon';

interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  feedback?: 'good' | 'bad';
}

const LOCAL_STORAGE_KEY = 'aiAgentChatHistory';

const AIAssistantPage: React.FC = () => {
  const chatRef = useRef<Chat | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Load chat history on mount and initialize AI
  useEffect(() => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

        // Step 1: Load history from localStorage
        const savedHistoryRaw = localStorage.getItem(LOCAL_STORAGE_KEY);
        let loadedHistory: ChatMessage[] = [];
        if (savedHistoryRaw) {
            try {
                loadedHistory = JSON.parse(savedHistoryRaw);
            } catch (e) {
                console.error("Failed to parse chat history from localStorage", e);
                localStorage.removeItem(LOCAL_STORAGE_KEY); // Clear corrupted data
            }
        }

        // Step 2: Prepare history for the AI model (don't include our hardcoded welcome message)
        const apiHistory = loadedHistory
            .filter((msg, index) => {
                // Remove the initial welcome message only if it's the very first item.
                if (index === 0 && msg.role === 'model' && msg.text.startsWith('Hello! I am the FE Agent.')) {
                    return false;
                }
                return true;
            })
            .map(msg => ({
                role: msg.role,
                parts: [{ text: msg.text }],
            }));
            
        // Step 3: Initialize the chat instance
        chatRef.current = ai.chats.create({
            model: 'gemini-2.5-flash',
            history: apiHistory,
            config: {
                systemInstruction: 'You are a helpful and knowledgeable AI assistant specializing in football in Eswatini. Your name is FE Agent. You provide information about players, teams, fixtures, results, and the history of football in the Kingdom of Eswatini. Your tone should be friendly, enthusiastic, and informative. Keep your answers concise and well-formatted using markdown where appropriate.',
            },
        });
        
        // Step 4: Set the display history
        if (loadedHistory.length > 0) {
            setChatHistory(loadedHistory);
        } else {
            setChatHistory([{
                role: 'model',
                text: 'Hello! I am the FE Agent. How can I help you with Eswatini football today?'
            }]);
        }

        setIsInitialized(true);
    } catch (error) {
        console.error("Failed to initialize Gemini AI:", error);
        setChatHistory([{
            role: 'model',
            text: 'Sorry, the AI Agent is currently unavailable. Please check the API key configuration.'
        }]);
    }
  }, []);

  // Save chat history to localStorage whenever it changes
  useEffect(() => {
    if (chatHistory.length > 0 && isInitialized) {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(chatHistory));
    }
  }, [chatHistory, isInitialized]);


  // Auto-scroll to bottom of chat
  useEffect(() => {
    chatContainerRef.current?.scrollTo({ top: chatContainerRef.current.scrollHeight, behavior: 'smooth' });
  }, [chatHistory, isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const chat = chatRef.current;
    if (!inputValue.trim() || isLoading || !chat) return;

    const userMessage = inputValue.trim();
    setInputValue('');
    setChatHistory(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);

    try {
      const stream = await chat.sendMessageStream({ message: userMessage });
      setIsLoading(false);

      let modelResponseText = '';
      setChatHistory(prev => [...prev, { role: 'model', text: '' }]);

      for await (const chunk of stream) {
        modelResponseText += chunk.text;
        setChatHistory(prev => {
          const newHistory = [...prev];
          const lastMessage = newHistory[newHistory.length - 1];
          if (lastMessage.role === 'model') {
            lastMessage.text = modelResponseText;
          }
          return newHistory;
        });
      }
    } catch (error) {
      console.error("Error sending message to Gemini:", error);
      setChatHistory(prev => [...prev, { role: 'model', text: 'Sorry, something went wrong while getting a response. Please try again.' }]);
      setIsLoading(false);
    }
  };

  const handleFeedback = (messageIndex: number, feedback: 'good' | 'bad') => {
      setChatHistory(prev => {
          const newHistory = [...prev];
          const message = newHistory[messageIndex];
          if (message && message.role === 'model') {
              // Toggle feedback off if the same button is clicked again
              message.feedback = message.feedback === feedback ? undefined : feedback;
          }
          return newHistory;
      });
      // In a real application, you would also send this feedback to a logging service.
  };

  return (
    <div className="bg-gray-50 py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 animate-fade-in">
        <div className="text-center mb-8">
          <SparklesIcon className="w-12 h-12 mx-auto text-primary mb-2" />
          <h1 className="text-4xl md:text-5xl font-display font-extrabold text-blue-800 mb-2">
            AI Agent
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Your personal football assistant. Ask me anything about Eswatini football!
          </p>
        </div>

        <Card className="max-w-3xl mx-auto shadow-lg">
          <div className="flex flex-col h-[70vh]">
            <CardContent ref={chatContainerRef} className="flex-grow p-6 space-y-4 overflow-y-auto">
              {chatHistory.map((message, index) => (
                <div key={index}>
                  <div className={`flex items-start gap-3 ${message.role === 'user' ? 'justify-end' : ''}`}>
                    {message.role === 'model' && (
                      <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <SparklesIcon className="w-5 h-5 text-primary" />
                      </span>
                    )}
                    <div className={`p-3 rounded-lg max-w-lg ${message.role === 'user' ? 'bg-primary text-white rounded-br-none' : 'bg-gray-100 text-gray-800 rounded-tl-none'}`}>
                      <p className="text-sm" style={{ whiteSpace: 'pre-wrap' }}>{message.text}</p>
                    </div>
                  </div>
                  {/* Feedback UI for model responses */}
                  {message.role === 'model' && message.text && index > 0 && !isLoading && (
                    <div className="flex items-center justify-start gap-2 ml-11 mt-2">
                        <button 
                            onClick={() => handleFeedback(index, 'good')}
                            disabled={message.feedback === 'bad'}
                            className={`p-1 rounded-full transition-colors ${
                                message.feedback === 'good' 
                                ? 'text-green-600 bg-green-100' 
                                : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50'
                            }`}
                            aria-label="Good response"
                        >
                            <ThumbsUpIcon className="w-4 h-4" />
                        </button>
                         <button 
                            onClick={() => handleFeedback(index, 'bad')}
                            disabled={message.feedback === 'good'}
                            className={`p-1 rounded-full transition-colors ${
                                message.feedback === 'bad' 
                                ? 'text-red-600 bg-red-100' 
                                : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50'
                            }`}
                             aria-label="Bad response"
                        >
                            <ThumbsDownIcon className="w-4 h-4" />
                        </button>
                    </div>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <SparklesIcon className="w-5 h-5 text-primary" />
                  </span>
                  <div className="bg-gray-100 rounded-lg rounded-tl-none p-3">
                    <div className="flex items-center space-x-1">
                      <span className="h-2 w-2 bg-gray-400 rounded-full animate-pulse [animation-delay:-0.3s]"></span>
                      <span className="h-2 w-2 bg-gray-400 rounded-full animate-pulse [animation-delay:-0.15s]"></span>
                      <span className="h-2 w-2 bg-gray-400 rounded-full animate-pulse"></span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
            <div className="p-4 border-t bg-white">
              <form onSubmit={handleSubmit} className="flex items-center gap-3">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Ask about players, teams, or fixtures..."
                  className="block w-full px-4 py-2 border border-gray-300 rounded-full shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  disabled={!isInitialized}
                />
                <Button type="submit" className="bg-primary text-white rounded-full w-10 h-10 p-0 flex items-center justify-center flex-shrink-0" disabled={isLoading || !inputValue.trim() || !isInitialized}>
                  <SendIcon className="w-5 h-5" />
                </Button>
              </form>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AIAssistantPage;