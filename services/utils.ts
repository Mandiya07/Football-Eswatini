import { Team, CompetitionFixture, MatchEvent, Player } from '../data/teams';
import { DirectoryEntity } from '../data/directory';

/**
 * Super-normalization for robust name matching.
 */
export const superNormalize = (s: string) => {
    if (!s) return '';
    return s.toLowerCase()
        .replace(/[^a-z0-9]/g, '') 
        .trim();
};

/**
 * Recursively removes properties with `undefined` values from an object or array.
 */
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

/**
 * Standardizes team names based on directory entries.
 */
export const findInMap = (name: string, map: Map<string, DirectoryEntity>): DirectoryEntity | undefined => {
    if (!name) return undefined;
    const target = superNormalize(name);
    for (const entry of map.values()) {
        if (superNormalize(entry.name) === target) return entry;
    }
    return undefined;
};

/**
 * Normalizes a team name and tries to find a match in a list of official team names.
 */
export const normalizeTeamName = (name: string, officialNames: string[]): string | null => {
    if (!name) return null;
    const target = superNormalize(name);
    for (const official of officialNames) {
        if (superNormalize(official) === target) return official;
    }
    return null;
};

/**
 * Renames a team across a list of matches (fixtures or results).
 */
export const renameTeamInMatches = (matches: CompetitionFixture[], oldName: string, newName: string): CompetitionFixture[] => {
    const oldNorm = superNormalize(oldName);
    return (matches || []).map(m => {
        let updated = { ...m };
        if (superNormalize(m.teamA) === oldNorm) {
            updated.teamA = newName;
        }
        if (superNormalize(m.teamB) === oldNorm) {
            updated.teamB = newName;
        }
        if (m.events) {
            updated.events = m.events.map(e => e.teamName && superNormalize(e.teamName) === oldNorm ? { ...e, teamName: newName } : e);
        }
        return updated;
    });
};

/**
 * MASTER PLAYER RECONCILER
 * Fix: Idempotent calculation. Uses baseStats as baseline and layers matches on top.
 * Uses a stable MatchKey for deduplication to prevent double-counting from ghost imports.
 */
export const reconcilePlayers = (baseTeams: Team[], allMatches: CompetitionFixture[]): Team[] => {
    const teamsMap = new Map<string, Team>();
    
    // 1. DEDUPLICATE MATCHES to prevent double counting
    const processedMatches = new Map<string, CompetitionFixture>();
    allMatches.forEach(m => {
        // Create a stable key: TeamA-TeamB-Date
        // This is much safer than relying on match.id which can be unstable across imports
        const dateKey = m.fullDate || m.date || 'no-date';
        const stableKey = `${superNormalize(m.teamA)}-${superNormalize(m.teamB)}-${dateKey}`;
        
        if (!processedMatches.has(stableKey)) {
            processedMatches.set(stableKey, m);
        } else {
            const existing = processedMatches.get(stableKey)!;
            // Prefer the version with more technical data (status/score)
            if (m.status === 'finished' || (m.scoreA !== undefined && existing.status !== 'finished')) {
                processedMatches.set(stableKey, m);
            }
        }
    });

    // 2. Initialize teams and players starting from BASELINE (ignores previous 'stats' total)
    baseTeams.forEach(team => {
        const teamCopy = { 
            ...team, 
            players: (team.players || []).map(p => {
                const base = p.baseStats || { appearances: 0, goals: 0, assists: 0, yellowCards: 0, redCards: 0, cleanSheets: 0, potmWins: 0 };
                return {
                    ...p,
                    stats: { ...base } // Reset to baseline before re-calculating
                };
            })
        };
        teamsMap.set(superNormalize(team.name), teamCopy);
    });

    // Per-player appearance set to ensure 1 app per match
    const playerAppearances = new Map<number, Set<string>>();

    // 3. Scan unique matches
    processedMatches.forEach(match => {
        const matchIdStr = String(match.id || `${match.teamA}-${match.teamB}-${match.fullDate}`);
        const teamA = teamsMap.get(superNormalize(match.teamA));
        const teamB = teamsMap.get(superNormalize(match.teamB));

        // Process Player of the Match
        if (match.playerOfTheMatch && match.playerOfTheMatch.teamName) {
            const potmTeam = teamsMap.get(superNormalize(match.playerOfTheMatch.teamName));
            if (potmTeam) {
                const player = potmTeam.players.find(p => 
                    (match.playerOfTheMatch?.playerID && p.id === match.playerOfTheMatch.playerID) || 
                    superNormalize(p.name) === superNormalize(match.playerOfTheMatch?.name || '')
                );
                if (player) {
                    player.stats.potmWins = (player.stats.potmWins || 0) + 1;
                }
            }
        }

        // Process Events (Goals, Cards, etc.)
        if (match.events) {
            match.events.forEach(event => {
                if (!event.playerName || !event.teamName) return;
                
                const targetTeam = teamsMap.get(superNormalize(event.teamName));
                if (!targetTeam) return;

                const playerNorm = superNormalize(event.playerName);
                let player = targetTeam.players.find(p => (event.playerID && p.id === event.playerID) || superNormalize(p.name) === playerNorm);

                if (!player) {
                    player = {
                        id: event.playerID || (Math.abs(event.playerName.split('').reduce((a,b) => (((a << 5) - a) + b.charCodeAt(0))|0, 0))),
                        name: event.playerName,
                        position: 'Midfielder', 
                        number: 0,
                        photoUrl: '',
                        bio: { nationality: 'Eswatini', age: 0, height: '-' },
                        stats: { appearances: 0, goals: 0, assists: 0, yellowCards: 0, redCards: 0, cleanSheets: 0, potmWins: 0 },
                        transferHistory: []
                    };
                    targetTeam.players.push(player);
                }

                const type = String(event.type || '').toLowerCase();
                if (type === 'goal') player.stats.goals += 1;
                if (type === 'assist') player.stats.assists += 1;
                if (type === 'yellow-card' || type === 'yellow_card') player.stats.yellowCards = (player.stats.yellowCards || 0) + 1;
                if (type === 'red-card' || type === 'red_card') player.stats.redCards = (player.stats.redCards || 0) + 1;
            });
        }

        // Process Lineups (Appearances & Clean Sheets)
        const processSide = (side: 'teamA' | 'teamB', scoreAgainst: number) => {
            const team = side === 'teamA' ? teamA : teamB;
            const lineup = match.lineups?.[side];
            if (!team || !lineup) return;

            const allInvolvedIds = new Set([...(lineup.starters || []), ...(lineup.subs || [])]);
            allInvolvedIds.forEach(pid => {
                const player = team.players.find(p => p.id === pid);
                if (player) {
                    // Unique appearance per match check
                    if (!playerAppearances.has(player.id)) playerAppearances.set(player.id, new Set());
                    const appSet = playerAppearances.get(player.id)!;
                    
                    if (!appSet.has(matchIdStr)) {
                        player.stats.appearances += 1;
                        appSet.add(matchIdStr);
                    }

                    if (match.status === 'finished' && scoreAgainst === 0 && (player.position === 'Goalkeeper' || player.position === 'Defender')) {
                        player.stats.cleanSheets = (player.stats.cleanSheets || 0) + 1;
                    }
                }
            });
        };

        processSide('teamA', match.scoreB || 0);
        processSide('teamB', match.scoreA || 0);
    });

    return Array.from(teamsMap.values());
};

export interface ScorerRecord {
    name: string;
    teamName: string;
    goals: number;
    potmWins: number;
    crestUrl: string;
    playerId?: number;
    score: number; 
}

// Completed implementation for aggregateGoalsFromEvents
/**
 * Aggregates goal stats for the Golden Boot race.
 * Fix: Sort primarily by pure goals count to satisfy standard football ranking rules.
 */
export const aggregateGoalsFromEvents = (fixtures: CompetitionFixture[] = [], results: CompetitionFixture[] = [], teams: Team[] = []): ScorerRecord[] => {
    const reconciledTeams = reconcilePlayers(teams, [...fixtures, ...results]);
    const scorers: ScorerRecord[] = [];

    reconciledTeams.forEach(t => {
        if (!t.players) return;
        t.players.forEach(p => {
            if (p.stats && (p.stats.goals > 0 || (p.stats.potmWins || 0) > 0)) {
                // Keep the weighted score for internal Tie priority
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

    return scorers.sort((a, b) => {
        if (b.goals !== a.goals) return b.goals - a.goals;
        return b.score - a.score;
    });
};

// Added exported function calculateStandings
/**
 * Calculates league standings based on teams and match results.
 */
export const calculateStandings = (teams: Team[], results: CompetitionFixture[], fixtures: CompetitionFixture[] = []): Team[] => {
    const standingsMap = new Map<string, Team>();
    
    // Initialize teams
    teams.forEach(team => {
        const norm = superNormalize(team.name);
        standingsMap.set(norm, {
            ...team,
            stats: { p: 0, w: 0, d: 0, l: 0, gs: 0, gc: 0, gd: 0, pts: 0, form: '' }
        });
    });

    // Sort results by date to build form string correctly
    const sortedResults = [...results].sort((a, b) => {
        const dateA = new Date(a.fullDate || a.date).getTime();
        const dateB = new Date(b.fullDate || b.date).getTime();
        return dateA - dateB;
    });

    sortedResults.forEach(match => {
        if (match.status !== 'finished') return;
        if (match.scoreA === undefined || match.scoreB === undefined) return;

        const normA = superNormalize(match.teamA);
        const normB = superNormalize(match.teamB);
        const teamA = standingsMap.get(normA);
        const teamB = standingsMap.get(normB);

        if (teamA && teamB) {
            teamA.stats.p += 1;
            teamB.stats.p += 1;
            teamA.stats.gs += match.scoreA;
            teamA.stats.gc += match.scoreB;
            teamB.stats.gs += match.scoreB;
            teamB.stats.gc += match.scoreA;
            teamA.stats.gd = teamA.stats.gs - teamA.stats.gc;
            teamB.stats.gd = teamB.stats.gs - teamB.stats.gc;

            if (match.scoreA > match.scoreB) {
                teamA.stats.w += 1;
                teamA.stats.pts += 3;
                teamB.stats.l += 1;
                teamA.stats.form = ((teamA.stats.form || '') + ' W').trim();
                teamB.stats.form = ((teamB.stats.form || '') + ' L').trim();
            } else if (match.scoreA < match.scoreB) {
                teamB.stats.w += 1;
                teamB.stats.pts += 3;
                teamA.stats.l += 1;
                teamA.stats.form = ((teamA.stats.form || '') + ' L').trim();
                teamB.stats.form = ((teamB.stats.form || '') + ' W').trim();
            } else {
                teamA.stats.d += 1;
                teamB.stats.d += 1;
                teamA.stats.pts += 1;
                teamB.stats.pts += 1;
                teamA.stats.form = ((teamA.stats.form || '') + ' D').trim();
                teamB.stats.form = ((teamB.stats.form || '') + ' D').trim();
            }
        }
    });

    // Finalize form (last 5) and sort
    return Array.from(standingsMap.values()).map(team => {
        const formArray = team.stats.form.split(' ').filter(Boolean);
        team.stats.form = formArray.slice(-5).reverse().join(' ');
        return team;
    }).sort((a, b) => {
        if (b.stats.pts !== a.stats.pts) return b.stats.pts - a.stats.pts;
        if (b.stats.gd !== a.stats.gd) return b.stats.gd - a.stats.gd;
        return b.stats.gs - a.stats.gs;
    });
};

// Added exported function calculateGroupStandings
/**
 * Calculates standings for a group stage.
 */
export const calculateGroupStandings = (teams: Team[], matches: CompetitionFixture[]): Team[] => {
    // Group stage matches are usually a mix of fixtures and results.
    // We only care about 'finished' matches.
    const finishedMatches = (matches || []).filter(m => m.status === 'finished');
    return calculateStandings(teams, finishedMatches);
};

// Added exported function compressImage
/**
 * Resizes and compresses an image to a base64 string.
 */
export const compressImage = (file: File, maxWidth: number, quality: number): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                if (width > maxWidth) {
                    height *= maxWidth / width;
                    width = maxWidth;
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error("Could not get canvas context"));
                    return;
                }
                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', quality));
            };
            img.onerror = () => reject(new Error("Failed to load image for compression"));
        };
        reader.onerror = () => reject(new Error("Failed to read file"));
    });
};
