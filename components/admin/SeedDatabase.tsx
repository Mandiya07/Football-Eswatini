
import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';

// Imports from run.js
import { db } from '../../services/firebase';
import { doc, getDoc, setDoc, collection, getDocs, writeBatch, serverTimestamp } from "firebase/firestore";
import { sponsors } from '../../data/sponsors';
import { newsData } from '../../data/news';
import { videoData } from '../../data/videos';
import { youthData } from '../../data/youth';
import { cupData } from '../../data/cups';
import { coachingContent } from '../../data/coaching';
import { onThisDayData, archiveData } from '../../data/memoryLane';
import { directoryData } from '../../data/directory';
import { scoutingData } from '../../data/scouting';
import { products } from '../../data/shop';
import { refereeData } from '../../data/referees';
import { calculateStandings } from '../../services/utils';
import { LiveUpdate } from '../../services/api';
import CloudDownloadIcon from '../icons/CloudDownloadIcon';
import DatabaseIcon from '../icons/DatabaseIcon';
import UploadCloudIcon from '../icons/UploadCloudIcon';

// --- DYNAMIC DATES ---
const today = new Date();
const tomorrow = new Date(today);
tomorrow.setDate(today.getDate() + 1);
const dayAfterTomorrow = new Date(today);
dayAfterTomorrow.setDate(today.getDate() + 2);

const todayStr = today.toISOString().split('T')[0];
const tomorrowStr = tomorrow.toISOString().split('T')[0];
const dayAfterTomorrowStr = dayAfterTomorrow.toISOString().split('T')[0];

const todayDay = today.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
const tomorrowDay = tomorrow.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
const dayAfterTomorrowDay = dayAfterTomorrow.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();

// --- MOCK DATA & DEFAULTS ---
const initialAds = {
    'homepage-banner': {
        imageUrl: 'https://via.placeholder.com/1200x150/002B7F/FFFFFF?text=Eswatini+Mobile+-+Official+Telecommunications+Partner',
        link: '#',
        altText: 'Advertisement for Eswatini Mobile'
    },
    'fixtures-banner': {
        imageUrl: 'https://via.placeholder.com/800x100/000000/FFFFFF?text=UMBRO+-+Official+Kit+Supplier',
        link: '#',
        altText: 'Advertisement for Umbro'
    },
    'news-listing-top-banner': {
        imageUrl: 'https://via.placeholder.com/1200x120/D22730/FFFFFF?text=MTN+-+Proud+Sponsors+of+the+Premier+League',
        link: '#',
        altText: 'Advertisement for MTN'
    },
    'news-article-top-banner': {
        imageUrl: 'https://via.placeholder.com/800x100/FDB913/002B7F?text=Subscribe+to+our+Newsletter+for+Exclusive+News',
        link: '#/profile/setup',
        altText: 'Newsletter Subscription Banner'
    }
};
const initialCategories = [
    { id: 'national-teams', name: 'National Teams', order: 5 },
    { id: 'premier-leagues', name: 'Premier Leagues', order: 10 },
    { id: 'international-leagues', name: 'International Leagues', order: 15 },
    { id: 'national-divisions', name: 'National