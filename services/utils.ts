
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
export const levenshtein = (s1: string, s2: string): number => {
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

// Helper normalize function for consistent key usage
export const normalize = (name: string) => 
    (name || '')
    .trim()
    .toLowerCase()
    .replace(/&/g, 'and') // Replace ampersand with 'and'
    .replace(/\.|fc|football club/g, '') // remove all dots and 'fc' variants
    .replace(/\s+/g, ' ') // collapse multiple spaces
    .trim();

  
// Normalizes a given team name against a list of official names using fuzzy matching.
export const normalizeTeamName = (inputName: string, officialNames: string[]): string | null => {
    if (!inputName || !officialNames || officialNames.length === 0) {
        return (inputName || '').trim() || null;
    }

    const trimmedInput = inputName.trim();
    
    // 1. Try exact match (case-insensitive)
    for (const officialName of officialNames) {
        if (officialName.toLowerCase() === trimmedInput.toLowerCase()) {
            return officialName;
        }
    }

    // 2. Fuzzy Match
    let bestMatch: string | null = null;
    let minDistance = Infinity;
    const normalizedInput = normalize(trimmedInput);

    for (const officialName of officialNames) {
        const normalizedOfficial = normalize(officialName);
        const distance = levenshtein(normalizedInput, normalizedOfficial);
        
        if (distance < minDistance) {
            minDistance = distance;
            bestMatch = officialName;
        }
    }

    // Threshold: allow small typos (e.g. 1-2 chars diff)
    // "Royal Leopard" vs "Royal Leopards" (dist 1) -> Pass
    // "Mbabane" vs "Manzini" (dist large) -> Fail
    const threshold = Math.max(2, Math.floor(trimmedInput.length / 4));

    if (bestMatch && minDistance <= threshold) {
        return bestMatch;
    }

    return null;
};

/**
 * Calculates league standings from a list of teams and finished matches.
 * Implements Official Rules 8.1 & 8.2:
 * 1. Points
 * 2. Head-to-Head Points (if tied on points)
 * 3. Head-to-Head Away Goals (if tied on H2H points)
 * 4. Goal Difference (Overall)
 * 5. Goals Scored (Overall)
 * 
 * @param baseTeams The original list of teams.
 * @param allResults The list of all finished matches for the competition.
 * @param allFixtures The list of all scheduled matches.
 * @returns A new array of teams with updated and sorted standings.
 */
export const calculateStandings = (baseTeams: Team[], allResults: CompetitionFixture[], allFixtures: CompetitionFixture[] = []): Team[] => {
    const teamsMap: Map<string, Team> = new Map();
    
    // 1. Initialize map with baseTeams, ensuring stats are reset
    baseTeams.forEach(team => {
        const teamCopy = { ...team };
        teamCopy.stats = { p: 0, w: 0, d: 0, l: 0, gs: 0, gc: 0, gd: 0, pts: 0, form: '' };
        teamsMap.set(normalize(team.name), teamCopy);
    });
    
    const allMatches = [...(allResults || []), ...(allFixtures || [])];

    // 2. Helper to resolve a name to an existing key in the map using fuzzy logic
    const resolveKey = (name: string): string | null => {
        const normName = normalize(name);
        if (teamsMap.has(normName)) return normName;

        // Fuzzy search existing keys
        let bestKey: string | null = null;
        let minDist = Infinity;
        
        for (const key of teamsMap.keys()) {
            const dist = levenshtein(normName, key);
            if (dist < minDist) {
                minDist = dist;
                bestKey = key;
            }
        }
        
        // Strict threshold: only match if very close (e.g. plural 's' missing)
        if (bestKey && minDist <= 2) {
            return bestKey;
        }
        return null;
    };

    // 3. Discover completely NEW teams that don't match anything in baseTeams
    allMatches.forEach(match => {
        [match.teamA, match.teamB].forEach(teamName => {
            if (teamName) {
                const resolvedKey = resolveKey(teamName);
                
                // If we couldn't resolve it to ANY existing team (even fuzzy), it's a true ghost/new team.
                if (!resolvedKey) {
                    const normalizedName = normalize(teamName);
                    if (!teamsMap.has(normalizedName)) {
                        console.log(`Discovered completely new team "${teamName}" from match data.`);
                        const newTeam: Team = {
                            id: Date.now() + Math.random(), // Temporary ID
                            name: teamName.trim(),
                            crestUrl: '',
                            stats: { p: 0, w: 0, d: 0, l: 0, gs: 0, gc: 0, gd: 0, pts: 0, form: '' },
                            players: [],
                            fixtures: [],
                            results: [],
                            staff: [],
                        };
                        teamsMap.set(normalizedName, newTeam);
                    }
                }
            }
        });
    });
    
    // 4. Combine results with any fixtures that are mistakenly marked as 'finished'
    const allFinishedMatches = allMatches
        .filter(r => r.status === 'finished' && r.scoreA != null && r.scoreB != null);
    
    const getMatchKey = (match: CompetitionFixture) => {
        const teams = [match.teamA.trim(), match.teamB.trim()].sort();
        return `${teams[0]}-${teams[1]}-${match.fullDate}`;
    };
    const uniqueFinishedMatches = Array.from(new Map(allFinishedMatches.map(m => [getMatchKey(m), m])).values());

    const sortedFinishedMatches = uniqueFinishedMatches
        .filter(fixture => fixture.fullDate)
        .sort((a, b) => new Date(a.fullDate!).getTime() - new Date(b.fullDate!).getTime());

    for (const fixture of sortedFinishedMatches) {
        // Resolve names to keys (handling typos)
        const keyA = resolveKey(fixture.teamA) || normalize(fixture.teamA);
        const keyB = resolveKey(fixture.teamB) || normalize(fixture.teamB);
        
        const teamA = teamsMap.get(keyA);
        const teamB = teamsMap.get(keyB);
        
        if (!teamA || !teamB) {
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
            teamA.stats.pts += 3; // Rule 8.1
            teamB.stats.l += 1;
            formA = 'W';
            formB = 'L';
        } else if (scoreB > scoreA) {
            teamB.stats.w += 1;
            teamB.stats.pts += 3; // Rule 8.1
            teamA.stats.l += 1;
            formB = 'W';
            formA = 'L';
        } else {
            teamA.stats.d += 1;
            teamB.stats.d += 1;
            teamA.stats.pts += 1; // Rule 8.1
            teamB.stats.pts += 1;
            formA = 'D';
            formB = 'D';
        }
        
        teamA.stats.form = [formA, ...teamA.stats.form.split(' ').filter(Boolean)].slice(0, 5).join(' ');
        teamB.stats.form = [formB, ...teamB.stats.form.split(' ').filter(Boolean)].slice(0, 5).join(' ');
    }

    const updatedTeams = Array.from(teamsMap.values());

    // 5. Sort Teams based on Rules 8.2(a) - 8.2(d)
    updatedTeams.sort((a, b) => {
        // Rule 8.2(a): Points obtained in all matches
        if (b.stats.pts !== a.stats.pts) {
            return b.stats.pts - a.stats.pts;
        }

        // Rule 8.2(b): Head-to-Head (H2H)
        // Find all finished matches between Team A and Team B
        const normA = normalize(a.name);
        const normB = normalize(b.name);

        const h2hMatches = sortedFinishedMatches.filter(m => {
            const mNormA = normalize(m.teamA);
            const mNormB = normalize(m.teamB);
            return (mNormA === normA && mNormB === normB) || (mNormA === normB && mNormB === normA);
        });

        if (h2hMatches.length > 0) {
            let ptsA = 0;
            let ptsB = 0;
            let awayGoalsA = 0;
            let awayGoalsB = 0;

            h2hMatches.forEach(m => {
                const mNormA = normalize(m.teamA);
                const sA = m.scoreA ?? 0;
                const sB = m.scoreB ?? 0;

                // Determine if 'a' is Home or Away in this match
                const isAHome = mNormA === normA;

                if (isAHome) {
                    // Match: A (Home) vs B (Away)
                    if (sA > sB) ptsA += 3;
                    else if (sB > sA) ptsB += 3;
                    else { ptsA += 1; ptsB += 1; }
                    
                    // B scored 'sB' away goals
                    awayGoalsB += sB;
                } else {
                    // Match: B (Home) vs A (Away)
                    if (sB > sA) ptsB += 3;
                    else if (sA > sB) ptsA += 3;
                    else { ptsB += 1; ptsA += 1; }
                    
                    // A scored 'sA' away goals
                    awayGoalsA += sA;
                }
            });

            // 1. H2H Points
            if (ptsA !== ptsB) return ptsB - ptsA;

            // 2. H2H Away Goals Rule (inherent in 8.2(b))
            if (awayGoalsA !== awayGoalsB) return awayGoalsB - awayGoalsA;
        }

        // Rule 8.2(c): Goal Difference (Overall)
        if (b.stats.gd !== a.stats.gd) {
            return b.stats.gd - a.stats.gd;
        }

        // Rule 8.2(d): Most Goals Scored (Overall)
        if (b.stats.gs !== a.stats.gs) {
            return b.stats.gs - a.stats.gs;
        }

        // Fallback: Alphabetical order
        return a.name.localeCompare(b.name);
    });

    return updatedTeams;
};

/**
 * Compresses an image file to a JPEG Base64 string with specified max width and quality.
 * @param file The image file to compress
 * @param maxWidth Maximum width in pixels
 * @param quality JPEG quality (0 to 1)
 * @returns Promise resolving to the base64 string
 */
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
