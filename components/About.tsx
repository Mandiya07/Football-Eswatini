import React from 'react';
import { Card, CardContent } from './ui/Card';

const About: React.FC = () => {
  return (
    <div className="py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <Card className="shadow-lg animate-fade-in">
                <CardContent className="p-8 md:p-12">
                    <h1 className="text-4xl md:text-5xl font-display font-extrabold text-blue-800 mb-6">
                        About Football Eswatini
                    </h1>
                    <div className="space-y-6 text-gray-700 leading-relaxed">
                        <p>
                            <strong>Football Eswatini</strong> is the premier online destination for everything related to football in the Kingdom of Eswatini. We are a passionate team of journalists, analysts, and football enthusiasts dedicated to providing timely, accurate, and engaging coverage of the beautiful game in our nation.
                        </p>
                        <h2 className="text-2xl font-bold font-display text-blue-700 pt-4 border-t border-gray-200">
                            Our Mission
                        </h2>
                        <p>
                            Our mission is simple: to shine a spotlight on Eswatini football at all levels. From the Premier League to grassroots development, we aim to celebrate the players, the clubs, and the fans that make our football community vibrant. We strive to be the most reliable source for news, fixtures, results, and in-depth analysis, fostering a deeper connection between the fans and the sport they love.
                        </p>
                        <p>
                            We believe in the power of sport to unite people and inspire greatness. Through our platform, we hope to not only inform but also to tell the compelling stories that unfold on and off the pitch, contributing to the growth and development of football in Eswatini.
                        </p>
                        <p>
                            Thank you for being a part of our community.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    </div>
  );
};

export default About;