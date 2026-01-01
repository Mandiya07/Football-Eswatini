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
 * Simple normalization for display and basic search.
 */
export const normalize = (name: string) => 
    (name || '')
    .trim()
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/\.|\,/g, '') 
    .replace(/\s+/g, ' ') 
    .trim();

/**
 * Finds a team entity from the directory map using a more robust matching logic.
 */
export const findInMap = (name: string, map: Map<string, DirectoryEntity>): DirectoryEntity | undefined => {
    if (!name) return undefined;
    const lowerName = name.trim().toLowerCase();
    const exactMatch = map.get(lowerName);
    if (exactMatch) return exactMatch;
    
    // Try super normalization fallback
    const target = superNormalize(name);
    for (const [key, value] of map.entries()) {
        if (superNormalize(key) === target) return value;
    }

    // Try Fuzzy Matching as last resort
    let bestMatch: DirectoryEntity | undefined = undefined;
    let lowestDistance = 4; // Threshold for fuzzy match

    for (const entry of map.values()) {
        const dist = levenshtein(superNormalize(name), superNormalize(entry.name));
        if (dist < lowestDistance) {
            lowestDistance = dist;
            bestMatch = entry;
        }
    }

    return bestMatch;
};

/**
 * Normalizes a team name and tries to find a match in a list of official team names.
 * Includes fuzzy matching for variations.
 */
export const normalizeTeamName = (name: string, officialNames: string[]): string | null => {
    if (!name) return null;
    const target = superNormalize(name);
    
    // 1. Try Super Normalize match
    for (const official of officialNames) {
        if (superNormalize(official) === target) return official;
    }

    // 2. Try Fuzzy Match (Levenshtein)
    let bestMatch: string | null = null;
    let lowestDistance = 3; // Threshold

    for (const official of officialNames) {
        const dist = levenshtein(target, superNormalize(official));
        if (dist < lowestDistance) {
            lowestDistance = dist;
            bestMatch = official;
        }
    }

    return bestMatch;
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
 * Calculates league standings from a list of teams and finished matches.
 * CRITICAL FIX: Now prioritizes name-based mapping to ensure "Ghost" teams are captured
 * but uses official list as the source of truth for IDs.
 */
export const calculateStandings = (baseTeams: Team[], allResults: CompetitionFixture[], allFixtures: CompetitionFixture[] = []): Team[] => {
    const teamsMap: Map<string, Team> = new Map();
    
    // 1. Initialize map with existing official teams
    baseTeams.forEach(team => {
        const teamCopy = { ...team };
        teamCopy.stats = { p: 0, w: 0, d: 0, l: 0, gs: 0, gc: 0, gd: 0, pts: 0, form: '' };
        teamsMap.set(superNormalize(team.name), teamCopy);
    });
    
    const allMatches = [...(allResults || []), ...(allFixtures || [])];

    // 2. Scan matches for any "Ghost" teams not in our list and add them temporarily
    allMatches.forEach(m => {
        [m.teamA, m.teamB].forEach(name => {
            if (!name) return;
            const norm = superNormalize(name);
            if (!teamsMap.has(norm)) {
                const newTeam: Team = {
                    id: Math.floor(Math.random() * 1000000), 
                    name: name.trim(),
                    crestUrl: `https://via.placeholder.com/128/333333/FFFFFF?text=${name.charAt(0)}`,
                    stats: { p: 0, w: 0, d: 0, l: 0, gs: 0, gc: 0, gd: 0, pts: 0, form: '' },
                    players: [], fixtures: [], results: [], staff: []
                };
                teamsMap.set(norm, newTeam);
            }
        });
    });

    // 3. Process finished matches strictly by date
    const finishedMatches = allMatches.filter(r => 
        (r.status === 'finished' || r.status === 'abandoned') && 
        r.scoreA != null && 
        r.scoreB != null
    );
    
    // Sort matches oldest to newest to build form guide chronologically (appending to front)
    const sortedMatches = finishedMatches
        .filter(fixture => fixture.fullDate)
        .sort((a, b) => new Date(a.fullDate!).getTime() - new Date(b.fullDate!).getTime());

    for (const fixture of sortedMatches) {
        const teamA = teamsMap.get(superNormalize(fixture.teamA));
        const teamB = teamsMap.get(superNormalize(fixture.teamB));
        
        if (!teamA || !teamB || superNormalize(teamA.name) === superNormalize(teamB.name)) continue;

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
            // Prepend new results so index 0 is newest
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

    // 4. Return sorted list
    return Array.from(teamsMap.values()).sort((a, b) => {
        if (b.stats.pts !== a.stats.pts) return b.stats.pts - a.stats.pts;
        if (b.stats.gd !== a.stats.gd) return b.stats.gd - a.stats.gd;
        if (b.stats.gs !== a.stats.gs) return b.stats.gs - a.stats.gs;
        return a.name.localeCompare(b.name);
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