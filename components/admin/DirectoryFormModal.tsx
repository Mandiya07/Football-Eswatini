
import React, { useState, useEffect } from 'react';
import { DirectoryEntity, EntityCategory, Region } from '../../data/directory';
import { Card, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import XIcon from '../icons/XIcon';

interface DirectoryFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: Omit<DirectoryEntity, 'id'>, id?: string) => void;
    entry: DirectoryEntity | null;
}

const DirectoryFormModal: React.FC<DirectoryFormModalProps> = ({ isOpen, onClose, onSave, entry }) => {
    const [formData, setFormData] = useState({
        name: '', category: 'Club' as EntityCategory, region: 'Hhohho' as Region,
        tier: 'Premier League' as NonNullable<DirectoryEntity['tier']>, nickname: '', founded: '', stadium: '', crestUrl: '', leaders: '', honours: '',
        phone: '', email: '',
    });


    useEffect(() => {
        if (entry) {
            setFormData({
                name: entry.name,
                category: entry.category,
                region: entry.region,
                tier: entry.tier || 'Regional',
                nickname: entry.nickname || '',
                founded: entry.founded ? String(entry.founded) : '',
                stadium: entry.stadium || '',
                crestUrl: entry.crestUrl || '',
                leaders: (entry.leaders || []).map(l => `${l.role}: ${l.name}`).join('\n'),
                honours: (entry.honours || []).join('\n'),
                phone: entry.contact?.phone || '',
                email: entry.contact?.email || '',
            });
        } else {
            setFormData({
                name: '', category: 'Club', region: 'Hhohho',
                tier: 'Premier League', nickname: '', founded: '', stadium: '', crestUrl: '', leaders: '', honours: '',
                phone: '', email: ''
            });
        }
    }, [entry, isOpen]);


    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        const isNumberField = ['founded'].includes(name);

        if (isNumberField) {
            const regex = /^\d*$/;
            if (regex.test(value)) {
                setFormData(prev => ({ ...prev, [name]: value }));
            }
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                if (typeof reader.result === 'string') {
                    setFormData(prev => ({ ...prev, crestUrl: reader.result as string }));
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const { name, category, region, tier, crestUrl, phone, email, nickname, founded, stadium, leaders, honours } = formData;
        
        const dataToSave: Partial<DirectoryEntity> = {
            name: String(name || '').trim(),
            category,
            region
        };
        
        if (crestUrl) dataToSave.crestUrl = crestUrl;
    
        const trimmedPhone = String(phone || '').trim();
        const trimmedEmail = String(email || '').trim();
        if (trimmedPhone || trimmedEmail) {
            const contact: DirectoryEntity['contact'] = {};
            if (trimmedPhone) contact.phone = trimmedPhone;
            if (trimmedEmail) contact.email = trimmedEmail;
            dataToSave.contact = contact;
        }

        if (!entry && (category === 'Club' || category === 'Academy')) {
            dataToSave.location = {
                lat: 50,
                lng: 60,
            };
        }
    
        if (category === 'Club') {
            dataToSave.tier = tier;
            const trimmedNickname = String(nickname || '').trim();
            if (trimmedNickname) dataToSave.nickname = trimmedNickname;
            const trimmedStadium = String(stadium || '').trim();
            if (trimmedStadium) dataToSave.stadium = trimmedStadium;
    
            const parsedFounded = parseInt(founded, 10);
            if (!isNaN(parsedFounded)) {
                dataToSave.founded = parsedFounded;
            }
    
            const parsedLeaders = leaders.split('\n').map(line => {
                const parts = line.split(':');
                const role = parts.shift()?.trim();
                const name = parts.join(':').trim();
                return { role: role || 'Leader', name };
            }).filter(l => l.name);
            if (parsedLeaders.length > 0) dataToSave.leaders = parsedLeaders;
    
            const parsedHonours = honours.split('\n').filter(Boolean).map(item => item.trim());
            if (parsedHonours.length > 0) dataToSave.honours = parsedHonours;
        } else if (entry && entry.category === 'Club') {
            (dataToSave as any).tier = null;
            (dataToSave as any).nickname = null;
            (dataToSave as any).founded = null;
            (dataToSave as any).stadium = null;
            (dataToSave as any).leaders = null;
            (dataToSave as any).honours = null;
        }
    
        onSave(dataToSave as Omit<DirectoryEntity, 'id'>, entry?.id);
    };
    
    const inputClass = "block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm";

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
            <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto relative animate-slide-up" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800" aria-label="Close form"><XIcon className="w-6 h-6" /></button>
                <CardContent className="p-8">
                    <h2 className="text-2xl font-bold font-display mb-6">{entry ? 'Edit Directory Entry' : 'Create Directory Entry'}</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* General Info */}
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Entity Name</label>
                            <input id="name" name="name" value={formData.name} onChange={handleChange} placeholder="Entity Name" required className={inputClass} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                                <select id="category" name="category" value={formData.category} onChange={handleChange} className={inputClass}>
                                    <option>Club</option><option>Academy</option><option>Referee</option><option>Association</option>
                                </select>
                            </div>
                            <div>
                                <label htmlFor="region" className="block text-sm font-medium text-gray-700 mb-1">Region</label>
                                <select id="region" name="region" value={formData.region} onChange={handleChange} className={inputClass}>
                                    <option>Hhohho</option><option>Manzini</option><option>Lubombo</option><option>Shiselweni</option>
                                </select>
                            </div>
                        </div>
                        
                        {/* Club-Specific Section */}
                        {formData.category === 'Club' && (
                            <div className="space-y-4 pt-4 border-t">
                                <h3 className="text-lg font-semibold text-gray-700">Club Details</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label htmlFor="tier" className="block text-sm font-medium text-gray-700 mb-1">Tier</label>
                                        <select id="tier" name="tier" value={formData.tier} onChange={handleChange} className={inputClass}><option>Premier League</option><option>NFD</option><option>Regional</option></select>
                                    </div>
                                    <div>
                                        <label htmlFor="nickname" className="block text-sm font-medium text-gray-700 mb-1">Nickname</label>
                                        <input id="nickname" name="nickname" value={formData.nickname} onChange={handleChange} placeholder="e.g., The Sea Robbers" className={inputClass} />
                                    </div>
                                    <div>
                                        <label htmlFor="founded" className="block text-sm font-medium text-gray-700 mb-1">Year Founded</label>
                                        <input id="founded" name="founded" type="text" inputMode="numeric" value={formData.founded} onChange={handleChange} placeholder="e.g., 1952" className={inputClass} />
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor="stadium" className="block text-sm font-medium text-gray-700 mb-1">Home Stadium</label>
                                    <input id="stadium" name="stadium" value={formData.stadium} onChange={handleChange} placeholder="e.g., Somhlolo National Stadium" className={inputClass} />
                                </div>
                                <div>
                                    <label htmlFor="leaders" className="block text-sm font-medium text-gray-700 mb-1">Leaders (one per line, e.g., Role: Name)</label>
                                    <textarea id="leaders" name="leaders" value={formData.leaders} onChange={handleChange} placeholder="e.g., Chairman: John Doe" rows={3} className={inputClass}></textarea>
                                </div>
                                <div>
                                    <label htmlFor="honours" className="block text-sm font-medium text-gray-700 mb-1">Honours (one per line)</label>
                                    <textarea id="honours" name="honours" value={formData.honours} onChange={handleChange} placeholder="e.g., Premier League: 2022, 2023" rows={3} className={inputClass}></textarea>
                                </div>
                            </div>
                        )}

                        {/* Image Upload Section */}
                        {['Club', 'Academy', 'Association', 'Referee'].includes(formData.category) && (() => {
                            const isReferee = formData.category === 'Referee';
                            const label = isReferee ? 'Photo URL or Upload' : 'Logo/Crest URL or Upload';
                            const altText = isReferee ? 'Photo preview' : 'Crest preview';
                            return (
                                <div className="pt-4 border-t">
                                    <label htmlFor="crestUrl" className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                                    <div className="flex items-center gap-2">
                                        <input id="crestUrl" name="crestUrl" value={formData.crestUrl} onChange={handleChange} placeholder="Image URL" className={inputClass} />
                                        <label htmlFor="crestUpload" className="cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 whitespace-nowrap">
                                            Upload
                                            <input type="file" id="crestUpload" onChange={handleFileChange} accept="image/*" className="sr-only" />
                                        </label>
                                    </div>
                                    {formData.crestUrl && <img src={formData.crestUrl} alt={altText} className="mt-2 h-20 object-contain border rounded p-1" />}
                                </div>
                            );
                        })()}

                        {/* Contact Info */}
                        {(formData.category === 'Club' || formData.category === 'Academy' || formData.category === 'Association') && (
                             <div className="space-y-4 pt-4 border-t">
                                <h3 className="text-lg font-semibold text-gray-700">Contact Info</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <input name="phone" value={formData.phone} onChange={handleChange} placeholder="Phone" className={inputClass} />
                                    <input name="email" type="email" value={formData.email} onChange={handleChange} placeholder="Email" className={inputClass} />
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end gap-2 pt-4">
                            <Button type="button" onClick={onClose} className="bg-gray-200 text-gray-800">Cancel</Button>
                            <Button type="submit" className="bg-primary text-white hover:bg-primary-dark">Save Entry</Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default DirectoryFormModal;
