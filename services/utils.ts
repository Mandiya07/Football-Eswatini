import { Team, CompetitionFixture } from '../data/teams';
import { DirectoryEntity } from '../data/directory';

/**
 * Recursively removes properties with `undefined` values from an object or array.
 * This is crucial for Firestore, which does not support `undefined`.
 * @param obj The object or array to clean.
 * @returns A new object or array with all `undefined` values removed.
 */
export const removeUndefinedProps = (obj: any): any => {
    if (obj === null || obj === undefined) {
        return obj;
    }

    if (Array.isArray(obj)) {
        return obj
            .map(item => removeUndefinedProps(item))
            .filter(item => item !== undefined);
    }
    
    if (typeof obj !== 'object' || obj.constructor !== Object) {
        return obj;
    }

    const newObj: { [key: string]: any } = {};
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            const value = obj[key];
            if (value !== undefined) {
                const cleanedValue = removeUndefinedProps(value);
                if (cleanedValue !== undefined) {
                    newObj[key] = cleanedValue;
                }
            }
        }
    }
    
    return newObj;
};

/**
 * Finds a team entity from the directory map using a more robust matching logic.
 * It first tries an exact match, then tries a cleaned match by removing common suffixes.
 * @param name The team name to search for.
 * @param map The directory map with lowercase keys.
 * @returns A DirectoryEntity or undefined if not found.
 */
export const findInMap = (name: string, map: Map<string, DirectoryEntity>): DirectoryEntity | undefined => {
    if (!name) return undefined;
    const lowerName = name.trim().toLowerCase();
    
    // 1. Try exact match on the lowercase name
    const exactMatch = map.get(lowerName);
    if (exactMatch) return exactMatch;
    
    // 2. Try matching by cleaning suffixes like 'FC', 'Ladies', etc. from both the input and the map keys
    const cleanName = lowerName.replace(/\s+(fc|ladies)$/, '').trim();

    for (const [key, value] of map.entries()) { // map keys are already lowercase
        const cleanKey = key.replace(/\s+(fc|ladies)$/, '').trim();
        if (cleanKey === cleanName) {
            return value;
        }
    }

    return undefined;
};


// Levenshtein distance function to calculate similarity between two strings.
const levenshtein = (s1: string, s2: string): number => {
    s1 = s1.toLowerCase();
    s2 = s2.toLowerCase();
  
    const costs: number[] = new Array(s2.length + 1);
    for (let i = 0; i <= s1.length; i++) {
      let lastValue = i;
      for (let j = 0; j <= s2.length; j++) {
        if (i === 0) {
          costs[j] = j;
        } else {
          if (j > 0) {
            let newValue = costs[j - 1];
            if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
              newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
            }
            costs[j - 1] = lastValue;
            lastValue = newValue;
          }
        }
      }
      if (i > 0) {
        costs[s2.length] = lastValue;
      }
    }
    return costs[s2.length];
};
  
// Normalizes a given team name against a list of official names using fuzzy matching.
export const normalizeTeamName = (inputName: string, officialNames: string[]): string | null => {
    if (!inputName || !officialNames || officialNames.length === 0) {
        return (inputName || '').trim() || null;
    }

    const trimmedInput = inputName.trim();
    
    for (const officialName of officialNames) {
        if (officialName.toLowerCase() === trimmedInput.toLowerCase()) {
            return officialName;
        }
    }

    let bestMatch: string | null = null;
    let minDistance = Infinity;

    for (const officialName of officialNames) {
        const distance = levenshtein(trimmedInput, officialName);
        if (distance < minDistance) {
            minDistance = distance;
            bestMatch = officialName;
        }
    }

    const threshold = Math.min(5, Math.floor(trimmedInput.length / 3)); 

    if (bestMatch && minDistance <= threshold) {
        return bestMatch;
    }

    console.warn(`[normalizeTeamName] Could not confidently match "${trimmedInput}" to any official team name.`)
    return null;
};

/**
 * Calculates league standings from a list of teams and finished matches.
 * It resets all stats, processes all finished matches to calculate new stats,
 * and then sorts the teams based on standard football league rules.
 * @param baseTeams The original list of teams.
 * @param allResults The list of all finished matches for the competition.
 * @param allFixtures The list of all scheduled matches, to check for any misplaced finished matches.
 * @returns A new array of teams with updated and sorted standings.
 */
export const calculateStandings = (baseTeams: Team[], allResults: CompetitionFixture[], allFixtures: CompetitionFixture[] = []): Team[] => {
    const teamsMap: Map<string, Team> = new Map();
    baseTeams.forEach(team => {
        // Create a shallow copy and reset stats. This is safe as we replace the stats object entirely.
        const teamCopy = { ...team };
        teamCopy.stats = { p: 0, w: 0, d: 0, l: 0, gs: 0, gc: 0, gd: 0, pts: 0, form: '' };
        teamsMap.set(team.name.trim(), teamCopy);
    });
    
    // Combine results with any fixtures that are mistakenly marked as 'finished'
    const allFinishedMatches = [
        ...(allResults || []).filter(r => r.status === 'finished' && r.scoreA != null && r.scoreB != null),
        ...(allFixtures || []).filter(f => f.status === 'finished' && f.scoreA != null && f.scoreB != null)
    ];
    
    // Create a composite key to ensure logical uniqueness, not just by ID.
    // A match is unique by its participants and date, regardless of home/away.
    const getMatchKey = (match: CompetitionFixture) => {
        const teams = [match.teamA.trim(), match.teamB.trim()].sort();
        return `${teams[0]}-${teams[1]}-${match.fullDate}`;
    };
    const uniqueFinishedMatches = Array.from(new Map(allFinishedMatches.map(m => [getMatchKey(m), m])).values());


    const sortedFinishedMatches = uniqueFinishedMatches
        .filter(fixture => fixture.fullDate) // Ensure fullDate exists before sorting
        .sort((a, b) => new Date(a.fullDate!).getTime() - new Date(b.fullDate!).getTime());

    for (const fixture of sortedFinishedMatches) {
        const teamA = teamsMap.get(fixture.teamA.trim());
        const teamB = teamsMap.get(fixture.teamB.trim());
        
        if (!teamA || !teamB) {
            console.warn(`Could not find one or both teams for fixture: ${fixture.teamA} vs ${fixture.teamB}`);
            continue;
        }

        const scoreA = fixture.scoreA!;
        const scoreB = fixture.scoreB!;
        
        if (scoreA == null || scoreB == null) continue;

        teamA.stats.p += 1;
        teamB.stats.p += 1;
        teamA.stats.gs += scoreA;
        teamA.stats.gc += scoreB;
        teamB.stats.gs += scoreB;
        teamB.stats.gc += scoreA;
        teamA.stats.gd = teamA.stats.gs - teamA.stats.gc;
        teamB.stats.gd = teamB.stats.gs - teamB.stats.gc;

        let formA: 'W' | 'D' | 'L';
        let formB: 'W' | 'D' | 'L';

        if (scoreA > scoreB) {
            teamA.stats.w += 1;
            teamA.stats.pts += 3;
            teamB.stats.l += 1;
            formA = 'W';
            formB = 'L';
        } else if (scoreB > scoreA) {
            teamB.stats.w += 1;
            teamB.stats.pts += 3;
            teamA.stats.l += 1;
            formB = 'W';
            formA = 'L';
        } else {
            teamA.stats.d += 1;
            teamB.stats.d += 1;
            teamA.stats.pts += 1;
            teamB.stats.pts += 1;
            formA = 'D';
            formB = 'D';
        }
        
        teamA.stats.form = [formA, ...teamA.stats.form.split(' ').filter(Boolean)].slice(0, 5).join(' ');
        teamB.stats.form = [formB, ...teamB.stats.form.split(' ').filter(Boolean)].slice(0, 5).join(' ');
    }

    const updatedTeams = Array.from(teamsMap.values());

    updatedTeams.sort((a, b) => {
        if (b.stats.pts !== a.stats.pts) return b.stats.pts - a.stats.pts;
        if (b.stats.gd !== a.stats.gd) return b.stats.gd - a.stats.gd;
        if (b.stats.gs !== a.stats.gs) return b.stats.gs - a.stats.gs;
        return a.name.localeCompare(b.name);
    });

    return updatedTeams;
};