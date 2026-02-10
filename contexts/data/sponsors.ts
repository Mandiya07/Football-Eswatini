export interface Sponsor {
    name: string;
    logoUrl: string;
    description: string;
    website: string;
}

export interface KitPartner {
    name: string;
    logoUrl: string;
}

export const sponsors: {
    spotlight: Sponsor;
    kitPartner: KitPartner;
} = {
    spotlight: {
        name: 'Eswatini Mobile',
        logoUrl: 'https://via.placeholder.com/250x80/002B7F/FFFFFF?text=Eswatini+Mobile',
        description: 'Connecting the Kingdom with fast, reliable, and affordable mobile services. Proudly supporting Eswatini football.',
        website: '#',
    },
    kitPartner: {
        name: 'Umbro',
        logoUrl: 'https://via.placeholder.com/150x50/000000/FFFFFF?text=UMBRO',
    }
};