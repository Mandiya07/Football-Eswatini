import React from 'react';
import { Card, CardContent } from './ui/Card';
import Button from './ui/Button';
import StarIcon from './icons/StarIcon';

const FanOfTheWeek: React.FC = () => {
    return (
        <Card className="shadow-lg bg-gradient-to-br from-blue-700 to-blue-900 text-white h-full">
            <CardContent className="p-6 flex flex-col items-center text-center h-full">
                <div className="flex items-center gap-2 mb-4">
                    <StarIcon className="w-6 h-6 text-yellow-400" />
                    <h3 className="text-xl font-display font-bold">Fan of the Week</h3>
                </div>
                
                <img 
                    src="https://i.pravatar.cc/150?u=fan1" 
                    alt="Fan of the week"
                    className="w-24 h-24 rounded-full border-4 border-yellow-400 shadow-lg my-4"
                />

                <p className="font-bold text-lg">Sipho M.</p>
                <p className="text-sm text-blue-200 mt-2 flex-grow">
                    Topped the prediction leaderboard with an incredible 92% accuracy last week. Well done!
                </p>

                <Button className="mt-6 bg-yellow-400 text-blue-900 font-bold hover:bg-yellow-300 focus:ring-yellow-400 w-full">
                    Play to Get Featured
                </Button>
            </CardContent>
        </Card>
    );
};

export default FanOfTheWeek;
