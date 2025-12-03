
export interface Product {
    id: string;
    name: string;
    price: number;
    salePrice?: number; // New optional field
    imageUrl: string;
    category: 'Jersey' | 'Scarf' | 'Ticket' | 'Accessory' | 'Match Ticket';
}

export const products: Product[] = [
    {
        id: '1',
        name: 'Mbabane Swallows Home Jersey 23/24',
        price: 650.00,
        salePrice: 585.00, // On sale
        imageUrl: 'https://via.placeholder.com/400/FF0000/FFFFFF?text=HOME+JERSEY',
        category: 'Jersey',
    },
    {
        id: '2',
        name: 'Mbabane Highlanders Away Jersey 23/24',
        price: 650.00,
        imageUrl: 'https://via.placeholder.com/400/000000/FFFFFF?text=AWAY+JERSEY',
        category: 'Jersey',
    },
    {
        id: '3',
        name: 'Green Mamba FC Scarf',
        price: 250.00,
        imageUrl: 'https://via.placeholder.com/400/1E4620/FFFFFF?text=SCARF',
        category: 'Scarf',
    },
    {
        id: '4',
        name: 'Royal Leopards FC Home Jersey 23/24',
        price: 600.00,
        salePrice: 450.00, // Heavy discount
        imageUrl: 'https://via.placeholder.com/400/00008B/FFFFFF?text=HOME+JERSEY',
        category: 'Jersey',
    },
    {
        id: '5',
        name: 'Manzini Wanderers Supporters Scarf',
        price: 250.00,
        imageUrl: 'https://via.placeholder.com/400/800080/FFFFFF?text=SCARF',
        category: 'Scarf',
    },
    {
        id: '6',
        name: 'Young Buffaloes FC Away Jersey 23/24',
        price: 600.00,
        imageUrl: 'https://via.placeholder.com/400/A52A2A/FFFFFF?text=AWAY+JERSEY',
        category: 'Jersey',
    },
    {
        id: '7',
        name: 'FE Branded Cap',
        price: 180.00,
        imageUrl: 'https://via.placeholder.com/400/4B5563/FFFFFF?text=CAP',
        category: 'Accessory',
    },
    {
        id: '8',
        name: 'Sihlangu Semnikati Replica Jersey',
        price: 700.00,
        imageUrl: 'https://via.placeholder.com/400/1D4ED8/FBBF24?text=SIHLANGU',
        category: 'Jersey',
    },
];
