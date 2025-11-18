

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CompetitionFixture, Team } from '../data/teams';
import { DirectoryEntity } from '../data/directory';
// FIX: Import 'fetchCompetition' which is now correctly exported from the API service.
import { fetchCompetition, fetchDirectoryEntries } from '../services/api';
import CountdownTimer from './CountdownTimer';
import { findInMap } from '../services/utils';

const Hero: React.FC = () => {
    const [nextMatch, setNextMatch] = useState<CompetitionFixture | null>(null);
    const [teams, setTeams] = useState<Team[]>([]);
    const [directoryMap, setDirectoryMap] = useState<Map<string, DirectoryEntity>>(new Map());
    const competitionId = 'mtn-premier-league';
    const heroImageUrl = "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?q=80&w=1935&auto=format&fit=crop";


    useEffect(() => {
        const getNextMatch = async () => {
            const [premierLeagueData, directoryEntries] = await Promise.all([
                fetchCompetition(competitionId),
                fetchDirectoryEntries()
            ]);

            const map = new Map<string, DirectoryEntity>();
            directoryEntries.forEach(entry => map.set(entry.name.trim().toLowerCase(), entry));
            setDirectoryMap(map);

            if (premierLeagueData) {
                setTeams(premierLeagueData.teams || []);
                if (premierLeagueData.fixtures) {
                    const upcoming = premierLeagueData.fixtures
                        .filter(f => f.status === 'scheduled' && f.fullDate)
                        .sort((a, b) => +new Date(a.fullDate!) - +new Date(b.fullDate!));
                    
                    if (upcoming.length > 0) {
                        setNextMatch(upcoming[0]);
                    }
                }
            }
        };

        getNextMatch();
    }, []);

    const teamA = teams.find(t => t.name === nextMatch?.teamA);
    const teamB = teams.find(t => t.name === nextMatch?.teamB);

    const teamADirectory = findInMap(nextMatch?.teamA || '', directoryMap);
    const teamBDirectory = findInMap(nextMatch?.teamB || '', directoryMap);

    const crestA = teamADirectory?.crestUrl || teamA?.crestUrl;
    const crestB = teamBDirectory?.crestUrl || teamB?.crestUrl;

    const handleScroll = (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        const targetId = e.currentTarget.getAttribute('href')?.substring(1);
        if (targetId) {
            const targetElement = document.getElementById(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({ behavior: 'smooth' });
            }
        }
    };

  return (
    <section 
      className="relative h-[80vh] bg-cover bg-center flex items-center justify-center text-white overflow-hidden"
      style={{ backgroundImage: `url(${heroImageUrl})` }}
    >
      <div className="absolute inset-0 bg-black/50"></div>
      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 z-10">
        <div className="max-w-4xl mx-auto text-center">
            {nextMatch ? (
                <div className="animate-fade-in-slow">
                    <p className="font-semibold text-accent mb-2">Next Match</p>
                    <div className="flex items-center justify-center gap-4 md:gap-8 mb-4">
                        <div className="text-right">
                            <div className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-2 bg-white/20 backdrop-blur-sm rounded-full p-2 flex items-center justify-center">
                                {crestA && <img src={crestA} alt={nextMatch.teamA} className="max-w-full max-h-full object-contain"/>}
                            </div>
                            <h2 className="text-xl md:text-3xl font-bold font-display">{nextMatch.teamA}</h2>
                        </div>
                        <span className="text-4xl md:text-5xl font-light text-gray-300">vs</span>
                        <div className="text-left">
                            <div className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-2 bg-white/20 backdrop-blur-sm rounded-full p-2 flex items-center justify-center">
                                {crestB && <img src={crestB} alt={nextMatch.teamB} className="max-w-full max-h-full object-contain"/>}
                            </div>
                             <h2 className="text-xl md:text-3xl font-bold font-display">{nextMatch.teamB}</h2>
                        </div>
                    </div>
                    {nextMatch.fullDate && <CountdownTimer targetDate={nextMatch.fullDate} />}
                </div>
            ) : (
                <>
                    <h1 className="text-5xl md:text-7xl font-extrabold font-display tracking-tight leading-tight mb-4 animate-fade-in-up">
                        FOOTBALL <span className="text-accent">ESWATINI</span>
                    </h1>
                    <p className="text-lg md:text-xl text-neutral-light/90 max-w-2xl mx-auto animate-fade-in-up animation-delay-300">
                        Your official source for fixtures, results, and news on football in the Kingdom of Eswatini.
                    </p>
                </>
            )}

            <div className="mt-8 flex justify-center gap-4 animate-fade-in-up animation-delay-600">
                <Link to="/fixtures" className="bg-accent text-neutral-dark font-bold py-3 px-6 rounded-lg hover:bg-yellow-300 transition-colors">
                    View Fixtures
                </Link>
                <a href="#matches" onClick={handleScroll} className="bg-white/20 backdrop-blur-sm text-white font-bold py-3 px-6 rounded-lg hover:bg-white/30 transition-colors">
                    Live Scores
                </a>
            </div>
        </div>
      </div>
    </section>
  );
};

// FIX: Add default export for Hero component
export default Hero;