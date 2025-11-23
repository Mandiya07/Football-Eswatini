
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Card, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';
import CopyIcon from '../icons/CopyIcon';
import SparklesIcon from '../icons/SparklesIcon';
import RefreshIcon from '../icons/RefreshIcon';
import SaveIcon from '../icons/SaveIcon';
import PhotoIcon from '../icons/PhotoIcon';
import DownloadIcon from '../icons/DownloadIcon';
import { fetchAllCompetitions } from '../../services/api';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../../services/firebase';

type DivisionType = 'International' | 'MTN Premier League' | 'National First Division League' | 'Regional' | 'Cups' | 'National Team';
type ContentType = 'captions' | 'summary' | 'image';

interface SocialMatch {
    id: string;
    type: 'result' | 'fixture';
    teamA: string;
    teamB: string;
    teamACrest?: string;
    teamBCrest?: string;
    scoreA?: number;
    scoreB?: number;
    date: string;
    time?: string;
    competition: string;
    competitionLogoUrl?: string;
    venue?: string;
    matchday?: number;
}

const SocialMediaGenerator: React.FC = () => {
    const [division, setDivision] = useState<DivisionType>('MTN Premier League');
    const [contentType, setContentType] = useState<ContentType>('captions');
    const [contextData, setContextData] = useState('');
    const [generatedContent, setGeneratedContent] = useState<string[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isFetchingData, setIsFetchingData] = useState(false);
    const [savedAsNews, setSavedAsNews] = useState(false);
    
    // Image Gen State
    const [rawMatches, setRawMatches] = useState<SocialMatch[]>([]);
    const [selectedMatchIds, setSelectedMatchIds] = useState<string[]>([]);
    const [imageCache, setImageCache] = useState<Map<string, HTMLImageElement>>(new Map());
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Helper to normalize team names for loose matching
    const normalizeName = (name: string) => name.trim().toLowerCase().replace(/\s+fc$/i, '').replace(/\s+football club$/i, '').trim();

    // Helper to format dates
    const formatMatchDate = (dateStr: string) => {
        try {
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return dateStr;
            return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
        } catch { return dateStr; }
    };

    const fetchRecentData = async () => {
        setIsFetchingData(true);
        try {
            const allComps = await fetchAllCompetitions();
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            
            let relevantText = `Recent results and fixtures for ${division} (Last 7 days):\n`;
            let foundData = false;
            const extractedMatches: SocialMatch[] = [];

            Object.values(allComps).forEach(comp => {
                let isRelevant = false;
                const nameLower = comp.name.toLowerCase();
                const catLower = (comp.categoryId || '').toLowerCase();
                
                if (division === 'MTN Premier League' && (nameLower.includes('premier') || nameLower.includes('mtn'))) isRelevant = true;
                else if (division === 'National First Division League' && (nameLower.includes('first division') || nameLower.includes('nfd'))) isRelevant = true;
                else if (division === 'Regional' && (nameLower.includes('regional') || nameLower.includes('super league'))) isRelevant = true;
                else if (division === 'Cups' && (nameLower.includes('cup') || nameLower.includes('tournament'))) isRelevant = true;
                else if (division === 'National Team' && (catLower === 'national-teams' || nameLower.includes('sihlangu'))) isRelevant = true;
                else if (division === 'International' && (nameLower.includes('caf') || nameLower.includes('cosafa'))) isRelevant = true;

                if (isRelevant) {
                    const recentResults = (comp.results || []).filter(r => new Date(r.fullDate || '') >= sevenDaysAgo);
                    const upcomingFixtures = (comp.fixtures || []).filter(f => new Date(f.fullDate || '') >= new Date() && new Date(f.fullDate || '') <= new Date(new Date().setDate(new Date().getDate() + 7)));

                    // Build robust map for crests with multiple key variations
                    const teamCrestMap = new Map<string, string>();
                    (comp.teams || []).forEach(t => {
                        if (t.crestUrl) {
                            teamCrestMap.set(t.name, t.crestUrl);
                            teamCrestMap.set(t.name.toLowerCase(), t.crestUrl);
                            teamCrestMap.set(t.name.trim(), t.crestUrl);
                            teamCrestMap.set(normalizeName(t.name), t.crestUrl);
                        }
                    });

                    const getCrest = (name: string) => {
                        if (!name) return undefined;
                        return teamCrestMap.get(name) || 
                               teamCrestMap.get(name.trim()) || 
                               teamCrestMap.get(name.toLowerCase()) || 
                               teamCrestMap.get(normalizeName(name));
                    };

                    if (recentResults.length > 0 || upcomingFixtures.length > 0) {
                        foundData = true;
                        relevantText += `\nCompetition: ${comp.name}\n`;
                        
                        recentResults.forEach(r => {
                            relevantText += `- ${r.teamA} ${r.scoreA}-${r.scoreB} ${r.teamB} (${r.fullDate})\n`;
                            extractedMatches.push({
                                id: `res-${r.id}`,
                                type: 'result',
                                teamA: r.teamA,
                                teamB: r.teamB,
                                teamACrest: getCrest(r.teamA),
                                teamBCrest: getCrest(r.teamB),
                                scoreA: r.scoreA,
                                scoreB: r.scoreB,
                                date: formatMatchDate(r.fullDate || ''),
                                competition: comp.name,
                                competitionLogoUrl: comp.logoUrl,
                                venue: r.venue,
                                matchday: r.matchday
                            });
                        });
                        
                        upcomingFixtures.forEach(f => {
                            relevantText += `- ${f.teamA} vs ${f.teamB} (${f.fullDate} @ ${f.time})\n`;
                            extractedMatches.push({
                                id: `fix-${f.id}`,
                                type: 'fixture',
                                teamA: f.teamA,
                                teamB: f.teamB,
                                teamACrest: getCrest(f.teamA),
                                teamBCrest: getCrest(f.teamB),
                                date: formatMatchDate(f.fullDate || ''),
                                time: f.time,
                                competition: comp.name,
                                competitionLogoUrl: comp.logoUrl,
                                venue: f.venue,
                                matchday: f.matchday
                            });
                        });
                    }
                }
            });

            if (!foundData) {
                relevantText += "No specific match data found in the database for this period.";
            }

            setContextData(relevantText);
            setRawMatches(extractedMatches);
            // Select the first match by default if available
            if (extractedMatches.length > 0) {
                setSelectedMatchIds([extractedMatches[0].id]);
            } else {
                setSelectedMatchIds([]);
            }
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
            alert("Failed to generate content. Check API key.");
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
            
            let category: string[] = ['National'];
            if (division === 'International') category = ['International'];
            else if (division === 'National Team') category = ['National', 'International'];
            
            await addDoc(collection(db, "news"), {
                title: `${division}: Weekly Update`,
                date: today.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
                content: generatedContent[0],
                summary: summary,
                image: 'https://images.unsplash.com/photo-1522778119026-d647f0565c79?auto=format&fit=crop&w=800&q=80',
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

    // --- IMAGE GENERATION LOGIC ---

    const handleMatchSelection = (id: string) => {
        setSelectedMatchIds(prev => {
            if (prev.includes(id)) return prev.filter(pid => pid !== id);
            return [...prev, id];
        });
    };

    // Load Images
    useEffect(() => {
        const loadImages = async () => {
            const matches = rawMatches.filter(m => selectedMatchIds.includes(m.id));
            const urlsToLoad = new Set<string>();
            const newCache = new Map(imageCache);
            let needsUpdate = false;

            matches.forEach(m => {
                if (m.teamACrest) urlsToLoad.add(m.teamACrest);
                if (m.teamBCrest) urlsToLoad.add(m.teamBCrest);
                if (m.competitionLogoUrl) urlsToLoad.add(m.competitionLogoUrl);
            });

            const promises: Promise<void>[] = [];

            urlsToLoad.forEach(url => {
                if (!newCache.has(url)) {
                    needsUpdate = true;
                    promises.push(new Promise((resolve) => {
                        const img = new Image();
                        img.crossOrigin = "anonymous"; // Crucial for canvas
                        img.onload = () => {
                            newCache.set(url, img);
                            resolve();
                        };
                        img.onerror = () => {
                            console.warn("Failed to load image:", url);
                            resolve();
                        };
                        img.src = url;
                    }));
                }
            });

            if (needsUpdate) {
                await Promise.all(promises);
                setImageCache(newCache);
            }
        };

        if (contentType === 'image' && selectedMatchIds.length > 0) {
            loadImages();
        }
    }, [selectedMatchIds, rawMatches, contentType]);

    // Draw Canvas
    useEffect(() => {
        if (contentType === 'image' && selectedMatchIds.length > 0 && canvasRef.current) {
            const matches = rawMatches.filter(m => selectedMatchIds.includes(m.id));
            if (matches.length > 0) {
                drawCanvas(matches);
            }
        }
    }, [contentType, selectedMatchIds, rawMatches, imageCache]);

    // Helper for rounded rectangles
    const fillRoundedRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + w, y, x + w, y + h, r);
        ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r);
        ctx.arcTo(x, y, x + w, y, r);
        ctx.closePath();
        ctx.fill();
    };

    const drawCanvas = (matches: SocialMatch[]) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Portrait Dimensions
        const width = 1080;
        const height = 1350;
        canvas.width = width;
        canvas.height = height;

        // 1. Background: Football Eswatini Blue
        const gradient = ctx.createLinearGradient(0, 0, width, height);
        gradient.addColorStop(0, '#001e5a'); // Deep Blue
        gradient.addColorStop(0.5, '#002B7F'); // Primary Blue
        gradient.addColorStop(1, '#1a4a9f'); // Light Blue
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        // 2. Pattern Overlay (Diagonal Lines)
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
        ctx.lineWidth = 3;
        for (let i = -width; i < width * 2; i += 30) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i - 300, height);
            ctx.stroke();
        }
        ctx.restore();

        if (matches.length === 1) {
            drawSingleMatch(ctx, matches[0], width, height);
        } else {
            drawMultiMatch(ctx, matches, width, height);
        }

        // Footer
        drawFooter(ctx, width, height);
    };

    const drawSingleMatch = (ctx: CanvasRenderingContext2D, match: SocialMatch, width: number, height: number) => {
        const centerX = width / 2;

        // -- 1. League Logo (Top) --
        const leagueLogo = match.competitionLogoUrl ? imageCache.get(match.competitionLogoUrl) : null;
        if (leagueLogo) {
            const lSize = 120;
            const ratio = Math.min(lSize / leagueLogo.width, lSize / leagueLogo.height);
            const lw = leagueLogo.width * ratio;
            const lh = leagueLogo.height * ratio;
            ctx.save();
            ctx.shadowColor = 'rgba(0,0,0,0.3)';
            ctx.shadowBlur = 10;
            ctx.drawImage(leagueLogo, centerX - lw/2, 60, lw, lh);
            ctx.restore();
        }

        // -- 2. League Name --
        ctx.fillStyle = '#FDB913'; // Eswatini Yellow
        ctx.font = 'bold 24px "Poppins", sans-serif';
        ctx.textAlign = 'center';
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 4;
        ctx.fillText(match.competition.toUpperCase(), centerX, 210);
        ctx.shadowBlur = 0;

        // -- 3. Matchday / Status --
        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        fillRoundedRect(ctx, centerX - 200, 240, 400, 50, 25); // Pill background
        
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '800 28px "Poppins", sans-serif';
        let label = "MATCHDAY";
        if (match.type === 'result') {
            label = "FULL TIME";
            if (match.matchday) label += ` • MATCHDAY ${match.matchday}`;
        } else {
            if (match.matchday) label = `MATCHDAY ${match.matchday}`;
        }
        ctx.fillText(label, centerX, 276);

        // -- 4. Teams Layout (Vertical Split) --
        const crestSize = 220; // Reduced slightly for better spacing
        
        const imgA = match.teamACrest ? imageCache.get(match.teamACrest) : null;
        const imgB = match.teamBCrest ? imageCache.get(match.teamBCrest) : null;

        // Home Team (Upper Section) - Moved UP to avoid center overlap
        const homeY = 420; 
        if (imgA) {
            const r = Math.min(crestSize / imgA.width, crestSize / imgA.height);
            const w = imgA.width * r;
            const h = imgA.height * r;
            ctx.save();
            ctx.shadowColor = 'rgba(0,0,0,0.4)';
            ctx.shadowBlur = 25;
            ctx.drawImage(imgA, centerX - w/2, homeY - h/2, w, h);
            ctx.restore();
        } else {
            ctx.beginPath();
            ctx.arc(centerX, homeY, 100, 0, Math.PI*2);
            ctx.fillStyle = 'rgba(255,255,255,0.1)';
            ctx.fill();
        }
        
        // Home Name
        ctx.font = '900 42px "Inter", sans-serif';
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(match.teamA, centerX, homeY + 140); // y = 560

        // Away Team (Lower Section) - Moved DOWN
        const awayY = 1000;
        if (imgB) {
            const r = Math.min(crestSize / imgB.width, crestSize / imgB.height);
            const w = imgB.width * r;
            const h = imgB.height * r;
            ctx.save();
            ctx.shadowColor = 'rgba(0,0,0,0.4)';
            ctx.shadowBlur = 25;
            ctx.drawImage(imgB, centerX - w/2, awayY - h/2, w, h);
            ctx.restore();
        } else {
            ctx.beginPath();
            ctx.arc(centerX, awayY, 100, 0, Math.PI*2);
            ctx.fillStyle = 'rgba(255,255,255,0.1)';
            ctx.fill();
        }

        // Away Name
        ctx.font = '900 42px "Inter", sans-serif';
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(match.teamB, centerX, awayY + 140); // y = 1140

        // -- 5. Center VS / Score --
        const midY = 710; // Fixed midpoint
        
        if (match.type === 'result') {
            // Score Box
            ctx.fillStyle = '#FDB913';
            ctx.shadowColor = 'rgba(0,0,0,0.5)';
            ctx.shadowBlur = 20;
            fillRoundedRect(ctx, centerX - 140, midY - 70, 280, 140, 20);
            
            ctx.fillStyle = '#002B7F';
            ctx.font = '900 90px "Poppins", sans-serif';
            ctx.fillText(`${match.scoreA}-${match.scoreB}`, centerX, midY + 35);
        } else {
            // VS Circle
            ctx.fillStyle = '#FFFFFF';
            ctx.shadowColor = 'rgba(0,0,0,0.3)';
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.arc(centerX, midY, 60, 0, Math.PI*2);
            ctx.fill();
            
            ctx.fillStyle = '#002B7F';
            ctx.font = 'italic 900 48px "Poppins", sans-serif';
            ctx.fillText("VS", centerX, midY + 18);
        }

        // -- 6. Info Footer (Date/Time) --
        const infoY = 1220;
        ctx.font = '600 28px "Inter", sans-serif';
        ctx.fillStyle = '#CCCCCC';
        const dateInfo = match.type === 'fixture' ? `${match.date} • ${match.time}` : match.date;
        ctx.fillText(dateInfo, centerX, infoY);
        
        if (match.venue) {
            ctx.font = '500 24px "Inter", sans-serif';
            ctx.fillText(match.venue, centerX, infoY + 40);
        }
    };

    const drawMultiMatch = (ctx: CanvasRenderingContext2D, matches: SocialMatch[], width: number, height: number) => {
        const centerX = width / 2;

        // -- Header --
        const leagueName = matches[0].competition.toUpperCase();
        const logoUrl = matches[0].competitionLogoUrl;
        
        if (logoUrl) {
            const img = imageCache.get(logoUrl);
            if (img) {
                const size = 100;
                const ratio = Math.min(size/img.width, size/img.height);
                ctx.drawImage(img, centerX - (img.width*ratio)/2, 50, img.width*ratio, img.height*ratio);
            }
        }

        ctx.textAlign = 'center';
        ctx.font = 'bold 28px "Poppins", sans-serif';
        ctx.fillStyle = '#FDB913';
        ctx.fillText(leagueName, centerX, 190);
        
        // Title Logic
        const distinctMatchdays = new Set(matches.map(m => m.matchday).filter(Boolean));
        let title = matches[0].type === 'result' ? 'MATCH RESULTS' : 'UPCOMING FIXTURES';
        if (distinctMatchdays.size === 1) {
            title = `MATCHDAY ${Array.from(distinctMatchdays)[0]} ${matches[0].type === 'result' ? 'RESULTS' : 'FIXTURES'}`;
        }

        ctx.font = '900 50px "Poppins", sans-serif';
        ctx.fillStyle = '#FFFFFF';
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 4;
        ctx.fillText(title, centerX, 250);
        ctx.shadowBlur = 0;

        // -- List Layout --
        const rowHeight = 100;
        const maxRows = 8; 
        const spacing = 20;
        const visibleMatches = matches.slice(0, maxRows);

        // Dynamic Centering Logic
        const headerBoundary = 290; // Bottom of header content
        const footerBoundary = height - 90; // Top of footer content
        const drawingArea = footerBoundary - headerBoundary;
        const contentHeight = (visibleMatches.length * rowHeight) + ((Math.max(0, visibleMatches.length - 1)) * spacing);
        
        let currentY = headerBoundary + (drawingArea - contentHeight) / 2;
        
        // Safety clamp to ensure it doesn't overlap header if list is full
        if (currentY < headerBoundary + 10) currentY = headerBoundary + 10;

        visibleMatches.forEach((m, i) => {
            const y = currentY + (i * (rowHeight + spacing));
            
            // Row Background
            ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
            fillRoundedRect(ctx, 60, y, width - 120, rowHeight, 15);

            const rowCenterY = y + rowHeight/2;

            // Team A (Left)
            const imgA = m.teamACrest ? imageCache.get(m.teamACrest) : null;
            if (imgA) {
                const s = 60;
                const r = Math.min(s/imgA.width, s/imgA.height);
                ctx.drawImage(imgA, 80, rowCenterY - (imgA.height*r)/2, imgA.width*r, imgA.height*r);
            }
            
            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 26px "Inter", sans-serif';
            ctx.textAlign = 'left';
            // Truncate name if too long
            let nameA = m.teamA;
            if (nameA.length > 15) nameA = nameA.substring(0, 13) + '..';
            ctx.fillText(nameA, 160, rowCenterY + 10);

            // Center Info Group
            ctx.textAlign = 'center';

            // 1. Date (Top of center)
            ctx.fillStyle = '#CCCCCC'; // Light gray
            ctx.font = '600 13px "Inter", sans-serif';
            ctx.fillText(m.date, centerX, rowCenterY - 22);

            // 2. Score / Time (Middle)
            if (m.type === 'result') {
                ctx.fillStyle = '#FDB913';
                ctx.font = '900 36px "Poppins", sans-serif';
                ctx.fillText(`${m.scoreA}-${m.scoreB}`, centerX, rowCenterY + 12);
            } else {
                ctx.fillStyle = '#FFFFFF';
                ctx.font = 'bold 32px "Poppins", sans-serif';
                ctx.fillText(m.time || 'VS', centerX, rowCenterY + 10);
            }

            // 3. Venue (Bottom of center)
            if (m.venue) {
                ctx.fillStyle = '#888888'; // Dimmer gray
                ctx.font = '500 11px "Inter", sans-serif';
                let venueText = m.venue;
                if (venueText.length > 25) venueText = venueText.substring(0, 23) + '..'; // Slightly tighter truncation for list
                ctx.fillText(venueText, centerX, rowCenterY + 32);
            }

            // Team B (Right)
            const imgB = m.teamBCrest ? imageCache.get(m.teamBCrest) : null;
            if (imgB) {
                const s = 60;
                const r = Math.min(s/imgB.width, s/imgB.height);
                ctx.drawImage(imgB, width - 80 - (imgB.width*r), rowCenterY - (imgB.height*r)/2, imgB.width*r, imgB.height*r);
            }
            
            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 26px "Inter", sans-serif';
            ctx.textAlign = 'right';
            let nameB = m.teamB;
            if (nameB.length > 15) nameB = nameB.substring(0, 13) + '..';
            ctx.fillText(nameB, width - 160, rowCenterY + 10);
        });
    };

    const drawFooter = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
        const footerH = 80;
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, height - footerH, width, footerH);
        
        ctx.save();
        ctx.font = 'bold 30px "Inter", sans-serif';
        ctx.fillStyle = '#FFFFFF';
        ctx.textAlign = 'center';
        ctx.fillText("FOOTBALL ESWATINI", width / 2, height - 28);
        
        ctx.fillStyle = '#D22730'; // Red Accent Line
        ctx.fillRect(0, height - footerH, width, 6);
        ctx.restore();
    };

    const downloadImage = () => {
        const canvas = canvasRef.current;
        if (canvas) {
            const link = document.createElement('a');
            link.download = `fe-social-graphic-${Date.now()}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
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
                        Generate social media captions, summaries, or visual graphics (Portrait). Select your parameters and fetch real data.
                    </p>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Division</label>
                            <select 
                                value={division} 
                                onChange={(e) => setDivision(e.target.value as DivisionType)}
                                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                            >
                                <option value="International">International</option>
                                <option value="MTN Premier League">MTN Premier League</option>
                                <option value="National First Division League">NFD</option>
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
                                <option value="captions">Captions</option>
                                <option value="summary">Summary</option>
                                <option value="image">Image Graphic (Portrait)</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="block text-sm font-bold text-gray-700">Data Source</label>
                            <button 
                                onClick={fetchRecentData} 
                                disabled={isFetchingData}
                                className="text-xs flex items-center gap-1 text-blue-600 hover:text-blue-800 disabled:opacity-50"
                            >
                                {isFetchingData ? <Spinner className="w-3 h-3 border-blue-600 border-2" /> : <RefreshIcon className="w-3 h-3" />}
                                Fetch Data
                            </button>
                        </div>
                        
                        {contentType === 'image' ? (
                            <div className="space-y-4">
                                {rawMatches.length > 0 ? (
                                    <div className="border rounded-md max-h-60 overflow-y-auto bg-white">
                                        {rawMatches.map(m => (
                                            <label key={m.id} className={`flex items-center p-2 border-b last:border-b-0 hover:bg-gray-50 cursor-pointer ${selectedMatchIds.includes(m.id) ? 'bg-blue-50' : ''}`}>
                                                <input 
                                                    type="checkbox"
                                                    checked={selectedMatchIds.includes(m.id)}
                                                    onChange={() => handleMatchSelection(m.id)}
                                                    className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 mr-3"
                                                />
                                                <div className="text-xs">
                                                    <span className="font-bold">{m.type === 'result' ? `[RESULT]` : `[FIXTURE]`}</span> {m.teamA} {m.type === 'result' ? `${m.scoreA}-${m.scoreB}` : 'vs'} {m.teamB} {m.matchday && <span className="text-gray-500 ml-1">(MD {m.matchday})</span>}
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-red-500 bg-red-50 p-2 rounded">No matches found. Please fetch data.</p>
                                )}
                                <p className="text-xs text-gray-500">
                                    Select one match for a feature graphic, or multiple for a list view.
                                </p>
                            </div>
                        ) : (
                            <textarea 
                                rows={8} 
                                value={contextData} 
                                onChange={(e) => setContextData(e.target.value)}
                                placeholder={`Enter match results...`}
                                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm font-mono"
                            />
                        )}
                    </div>

                    {contentType !== 'image' && (
                        <Button 
                            onClick={handleGenerate} 
                            disabled={isGenerating || !contextData} 
                            className="w-full bg-purple-600 text-white hover:bg-purple-700 flex justify-center items-center gap-2 h-11"
                        >
                            {isGenerating ? <Spinner className="w-5 h-5 border-2" /> : <><SparklesIcon className="w-5 h-5" /> Generate Content</>}
                        </Button>
                    )}
                </CardContent>
            </Card>

            {/* Right Column: Output */}
            <Card className="shadow-lg bg-gray-50 border-2 border-dashed border-gray-200 min-h-[400px]">
                <CardContent className="p-6 h-full flex flex-col">
                    <h3 className="text-lg font-bold font-display text-gray-700 mb-4">
                        {contentType === 'image' ? 'Image Preview' : 'Generated Output'}
                    </h3>
                    
                    {contentType === 'image' ? (
                        <div className="flex flex-col items-center gap-4 h-full">
                            {selectedMatchIds.length > 0 ? (
                                <>
                                    <div className="relative w-full bg-gray-200 rounded shadow-sm overflow-hidden max-w-[400px]" style={{ aspectRatio: '4/5' }}>
                                        <canvas ref={canvasRef} className="w-full h-full object-contain" />
                                    </div>
                                    <Button onClick={downloadImage} className="bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2">
                                        <DownloadIcon className="w-5 h-5" /> Download PNG
                                    </Button>
                                </>
                            ) : (
                                <div className="flex-grow flex flex-col items-center justify-center text-gray-400">
                                    <PhotoIcon className="w-12 h-12 mb-2 opacity-20" />
                                    <p className="text-sm">Select matches to render image.</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <>
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
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default SocialMediaGenerator;
