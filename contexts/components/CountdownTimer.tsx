import React, { useState, useEffect } from 'react';

interface CountdownTimerProps {
  targetDate: string;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({ targetDate }) => {
  const calculateTimeLeft = (): TimeLeft | null => {
    const difference = +new Date(targetDate) - +new Date();
    if (difference > 0) {
      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    }
    return null;
  };

  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(calculateTimeLeft());

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  if (!timeLeft) {
    return <div className="text-xl font-semibold text-accent">The match is on!</div>;
  }

  const TimerBox: React.FC<{ value: number; label: string }> = ({ value, label }) => (
    <div className="flex flex-col items-center">
      <div className="text-4xl md:text-5xl font-bold font-display tracking-tighter">{value.toString().padStart(2, '0')}</div>
      <div className="text-xs md:text-sm uppercase tracking-widest">{label}</div>
    </div>
  );

  return (
    <div className="flex justify-center items-center gap-4 md:gap-8 text-white bg-black/30 backdrop-blur-sm p-4 rounded-xl">
      <TimerBox value={timeLeft.days} label="Days" />
      <span className="text-3xl font-light -mt-4">:</span>
      <TimerBox value={timeLeft.hours} label="Hours" />
      <span className="text-3xl font-light -mt-4">:</span>
      <TimerBox value={timeLeft.minutes} label="Minutes" />
      <span className="text-3xl font-light -mt-4">:</span>
      <TimerBox value={timeLeft.seconds} label="Seconds" />
    </div>
  );
};

export default CountdownTimer;
