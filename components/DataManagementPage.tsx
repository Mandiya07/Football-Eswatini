
import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from './ui/Card';
import Button from './ui/Button';
import ArrowRightIcon from './icons/ArrowRightIcon';
import SparklesIcon from './icons/SparklesIcon';
import CalendarIcon from './icons/CalendarIcon';
import CloudDownloadIcon from './icons/CloudDownloadIcon';
import UsersIcon from './icons/UsersIcon';

const DataManagementPage: React.FC = () => {
    return (
        <div className="bg-gray-50 py-12">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 animate-fade-in">
                <div className="text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-display font-extrabold text-blue-800 mb-2">
                        League Control Center
                    </h1>
                    <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                        Official tools for managing match data, league structures, and team rosters.
                    </p>
                </div>

                <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
                     <Card className="shadow-lg border-l-4 border-blue-600">
                        <CardContent className="p-8 text-center flex flex-col">
                            <div className="flex justify-center mb-4">
                                <div className="bg-blue-100 p-4 rounded-full">
                                    <UsersIcon className="w-8 h-8 text-blue-600" />
                                </div>
                            </div>
                            <h2 className="text-2xl font-bold font-display text-gray-800">Manage Teams</h2>
                            <p className="text-gray-600 mt-2 mb-6 flex-grow">
                                Add new clubs to your hub, update team crests, and sync with the public directory.
                            </p>
                            <Link to="/club-management?tab=teams">
                                <Button className="bg-blue-600 text-white hover:bg-blue-700 w-full h-11">
                                    Open Team Manager
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>

                    <Card className="shadow-lg border-l-4 border-yellow-500">
                        <CardContent className="p-8 text-center flex flex-col">
                            <div className="flex justify-center mb-4">
                                <div className="bg-accent/20 p-4 rounded-full">
                                    <SparklesIcon className="w-8 h-8 text-yellow-600" />
                                </div>
                            </div>
                            <h2 className="text-2xl font-bold font-display text-gray-800">AI Bulk Import</h2>
                            <p className="text-gray-600 mt-2 mb-6 flex-grow">
                                Paste a list of fixtures or results and let our AI parse and import them for you in seconds.
                            </p>
                            <Link to="/data-management/bulk-import">
                                <Button className="bg-accent text-primary-dark font-semibold hover:bg-yellow-300 w-full h-11">
                                    Use AI Bulk Import
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>

                     <Card className="shadow-lg border-l-4 border-green-600">
                        <CardContent className="p-8 text-center flex flex-col">
                            <div className="flex justify-center mb-4">
                                <div className="bg-green-100 p-4 rounded-full">
                                    <CalendarIcon className="w-8 h-8 text-green-600" />
                                </div>
                            </div>
                            <h2 className="text-2xl font-bold font-display text-gray-800">Manual Entry Forms</h2>
                            <p className="text-gray-600 mt-2 mb-6 flex-grow">
                                Dedicated forms to add a single new fixture or match result. Best for specific updates.
                            </p>
                            <div className="flex gap-2 justify-center">
                                <Link to="/submit-fixtures" className="flex-1">
                                    <Button className="bg-green-600 text-white hover:bg-green-700 w-full">
                                        Fixture
                                    </Button>
                                </Link>
                                <Link to="/submit-results" className="flex-1">
                                    <Button className="bg-primary text-white hover:bg-primary-dark w-full">
                                       Result
                                    </Button>
                                </Link>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-lg border-l-4 border-purple-600">
                        <CardContent className="p-8 text-center flex flex-col">
                            <div className="flex justify-center mb-4">
                                <div className="bg-purple-100 p-4 rounded-full">
                                    <CloudDownloadIcon className="w-8 h-8 text-purple-600" />
                                </div>
                            </div>
                            <h2 className="text-2xl font-bold font-display text-gray-800">Live Fixture Import</h2>
                            <p className="text-gray-600 mt-2 mb-6 flex-grow">
                                Connect to external sports APIs to fetch and import upcoming fixtures directly into the database.
                            </p>
                            <Link to="/data-management/api-import">
                                <Button className="bg-purple-600 text-white font-semibold hover:bg-purple-700 w-full">
                                    Import from Live Feed
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default DataManagementPage;
