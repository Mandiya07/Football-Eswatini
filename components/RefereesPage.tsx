import React, { useState, useEffect } from 'react';
import { Card, CardContent } from './ui/Card';
import { fetchRefereesData } from '../services/api';
import { Referee, Rule } from '../data/referees';
import SectionLoader from './SectionLoader';
import BookOpenIcon from './icons/BookOpenIcon';
import WhistleIcon from './icons/WhistleIcon';
import StarIcon from './icons/StarIcon';
import InfoIcon from './icons/InfoIcon';

const RefereeProfileCard: React.FC<{ referee: Referee, isSpotlight?: boolean }> = ({ referee, isSpotlight = false }) => {
    const levelColor = referee.level === 'FIFA' ? 'bg-yellow-400 text-yellow-900' : 'bg-gray-200 text-gray-800';
    
    if (isSpotlight) {
        return (
            <Card className="shadow-2xl border-2 border-yellow-400 bg-gradient-to-br from-gray-50 to-yellow-50">
                <CardContent className="p-0">
                    <div className="flex flex-col md:flex-row">
                        <img src={referee.photoUrl} alt={referee.name} className="w-full md:w-2/5 h-64 md:h-auto object-cover" />
                        <div className="p-6 flex flex-col">
                             <div className="flex items-center gap-3">
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${levelColor}`}>{referee.level}</span>
                                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-yellow-400 text-yellow-900 inline-flex items-center gap-1">
                                    <StarIcon className="w-3 h-3"/> SPOTLIGHT
                                </span>
                             </div>
                            <h3 className="text-3xl font-bold font-display mt-2">{referee.name}</h3>
                            <p className="text-sm text-gray-600 my-4 flex-grow">{referee.bio}</p>
                            <div className="grid grid-cols-3 gap-2 text-center text-sm border-t pt-4">
                                <div><p className="font-bold text-2xl">{referee.stats.matches}</p><p className="text-xs text-gray-500 uppercase">Matches</p></div>
                                <div><p className="font-bold text-2xl text-yellow-600">{referee.stats.yellowCards}</p><p className="text-xs text-gray-500 uppercase">Yellows</p></div>
                                <div><p className="font-bold text-2xl text-red-600">{referee.stats.redCards}</p><p className="text-xs text-gray-500 uppercase">Reds</p></div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="flex flex-col sm:flex-row overflow-hidden transition-shadow duration-300 hover:shadow-lg">
            <img src={referee.photoUrl} alt={referee.name} className="w-full sm:w-1/3 h-48 sm:h-auto object-cover" />
            <CardContent className="p-4 flex flex-col">
                <div>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${levelColor}`}>{referee.level}</span>
                    <h3 className="text-xl font-bold font-display mt-1">{referee.name}</h3>
                </div>
                <p className="text-sm text-gray-600 my-3 flex-grow">{referee.bio}</p>
                <div className="grid grid-cols-3 gap-2 text-center text-sm border-t pt-3">
                    <div><p className="font-bold text-lg">{referee.stats.matches}</p><p className="text-xs text-gray-500">Matches</p></div>
                    <div><p className="font-bold text-lg text-yellow-600">{referee.stats.yellowCards}</p><p className="text-xs text-gray-500">Yellows</p></div>
                    <div><p className="font-bold text-lg text-red-600">{referee.stats.redCards}</p><p className="text-xs text-gray-500">Reds</p></div>
                </div>
            </CardContent>
        </Card>
    );
};

const RuleOfTheWeek: React.FC<{ rule: Rule }> = ({ rule }) => (
    <Card className="shadow-lg">
        <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
                <BookOpenIcon className="w-6 h-6 text-primary" />
                <h3 className="text-xl font-bold font-display">Rule of the Week</h3>
            </div>
            <h4 className="font-bold text-gray-800">{rule.title}</h4>
            <p className="text-sm text-gray-600 mt-2 border-l-4 border-primary/20 pl-4">{rule.summary}</p>
            <details className="mt-3 text-sm">
                <summary className="cursor-pointer font-semibold text-primary/80">Read full explanation</summary>
                <p className="text-gray-600 mt-2">{rule.explanation}</p>
            </details>
        </CardContent>
    </Card>
);

const RefereesPage: React.FC = () => {
    const [referees, setReferees] = useState<Referee[]>([]);
    const [rule, setRule] = useState<Rule | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            const data = await fetchRefereesData();
            setReferees(data.referees);
            setRule(data.ruleOfTheWeek);
            setLoading(false);
        };
        loadData();
    }, []);

    const spotlightReferee = referees.find(r => r.isSpotlight);
    const otherReferees = referees.filter(r => !r.isSpotlight);

    return (
        <div className="bg-gray-50 py-12">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 animate-fade-in">
                <div className="text-center mb-12">
                    <WhistleIcon className="w-12 h-12 mx-auto text-primary mb-2" />
                    <h1 className="text-4xl md:text-5xl font-display font-extrabold text-blue-800 mb-2">
                        Meet The Officials
                    </h1>
                    <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                        Profiles, statistics, and rule clarifications for the referees of Eswatini football.
                    </p>
                </div>

                <div className="mb-12 max-w-4xl mx-auto">
                    <Card className="bg-blue-50 border border-blue-100">
                        <CardContent className="p-4 flex items-start gap-3">
                            <InfoIcon className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-blue-800">
                                <strong>How are referees added?</strong> Official match referees are assigned to fixtures during match creation by Club Admins or the League Manager. You can see the assigned referee in the "Match Info" section of any fixture detail view.
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {loading ? <SectionLoader /> : (
                    <div className="space-y-12">
                        {spotlightReferee && (
                            <section>
                                <h2 className="text-2xl font-display font-bold mb-4">Referee Spotlight</h2>
                                <RefereeProfileCard referee={spotlightReferee} isSpotlight={true} />
                            </section>
                        )}
                        <section>
                             <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                                <div className="lg:col-span-2 space-y-8">
                                    {otherReferees.map(ref => <RefereeProfileCard key={ref.id} referee={ref} />)}
                                </div>
                                <div className="lg:col-span-1 space-y-8 sticky top-20">
                                    {rule && <RuleOfTheWeek rule={rule} />}
                                </div>
                            </div>
                        </section>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RefereesPage;