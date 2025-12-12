
import { Video } from './videos';

export interface OnThisDayEvent {
  id: number;
  month: number; // 1-12
  day: number;
  year: number;
  title: string;
  description:string;
  imageUrl: string;
}

export interface ArchiveMatch {
  teams: string; // "Team A vs Team B"
  score: string;
  competition: string;
}

export interface ArchivePhoto {
  imageUrl: string;
}

export interface ArchiveClip {
  video: Video;
}

export interface ArchiveItem {
  id: number | string;
  type: 'match' | 'photo' | 'clip';
  title: string;
  year: number;
  description: string;
  details: ArchiveMatch | ArchivePhoto | ArchiveClip;
}

// Get today's date to feature one event
const today = new Date();
const currentMonth = today.getMonth() + 1;
const currentDay = today.getDate();


export const onThisDayData: OnThisDayEvent[] = [
    {
        id: 1,
        month: currentMonth,
        day: currentDay,
        year: 1992,
        title: "Sihlangu's Historic COSAFA Cup Debut",
        description: "The Eswatini national team, Sihlangu Semnikati, played their first-ever match in the COSAFA Cup, marking a new era for international football in the kingdom.",
        imageUrl: "https://picsum.photos/seed/history1/800/450",
    },
    {
        id: 2,
        month: 5,
        day: 15,
        year: 2003,
        title: "Mbabane Highlanders Clinch the League Title",
        description: "In a nail-biting final day of the season, Mbabane Highlanders defeated Manzini Wanderers 1-0 to secure their 10th Premier League title.",
        imageUrl: "https://picsum.photos/seed/history2/800/450",
    },
];

export const archiveData: ArchiveItem[] = [
    {
        id: 1,
        type: 'match',
        title: "2016 Ingwenyama Cup Final",
        year: 2016,
        description: "An unforgettable final where Mbabane Swallows faced off against Royal Leopards in a match that went down to the wire.",
        details: {
            teams: "Mbabane Swallows vs Royal Leopards",
            score: "2 - 1",
            competition: "Ingwenyama Cup",
        }
    },
    {
        id: 2,
        type: 'photo',
        title: "The Somhlolo Roar",
        year: 1998,
        description: "A legendary photograph capturing the passion of the fans during a packed Mbabane derby at Somhlolo National Stadium.",
        details: {
            imageUrl: "https://picsum.photos/seed/archivephoto1/800/600",
        }
    },
    {
        id: 3,
        type: 'clip',
        title: "Siza Dlamini's Wonder Goal",
        year: 2005,
        description: "Relive the incredible long-range strike from Siza 'King Pele' Dlamini that is still talked about by fans today.",
        details: {
            video: {
                id: '101',
                title: "Siza Dlamini's Wonder Goal (2005)",
                thumbnailUrl: "https://picsum.photos/seed/archiveclip1/600/400",
                videoUrl: "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
                duration: "0:45",
                description: "The iconic goal scored by Siza Dlamini for Mbabane Swallows against Manzini Wanderers in the 2005 Trade Fair Cup.",
                category: 'highlight',
            }
        }
    },
    {
        id: 4,
        type: 'photo',
        title: "First Women's League Champions",
        year: 2009,
        description: "The victorious squad of the inaugural Women's Super League celebrating their historic championship win.",
        details: {
            imageUrl: "https://picsum.photos/seed/archivephoto2/800/600",
        }
    },
];
