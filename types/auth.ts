
export interface NotificationPreferences {
    matchAlerts: boolean;
    news: boolean;
    announcements: boolean;
}

export interface SubscriptionInfo {
    tier: 'Basic' | 'Professional' | 'Elite' | 'Enterprise';
    status: 'active' | 'expiring' | 'past_due' | 'canceled';
    startDate: string;
    nextRenewalDate: string;
    autoRenew: boolean;
    lastTransactionId?: string;
}

export interface ManagedTeam {
    teamName: string;
    competitionId: string;
    role: 'club_admin' | 'coach';
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: 'user' | 'club_admin' | 'league_admin' | 'super_admin' | 'journalist' | 'referee_admin';
  club?: string;
  managedTeams: ManagedTeam[]; // Support for multiple divisions
  managedLeagues?: string[]; 
  favoriteTeamIds: string[];
  notificationPreferences: NotificationPreferences;
  subscription?: SubscriptionInfo;
  xp: number; 
  level: number; 
  journalismCredentials?: {
      outlet: string;
      verified: boolean;
      bio: string;
      accreditations: string[];
      portfolioCount: number;
  };
  canAccessEFADashboard: boolean;
}

export type LoginCredentials = { email: string; password?: string; };
export type RegisterCredentials = { name: string; email: string; password?: string; };
