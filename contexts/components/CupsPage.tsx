
import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import TournamentBracketDisplay from './TournamentBracketDisplay';
import { Tournament, cupData as localCupData } from '../data/cups';
import { fetchCups, fetchDirectoryEntries, fetchAllCompetitions } from '../services/api';
import SectionLoader from './SectionLoader';
import InfoIcon from './icons/InfoIcon';
import { Card, CardContent } from './ui/Card';
import TrophyIcon from './icons/TrophyIcon';
import MapPinIcon from './icons/MapPinIcon';
import ArrowRightIcon from './icons/ArrowRightIcon';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import { superNormalize, findInMap } from '../services/utils';

type ViewState = 'hub' | 'ingwenyama-hub' | 'bracket';

const CupsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [cups, setCups] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<ViewState>('hub');
  const [selectedCupId, setSelectedCupId] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
          const [fetchedCups, dirEntries, allCompetitions] = await Promise.all([
              fetchCups(),
              fetchDirectoryEntries(),
              fetchAllCompetitions()
          ]);

          const dirMap = new Map();
          dirEntries.forEach(e => dirMap.set(superNormalize(e.name), e));

          const allGlobalTeams = Object.values(allCompetitions).flatMap(c => c.teams || []);

          const cupsMap = new Map<string, Tournament>();
          localCupData.forEach(cup => cupsMap.set(cup.id, cup));

          if (fetchedCups && fetchedCups.length > 0) {
              fetchedCups.forEach((cup: any) => {
                  if (!cup || !cup.id || !cup.rounds) return;

                  const hydratedRounds = cup.rounds.map((round: any) => ({
                      title: round.title,
                      matches: (round.matches || []).map((m: any) => {
                          const mAny = m as any;
                          const t1Name = mAny.team1Name !== undefined ? mAny.team1Name : (mAny.team1?.name || 'TBD');
                          const t2Name = mAny.team2Name !== undefined ? mAny.team2Name : (mAny.team2?.name || 'TBD');

                          // FAIL-SAFE CREST RESOLUTION
                          const resolveCrest = (name: string, explicitCrest?: string) => {
                              if (!name || name.trim().toUpperCase() === 'TBD') return '';
                              // 1. Priority: Explicit crest stored in match record
                              if (explicitCrest && explicitCrest.trim().length > 0) return explicitCrest;
                              // 2. Fallback: Lookup in directory
                              const dirMatch = findInMap(name, dirMap);
                              if (dirMatch?.crestUrl) return dirMatch.crestUrl;
                              // 3. Fallback: Lookup in global team database
                              const teamMatch = allGlobalTeams.find(t => superNormalize(t.name) === superNormalize(name));
                              return teamMatch?.crestUrl || '';
                          };

                          return {
                              ...m,
                              id: m.id || `match-${Math.random()}`,
                              team1: {
                                  name: t1Name || 'TBD',
                                  crestUrl: resolveCrest(t1Name, mAny.team1Crest || mAny.team1?.crestUrl),
                                  score: (mAny.score1 !== undefined && mAny.score1 !== '') ? mAny.score1 : (mAny.team1?.score !== undefined ? mAny.team1.score : '-')
                              },
                              team2: {
                                  name: t2Name || 'TBD',
                                  crestUrl: resolveCrest(t2Name, mAny.team2Crest || mAny.team2?.crestUrl),
                                  score: (mAny.score2 !== undefined && mAny.score2 !== '') ? mAny.score2 : (mAny.team2?.score !== undefined ? mAny.team2.score : '-')
                              },
                              winner: m.winner || null,
                              venue: m.venue || '',
                              date: m.date || '',
                              time: m.time || ''
                          };
                      })
                  }));
                  cupsMap.set(cup.id, { ...cup, id: cup.id, rounds: hydratedRounds });
              });
          }
          
          const finalCupsList = Array.from(cupsMap.values());
          setCups(finalCupsList);

          const urlCupId = searchParams.get('id');
          if (urlCupId) {
              const found = finalCupsList.find(c => c.id === urlCupId);
              if (found) {
                  setSelectedCupId(urlCupId);
                  setCurrentView('bracket');
              }
          }
      } catch (e) {
          console.error("Failed to load tournaments", e);
      } finally {
          setLoading(false);
      }
    };
    loadData();
  }, [searchParams]);

  const handleCupSelect = (id: string) => setSearchParams({ id });

  const handleBack = () => {
      if (currentView === 'bracket') {
          const currentCup = cups.find(c => c.id === selectedCupId);
          const name = (currentCup?.name || '').toLowerCase();
          if (name.includes('ingwenyama')) setCurrentView('ingwenyama-hub');
          else setCurrentView('hub');
      } else if (currentView === 'ingwenyama-hub') {
          setCurrentView('hub');
      }
      setSelectedCupId(null);
      setSearchParams({});
  };

  const renderHub = () => (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto animate-fade-in">
          <Card 
            className="group cursor-pointer hover:shadow-2xl transition-all duration-300 border-t-4 border-yellow-600 bg-gradient-to-br from-white to-yellow-50"
            onClick={() => setCurrentView('ingwenyama-hub')}
          >
              <CardContent className="p-8 flex flex-col items-center text-center h-full">
                  <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                      <TrophyIcon className="w-10 h-10 text-yellow-700" />
                  </div>
                  <h2 className="text-3xl font-display font-bold text-gray-900 mb-3">Ingwenyama Cup</h2>
                  <p className="text-gray-600 mb-6 flex-grow">Regional qualifiers and National Grand Finals.</p>
                  <span className="text-yellow-700 font-bold flex items-center gap-2">
                      View Hub <ArrowRightIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform"/>
                  </span>
              </CardContent>
          </Card>
          <Card 
            className="group cursor-pointer hover:shadow-2xl transition-all duration-300 border-t-4 border-blue-600 bg-gradient-to-br from-white to-blue-50"
            onClick={() => handleCupSelect('trade-fair-cup')}
          >
              <CardContent className="p-8 flex flex-col items-center text-center h-full">
                  <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                      <TrophyIcon className="w-10 h-10 text-blue-700" />
                  </div>
                  <h2 className="text-3xl font-display font-bold text-gray-900 mb-3">Trade Fair Cup</h2>
                  <p className="text-gray-600 mb-6 flex-grow">The traditional season-opening tournament.</p>
                  <span className="text-blue-700 font-bold flex items-center gap-2">
                      View Bracket <ArrowRightIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform"/>
                  </span>
              </CardContent>
          </Card>
      </div>
  );

  const renderIngwenyamaHub = () => {
      const findRegionCupId = (regionName: string) => {
          const normRegion = superNormalize(regionName);
          const candidates = cups.filter(c => {
              const normName = superNormalize(c.name);
              return normName.includes(normRegion) && (normName.includes('ingwenyama') || normName.includes('cup'));
          });
          if (candidates.length === 0) return `${regionName.toLowerCase()}-super-league-ingwenyama-cup`;
          const bestMatch = candidates.sort((a, b) => {
              const countData = (cup: Tournament) => cup.rounds?.reduce((acc, round) => acc + round.matches.filter(m => m.team1.name && m.team1.name.trim().toUpperCase() !== 'TBD').length, 0) || 0;
              return countData(b) - countData(a);
          })[0];
          return bestMatch.id;
      };
      const regions = [
          { id: findRegionCupId('Hhohho'), label: 'Hhohho Region', color: 'text-blue-600', bg: 'bg-blue-50' },
          { id: findRegionCupId('Lubombo'), label: 'Lubombo Region', color: 'text-green-600', bg: 'bg-green-50' },
          { id: findRegionCupId('Shiselweni'), label: 'Shiselweni Region', color: 'text-orange-600', bg: 'bg-orange-50' },
          { id: findRegionCupId('Manzini'), label: 'Manzini Region', color: 'text-red-600', bg: 'bg-red-50' },
      ];
      return (
          <div className="animate-fade-in">
              <div className="mb-8">
                  <Card className="bg-yellow-50 border-l-4 border-yellow-600">
                      <CardContent className="p-6 flex items-start gap-4">
                          <InfoIcon className="w-6 h-6 text-yellow-700 flex-shrink-0 mt-1"/>
                          <div>
                              <h3 className="font-bold text-yellow-900 text-lg">Ingwenyama Cup Hub</h3>
                              <p className="text-yellow-800 text-sm mt-1">Track progress through regional qualifiers and national draw.</p>
                          </div>
                      </CardContent>
                  </Card>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
                  <Card 
                    className="sm:col-span-2 lg:col-span-3 cursor-pointer hover:shadow-xl transition-shadow bg-gray-900 text-white border-b-4 border-yellow-500"
                    onClick={() => handleCupSelect('ingwenyama-cup')}
                  >
                      <CardContent className="p-6 flex items-center justify-between">
                          <div><h3 className="text-2xl font-bold font-display text-yellow-400">National Finals (Main Draw)</h3><p className="text-gray-300 text-sm mt-1">The Grand Finale featuring elite qualified clubs.</p></div>
                          <ArrowRightIcon className="w-8 h-8 text-white" />
                      </CardContent>
                  </Card>
                  {regions.map(region => (
                      <Card key={region.id} className="cursor-pointer hover:shadow-lg transition-all hover:-translate-y-1" onClick={() => handleCupSelect(region.id)}>
                          <CardContent className="p-6 flex flex-col items-center text-center">
                              <div className={`w-12 h-12 ${region.bg} rounded-full flex items-center justify-center mb-3`}><MapPinIcon className={`w-6 h-6 ${region.color}`} /></div>
                              <h3 className="font-bold text-lg text-gray-800">{region.label}</h3>
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">View Live Qualifiers</p>
                          </CardContent>
                      </Card>
                  ))}
              </div>
          </div>
      );
  };

  return (
    <div className="bg-eswatini-pattern py-12 min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
            {currentView !== 'hub' && (
                <button onClick={handleBack} className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors mb-6"><ArrowLeftIcon className="w-4 h-4" /> Back</button>
            )}
            <div className="text-center"><h1 className="text-4xl md:text-5xl font-display font-extrabold text-primary mb-2">{currentView === 'hub' ? 'Domestic Cups' : currentView === 'ingwenyama-hub' ? 'Ingwenyama Cup Hub' : cups.find(c => c.id === selectedCupId)?.name || 'Tournament Bracket'}</h1></div>
        </div>
        {loading ? <SectionLoader /> : (
            <>
                {currentView === 'hub' && renderHub()}
                {currentView === 'ingwenyama-hub' && renderIngwenyamaHub()}
                {currentView === 'bracket' && (
                    <div className="animate-slide-up">
                        {cups.find(c => c.id === selectedCupId) ? <TournamentBracketDisplay tournament={cups.find(c => c.id === selectedCupId)!} /> : <div className="text-center py-20 bg-white rounded-3xl border border-dashed"><p className="text-gray-400">Loading your bracket data...</p></div>}
                    </div>
                )}
            </>
        )}
      </div>
    </div>
  );
};

export default CupsPage;
