
import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Card, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';
import CopyIcon from '../icons/CopyIcon';
import SparklesIcon from '../icons/SparklesIcon';
import RefreshIcon from '../icons/RefreshIcon';
import SaveIcon from '../icons/SaveIcon';
import { fetchAllCompetitions } from '../../services/api';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../../services/firebase';

type DivisionType = 'International' | 'MTN Premier League' | 'National First Division League' | 'Regional' | 'Cups' | 'National Team';
type ContentType = 'captions' | 'summary';

const SocialMediaGenerator: React.FC = () => {
    const [division, setDivision] = useState<DivisionType>('MTN Premier League');
    const [contentType, setContentType] = useState<ContentType>('captions');
    const [contextData, setContextData] = useState('');
    const [generatedContent, setGeneratedContent] = useState<string[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isFetchingData, setIsFetchingData] = useState(false);
    const [savedAsNews, setSavedAsNews] = useState(false);

    const fetchRecentData = async () => {
        setIsFetchingData(true);
        try {
            const allComps = await fetchAllCompetitions();
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            
            let relevantText = `Recent results and fixtures for ${division} (Last 7 days):\n`;
            let foundData = false;

            Object.values(allComps).forEach(comp => {
                // Filter to match specific division to competition categories/names
                let isRelevant = false;
                const nameLower = comp.name.toLowerCase();
                const catLower = (comp.categoryId || '').toLowerCase();
                
                if (division === 'MTN Premier League' && (nameLower.includes('premier') || nameLower.includes('mtn'))) {
                    isRelevant = true;
                } else if (division === 'National First Division League' && (nameLower.includes('first division') || nameLower.includes('nfd') || nameLower.includes('national first'))) {
                    isRelevant = true;
                } else if (division === 'Regional' && (nameLower.includes('regional') || nameLower.includes('super league') || catLower.includes('regional'))) {
                    isRelevant = true;
                } else if (division === 'Cups' && (nameLower.includes('cup') || nameLower.includes('tournament') || nameLower.includes('knockout'))) {
                    isRelevant = true;
                } else if (division === 'National Team' && (catLower === 'national-teams' || nameLower.includes('sihlangu') || nameLower.includes('national team'))) {
                    isRelevant = true;
                } else if (division === 'International' && (nameLower.includes('caf') || nameLower.includes('cosafa') || nameLower.includes('international') || nameLower.includes('champions league'))) {
                    isRelevant = true;
                }

                if (isRelevant) {
                    const recentResults = (comp.results || []).filter(r => new Date(r.fullDate || '') >= sevenDaysAgo);
                    const upcomingFixtures = (comp.fixtures || []).filter(f => new Date(f.fullDate || '') >= new Date() && new Date(f.fullDate || '') <= new Date(new Date().setDate(new Date().getDate() + 7)));

                    if (recentResults.length > 0 || upcomingFixtures.length > 0) {
                        foundData = true;
                        relevantText += `\nCompetition: ${comp.name}\n`;
                        
                        if (recentResults.length > 0) {
                            relevantText += "Results:\n";
                            recentResults.forEach(r => relevantText += `- ${r.teamA} ${r.scoreA}-${r.scoreB} ${r.teamB} (${r.fullDate})\n`);
                        }
                        
                        if (upcomingFixtures.length > 0) {
                            relevantText += "Upcoming:\n";
                            upcomingFixtures.forEach(f => relevantText += `- ${f.teamA} vs ${f.teamB} (${f.fullDate} @ ${f.time})\n`);
                        }
                    }
                }
            });

            if (!foundData) {
                relevantText += "No specific match data found in the database for this period. Please enter key highlights manually.";
            }

            setContextData(relevantText);
        } catch (error) {
            console.error("Error fetching data:", error);
            alert("Failed to auto-fetch data.");
        } finally {
            setIsFetchingData(false);
        }
    };

    const handleGenerate = async () => {
        if (!contextData.trim()) {
            alert("Please enter some context or fetch recent data first.");
            return;
        }

        setIsGenerating(true);
        setGeneratedContent([]);
        setSavedAsNews(false);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            let prompt = "";

            if (contentType === 'captions') {
                prompt = `You are a social media manager for Football Eswatini. Create 5 distinct, engaging social media posts (under 140 characters each) based on the following data. 
                Section: ${division}.
                Context: ${contextData}
                
                Style: Exciting, use emojis, use hashtags like #FootballEswatini #${division.replace(/\s/g, '')}.
                Output format: Just the 5 captions separated by a "|||" delimiter. Do not number them.`;
            } else {
                prompt = `You are a sports journalist for Football Eswatini. Write a comprehensive "Weekly Wrap-Up" summary article for the ${division} based on the following data.
                Context: ${contextData}
                
                Style: Professional, engaging, journalistic. Highlight big wins, upsets, and upcoming key matches. Length: 150-250 words.
                Output format: A single markdown-formatted article body.`;
            }

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });

            const text = response.text || "";
            
            if (contentType === 'captions') {
                const captions = text.split('|||').map(c => c.trim()).filter(c => c.length > 0);
                setGeneratedContent(captions);
            } else {
                setGeneratedContent([text]);
            }

        } catch (error) {
            console.error("AI Generation failed:", error);
            alert("Failed to generate content. Please check your API key configuration.");
        } finally {
            setIsGenerating(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        alert("Copied to clipboard!");
    };

    const saveAsNews = async () => {
        if (generatedContent.length === 0) return;
        
        try {
            const today = new Date();
            const summary = generatedContent[0].substring(0, 150) + "...";
            
            // Map division to general news category
            let category: string[] = ['National'];
            if (division === 'International') category = ['International'];
            else if (division === 'National Team') category = ['National', 'International'];
            
            await addDoc(collection(db, "news"), {
                title: `${division}: Weekly Update`,
                date: today.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
                content: generatedContent[0],
                summary: summary,
                image: 'https://images.unsplash.com/photo-1522778119026-d647f0565c79?auto=format&fit=crop&w=800&q=80', // Generic football image
                category: category,
                url: `/news/update-${division.toLowerCase().replace(/\s/g, '-')}-${Date.now()}`
            });
            setSavedAsNews(true);
            alert("Draft saved to News section!");
        } catch (error) {
            console.error("Error saving news:", error);
            alert("Failed to save news article.");
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
            {/* Left Column: Configuration */}
            <Card className="shadow-lg h-fit">
                <CardContent className="p-6 space-y-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="bg-purple-100 p-3 rounded-full">
                            <SparklesIcon className="w-6 h-6 text-purple-600" />
                        </div>
                        <h3 className="text-2xl font-bold font-display text-gray-800">Social & Content Gen</h3>
                    </div>
                    <p className="text-sm text-gray-600">
                        Generate social media captions or weekly summaries using AI. Select your parameters and fetch real data or paste your own notes.
                    </p>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Division / Section</label>
                            <select 
                                value={division} 
                                onChange={(e) => setDivision(e.target.value as DivisionType)}
                                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                            >
                                <option value="International">International</option>
                                <option value="MTN Premier League">MTN Premier League</option>
                                <option value="National First Division League">National First Division</option>
                                <option value="Regional">Regional</option>
                                <option value="Cups">Cups</option>
                                <option value="National Team">National Team</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Content Type</label>
                            <select 
                                value={contentType} 
                                onChange={(e) => { setContentType(e.target.value as ContentType); setGeneratedContent([]); }}
                                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                            >
                                <option value="captions">Social Media Captions</option>
                                <option value="summary">Weekly Summary Article</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="block text-sm font-bold text-gray-700">Context & Key Details</label>
                            <button 
                                onClick={fetchRecentData} 
                                disabled={isFetchingData}
                                className="text-xs flex items-center gap-1 text-blue-600 hover:text-blue-800 disabled:opacity-50"
                            >
                                {isFetchingData ? <Spinner className="w-3 h-3 border-blue-600 border-2" /> : <RefreshIcon className="w-3 h-3" />}
                                Fetch Last 7 Days Data
                            </button>
                        </div>
                        <textarea 
                            rows={8} 
                            value={contextData} 
                            onChange={(e) => setContextData(e.target.value)}
                            placeholder={`Enter match results, player names, or key moments here...\n\nExample:\n- Highlanders beat Swallows 2-1\n- Moloto scored winning goal in 90th min\n- Green Mamba stays top of table`}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm font-mono"
                        />
                    </div>

                    <Button 
                        onClick={handleGenerate} 
                        disabled={isGenerating || !contextData} 
                        className="w-full bg-purple-600 text-white hover:bg-purple-700 flex justify-center items-center gap-2 h-11"
                    >
                        {isGenerating ? <Spinner className="w-5 h-5 border-2" /> : <><SparklesIcon className="w-5 h-5" /> Generate Content</>}
                    </Button>
                </CardContent>
            </Card>

            {/* Right Column: Output */}
            <Card className="shadow-lg bg-gray-50 border-2 border-dashed border-gray-200 min-h-[400px]">
                <CardContent className="p-6 h-full flex flex-col">
                    <h3 className="text-lg font-bold font-display text-gray-700 mb-4">Generated Output</h3>
                    
                    {generatedContent.length === 0 ? (
                        <div className="flex-grow flex flex-col items-center justify-center text-gray-400">
                            <SparklesIcon className="w-12 h-12 mb-2 opacity-20" />
                            <p className="text-sm">Content will appear here.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {contentType === 'captions' ? (
                                generatedContent.map((caption, idx) => (
                                    <div key={idx} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex gap-3 items-start group">
                                        <div className="flex-grow text-gray-800 text-sm">{caption}</div>
                                        <button 
                                            onClick={() => copyToClipboard(caption)}
                                            className="text-gray-400 hover:text-purple-600 p-1 rounded hover:bg-purple-50 transition-colors"
                                            title="Copy to Clipboard"
                                        >
                                            <CopyIcon className="w-5 h-5" />
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                                    <div className="prose prose-sm max-w-none text-gray-800 whitespace-pre-wrap">
                                        {generatedContent[0]}
                                    </div>
                                    <div className="mt-6 flex gap-3 justify-end pt-4 border-t">
                                        <Button 
                                            onClick={() => copyToClipboard(generatedContent[0])} 
                                            className="bg-gray-200 text-gray-800 hover:bg-gray-300 text-xs"
                                        >
                                            <CopyIcon className="w-4 h-4 mr-1 inline" /> Copy Text
                                        </Button>
                                        <Button 
                                            onClick={saveAsNews} 
                                            disabled={savedAsNews}
                                            className="bg-green-600 text-white hover:bg-green-700 text-xs"
                                        >
                                            {savedAsNews ? <span className="flex items-center gap-1">Saved <SaveIcon className="w-3 h-3"/></span> : "Save as News Article"}
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default SocialMediaGenerator;
