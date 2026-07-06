
export interface Sponsor {
  id: string;
  name: string;
  logo: string;
  logoUrl?: string;
  website: string;
  tier: 'platinum' | 'gold' | 'silver' | 'bronze';
  description?: string;
}

export interface KitPartner {
  id: string;
  name: string;
  logo: string;
  website: string;
  description?: string;
}

export const sponsors: Sponsor[] = [];
export const kitPartners: KitPartner[] = [];
