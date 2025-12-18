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
    // Robust check for missing API Key in deployment
    if (!process.env.API_KEY || process.env.API_KEY === 'undefined' || process.env.API_KEY === '') {
        console.error("API_KEY is missing. Ensure it is set in Vercel environment variables.");
