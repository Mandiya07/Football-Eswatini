import { Team, CompetitionFixture, MatchEvent, Player, PlayerStats } from '../data/teams';
import { DirectoryEntity } from '../data/directory';

export interface ScorerRecord {
    name: string;
    teamName: string;
    goals: number;
    potmWins: number;
    crestUrl: string;
    playerId: number;
    score: number;
}

export const superNormalize = (s: string) => {
    if (!s) return '';
    return s.toLowerCase()
        .replace(/[^a-z0-9]/g, '') 
        .trim();
};

export const generateStableId = (name: string): number => {
    let hash = 0;
    const str = superNormalize(name);
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash |= 0;
    }
    return Math.abs(hash);
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
 * MASTER PLAYER RECONCILIATION ENGINE (v12.0 - ADDITIVE PERSISTENCE)
 * This engine guarantees that every manually added player is kept, 
 * while match events are used to calculate their live stats.
 */
export const reconcilePlayers = (baseTeams: Team[], allMatches: CompetitionFixture[]): Team[] => {
    const teamsMap = new Map<string, Team>();
    
    // 1. INITIALIZE TEAMS FROM ALL SOURCES
    baseTeams.forEach(incoming => {
        const normName = superNormalize(incoming.name);
        let masterTeam = teamsMap.get(normName);
        if (!masterTeam) {
            masterTeam = JSON.parse(JSON.stringify(incoming));
            teamsMap.set(normName, masterTeam!);
        } else {
            // Restore rich data (Bios/Photos)
            if (incoming.crestUrl && !masterTeam.crestUrl?.includes('api.dicebear')) masterTeam.crestUrl = incoming.crestUrl;
            
            (incoming.players || []).forEach(newP => {
                const existingIdx = masterTeam!.players.findIndex(p => p.id === newP.id || superNormalize(p.name) === superNormalize(newP.name));
                if (existingIdx === -1) {
                    masterTeam!.players.push(newP);
                } else {
                    // Update metadata for existing players (keep photos, etc.)
                    const p = masterTeam!.players[existingIdx];
                    if (newP.photoUrl && (!p.photoUrl || p.photoUrl.includes('dicebear'))) p.photoUrl = newP.photoUrl;
                    if (newP.bio?.age && !p.bio?.age) p.bio = newP.bio;
                }
            });
        }
    });

    // 2. PREPARE STATS (Reset for calculation but KEEP manual baselines)
    teamsMap.forEach(team => {
        team.players = (team.players || []).map(p => {
            const base = p.baseStats || { appearances: 0, goals: 0, assists: 0, yellowCards: 0, redCards: 0, cleanSheets: 0, potmWins: 0 };
            return {
                ...p,
                stats: { 
                    appearances: Number(base.appearances || 0),
                    goals: Number(base.goals || 0),
                    assists: Number(base.assists || 0),
                    yellowCards: Number(base.yellowCards || 0),
                    redCards: Number(base.redCards || 0),
                    cleanSheets: Number(base.cleanSheets || 0),
                    potmWins: Number(base.potmWins || 0)
                }
            };
        });
    });

    const playerMatchRegistry = new Map<number, Set<string>>();

    // Helper to find or STABLY CREATE a discovered player
    const getOrCreatePlayer = (team: Team, playerName?: string, playerID?: number): Player | null => {
        if (!playerName && !playerID) return null;
        const normName = playerName ? superNormalize(playerName) : '';
        
        // Priority 1: Match by ID
        // Priority 2: Match by Normalized Name
        let p = team.players.find(tp => 
            (playerID && tp.id === playerID) || 
            (normName && superNormalize(tp.name) === normName)
        );
        
        if (!p) {
            const stableId = playerID || (playerName ? generateStableId(playerName) : Date.now());
            p = {
                id: stableId,
                name: playerName || `Player ${playerID}`,
                position: 'Forward',
                number: 0,
                photoUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${playerName || playerID}`,
                bio: { nationality: 'Eswatini', age: 21, height: '-' },
                stats: { appearances: 0, goals: 0, assists: 0, yellowCards: 0, redCards: 0, cleanSheets: 0, potmWins: 0 },
                transferHistory: [],
                isDiscovered: true 
            } as any;
            team.players.push(p!);
        }
        return p!;
    };

    // 3. SCAN ALL UNIQUE MATCH LOGS
    const uniqueMatches = new Map<string, CompetitionFixture>();
    allMatches.forEach(m => {
        const sortedTeams = [superNormalize(m.teamA), superNormalize(m.teamB)].sort();
        const key = `${sortedTeams[0]}-${sortedTeams[1]}-${m.fullDate || m.date}`;
        if (!uniqueMatches.has(key) || m.status === 'finished') uniqueMatches.set(key, m);
    });

    uniqueMatches.forEach(match => {
        const matchKey = `${superNormalize(match.teamA)}-${superNormalize(match.teamB)}-${match.fullDate || match.date}`;
        const teamA = teamsMap.get(superNormalize(match.teamA));
        const teamB = teamsMap.get(superNormalize(match.teamB));

        // Lineups
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

        // Events
        if (match.events) {
            match.events.forEach(e => {
                const t = teamsMap.get(superNormalize(e.teamName || ''));
                if (!t) return;
                const p = getOrCreatePlayer(t, e.playerName, e.playerID);
                if (p) {
                    const type = String(e.type || '').toLowerCase();
                    if (type === 'goal') p.stats.goals += 1;
                    if (type === 'assist') p.stats.assists += 1;
                    if (type.includes('yellow')) p.stats.yellowCards = (p.stats.yellowCards || 0) + 1;
                    if (type.includes('red')) p.stats.redCards = (p.stats.redCards || 0) + 1;
                }
            });
        }

        // POTM
        if (match.playerOfTheMatch) {
            const t = teamsMap.get(superNormalize(match.playerOfTheMatch.teamName));
            if (t) {
                const p = getOrCreatePlayer(t, match.playerOfTheMatch.name, match.playerOfTheMatch.playerID);
                if (p) p.stats.potmWins = (p.stats.potmWins || 0) + 1;
            }
        }
    });

    return Array.from(teamsMap.values());
};

export const aggregateGoalsFromEvents = (fixtures: CompetitionFixture[] = [], results: CompetitionFixture[] = [], teams: Team[] = []): ScorerRecord[] => {
    const reconciledTeams = reconcilePlayers(teams, [...fixtures, ...results]);
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
    return scorers.sort((a, b) => (b.goals !== a.goals) ? b.goals - a.goals : b.score - a.score);
};

export const calculateStandings = (teams: Team[], results: CompetitionFixture[], fixtures: CompetitionFixture[] = []): Team[] => {
    const standingsMap = new Map<string, Team>();
    teams.forEach(team => {
        standingsMap.set(superNormalize(team.name), {
            ...team,
            stats: { p: 0, w: 0, d: 0, l: 0, gs: 0, gc: 0, gd: 0, pts: 0, form: '' }
        });
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

/**
 * RE-RECONCILIATION HELPER: RENAME TEAM IN MATCH RECORDS
 * Fix: Implemented renameTeamInMatches to resolve import error in ManageTeams.tsx
 */
export const renameTeamInMatches = (matches: CompetitionFixture[], oldName: string, newName: string): CompetitionFixture[] => {
    const normOld = superNormalize(oldName);
    return (matches || []).map(m => {
        const updated = { ...m };
        if (superNormalize(m.teamA) === normOld) updated.teamA = newName;
        if (superNormalize(m.teamB) === normOld) updated.teamB = newName;
        return updated;
    });
};

/**
 * GROUP-STAGE STANDINGS CALCULATOR
 * Fix: Implemented calculateGroupStandings to resolve import error in TournamentView.tsx
 */
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