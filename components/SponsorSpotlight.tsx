import React, { useState, useEffect } from 'react';
import { Card, CardContent } from './ui/Card';
import Button from './ui/Button';
import MegaphoneIcon from './icons/MegaphoneIcon';
// FIX: Import 'fetchSponsors' which is now correctly exported from the API service.
import { fetchSponsors } from '../services/api';
import { Sponsor } from '../data/sponsors';
import Skeleton from './ui/Skeleton';

const SponsorSpotlight: React.FC = () => {
    const [sponsor, setSponsor] = useState<Sponsor | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadSponsor = async () => {
            setLoading(true);
            const data = await fetchSponsors();
            setSponsor(data.spotlight);
            setLoading(false);
        };
        loadSponsor();
    }, []);

    if (loading) {
        return (
            <section>
                <Card className="shadow-lg">
                    <CardContent>
                        <Skeleton className="h-24" />
                    </CardContent>
                </Card>
            </section>
        );
    }

    if (!sponsor) {
        return null;
    }

    return (
        <section>
            <Card className="shadow-lg bg-gradient-to-r from-gray-50 to-blue-50">
                <CardContent>
                    <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8">
                        <div className="flex-shrink-0 text-center md:text-left">
                            <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                                <MegaphoneIcon className="w-5 h-5 text-blue-600" />
                                <h3 className="text-sm font-bold uppercase tracking-wider text-blue-600">Sponsor of the Week</h3>
                            </div>
                            <img src={sponsor.logoUrl} alt={`${sponsor.name} logo`} className="h-16 md:h-20 object-contain" />
                        </div>
                        <div className="border-l-0 md:border-l-2 border-gray-200 pl-0 md:pl-8 flex-grow text-center md:text-left">
                            <p className="text-gray-600 text-sm md:text-base">{sponsor.description}</p>
                            <Button
                                onClick={() => window.open(sponsor.website, '_blank')}
                                className="mt-4 bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 text-xs px-3 py-1.5"
                            >
                                Visit Website
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </section>
    );
}

export default SponsorSpotlight;