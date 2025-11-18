import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from './ui/Card';
import Button from './ui/Button';
import ArrowRightIcon from './icons/ArrowRightIcon';
import SparklesIcon from './icons/SparklesIcon';
import CalendarIcon from './icons/CalendarIcon';
import CloudDownloadIcon from './icons/CloudDownloadIcon';

const DataManagementPage: React.FC = () => {
    return (
        <div className="bg-gray-50 py-12">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 animate-fade-in">
                <div className="text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-display font-extrabold text-blue-800 mb-2">
                        Data Management
                    </h1>
                    <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                        Tools for updating application data, such as match results and league standings.
                    </p>
                </div>

                <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
                     <Card className="shadow-lg">
                        <CardContent className="p-8 text-center flex flex-col">
                            <div className="flex justify-center mb-4">
                                <div className="bg-green-100 p-4 rounded-full">
                                    <CalendarIcon className="w-8 h-8 text-green-600" />
                                </div>
                            </div>
                            <h2 className="text-2xl font-bold font-display text-gray-800">Manual Entry Forms</h2>
                            <p className="text-gray-600 mt-2 mb-6 flex-grow">
                                Use our dedicated forms to add a single new fixture or match result. Best for one-off updates.
                            </p>
                            <div className="flex gap-2 justify-center">
                                <Link to="/submit-fixtures">
                                    <Button className="bg-green-600 text-white hover:bg-green-700 focus:ring-green-500">
                                        Add Fixture
                                    </Button>
                                </Link>
                                <Link to="/submit-results">
                                    <Button className="bg-primary text-white hover:bg-primary-dark focus:ring-primary-light">
                                       Add Result
                                    </Button>
                                </Link>
                            </div>
                        </CardContent>
                    </Card>
                     <Card className="shadow-lg">
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
                                <Button className="bg-accent text-primary-dark font-semibold hover:bg-yellow-300 focus:ring-yellow-400 inline-flex items-center justify-center gap-2">
                                    Use AI Bulk Import
                                    <ArrowRightIcon className="w-4 h-4" />
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                    <Card className="shadow-lg md:col-span-2 lg:col-span-2">
                        <CardContent className="p-8 text-center flex flex-col">
                            <div className="flex justify-center mb-4">
                                <div className="bg-purple-100 p-4 rounded-full">
                                    <CloudDownloadIcon className="w-8 h-8 text-purple-600" />
                                </div>
                            </div>
                            <h2 className="text-2xl font-bold font-display text-gray-800">Live Fixture Import</h2>
                            <p className="text-gray-600 mt-2 mb-6 flex-grow">
                                Connect to an external sports API to fetch and import upcoming fixtures directly into the database. This tool helps keep schedules up-to-date with minimal manual entry.
                            </p>
                            <Link to="/data-management/api-import">
                                <Button className="bg-purple-600 text-white font-semibold hover:bg-purple-700 focus:ring-purple-500 inline-flex items-center justify-center gap-2">
                                    Import from Live Feed
                                    <ArrowRightIcon className="w-4 h-4" />
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