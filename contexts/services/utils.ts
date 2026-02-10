
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
 * This function builds a dynamic list of players and their statistics 
 * by combining Profile "Base Stats" with "Match Center Events".
 */
export const reconcilePlayers = (baseTeams: Team[], allMatches: CompetitionFixture[]): Team[] => {
    const teamsMap = new Map<string, Team>();
    
    // 1. Initialize teams and create fresh counters starting from the profile baseline
    baseTeams.forEach(team => {
        const teamCopy = { 
            ...team, 
            players: (team.players || []).map(p => ({
                ...p,
                stats: { 
                    // Use profile data as the starting baseline (Manual Overrides / Historical)
                    appearances: p.stats?.appearances || 0,
                    goals: p.stats?.goals || 0,
                    assists: p.stats?.assists || 0,
                    yellowCards: p.stats?.yellowCards || 0,
                    redCards: p.stats?.redCards || 0,
                    cleanSheets: p.stats?.cleanSheets || 0,
                    potmWins: p.stats?.potmWins || 0 
                }
            }))
        };
        teamsMap.set(superNormalize(team.name), teamCopy);
    });

    // 2. Scan every match for data points and ADD to the baseline
    allMatches.forEach(match => {
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

                // AUTO-DISCOVERY: If event has a player not in roster, create a temporary entry
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
                    player.stats.appearances += 1;
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

export const aggregateGoalsFromEvents = (fixtures: CompetitionFixture[] = [], results: CompetitionFixture[] = [], teams: Team[] = []): ScorerRecord[] => {
    const reconciledTeams = reconcilePlayers(teams, [...fixtures, ...results]);
    const scorers: ScorerRecord[] = [];

    reconciledTeams.forEach(t => {
        if (!t.players) return;
        t.players.forEach(p => {
            if (p.stats && (p.stats.goals > 0 || p.stats.potmWins > 0)) {
                const combinedScore = (p.stats.goals * 10) + ((p.stats.potmWins || 0) * 25);
                
                scorers.push({
                    name: p.name,
                    teamName: t.name,
                    goals: p.stats.goals,
                    potmWins: p.stats.potmWins || 0,
                    crestUrl: t.crestUrl,
                    playerId: p.id,
                    score: combinedScore
                });
            }
        });
    });

    return scorers.sort((a, b) => b.score - a.score);
};

export const calculateStandings = (baseTeams: Team[], allResults: CompetitionFixture[], allFixtures: CompetitionFixture[] = []): Team[] => {
    const teams = reconcilePlayers(baseTeams, [...allResults, ...allFixtures]);
    const teamsMap = new Map<string, Team>();
    
    teams.forEach(t => {
        t.stats = { p: 0, w: 0, d: 0, l: 0, gs: 0, gc: 0, gd: 0, pts: 0, form: '', aw: 0 } as any;
        teamsMap.set(superNormalize(t.name), t);
    });
    
    const finishedMatches = allResults.filter(r => 
        (r.status === 'finished' || r.status === 'abandoned') && 
        r.scoreA != null && 
        r.scoreB != null
    ).sort((a, b) => new Date(a.fullDate || 0).getTime() - new Date(b.fullDate || 0).getTime());

    for (const fixture of finishedMatches) {
        const teamA = teamsMap.get(superNormalize(fixture.teamA));
        const teamB = teamsMap.get(superNormalize(fixture.teamB));
        if (!teamA || !teamB) continue;

        const scoreA = fixture.scoreA!;
        const scoreB = fixture.scoreB!;
        
        teamA.stats.p += 1;
        teamB.stats.p += 1;
        teamA.stats.gs += scoreA;
        teamA.stats.gc += scoreB;
        teamB.stats.gs += scoreB;
        teamB.stats.gc += scoreA;
        teamA.stats.gd = teamA.stats.gs - teamA.stats.gc;
        teamB.stats.gd = teamB.stats.gs - teamB.stats.gc;

        if (scoreA > scoreB) {
            teamA.stats.w += 1; teamA.stats.pts += 3; teamB.stats.l += 1;
            teamA.stats.form = ['W', ...teamA.stats.form.split(' ').filter(Boolean)].slice(0, 5).join(' ');
            teamB.stats.form = ['L', ...teamB.stats.form.split(' ').filter(Boolean)].slice(0, 5).join(' ');
        } else if (scoreB > scoreA) {
            teamB.stats.w += 1; teamB.stats.pts += 3; teamA.stats.l += 1;
            (teamB.stats as any).aw = ((teamB.stats as any).aw || 0) + 1;
            teamB.stats.form = ['W', ...teamB.stats.form.split(' ').filter(Boolean)].slice(0, 5).join(' ');
            teamA.stats.form = ['L', ...teamA.stats.form.split(' ').filter(Boolean)].slice(0, 5).join(' ');
        } else {
            teamA.stats.d += 1; teamB.stats.d += 1; teamA.stats.pts += 1; teamB.stats.pts += 1;
            teamA.stats.form = ['D', ...teamA.stats.form.split(' ').filter(Boolean)].slice(0, 5).join(' ');
            teamB.stats.form = ['D', ...teamB.stats.form.split(' ').filter(Boolean)].slice(0, 5).join(' ');
        }
    }

    return Array.from(teamsMap.values()).sort((a, b) => {
        if (b.stats.pts !== a.stats.pts) return b.stats.pts - a.stats.pts;
        if (b.stats.gd !== a.stats.gd) return b.stats.gd - a.stats.gd;
        if (b.stats.gs !== a.stats.gs) return b.stats.gs - a.stats.gs;
        return (b.stats as any).aw - (a.stats as any).aw;
    });
};

export const calculateGroupStandings = (groupTeams: Team[], allMatches: CompetitionFixture[]): Team[] => {
    return calculateStandings(groupTeams, allMatches.filter(m => m.status === 'finished'), allMatches.filter(m => m.status !== 'finished'));
};

export const compressImage = (file: File, maxWidth: number = 1000, quality: number = 0.7): Promise<string> => {
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
                    height = Math.round((maxWidth / width) * height);
                    width = maxWidth;
                }
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', quality));
            };
            img.onerror = (error) => reject(error);
        };
        reader.onerror = (error) => reject(error);
    });
};
