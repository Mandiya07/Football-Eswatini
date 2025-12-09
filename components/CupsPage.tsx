
import React, { useState, useEffect, useMemo } from 'react';
import TournamentBracketDisplay from './TournamentBracketDisplay';
import { Tournament, cupData as localCupData } from '../data/cups';
import { fetchCups, fetchAllTeams, fetchDirectoryEntries } from '../services/api';
import SectionLoader from './SectionLoader';
import InfoIcon from './icons/InfoIcon';
import { Card, CardContent } from './ui/Card';
import TrophyIcon from './icons/TrophyIcon';
import MapPinIcon from './icons/MapPinIcon';
import ArrowRightIcon from './icons/ArrowRightIcon';
import ArrowLeftIcon from './icons/ArrowLeftIcon';

type ViewState = 'hub' | 'ingwenyama-hub' | 'bracket';

const CupsPage: React.FC = () => {
  const [cups, setCups] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<ViewState>('hub');
  const [selectedCupId, setSelectedCupId] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
          const [fetchedCups, fetchedTeams, dirEntries] = await Promise.all([
              fetchCups(), 
              fetchAllTeams(),
              fetchDirectoryEntries()
          ]);
          
          // Create crest map from directory (Source of Truth)
          const crestMap = new Map<string, string>();
          dirEntries.forEach(e => {
             if (e.crestUrl) crestMap.set(e.name.trim().toLowerCase(), e.crestUrl);
          });
          
          // Create a map starting with local data as fallback
          const cupsMap = new Map<string, Tournament>();
          localCupData.forEach(cup => cupsMap.set(cup.id, cup));

          if (fetchedCups.length > 0) {
              fetchedCups.forEach((cup: any) => {
                  const sampleMatch = cup.rounds?.[0]?.matches?.[0];
                  const isIdBased = sampleMatch && (sampleMatch.team1Id !== undefined || sampleMatch.team1 === undefined);
                  
                  let processedCup = cup as Tournament;

                  if (isIdBased) {
                      const newRounds = cup.rounds.map((round: any) => ({
                          title: round.title,
                          matches: round.matches.map((m: any) => {
                              const t1 = fetchedTeams.find(t => t.id === m.team1Id);
                              const t1Name = t1 ? t1.name : (m.round > 1 ? 'Winner Previous' : 'TBD');
                              const t1Crest = crestMap.get(t1Name.trim().toLowerCase()) || (t1 ? t1.crestUrl : undefined);
                              
                              const t2 = fetchedTeams.find(t => t.id === m.team2Id);
                              const t2Name = t2 ? t2.name : (m.round > 1 ? 'Winner Previous' : 'TBD');
                              const t2Crest = crestMap.get(t2Name.trim().toLowerCase()) || (t2 ? t2.crestUrl : undefined);

                              let winner: 'team1' | 'team2' | undefined;
                              if (m.winnerId) {
                                  if (m.winnerId === m.team1Id) winner = 'team1';
                                  else if (m.winnerId === m.team2Id) winner = 'team2';
                              } else if (m.winner) {
                                  winner = m.winner; 
                              }

                              return {
                                  id: m.id,
                                  date: m.date,
                                  time: m.time,
                                  venue: m.venue,
                                  team1: { name: t1Name, crestUrl: t1Crest, score: m.score1 },
                                  team2: { name: t2Name, crestUrl: t2Crest, score: m.score2 },
                                  winner: winner
                              };
                          })
                      }));
                      processedCup = { ...cup, rounds: newRounds };
                  } else {
                       // Apply directory crests to non-ID based cups too
                       const newRounds = cup.rounds.map((round: any) => ({
                          title: round.title,
                          matches: round.matches.map((m: any) => {
                              const t1Name = m.team1?.name || 'TBD';
                              const t2Name = m.team2?.name || 'TBD';
                              const t1Crest = crestMap.get(t1Name.trim().toLowerCase()) || m.team1?.crestUrl;
                              const t2Crest = crestMap.get(t2Name.trim().toLowerCase()) || m.team2?.crestUrl;
                              
                              return {
                                  ...m,
                                  team1: { ...m.team1, crestUrl: t1Crest },
                                  team2: { ...m.team2, crestUrl: t2Crest }
                              };
                          })
                       }));
                       processedCup = { ...cup, rounds: newRounds };
                  }
                  
                  // Robust matching for admin-created tournament names to map to UI cards
                  const cupNameLower = processedCup.name.toLowerCase();
                  
                  if (cupNameLower.includes("manzini") && cupNameLower.includes("ingwenyama")) {
                      cupsMap.set('ingwenyama-manzini', { ...processedCup, id: 'ingwenyama-manzini' });
                  } else if (cupNameLower.includes("hhohho") && cupNameLower.includes("ingwenyama")) {
                      cupsMap.set('ingwenyama-hhohho', { ...processedCup, id: 'ingwenyama-hhohho' });
                  } else if (cupNameLower.includes("lubombo") && cupNameLower.includes("ingwenyama")) {
                      cupsMap.set('ingwenyama-lubombo', { ...processedCup, id: 'ingwenyama-lubombo' });
                  } else if (cupNameLower.includes("shiselweni") && cupNameLower.includes("ingwenyama")) {
                      cupsMap.set('ingwenyama-shiselweni', { ...processedCup, id: 'ingwenyama-shiselweni' });
                  } else if (cupNameLower.includes("ingwenyama cup (national finals)") || (cupNameLower.includes("ingwenyama") && cupNameLower.includes("national"))) {
                      cupsMap.set('ingwenyama-cup', { ...processedCup, id: 'ingwenyama-cup' });
                  } else {
                      // Overwrite or add normally using its Firestore ID
                      cupsMap.set(cup.id, processedCup);
                  }
              });
          }
          
          setCups(Array.from(cupsMap.values()));
      } catch (e) {
          console.error("Failed to load cups, using fallback.", e);
          setCups(localCupData);
      } finally {
          setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleCupSelect = (id: string) => {
      setSelectedCupId(id);
      setCurrentView('bracket');
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleIngwenyamaSelect = () => {
      setCurrentView('ingwenyama-hub');
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBack = () => {
      if (currentView === 'bracket') {
          // If we were deep in a regional bracket, go back to region hub
          if (selectedCupId?.startsWith('ingwenyama-')) {
              setCurrentView('ingwenyama-hub');
          } else {
              setCurrentView('hub');
          }
      } else if (currentView === 'ingwenyama-hub') {
          setCurrentView('hub');
      }
      setSelectedCupId(null);
  };

  // --- Render Functions ---

  const renderHub = () => (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto animate-fade-in">
          {/* Ingwenyama Cup Card */}
          <Card 
            className="group cursor-pointer hover:shadow-2xl transition-all duration-300 border-t-4 border-yellow-600 bg-gradient-to-br from-white to-yellow-50"
            onClick={handleIngwenyamaSelect}
          >
              <CardContent className="p-8 flex flex-col items-center text-center h-full">
                  <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                      <TrophyIcon className="w-10 h-10 text-yellow-700" />
                  </div>
                  <h2 className="text-3xl font-display font-bold text-gray-900 mb-3">Ingwenyama Cup</h2>
                  <p className="text-gray-600 mb-6 flex-grow">
                      The prestigious knockout tournament blending football with culture. Featuring regional qualifiers culminating in a grand national final.
                  </p>
                  <span className="text-yellow-700 font-bold flex items-center gap-2">
                      View Regions & Finals <ArrowRightIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform"/>
                  </span>
              </CardContent>
          </Card>

          {/* Trade Fair Cup Card */}
          <Card 
            className="group cursor-pointer hover:shadow-2xl transition-all duration-300 border-t-4 border-blue-600 bg-gradient-to-br from-white to-blue-50"
            onClick={() => handleCupSelect('trade-fair-cup')}
          >
              <CardContent className="p-8 flex flex-col items-center text-center h-full">
                  <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                      <TrophyIcon className="w-10 h-10 text-blue-700" />
                  </div>
                  <h2 className="text-3xl font-display font-bold text-gray-900 mb-3">Trade Fair Cup</h2>
                  <p className="text-gray-600 mb-6 flex-grow">
                      The season opener held during the Eswatini International Trade Fair. A historic competition showcasing Premier League talent.
                  </p>
                  <span className="text-blue-700 font-bold flex items-center gap-2">
                      View Bracket <ArrowRightIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform"/>
                  </span>
              </CardContent>
          </Card>
      </div>
  );

  const renderIngwenyamaHub = () => (
      <div className="animate-fade-in">
          <div className="mb-8">
              <Card className="bg-yellow-50 border-l-4 border-yellow-600">
                  <CardContent className="p-6 flex items-start gap-4">
                      <InfoIcon className="w-6 h-6 text-yellow-700 flex-shrink-0 mt-1"/>
                      <div>
                          <h3 className="font-bold text-yellow-900 text-lg">Regional Qualifiers</h3>
                          <p className="text-yellow-800 text-sm mt-1">
                              Winners from the four regional qualifiers join the National First Division and Premier League teams in the main knockout draw.
                          </p>
                      </div>
                  </CardContent>
              </Card>
          </div>

          <h2 className="text-2xl font-bold font-display text-center mb-6 text-gray-800">Select a Bracket</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {/* National Final */}
              <Card 
                className="sm:col-span-2 lg:col-span-3 cursor-pointer hover:shadow-xl transition-shadow bg-gray-900 text-white"
                onClick={() => handleCupSelect('ingwenyama-cup')}
              >
                  <CardContent className="p-6 flex items-center justify-between">
                      <div>
                          <h3 className="text-2xl font-bold font-display text-yellow-400">National Finals (Main Draw)</h3>
                          <p className="text-gray-300 text-sm mt-1">The Last 32 to the Grand Final</p>
                      </div>
                      <ArrowRightIcon className="w-8 h-8 text-white" />
                  </CardContent>
              </Card>

              {/* Regions */}
              {[
                  { id: 'ingwenyama-hhohho', name: 'Hhohho Region', sub: 'Hhohho Super League Qualifiers', color: 'text-blue-600', bg: 'bg-blue-50' },
                  { id: 'ingwenyama-manzini', name: 'Manzini Region', sub: 'Manzini Super League Qualifiers', color: 'text-red-600', bg: 'bg-red-50' },
                  { id: 'ingwenyama-lubombo', name: 'Lubombo Region', sub: 'Lubombo Super League Qualifiers', color: 'text-green-600', bg: 'bg-green-50' },
                  { id: 'ingwenyama-shiselweni', name: 'Shiselweni Region', sub: 'Shiselweni Super League Qualifiers', color: 'text-orange-600', bg: 'bg-orange-50' },
                  { id: 'ingwenyama-cup-women', name: 'Women\'s Tournament', sub: 'View Ladies Bracket', color: 'text-pink-600', bg: 'bg-pink-50' },
              ].map(region => (
                  <Card 
                    key={region.id} 
                    className="cursor-pointer hover:shadow-lg transition-all hover:-translate-y-1"
                    onClick={() => handleCupSelect(region.id)}
                  >
                      <CardContent className="p-6 flex flex-col items-center text-center">
                          <div className={`w-12 h-12 ${region.bg} rounded-full flex items-center justify-center mb-3`}>
                              <MapPinIcon className={`w-6 h-6 ${region.color}`} />
                          </div>
                          <h3 className="font-bold text-lg text-gray-800">{region.name}</h3>
                          <p className="text-xs text-gray-500 mt-1">{region.sub}</p>
                      </CardContent>
                  </Card>
              ))}
          </div>
      </div>
  );

  const renderBracketView = () => {
      const selectedCup = cups.find(c => c.id === selectedCupId);
      
      if (!selectedCup) {
          return (
              <div className="text-center py-12">
                  <p className="text-gray-500 mb-4">Tournament data not found.</p>
                  <button onClick={handleBack} className="text-blue-600 hover:underline">Go Back</button>
              </div>
          );
      }

      return (
          <div className="animate-slide-up">
              <TournamentBracketDisplay tournament={selectedCup} />
          </div>
      );
  };

  return (
    <div className="bg-gray-50 py-12 min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header & Navigation */}
        <div className="mb-8">
            {currentView !== 'hub' && (
                <button 
                    onClick={handleBack} 
                    className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors mb-6"
                >
                    <ArrowLeftIcon className="w-4 h-4" />
                    {currentView === 'bracket' ? 'Back to Selection' : 'Back to All Cups'}
                </button>
            )}
            
            <div className="text-center">
                <h1 className="text-4xl md:text-5xl font-display font-extrabold text-blue-800 mb-2">
                    {currentView === 'hub' ? 'Domestic Cups' : 
                     currentView === 'ingwenyama-hub' ? 'Ingwenyama Cup Hub' : 
                     cups.find(c => c.id === selectedCupId)?.name || 'Tournament Bracket'}
                </h1>
                {currentView === 'hub' && (
                    <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                        Follow the knockout stages of Eswatini's prestigious cup competitions.
                    </p>
                )}
            </div>
        </div>
        
        {loading ? <SectionLoader /> : (
            <>
                {currentView === 'hub' && renderHub()}
                {currentView === 'ingwenyama-hub' && renderIngwenyamaHub()}
                {currentView === 'bracket' && renderBracketView()}
            </>
        )}
      </div>
    </div>
  );
};

export default CupsPage;
