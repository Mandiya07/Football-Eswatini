
import { Team, CompetitionFixture } from '../data/teams';
import { DirectoryEntity } from '../data/directory';

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
 * Super-normalization for robust matching.
 * Strips all non-alphanumeric chars and collapses whitespace.
 */
export const superNormalize = (s: string) => {
    if (!s) return '';
    return s.toLowerCase()
        .replace(/[^a-z0-9]/g, '') // Remove everything except letters and numbers
        .trim();
};

/**
 * Finds a team entity from the directory map using a more robust matching logic.
 */
export const findInMap = (name: string, map: Map<string, DirectoryEntity>): DirectoryEntity | undefined => {
    if (!name) return undefined;
    const lowerName = name.trim().toLowerCase();
    const exactMatch = map.get(lowerName);
    if (exactMatch) return exactMatch;
    
    const target = superNormalize(name);
    for (const [key, value] of map.entries()) {
        if (superNormalize(key) === target) return value;
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
 * Calculates league standings.
 * FIXED: Uses super-normalization for match-to-team pairing to ensure 
 * naming inconsistencies (spaces, casing) don't cause matches to be skipped in the logs.
 */
export const calculateStandings = (baseTeams: Team[], allResults: CompetitionFixture[], allFixtures: CompetitionFixture[] = []): Team[] => {
    const teamsMap: Map<string, Team> = new Map();
    
    // 1. Initialize map with official teams using normalized keys
    baseTeams.forEach(team => {
        const teamCopy = { ...team };
        teamCopy.stats = { p: 0, w: 0, d: 0, l: 0, gs: 0, gc: 0, gd: 0, pts: 0, form: '' };
        teamsMap.set(superNormalize(team.name), teamCopy);
    });
    
    const allMatches = [...(allResults || []), ...(allFixtures || [])];

    // 2. Process finished matches
    const finishedMatches = allMatches.filter(r => 
        (r.status === 'finished' || r.status === 'abandoned') && 
        r.scoreA != null && 
        r.scoreB != null
    );
    
    // Sort by date to ensure form is calculated correctly
    const sortedMatches = finishedMatches
        .sort((a, b) => new Date(a.fullDate || 0).getTime() - new Date(b.fullDate || 0).getTime());

    for (const fixture of sortedMatches) {
        const teamAKey = superNormalize(fixture.teamA);
        const teamBKey = superNormalize(fixture.teamB);
        
        const teamA = teamsMap.get(teamAKey);
        const teamB = teamsMap.get(teamBKey);
        
        // Only process if BOTH teams are found in the official team list
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
            teamA.stats.w += 1;
            teamA.stats.pts += 3;
            teamB.stats.l += 1;
            teamA.stats.form = ['W', ...teamA.stats.form.split(' ').filter(Boolean)].slice(0, 5).join(' ');
            teamB.stats.form = ['L', ...teamB.stats.form.split(' ').filter(Boolean)].slice(0, 5).join(' ');
        } else if (scoreB > scoreA) {
            teamB.stats.w += 1;
            teamB.stats.pts += 3;
            teamA.stats.l += 1;
            teamB.stats.form = ['W', ...teamB.stats.form.split(' ').filter(Boolean)].slice(0, 5).join(' ');
            teamA.stats.form = ['L', ...teamA.stats.form.split(' ').filter(Boolean)].slice(0, 5).join(' ');
        } else {
            teamA.stats.d += 1;
            teamB.stats.d += 1;
            teamA.stats.pts += 1;
            teamB.stats.pts += 1;
            teamA.stats.form = ['D', ...teamA.stats.form.split(' ').filter(Boolean)].slice(0, 5).join(' ');
            teamB.stats.form = ['D', ...teamB.stats.form.split(' ').filter(Boolean)].slice(0, 5).join(' ');
        }
    }

    return Array.from(teamsMap.values()).sort((a, b) => {
        if (b.stats.pts !== a.stats.pts) return b.stats.pts - a.stats.pts;
        if (b.stats.gd !== a.stats.gd) return b.stats.gd - a.stats.gd;
        return b.stats.gs - a.stats.gs;
    });
};

export const calculateGroupStandings = (groupTeams: Team[], allMatches: CompetitionFixture[]): Team[] => {
    const groupTeamNames = new Set(groupTeams.map(t => superNormalize(t.name)));
    const groupMatches = allMatches.filter(m => groupTeamNames.has(superNormalize(m.teamA)) && groupTeamNames.has(superNormalize(m.teamB)));
    return calculateStandings(groupTeams, groupMatches, []);
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
