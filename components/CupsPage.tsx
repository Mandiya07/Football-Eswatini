
import React, { useState, useEffect, useMemo } from 'react';
import TournamentBracketDisplay from './TournamentBracketDisplay';
import { Tournament, cupData as localCupData } from '../data/cups';
import { fetchCups } from '../services/api';
import SectionLoader from './SectionLoader';
import InfoIcon from './icons/InfoIcon';
import { Card, CardContent } from './ui/Card';

const CupsPage: React.FC = () => {
  const [cups, setCups] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
          // Try fetching from API
          const data = await fetchCups();
          if (data.length > 0) {
              setCups(data);
          } else {
              // Fallback to local static data if API returns empty (so the UI is never empty for the user)
              console.log("No API data found, using local fallback for Cups.");
              setCups(localCupData);
          }
      } catch (e) {
          console.error("Failed to load cups, using fallback.", e);
          setCups(localCupData);
      } finally {
          setLoading(false);
      }
    };
    loadData();
  }, []);

  const ingwenyamaCup = useMemo(() => cups.find(c => c.id === 'ingwenyama-cup'), [cups]);
  const ingwenyamaCupWomen = useMemo(() => cups.find(c => c.id === 'ingwenyama-cup-women'), [cups]);
  const tradeFairCup = useMemo(() => cups.find(c => c.id === 'trade-fair-cup'), [cups]);

  return (
    <div className="bg-gray-50 py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 animate-fade-in">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-display font-extrabold text-blue-800 mb-2">
            Domestic Cups
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Follow the knockout stages of Eswatini's prestigious cup competitions.
          </p>
        </div>
        
        {loading ? <SectionLoader /> : (
            <div className="space-y-12">
                {(ingwenyamaCup || ingwenyamaCupWomen) && (
                    <div className="space-y-6 animate-slide-up">
                        {/* Ingwenyama Cup Explainer */}
                        <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200">
                            <CardContent className="p-6">
                                <div className="flex items-start gap-4">
                                    <div className="bg-amber-200 p-2 rounded-full text-amber-800 flex-shrink-0 mt-1">
                                        <InfoIcon className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold font-display text-amber-900 mb-2">About the Ingwenyama Cup Format</h3>
                                        <div className="text-sm text-amber-800 space-y-2">
                                            <p>The tournament operates in distinct phases:</p>
                                            <ul className="list-disc list-inside ml-1 space-y-1">
                                                <li><strong>Regional Phase:</strong> Super League clubs from Hhohho, Lubombo, Manzini, and Shiselweni compete in regional qualifiers.</li>
                                                <li><strong>Main Draw Entry:</strong> Winners from the regional phase advance to face Premier League and National First Division teams in the Last 32.</li>
                                                <li><strong>Knockout Rounds:</strong> The tournament proceeds through a straight knockout format from the Last 32 to the Final.</li>
                                                <li><strong>Women's Tournament:</strong> A separate competition runs concurrently for women's teams with its own knockout rounds and prizes.</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {ingwenyamaCup && <TournamentBracketDisplay tournament={ingwenyamaCup} />}
                        {ingwenyamaCupWomen && <TournamentBracketDisplay tournament={ingwenyamaCupWomen} />}
                    </div>
                )}
                
                {tradeFairCup && (
                    <div className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
                        <TournamentBracketDisplay tournament={tradeFairCup} />
                    </div>
                )}

                {!ingwenyamaCup && !ingwenyamaCupWomen && !tradeFairCup && !loading && (
                    <p className="text-center text-gray-500">No cup competitions are currently active.</p>
                )}
            </div>
        )}
      </div>
    </div>
  );
};

export default CupsPage;
