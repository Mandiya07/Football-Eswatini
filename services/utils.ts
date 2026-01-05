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
 */
export const superNormalize = (s: string) => {
    if (!s) return '';
    return s.toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .trim();
};

/**
 * Calculates the Levenshtein distance between two strings.
 */
export const levenshtein = (a: string, b: string): number => {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;
    const matrix = Array.from({ length: b.length + 1 }, (_, i) => [i]);
    matrix[0] = Array.from({ length: a.length + 1 }, (_, i) => i);
    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b[i - 1] === a[j - 1]) matrix[i][j] = matrix[i - 1][j - 1];
            else matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
        }
    }
    return matrix[b.length][a.length];
};

/**
 * Normalizes a team name and tries to find a match.
 */
export const normalizeTeamName = (name: string, officialNames: string[]): string | null => {
    if (!name) return null;
    const target = superNormalize(name);
    for (const official of officialNames) {
        if (superNormalize(official) === target) return official;
    }
    let bestMatch: string | null = null;
    let lowestDistance = 3;
    for (const official of officialNames) {
        const dist = levenshtein(target, superNormalize(official));
        if (dist < lowestDistance) {
            lowestDistance = dist;
            bestMatch = official;
        }
    }
    return bestMatch;
};

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
 * Internal logic to compute team stats from a set of matches
 */
const computeStats = (baseTeams: Team[], matches: CompetitionFixture[]) => {
    const teamsMap: Map<string, Team> = new Map();
    baseTeams.forEach(team => {
        const teamCopy = JSON.parse(JSON.stringify(team));
        teamCopy.stats = { p: 0, w: 0, d: 0, l: 0, gs: 0, gc: 0, gd: 0, pts: 0, form: '' };
        teamsMap.set(superNormalize(team.name), teamCopy);
    });

    const sortedMatches = [...matches].sort((a, b) => new Date(a.fullDate || 0).getTime() - new Date(b.fullDate || 0).getTime());

    for (const fixture of sortedMatches) {
        const teamA = teamsMap.get(superNormalize(fixture.teamA));
        const teamB = teamsMap.get(superNormalize(fixture.teamB));
        if (!teamA || !teamB || teamA.name === teamB.name) continue;

        const sA = fixture.scoreA ?? 0;
        const sB = fixture.scoreB ?? 0;
        teamA.stats.p++; teamB.stats.p++;
        teamA.stats.gs += sA; teamA.stats.gc += sB;
        teamB.stats.gs += sB; teamB.stats.gc += sA;
        teamA.stats.gd = teamA.stats.gs - teamA.stats.gc;
        teamB.stats.gd = teamB.stats.gs - teamB.stats.gc;

        if (sA > sB) {
            teamA.stats.w++; teamA.stats.pts += 3; teamB.stats.l++;
            teamA.stats.form = ['W', ...teamA.stats.form.split(' ').filter(Boolean)].slice(0, 5).join(' ');
            teamB.stats.form = ['L', ...teamB.stats.form.split(' ').filter(Boolean)].slice(0, 5).join(' ');
        } else if (sB > sA) {
            teamB.stats.w++; teamB.stats.pts += 3; teamA.stats.l++;
            teamB.stats.form = ['W', ...teamB.stats.form.split(' ').filter(Boolean)].slice(0, 5).join(' ');
            teamA.stats.form = ['L', ...teamA.stats.form.split(' ').filter(Boolean)].slice(0, 5).join(' ');
        } else {
            teamA.stats.d++; teamB.stats.d++; teamA.stats.pts += 1; teamB.stats.pts += 1;
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

/**
 * Calculates standings and determines movement (up/down)
 */
export const calculateStandings = (baseTeams: Team[], allResults: CompetitionFixture[], allFixtures: CompetitionFixture[] = []): Team[] => {
    const finishedMatches = allResults.filter(r => (r.status === 'finished' || r.status === 'abandoned') && r.scoreA != null && r.scoreB != null);
    
    // 1. Current Standings
    const currentStandings = computeStats(baseTeams, finishedMatches);

    // 2. Previous Standings (Identify most recent match date and exclude those matches)
    const sortedDates = Array.from(new Set(finishedMatches.map(m => m.fullDate || ''))).sort();
    const latestDate = sortedDates[sortedDates.length - 1];
    const previousMatches = finishedMatches.filter(m => (m.fullDate || '') < latestDate);
    
    const previousStandings = computeStats(baseTeams, previousMatches);

    // 3. Map ranks and calculate change
    return currentStandings.map((team, currentRank) => {
        const prevRank = previousStandings.findIndex(t => superNormalize(t.name) === superNormalize(team.name));
        let posChange: 'up' | 'down' | 'same' = 'same';
        
        if (prevRank !== -1) {
            if (currentRank < prevRank) posChange = 'up';
            else if (currentRank > prevRank) posChange = 'down';
        }
        
        return {
            ...team,
            positionChange: posChange
        };
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