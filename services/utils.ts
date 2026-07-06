
import { Team, CompetitionFixture, MatchEvent, Player, PlayerStats } from '../data/teams';
import { DirectoryEntity } from '../data/directory';

export interface ScorerRecord {
    name: string;
    teamName: string;
    goals: number;
    assists?: number;
    appearances?: number;
    potmWins: number;
    crestUrl: string;
    playerId: string;
    score: number;
}

export const pcmToWav = (pcmBase64: string, sampleRate: number = 24000): string => {
    const binaryString = window.atob(pcmBase64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    
    // Create WAV header
    const wavBuffer = new ArrayBuffer(44 + len);
    const view = new DataView(wavBuffer);
    
    const writeString = (view: DataView, offset: number, string: string) => {
        for (let i = 0; i < string.length; i++) {
            view.setUint8(offset + i, string.charCodeAt(i));
        }
    };
    
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + len, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true); // 1 channel (mono)
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(view, 36, 'data');
    view.setUint32(40, len, true);
    
    // Copy PCM data
    const wavBytes = new Uint8Array(wavBuffer);
    wavBytes.set(bytes, 44);
    
    let binary = '';
    // Process in chunks to avoid call stack size limits
    const chunkSize = 8192;
    for (let i = 0; i < wavBytes.length; i += chunkSize) {
        const chunk = wavBytes.subarray(i, i + chunkSize);
        binary += String.fromCharCode.apply(null, chunk as unknown as number[]);
    }
    return window.btoa(binary);
};

export const parseScore = (s: string | number | undefined | null) => {
    if (s === undefined || s === null || s === '') return { main: 0, pens: 0 };
    const clean = String(s).replace(/\s+/g, '');
    const match = clean.match(/^(\d+)(?:\((\d+)\))?$/);
    if (!match) {
        const n = parseInt(clean);
        return { main: isNaN(n) ? 0 : n, pens: 0 };
    }
    return {
        main: parseInt(match[1]) || 0,
        pens: parseInt(match[2]) || 0
    };
};

export const superNormalize = (s: string) => {
    if (!s) return '';
    return s.toLowerCase()
        .replace(/[^a-z0-9]/g, '') 
        .trim();
};

/**
 * Deep clones an object while handling circular references by replacing them with "[Circular]".
 */
export const makePlain = (obj: any, seen: WeakSet<any> = new WeakSet()): any => {
    // Return primitives directly
    if (obj === null || typeof obj !== 'object') return obj;

    // Handle circular references early
    if (seen.has(obj)) return "[Circular]";
    seen.add(obj);

    // Handle Dates and other standard types
    if (obj instanceof Date) return obj.toISOString();
    if (obj instanceof Map) return Array.from(obj.entries()).map(([k, v]) => [k, makePlain(v, seen)]);
    if (obj instanceof Set) return Array.from(obj).map(item => makePlain(item, seen));

    // Only process plain objects or arrays.
    // If it's a non-plain object (like a complex class instance from Firebase), 
    // try to convert to a plain object or return a string description.
    
    // Check if it's an array
    if (Array.isArray(obj)) {
        return obj.map(item => makePlain(item, seen));
    }

    // Attempt to convert to a plain object by copying properties
    // This ignores prototype properties.
    const newObj: any = {};
    for (const key of Object.keys(obj)) {
        const val = obj[key];
        // Skip functions and internal-looking properties
        if (typeof val === 'function') continue;
        
        // Always safe stringify values that look like Firestore internal objects
        // We match by checking if constructor name is small and obfuscated 
        // to catch other SDK objects or we just let recursive makePlain handle it
        if (typeof val === 'object' && val !== null && val.constructor && val.constructor.name !== 'Object' && val.constructor.name !== 'Array') {
            newObj[key] = `[Object: ${val.constructor.name}]`;
        } else {
            newObj[key] = makePlain(val, seen);
        }
    }
    return newObj;
};

export const safeJSONStringify = (obj: any, replacer?: (this: any, key: string, value: any) => any, space?: string | number): string => {
    const seen = new WeakSet();
    const circularReplacer = (key: string, value: any) => {
        if (typeof value === "object" && value !== null) {
            if (seen.has(value)) {
                return "[Circular]";
            }
            seen.add(value);
        }
        return replacer ? replacer.call(this, key, value) : value;
    };
    
    try {
        // Use makePlain first to sanitize for JSON.stringify, then use replacer for double safety
        return JSON.stringify(makePlain(obj), circularReplacer, space);
    } catch (e) {
        console.error("safeJSONStringify final failure:", e);
        return JSON.stringify({ error: "Serialization failed" });
    }
};

export const generateStableId = (name: string): string => {
    let hash = 0;
    const str = superNormalize(name);
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash |= 0;
    }
    return String(Math.abs(hash));
};

export const normalizeTeamName = (rawName: string, officialNames: string[]): string | null => {
    if (!rawName) return null;
    const normRaw = superNormalize(rawName);
    for (const official of officialNames) {
        if (superNormalize(official) === normRaw) return official;
    }
    return null;
};

export const removeUndefinedProps = (obj: any): any => {
    if (obj === null || obj === undefined) return obj;
    if (Array.isArray(obj)) return obj.map(item => removeUndefinedProps(item)).filter(item => item !== undefined);
    if (typeof obj !== 'object' || obj.constructor !== Object) return obj;
    const newObj: { [key: string]: any } = {};
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            const value = obj[key];
            if (value !== undefined) {
                const cleanedValue = removeUndefinedProps(value);
                if (cleanedValue !== undefined) newObj[key] = cleanedValue;
            }
        }
    }
    return newObj;
};

export const findInMap = (name: string, map: Map<string, DirectoryEntity>): DirectoryEntity | undefined => {
    if (!name) return undefined;
    const target = superNormalize(name);
    for (const entry of map.values()) {
        if (superNormalize(entry.name) === target) return entry;
    }
    return undefined;
};

/**
 * MASTER PLAYER RECONCILIATION ENGINE (v14.0 - CONTEXT AWARE)
 * @param mode 'career' (includes manual baselines) or 'competition' (purely from match logs)
 */
export const reconcilePlayers = (
    baseTeams: Team[], 
    allMatches: CompetitionFixture[], 
    mode: 'career' | 'competition' = 'career'
): Team[] => {
    const teamsMap = new Map<string, Team>();
    
    // 1. INITIALIZE TEAMS & ROSTERS
    baseTeams.forEach(incoming => {
        const normName = superNormalize(incoming.name);
        if (!teamsMap.has(normName)) {
            // Manual deep clone to avoid circular structure errors with JSON.stringify
            const masterTeam: Team = {
                ...incoming,
                stats: { ...incoming.stats },
                players: (incoming.players || []).map(p => ({
                    ...p,
                    bio: p.bio,
                    baseStats: p.baseStats ? { ...p.baseStats } : undefined,
                    stats: { ...p.stats },
                    transferHistory: (p.transferHistory || []).map(t => ({ ...t }))
                })),
                fixtures: (incoming.fixtures || []).map(f => ({ ...f })),
                results: (incoming.results || []).map(r => ({ ...r })),
                staff: (incoming.staff || []).map(s => ({ ...s }))
            };
            
            // Reset stats for calculation
            masterTeam.players = masterTeam.players.map(p => {
                // If competition mode, start from zero. If career mode, start from baseStats.
                const base = mode === 'competition' ? null : p.baseStats;
                return {
                    ...p,
                    stats: { 
                        appearances: Number(base?.appearances || 0),
                        goals: Number(base?.goals || 0),
                        assists: Number(base?.assists || 0),
                        yellowCards: Number(base?.yellowCards || 0),
                        redCards: Number(base?.redCards || 0),
                        cleanSheets: Number(base?.cleanSheets || 0),
                        potmWins: Number(base?.potmWins || 0)
                    }
                };
            });
            teamsMap.set(normName, masterTeam);
        }
    });

    const playerMatchRegistry = new Map<string, Set<string>>();

    // Robust Player Finder: Matches by ID or Normalized Name globally first, then locally
    const getOrCreatePlayer = (team: Team, playerName?: string, playerID?: string | number): Player | null => {
        if (!playerName && !playerID) return null;
        const normName = playerName ? superNormalize(playerName) : '';
        
        let globalPlayer: Player | undefined;
        
        // 1. Global Search (Pass 1): Exact ID match
        if (playerID) {
            const searchId = String(playerID);
            for (const t of teamsMap.values()) {
                globalPlayer = t.players.find(tp => String(tp.id) === searchId);
                if (globalPlayer) break;
            }
        }

        // 2. Global Search (Pass 2): Name match (Fallback for transfers where old ID was deleted)
        if (!globalPlayer && normName) {
            for (const t of teamsMap.values()) {
                globalPlayer = t.players.find(tp => superNormalize(tp.name) === normName);
                if (globalPlayer) break;
            }
        }

        if (globalPlayer) {
            return globalPlayer;
        }
        
        // 3. Local Creation: If not found anywhere, create in the team where the event occurred
        const stableId = playerID ? String(playerID) : (playerName ? generateStableId(playerName) : String(Date.now()));
        const newPlayer: Player = {
            id: stableId,
            name: playerName || `Player ${playerID}`,
            position: 'Forward',
            number: 0,
            photoUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${playerName || playerID}`,
            nationality: 'Eswatini',
            age: 21,
            height: '-',
            stats: { appearances: 0, goals: 0, assists: 0, yellowCards: 0, redCards: 0, cleanSheets: 0, potmWins: 0 },
            transferHistory: [],
            isDiscovered: true 
        } as any;
        team.players.push(newPlayer);
        
        return newPlayer;
    };

    // 2. FILTER UNIQUE MATCHES (Most recent status takes precedence)
    const uniqueMatches = new Map<string, CompetitionFixture>();
    allMatches.forEach(m => {
        const sortedTeams = [superNormalize(m.teamA), superNormalize(m.teamB)].sort();
        const key = `${sortedTeams[0]}-${sortedTeams[1]}-${m.fullDate || m.date}`;
        // If we see the same match again, prefer the 'finished' or 'live' version over 'scheduled'
        if (!uniqueMatches.has(key) || m.status === 'finished' || (m.status === 'live' && uniqueMatches.get(key)?.status !== 'finished')) {
            uniqueMatches.set(key, m);
        }
    });

    // 3. AGGREGATE EVENTS
    uniqueMatches.forEach(match => {
        const matchKey = `${superNormalize(match.teamA)}-${superNormalize(match.teamB)}-${match.fullDate || match.date}`;
        const teamA = teamsMap.get(superNormalize(match.teamA));
        const teamB = teamsMap.get(superNormalize(match.teamB));

        // Lineups Attribution
        ['teamA', 'teamB'].forEach(side => {
            const t = side === 'teamA' ? teamA : teamB;
            const scoreAgainst = side === 'teamA' ? (match.scoreB || 0) : (match.scoreA || 0);
            const lineup = match.lineups?.[side as 'teamA' | 'teamB'];
            if (!t || !lineup) return;
            
            const participantIds = new Set([...(lineup.starters || []), ...(lineup.subs || [])]);
            participantIds.forEach(pid => {
                const p = getOrCreatePlayer(t, undefined, pid);
                if (p) {
                    if (!playerMatchRegistry.has(p.id)) playerMatchRegistry.set(p.id, new Set());
                    const reg = playerMatchRegistry.get(p.id)!;
                    if (!reg.has(matchKey)) {
                        p.stats.appearances += 1;
                        reg.add(matchKey);
                    }
                    if (match.status === 'finished' && scoreAgainst === 0 && (p.position === 'Goalkeeper' || p.position === 'Defender')) {
                        p.stats.cleanSheets = (p.stats.cleanSheets || 0) + 1;
                    }
                }
            });
        });

        // Event-Based Attribution (Goals, Cards)
        if (match.events) {
            match.events.forEach(e => {
                const type = String(e.type || '').toLowerCase();
                if (!type || type === 'info') return;

                // ATTRUBUTION HEURISTIC:
                // 1. Try provided teamName
                // 2. If missing/invalid, check which team the player belongs to
                let t = teamsMap.get(superNormalize(e.teamName || ''));
                
                if (!t && teamA && teamB) {
                    const normSearch = e.playerName ? superNormalize(e.playerName) : '';
                    const inA = teamA.players.some(p => (e.playerID && p.id === e.playerID) || (normSearch && superNormalize(p.name) === normSearch));
                    t = inA ? teamA : teamB;
                }

                if (!t) return;

                const p = getOrCreatePlayer(t, e.playerName, e.playerID);
                if (p) {
                    if (type === 'goal') p.stats.goals += 1;
                    if (type === 'assist') p.stats.assists += 1;
                    if (type.includes('yellow')) p.stats.yellowCards = (p.stats.yellowCards || 0) + 1;
                    if (type.includes('red')) p.stats.redCards = (p.stats.redCards || 0) + 1;
                }
            });
        }

        // MVP Attribution
        if (match.playerOfTheMatch) {
            let t = teamsMap.get(superNormalize(match.playerOfTheMatch.teamName || ''));
            if (!t && teamA && teamB) {
                const normSearch = superNormalize(match.playerOfTheMatch.name);
                const inA = teamA.players.some(p => (match.playerOfTheMatch?.playerID && p.id === match.playerOfTheMatch.playerID) || superNormalize(p.name) === normSearch);
                t = inA ? teamA : teamB;
            }
            if (t) {
                const p = getOrCreatePlayer(t, match.playerOfTheMatch.name, match.playerOfTheMatch.playerID);
                if (p) p.stats.potmWins = (p.stats.potmWins || 0) + 1;
            }
        }
    });

    return Array.from(teamsMap.values());
};

export const getCompCategory = (id: string, name?: string): 'women' | 'youth' | 'senior' => {
    const s = `${id} ${name || ''}`.toLowerCase();
    if (s.includes('women') || s.includes('ewfa')) return 'women';
    if (s.includes('youth') || s.match(/u\d{2}/) || s.includes('schools') || s.includes('girls') || s.includes('boys')) return 'youth';
    return 'senior';
};

export const aggregateGoalsFromEvents = (fixtures: CompetitionFixture[] = [], results: CompetitionFixture[] = [], teams: Team[] = []): ScorerRecord[] => {
    // CRITICAL: Force 'competition' mode to ensure Golden Boot is season-specific, not career-total.
    const reconciledTeams = reconcilePlayers(teams, [...fixtures, ...results], 'competition');
    const scorers: ScorerRecord[] = [];
    
    reconciledTeams.forEach(t => {
        t.players?.forEach(p => {
            if (p.stats && (p.stats.goals > 0 || (p.stats.potmWins || 0) > 0)) {
                scorers.push({
                    name: p.name,
                    teamName: t.name,
                    goals: p.stats.goals,
                    potmWins: p.stats.potmWins || 0,
                    crestUrl: t.crestUrl,
                    playerId: p.id,
                    score: (p.stats.goals * 10) + ((p.stats.potmWins || 0) * 5)
                });
            }
        });
    });
    
    // Sort primarily by goals, then by potm/score tiebreaker
    return scorers.sort((a, b) => (b.goals !== a.goals) ? b.goals - a.goals : b.score - a.score);
};

export const calculateStandings = (teams: Team[], results: CompetitionFixture[], fixtures: CompetitionFixture[] = []): Team[] => {
    const standingsMap = new Map<string, Team>();
    teams.forEach(team => {
        standingsMap.set(superNormalize(team.name), {
            ...team,
            stats: { p: 0, w: 0, d: 0, l: 0, gs: 0, gc: 0, gd: 0, pts: 0, form: '' },
            players: team.players ? [...team.players] : []
        });
    });

    // Synchronize player rosters from match events & Player of the Match awards to prevent duplicates
    const allMatches = [...results, ...fixtures];
    allMatches.forEach(match => {
        // 1. Synchronize player list from Match Events
        if (match.events && Array.isArray(match.events)) {
            match.events.forEach(e => {
                if (!e.playerName) return;
                const pName = e.playerName.trim();
                if (!pName) return;

                // Determine or guess the team name for the player event
                let tName = e.teamName;
                
                // If teamName is missing, attempt to resolve via description or global roster presence
                if (!tName) {
                    const descLower = e.description ? e.description.toLowerCase() : '';
                    const normA = superNormalize(match.teamA);
                    const normB = superNormalize(match.teamB);
                    
                    const containsA = descLower.includes(match.teamA.toLowerCase()) || descLower.includes(normA);
                    const containsB = descLower.includes(match.teamB.toLowerCase()) || descLower.includes(normB);
                    
                    if (containsA && !containsB) {
                        tName = match.teamA;
                    } else if (containsB && !containsA) {
                        tName = match.teamB;
                    } else {
                        const normPName = superNormalize(pName);
                        const teamAObj = standingsMap.get(normA);
                        const teamBObj = standingsMap.get(normB);
                        const inA = teamAObj && (teamAObj.players || []).some(p => superNormalize(p.name) === normPName);
                        const inB = teamBObj && (teamBObj.players || []).some(p => superNormalize(p.name) === normPName);
                        
                        if (inA && !inB) {
                            tName = match.teamA;
                        } else if (inB && !inA) {
                            tName = match.teamB;
                        } else {
                            tName = match.teamA; // Default fallback to home team
                        }
                    }
                }

                const normTeam = superNormalize(tName);
                const teamObj = standingsMap.get(normTeam);
                if (!teamObj) return;

                const pId = e.playerID ? String(e.playerID) : generateStableId(pName);
                const normPName = superNormalize(pName);
                if (!teamObj.players) teamObj.players = [];
                const playerExists = teamObj.players.some(p => 
                    superNormalize(p.name) === normPName || String(p.id) === pId
                );

                if (!playerExists) {
                    const newPlayer: Player = {
                        id: pId,
                        name: pName,
                        position: 'Forward',
                        number: 0,
                        photoUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${pName}`,
                        nationality: 'Eswatini',
                        age: 21,
                        height: '-',
                        stats: { appearances: 0, goals: 0, assists: 0, yellowCards: 0, redCards: 0, cleanSheets: 0, potmWins: 0 },
                        baseStats: { appearances: 0, goals: 0, assists: 0, yellowCards: 0, redCards: 0, cleanSheets: 0, potmWins: 0 },
                        transferHistory: []
                    };
                    teamObj.players.push(newPlayer);
                }
            });
        }

        // 2. Synchronize player list from Player of the Match awards
        if (match.playerOfTheMatch && match.playerOfTheMatch.name) {
            const potm = match.playerOfTheMatch;
            const pName = potm.name.trim();
            if (pName) {
                const tName = potm.teamName || match.teamA;
                const normTeam = superNormalize(tName);
                const teamObj = standingsMap.get(normTeam);
                if (teamObj) {
                    const pId = potm.playerID ? String(potm.playerID) : generateStableId(pName);
                    const normPName = superNormalize(pName);
                    if (!teamObj.players) teamObj.players = [];
                    const playerExists = teamObj.players.some(p => 
                        superNormalize(p.name) === normPName || String(p.id) === pId
                    );

                    if (!playerExists) {
                        const newPlayer: Player = {
                            id: pId,
                            name: pName,
                            position: 'Forward',
                            number: 0,
                            photoUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${pName}`,
                            nationality: 'Eswatini',
                            age: 21,
                            height: '-',
                            stats: { appearances: 0, goals: 0, assists: 0, yellowCards: 0, redCards: 0, cleanSheets: 0, potmWins: 0 },
                            baseStats: { appearances: 0, goals: 0, assists: 0, yellowCards: 0, redCards: 0, cleanSheets: 0, potmWins: 0 },
                            transferHistory: []
                        };
                        teamObj.players.push(newPlayer);
                    }
                }
            }
        }
    });

    const uniqueMatches = new Map<string, CompetitionFixture>();
    results.forEach(m => {
        if (m.status !== 'finished') return;
        const sortedTeams = [superNormalize(m.teamA), superNormalize(m.teamB)].sort();
        const key = `${sortedTeams[0]}-${sortedTeams[1]}-${m.fullDate || m.date}`;
        uniqueMatches.set(key, m);
    });

    Array.from(uniqueMatches.values()).forEach(match => {
        const teamA = standingsMap.get(superNormalize(match.teamA));
        const teamB = standingsMap.get(superNormalize(match.teamB));
        if (teamA && teamB && match.scoreA !== undefined && match.scoreB !== undefined) {
            teamA.stats.p++; teamB.stats.p++;
            teamA.stats.gs += match.scoreA; teamA.stats.gc += match.scoreB;
            teamB.stats.gs += match.scoreB; teamB.stats.gc += match.scoreA;
            teamA.stats.gd = teamA.stats.gs - teamA.stats.gc;
            teamB.stats.gd = teamB.stats.gs - teamB.stats.gc;
            if (match.scoreA > match.scoreB) {
                teamA.stats.w++; teamA.stats.pts += 3; teamB.stats.l++;
                teamA.stats.form = (teamA.stats.form + ' W').trim();
                teamB.stats.form = (teamB.stats.form + ' L').trim();
            } else if (match.scoreA < match.scoreB) {
                teamB.stats.w++; teamB.stats.pts += 3; teamA.stats.l++;
                teamA.stats.form = (teamA.stats.form + ' L').trim();
                teamB.stats.form = (teamB.stats.form + ' W').trim();
            } else {
                teamA.stats.d++; teamB.stats.d++; teamA.stats.pts++; teamB.stats.pts++;
                teamA.stats.form = (teamA.stats.form + ' D').trim();
                teamB.stats.form = (teamB.stats.form + ' D').trim();
            }
        }
    });

    return Array.from(standingsMap.values()).map(t => {
        const form = t.stats.form.split(' ').filter(Boolean);
        t.stats.form = form.slice(-5).reverse().join(' ');
        return t;
    }).sort((a, b) => b.stats.pts - a.stats.pts || b.stats.gd - a.stats.gd || b.stats.gs - a.stats.gs);
};

export const compressImage = (file: File, maxWidth: number, quality: number): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width, height = img.height;
                if (width > maxWidth) { height *= maxWidth / width; width = maxWidth; }
                canvas.width = width; canvas.height = height;
                const ctx = canvas.getContext('2d');
                if (!ctx) return reject(new Error("Canvas error"));
                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', quality));
            };
        };
    });
};

export const renameTeamInMatches = (matches: CompetitionFixture[], oldName: string, newName: string): CompetitionFixture[] => {
    const normOld = superNormalize(oldName);
    return (matches || []).map(m => {
        const updated = { ...m };
        if (superNormalize(m.teamA) === normOld) updated.teamA = newName;
        if (superNormalize(m.teamB) === normOld) updated.teamB = newName;
        return updated;
    });
};

export const safeLocalStorage = {
    getItem: (key: string) => {
        try { return localStorage.getItem(key); } catch (e) { return null; }
    },
    setItem: (key: string, value: string) => {
        try { localStorage.setItem(key, value); } catch (e) {}
    },
    removeItem: (key: string) => {
        try { localStorage.removeItem(key); } catch (e) {}
    },
    clear: () => {
        try { localStorage.clear(); } catch (e) {}
    }
};

export const safeSessionStorage = {
    getItem: (key: string) => {
        try { return sessionStorage.getItem(key); } catch (e) { return null; }
    },
    setItem: (key: string, value: string) => {
        try { sessionStorage.setItem(key, value); } catch (e) {}
    },
    removeItem: (key: string) => {
        try { sessionStorage.removeItem(key); } catch (e) {}
    },
    clear: () => {
        try { sessionStorage.clear(); } catch (e) {}
    }
};

export const calculateGroupStandings = (teams: Team[], matches: CompetitionFixture[]): Team[] => {
    const groupTeamNames = new Set(teams.map(t => superNormalize(t.name)));
    const groupMatches = (matches || []).filter(m => 
        groupTeamNames.has(superNormalize(m.teamA)) && 
        groupTeamNames.has(superNormalize(m.teamB))
    );
    
    const results = groupMatches.filter(m => m.status === 'finished');
    const fixtures = groupMatches.filter(m => m.status !== 'finished');
    
    return calculateStandings(teams, results, fixtures);
};
