
import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';
import { fetchAllCompetitions, handleFirestoreError, Competition } from '../../services/api';
import { db } from '../../services/firebase';
import { doc, setDoc, deleteDoc, runTransaction } from 'firebase/firestore';
import SearchIcon from '../icons/SearchIcon';
import TrophyIcon from '../icons/TrophyIcon';
import PlusCircleIcon from '../icons/PlusCircleIcon';
import PencilIcon from '../icons/PencilIcon';
import TrashIcon from '../icons/TrashIcon';
import UsersIcon from '../icons/UsersIcon';
import CalendarIcon from '../icons/CalendarIcon';
import CheckCircleIcon from '../icons/CheckCircleIcon';
import CompetitionFormModal from './CompetitionFormModal';
import { removeUndefinedProps } from '../../services/utils';

interface CompetitionItem extends Competition {
    id: string;
}

const CompetitionManager: React.FC = () => {
    const [competitions, setCompetitions] = useState<CompetitionItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingComp, setEditingComp] = useState<CompetitionItem | null>(null);
    const [processingId, setProcessingId] = useState<string | null>(null);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await fetchAllCompetitions();
            const list = Object.entries(data).map(([id, comp]) => ({
                id,
                ...comp
            } as CompetitionItem));
            setCompetitions(list.sort((a, b) => a.name.localeCompare(b.name)));
        } catch (error) {
            console.error("Failed to load competitions", error);
        } finally {
            setLoading(false);
