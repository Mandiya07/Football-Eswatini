import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';
import { db } from '../../services/firebase';
import { doc, updateDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { fetchAllCompetitions, fetchCups } from '../../services/api';
import TrophyIcon from '../icons/TrophyIcon';
import PencilIcon from '../icons/PencilIcon';
import TrashIcon from '../icons/TrashIcon';
import PlusCircleIcon from '../icons/PlusCircleIcon';
import ImageUploader from '../ui/ImageUploader';
import ConfirmationModal from '../ui/ConfirmationModal';
import AdminPreviewModal from './AdminPreviewModal';

interface NationalTeamEntity {
  id: string;
  name: string;
  description?: string;
  logoUrl?: string;
  categoryId: string;
  isCup: boolean;
}

const NationalTeamsManagement: React.FC = () => {
  const [teams, setTeams] = useState<NationalTeamEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<NationalTeamEntity | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '', logoUrl: '', isCup: false });
  const [submitting, setSubmitting] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const loadTeams = async () => {
    setLoading(true);
    try {
      const [comps, cups] = await Promise.all([
        fetchAllCompetitions(),
        fetchCups()
      ]);

      const nTeams = Object.entries(comps)
        .filter(([_, comp]) => comp.categoryId === 'national-teams')
        .map(([id, comp]) => ({
          id,
          name: comp.name,
          description: (comp as any).description || '',
          logoUrl: (comp as any).logoUrl || '',
          categoryId: 'national-teams',
          isCup: false
        }));

      const nCups = cups
        .filter(c => c.categoryId === 'national-teams')
        .map(c => ({
          id: c.id,
          name: c.name,
          description: (c as any).description || '',
          logoUrl: (c as any).logoUrl || '',
          categoryId: 'national-teams',
          isCup: true
        }));

      setTeams([...nTeams, ...nCups].sort((a, b) => a.name.localeCompare(b.name)));
    } catch (error) {
      console.error('Failed to load national teams', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeams();
  }, []);

  const handleOpenModal = (team?: NationalTeamEntity) => {
    if (team) {
      setEditingTeam(team);
      setFormData({
        name: team.name,
        description: team.description || '',
        logoUrl: team.logoUrl || '',
        isCup: team.isCup
      });
    } else {
      setEditingTeam(null);
      setFormData({ name: '', description: '', logoUrl: '', isCup: false });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const id = editingTeam ? editingTeam.id : formData.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
      const collectionName = formData.isCup ? 'cups' : 'competitions';
      const docRef = doc(db, collectionName, id);

      const dataToSave = {
        name: formData.name,
        description: formData.description,
        logoUrl: formData.logoUrl,
        categoryId: 'national-teams',
        type: formData.isCup ? 'cup' : 'league', // Used mostly for competitions
      };

      if (editingTeam) {
        await updateDoc(docRef, dataToSave);
      } else {
        await setDoc(docRef, {
          ...dataToSave,
          teams: [],
          fixtures: [],
          results: []
        });
      }
      setIsModalOpen(false);
      loadTeams();
    } catch (error) {
      console.error('Failed to save team', error);
      alert('Failed to save team.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDeleteId) return;
    try {
      const team = teams.find(t => t.id === confirmDeleteId);
      if (!team) return;
      const collectionName = team.isCup ? 'cups' : 'competitions';
      await deleteDoc(doc(db, collectionName, confirmDeleteId));
      setConfirmDeleteId(null);
      loadTeams();
    } catch (error) {
      console.error('Failed to delete team', error);
      alert('Failed to delete team.');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <Card className="shadow-lg border-0 overflow-hidden">
        <div className="bg-primary p-6 text-white flex justify-between items-center">
          <div>
            <h3 className="text-2xl font-bold font-display">National Teams Hub</h3>
            <p className="text-blue-100 text-sm">Manage the national squads and their specific competitions.</p>
          </div>
          <Button onClick={() => handleOpenModal()} className="bg-accent text-primary-dark font-black px-4 flex items-center gap-2 shadow-lg">
            <PlusCircleIcon className="w-5 h-5" /> Add Team
          </Button>
        </div>
        
        <CardContent className="p-6">
          {loading ? (
            <div className="flex justify-center py-12"><Spinner /></div>
          ) : teams.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No national teams found. Create one to get started.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {teams.map(team => (
                <div key={team.id} className="border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow bg-white flex flex-col">
                  <div className="p-4 flex items-start gap-4">
                    <div className="w-16 h-16 bg-gray-50 rounded-lg flex-shrink-0 flex items-center justify-center p-2 border border-gray-100">
                      {team.logoUrl ? (
                        <img src={team.logoUrl} alt={team.name} className="max-w-full max-h-full object-contain" />
                      ) : (
                        <TrophyIcon className="w-8 h-8 text-gray-300" />
                      )}
                    </div>
                    <div className="flex-grow min-w-0">
                      <h4 className="font-bold text-gray-900 truncate">{team.name}</h4>
                      <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">{team.isCup ? 'Knockout/Cup' : 'Squad/League'}</p>
                      <p className="text-xs text-gray-600 line-clamp-2">{team.description}</p>
                    </div>
                  </div>
                  <div className="mt-auto bg-gray-50 px-4 py-3 border-t border-gray-100 flex justify-end gap-2">
                    <button onClick={() => handleOpenModal(team)} className="p-2 text-blue-600 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-blue-100" title="Edit">
                      <PencilIcon className="w-4 h-4" />
                    </button>
                    <button onClick={() => setConfirmDeleteId(team.id)} className="p-2 text-red-600 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-red-100" title="Delete">
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={() => setIsModalOpen(false)}>
          <Card className="w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold mb-6">{editingTeam ? 'Edit National Team' : 'Add National Team'}</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Name</label>
                  <input 
                    type="text" 
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})} 
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-primary/20 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Description</label>
                  <textarea 
                    value={formData.description} 
                    onChange={e => setFormData({...formData, description: e.target.value})} 
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-primary/20 outline-none"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Type</label>
                  <select 
                    value={formData.isCup ? 'cup' : 'league'} 
                    onChange={e => setFormData({...formData, isCup: e.target.value === 'cup'})}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-primary/20 outline-none"
                    disabled={!!editingTeam}
                  >
                    <option value="league">Squad / League</option>
                    <option value="cup">Knockout / Cup</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Logo URL (Optional)</label>
                  <div className="flex gap-2 items-center">
                    <input 
                      type="text" 
                      value={formData.logoUrl} 
                      onChange={e => setFormData({...formData, logoUrl: e.target.value})} 
                      className="w-full p-2 border rounded focus:ring-2 focus:ring-primary/20 outline-none flex-grow"
                    />
                  </div>
                  {formData.logoUrl && (
                    <img src={formData.logoUrl} alt="Preview" className="h-16 mt-2 object-contain bg-gray-50 border p-1 rounded" />
                  )}
                </div>
                
                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" className="border-blue-200 text-blue-600 hover:bg-blue-50" onClick={() => setIsPreviewOpen(true)}>
                    Preview Cohort Card
                  </Button>
                  <Button type="button" onClick={() => setIsModalOpen(false)} className="bg-gray-100 text-gray-700">Cancel</Button>
                  <Button type="submit" disabled={submitting} className="bg-primary text-white">
                    {submitting ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <AdminPreviewModal 
            isOpen={isPreviewOpen}
            onClose={() => setIsPreviewOpen(false)}
            type="competition"
            data={formData}
          />
        </div>
      )}

      <ConfirmationModal 
        isOpen={!!confirmDeleteId}
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete National Team"
        message="Are you sure you want to delete this national team? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
};

export default NationalTeamsManagement;
