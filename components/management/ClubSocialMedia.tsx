
import React, { useState } from 'react';
import { Card, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import SparklesIcon from '../icons/SparklesIcon';
import ShareIcon from '../icons/ShareIcon';
import FacebookIcon from '../icons/FacebookIcon';
import InstagramIcon from '../icons/InstagramIcon';
import { GoogleGenAI } from "@google/genai";
import Spinner from '../ui/Spinner';
import CopyIcon from '../icons/CopyIcon';

const ClubSocialMedia: React.FC<{ clubName: string }> = ({ clubName }) => {
    const [prompt, setPrompt] = useState('');
    const [generatedContent, setGeneratedContent] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [platform, setPlatform] = useState('Twitter/X');

    const handleGenerate = async () => {
        if (!prompt) return;
        if (!process.env.API_KEY || process.env.API_KEY === 'undefined' || process.env.API_KEY === '') {
            alert('API_KEY is missing. Please contact support.');
            return;
        }

        setIsGenerating(true);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const fullPrompt = `You are the social media manager for ${clubName}. Create a catchy, engaging ${platform} post based on this context: "${prompt}". Use emojis, relevant hashtags for Eswatini football, and keep it professional but exciting for fans.`;
            
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: fullPrompt,
            });
            setGeneratedContent(response.text || "Failed to generate content.");
        } catch (error) {
            console.error("AI Error", error);
            setGeneratedContent("Error generating content. Please try again.");
        } finally {
            setIsGenerating(false);
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(generatedContent);
        alert("Copied to clipboard!");
    };

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Integration Status */}
            <Card className="shadow-lg">
                <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <ShareIcon className="w-8 h-8 text-blue-600" />
                        <h3 className="text-2xl font-bold font-display">Social Media Integration</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="border rounded-lg p-4 flex items-center justify-between bg-blue-50 border-blue-200">
                            <div className="flex items-center gap-3">
                                <FacebookIcon className="w-6 h-6 text-blue-700" />
                                <div>
                                    <p className="font-bold text-gray-800">Facebook</p>
                                    <p className="text-xs text-green-600 font-semibold">● Connected as {clubName}</p>
                                </div>
                            </div>
                            <Button className="text-xs bg-white border border-gray-300 text-gray-700 hover:bg-gray-50">Manage</Button>
                        </div>
                        <div className="border rounded-lg p-4 flex items-center justify-between bg-pink-50 border-pink-200">
                            <div className="flex items-center gap-3">
                                <InstagramIcon className="w-6 h-6 text-pink-600" />
                                <div>
                                    <p className="font-bold text-gray-800">Instagram</p>
                                    <p className="text-xs text-gray-500">● Not Connected</p>
                                </div>
                            </div>
                            <Button className="text-xs bg-white border border-gray-300 text-gray-700 hover:bg-gray-50">Connect</Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* AI Generator */}
            <Card className="shadow-lg border-t-4 border-purple-500">
                <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <SparklesIcon className="w-6 h-6 text-purple-600" />
                        <h3 className="text-xl font-bold font-display text-gray-800">AI Content Assistant</h3>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">Need a quick caption for a match result, new signing, or announcement? Describe it below and let AI write it for you.</p>
                    
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="md:col-span-3">
                                <input 
                                    type="text" 
                                    value={prompt} 
                                    onChange={e => setPrompt(e.target.value)} 
                                    placeholder="e.g. We won 2-0 against Wanderers, goals by Dlamini and Mamba..." 
                                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                                />
                            </div>
                            <select 
                                value={platform} 
                                onChange={e => setPlatform(e.target.value)} 
                                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                            >
                                <option>Twitter/X</option>
                                <option>Facebook</option>
                                <option>Instagram</option>
                            </select>
                        </div>
                        
                        <Button 
                            onClick={handleGenerate} 
                            disabled={isGenerating || !prompt}
                            className="bg-purple-600 text-white hover:bg-purple-700 w-full md:w-auto"
                        >
                            {isGenerating ? <Spinner className="w-4 h-4 border-2" /> : 'Generate Caption'}
                        </Button>

                        {generatedContent && (
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mt-4 relative group">
                                <p className="text-gray-800 whitespace-pre-wrap text-sm">{generatedContent}</p>
                                <button 
                                    onClick={copyToClipboard}
                                    className="absolute top-2 right-2 text-gray-400 hover:text-purple-600 p-1 bg-white rounded shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                                    title="Copy"
                                >
                                    <CopyIcon className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default ClubSocialMedia;
