

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from './ui/Card';
import SchoolIcon from './icons/SchoolIcon';
import TrophyIcon from './icons/TrophyIcon';
import MapPinIcon from './icons/MapPinIcon';
import StarIcon from './icons/StarIcon';
import { fetchYouthData, fetchCups } from '../services/api';
import { YouthLeague } from '../data/youth';
import { Tournament, cupData as localCupData } from '../data/cups';
import Spinner from './ui/Spinner';
import TournamentBracketDisplay from './TournamentBracketDisplay';
import RisingStars from './RisingStars';
import Fixtures from './Fixtures';
import NewsSection from './News';

const SchoolsPage: React.FC = () => {
  const [schoolsData, setSchoolsData] = useState<YouthLeague | null>(null);
  const [instacashBracket, setInstacashBracket] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Fetch Schools/Youth Data
        const youthLeagues = await fetchYouthData();
        const schoolsLeague = youthLeagues.find(l => l.id === 'schools');
        setSchoolsData(schoolsLeague || null);

        // Fetch Cup Data for Bracket
        const allCups = await fetchCups();
        let foundBracket = allCups.find(c => c.id === 'instacash-schools-tournament');
        
        // Fallback to local data if not found in API (ensure localCupData has it added)
        if (!foundBracket) {
            foundBracket = localCupData.find(c => c.id === 'instacash-schools-tournament');
        }
        setInstacashBracket(foundBracket || null);

      } catch (error) {
        console.error("Failed to load schools data", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  return (
    <div className="bg-gray-50 py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 animate-fade-in">
        
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-block p-4 bg-orange-100 rounded-full mb-4">
            <SchoolIcon className="w-12 h-12 text-orange-600" />
          </div>
          <h1 className="text-4xl md:text-6xl font-display font-extrabold text-blue-900 mb-4">
            Instacash Schools Tournament
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            A national school football competition run in partnership with the Eswatini Schools Sports Association. 
            Developing young talent and giving learners a professional platform to shine.
          </p>
        </div>

        <div className="mb-16">
             <NewsSection category="Schools" />
        </div>

        {/* Info Grid - Tournament Structure */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <Card className="shadow-lg border-t-4 border-blue-500">
                <CardContent className="p-8 text-center">
                    <div className="flex justify-center mb-4">
                        <MapPinIcon className="w-10 h-10 text-blue-600" />
                    </div>
                    <h3 className="text-xl font-bold font-display mb-3">Regional Qualifiers</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">
                        Schools from Hhohho, Manzini, Shiselweni, and Lubombo compete first at regional level. A "Top 16" draw sets up the path to the national stage.
                    </p>
                </CardContent>
            </Card>

            <Card className="shadow-lg border-t-4 border-orange-500">
                <CardContent className="p-8 text-center">
                    <div className="flex justify-center mb-4">
                        <TrophyIcon className="w-10 h-10 text-orange-600" />
                    </div>
                    <h3 className="text-xl font-bold font-display mb-3">National Knockout</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">
                        Winners advance to quarter-finals, semi-finals, and the grand final. Hosted in premier venues like King Sobhuza II Stadium and Mavuso Sports Centre.
                    </p>
                </CardContent>
            </Card>

            <Card className="shadow-lg border-t-4 border-yellow-500">
                <CardContent className="p-8 text-center">
                    <div className="flex justify-center mb-4">
                        <StarIcon className="w-10 h-10 text-yellow-600" />
                    </div>
                    <h3 className="text-xl font-bold font-display mb-3">Sponsorship & Prizes</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">
                        Funded by Instacash to cover logistics and kits. Schools receive full playing gear, tracksuits, and equipment, plus prize money for champions.
                    </p>
                </CardContent>
            </Card>
        </div>

        {/* Latest Updates Section */}
        <div className="mb-16 max-w-5xl mx-auto">
            <h2 className="text-3xl font-display font-bold text-center mb-8 text-gray-800">Tournament Progress & Results</h2>
            <Fixtures 
                showSelector={false} 
                defaultCompetition="instacash-schools-tournament" 
                maxHeight="max-h-[600px]" 
            />
        </div>

        {loading ? (
            <div className="flex justify-center py-12"><Spinner /></div>
        ) : (
            <div className="space-y-16">
                {/* Tournament Bracket */}
                {instacashBracket && (
                    <section>
                        <h2 className="text-3xl font-display font-bold text-center mb-8 text-gray-800">National Knockout Stage</h2>
                        <div className="animate-slide-up">
                            <TournamentBracketDisplay tournament={instacashBracket} />
                        </div>
                    </section>
                )}

                {/* Rising Stars */}
                {schoolsData?.risingStars && schoolsData.risingStars.length > 0 && (
                    <section>
                        <h2 className="text-3xl font-display font-bold mb-8 border-b pb-4">Players to Watch</h2>
                        <RisingStars players={schoolsData.risingStars} />
                    </section>
                )}

                {/* Participating Schools List */}
                {schoolsData?.teams && schoolsData.teams.length > 0 && (
                    <section>
                        <h2 className="text-3xl font-display font-bold mb-8 border-b pb-4">Participating Schools</h2>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
                            {schoolsData.teams.map(team => (
                                <Card key={team.id} className="hover:shadow-md transition-shadow">
                                    <CardContent className="p-4 flex flex-col items-center text-center">
                                        <img src={team.crestUrl} alt={team.name} className="w-16 h-16 object-contain mb-3" />
                                        <span className="font-semibold text-sm text-gray-800">{team.name}</span>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </section>
                )}
            </div>
        )}

      </div>
    </div>
  );
};

export default SchoolsPage;