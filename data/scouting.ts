
import { Region } from './directory';

export type PlayerPosition = 'Goalkeeper' | 'Defender' | 'Midfielder' | 'Forward';

export interface ScoutedPlayer {
  id: string;
  name: string;
  age: number;
  position: PlayerPosition;
  region: Region;
  photoUrl: string;
  videoUrl?: string; // Optional
  strengths: string[];
  bio: string;
  stats: { label: string; value: string | number }[];
  contactEmail: string;
}

export const scoutingData: ScoutedPlayer[] = [
  {
    id: '1',
    name: 'Lwazi Maziya',
    age: 17,
    position: 'Forward',
    region: 'Hhohho',
    photoUrl: 'https://i.pravatar.cc/150?u=scout1',
    videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
    strengths: ['Pace', 'Finishing', 'Off-the-ball movement'],
    bio: 'A natural goalscorer with blistering pace, Lwazi excels at running in behind defenses. His composure in front of goal is exceptional for his age, making him a constant threat in the final third.',
    stats: [
      { label: 'U-17 League Goals', value: 14 },
      { label: 'U-17 League Assists', value: 5 },
      { label: 'Top Speed', value: '34 km/h' },
    ],
    contactEmail: 'agent.lwazi@example.com',
  },
  {
    id: '2',
    name: 'Bongani Gamedze',
    age: 19,
    position: 'Midfielder',
    region: 'Manzini',
    photoUrl: 'https://i.pravatar.cc/150?u=scout2',
    videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    strengths: ['Vision', 'Passing Range', 'Set-piece Specialist'],
    bio: 'A technically gifted midfielder who dictates the tempo of the game. Bongani possesses an outstanding passing range and is a significant threat from set-pieces, both in delivery and shooting.',
    stats: [
      { label: 'U-20 League Appearances', value: 18 },
      { label: 'Key Passes per Game', value: '3.2' },
      { label: 'Successful Tackles', value: '78%' },
    ],
    contactEmail: 'agent.bongani@example.com',
  },
  {
    id: '3',
    name: 'Sibusiso Dlamini',
    age: 18,
    position: 'Defender',
    region: 'Shiselweni',
    photoUrl: 'https://i.pravatar.cc/150?u=scout3',
    videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    strengths: ['Tackling', 'Aerial Duels', 'Leadership'],
    bio: 'A commanding center-back who reads the game brilliantly. Sibusiso is strong in the air and excels in one-on-one defensive situations. Already shows strong leadership qualities on the pitch.',
    stats: [
      { label: 'Clean Sheets', value: 9 },
      { label: 'Interceptions per Game', value: '4.5' },
      { label: 'Aerial Duels Won', value: '85%' },
    ],
    contactEmail: 'agent.sibusiso@example.com',
  },
  {
    id: '4',
    name: 'Nomcebo Mdluli',
    age: 16,
    position: 'Goalkeeper',
    region: 'Lubombo',
    photoUrl: 'https://i.pravatar.cc/150?u=scout4',
    videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    strengths: ['Reflexes', 'Shot-stopping', 'Distribution'],
    bio: 'An agile goalkeeper with phenomenal reflexes. Nomcebo is a confident shot-stopper and possesses excellent distribution skills, capable of launching quick counter-attacks from the back.',
    stats: [
        { label: 'Save Percentage', value: '88%' },
        { label: 'Penalties Saved', value: 3 },
        { label: 'Pass Completion', value: '82%' },
    ],
    contactEmail: 'agent.nomcebo@example.com',
  },
];
