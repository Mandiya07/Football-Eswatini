import React, { useState, useEffect } from 'react';
import {
  fetchCRMLeads,
  saveCRMLead,
  deleteCRMLead,
  getAISalesInsights,
  CRMLead,
  CRMTask,
  CRMActivity
} from '../../services/crm';
import {
  Users,
  Phone,
  Mail,
  MapPin,
  Plus,
  Trash2,
  CheckSquare,
  Square,
  RefreshCw,
  Sparkles,
  Send,
  Copy,
  AlertTriangle,
  FileText,
  CheckCircle,
  TrendingUp,
  DollarSign,
  Award,
  ArrowRight,
  ChevronRight,
  Filter,
  X,
  PlusCircle,
  Clock,
  Briefcase,
  Layers,
  HelpCircle,
  Download
} from 'lucide-react';
import Spinner from '../ui/Spinner';
import Button from '../ui/Button';
import Markdown from 'react-markdown';
import { jsPDF } from 'jspdf';

export const SalesCRM: React.FC = () => {
  const [leads, setLeads] = useState<CRMLead[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  
  // Modals & form state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [selectedLead, setSelectedLead] = useState<CRMLead | null>(null);
  const [activeTabFilter, setActiveTabFilter] = useState<'all' | 'Hhohho' | 'Manzini' | 'Lubombo' | 'Shiselweni'>('all');
  
  // Create lead form state
  const [formClubName, setFormClubName] = useState('');
  const [formContactName, setFormContactName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formRegion, setFormRegion] = useState<'Hhohho' | 'Manzini' | 'Lubombo' | 'Shiselweni' | 'Other'>('Hhohho');
  const [formTier, setFormTier] = useState<'basic' | 'premium' | 'press' | 'advertising'>('basic');
  const [formValue, setFormValue] = useState<number>(150);
  const [formNotes, setFormNotes] = useState('');

  // Inside lead actions state
  const [newNote, setNewNote] = useState('');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState(new Date().toISOString().split('T')[0]);

  // AI Assistant output states
  const [aiAssistantOutput, setAiAssistantOutput] = useState<string>('');
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [aiPromptType, setAiPromptType] = useState<'pitch_email' | 'deal_strategy' | 'objection_handling' | null>(null);

  // Status/Toast alert
  const [alert, setAlert] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    loadCRMData();
  }, []);

  const loadCRMData = async () => {
    setIsLoading(true);
    try {
      const data = await fetchCRMLeads();
      setLeads(data);
    } catch (error) {
      console.error('Failed to load CRM data', error);
      triggerNotification('Failed to retrieve pipeline data.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshCRMData = async () => {
    setIsRefreshing(true);
    try {
      const data = await fetchCRMLeads();
      setLeads(data);
      triggerNotification('CRM Pipeline reloaded.', 'success');
    } catch (error) {
      triggerNotification('Failed to reload data.', 'error');
    } finally {
      setIsRefreshing(false);
    }
  };

  const triggerNotification = (message: string, type: 'success' | 'error') => {
    setAlert({ message, type });
    setTimeout(() => {
      setAlert(null);
    }, 4000);
  };

  // Automated pricing suggestion when selecting tier in form
  const handleTierChange = (tier: 'basic' | 'premium' | 'press' | 'advertising') => {
    setFormTier(tier);
    if (tier === 'basic') setFormValue(150);
    else if (tier === 'premium') setFormValue(350);
    else if (tier === 'press') setFormValue(500);
    else if (tier === 'advertising') setFormValue(800);
  };

  // Submit new manual lead
  const handleCreateLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formClubName || !formContactName) {
      triggerNotification('Club Name and Contact Name are required', 'error');
      return;
    }

    const now = new Date().toISOString();
    const randSuffix = Math.random().toString(36).substring(2, 9);
    const newLead: CRMLead = {
      id: `lead-${Date.now()}-${randSuffix}`,
      clubName: formClubName,
      contactName: formContactName,
      email: formEmail,
      phone: formPhone,
      region: formRegion,
      status: 'lead',
      subscriptionTier: formTier,
      dealValue: formValue,
      notes: formNotes,
      tasks: [],
      activities: [
        {
          id: `act-${Date.now()}-${randSuffix}`,
          type: 'system',
          description: `Lead created manually by administrator`,
          timestamp: now
        }
      ],
      createdAt: now,
      updatedAt: now
    };

    try {
      const saved = await saveCRMLead(newLead);
      setLeads(prev => {
        if (prev.some(l => l.id === saved.id)) return prev;
        return [saved, ...prev];
      });
      setIsCreateModalOpen(false);
      triggerNotification(`${formClubName} added to the pipeline!`, 'success');
      // Reset Form fields
      setFormClubName('');
      setFormContactName('');
      setFormEmail('');
      setFormPhone('');
      setFormRegion('Hhohho');
      setFormTier('basic');
      setFormValue(150);
      setFormNotes('');
    } catch (error) {
      triggerNotification('Failed to save lead.', 'error');
    }
  };

  // Change stage for a lead
  const handleStageChange = async (leadId: string, newStatus: CRMLead['status']) => {
    const updatedLeads = leads.map(async (lead) => {
      if (lead.id === leadId) {
        const oldStatus = lead.status;
        const now = new Date().toISOString();
        const activity: CRMActivity = {
          id: `act-stage-${Date.now()}`,
          type: 'system',
          description: `Pipeline stage moved from ${oldStatus.toUpperCase()} to ${newStatus.toUpperCase()}`,
          timestamp: now
        };
        const updated = {
          ...lead,
          status: newStatus,
          activities: [activity, ...lead.activities],
          updatedAt: now
        };
        await saveCRMLead(updated);
        
        // Update selected lead details if currently open
        if (selectedLead?.id === leadId) {
          setSelectedLead(updated);
        }
        return updated;
      }
      return lead;
    });

    try {
      const resolved = await Promise.all(updatedLeads);
      setLeads(resolved);
      triggerNotification(`Stage updated successfully.`, 'success');
    } catch (error) {
      triggerNotification('Could not update stage in Firestore.', 'error');
    }
  };

  // Delete lead completely
  const handleDeleteLead = async (leadId: string) => {
    if (!window.confirm('Are you absolutely sure you want to remove this lead from the CRM? This cannot be undone.')) {
      return;
    }

    try {
      await deleteCRMLead(leadId);
      setLeads(prev => prev.filter(l => l.id !== leadId));
      setSelectedLead(null);
      triggerNotification('Lead removed from CRM database.', 'success');
    } catch (error) {
      triggerNotification('Failed to delete lead.', 'error');
    }
  };

  // Add Task to Lead
  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead || !newTaskTitle) return;

    const newTask: CRMTask = {
      id: `task-${Date.now()}`,
      title: newTaskTitle,
      dueDate: newTaskDueDate,
      completed: false
    };

    const now = new Date().toISOString();
    const updatedLead: CRMLead = {
      ...selectedLead,
      tasks: [...selectedLead.tasks, newTask],
      activities: [
        {
          id: `act-t-${Date.now()}`,
          type: 'note',
          description: `Created Task: "${newTaskTitle}" (Due: ${newTaskDueDate})`,
          timestamp: now
        },
        ...selectedLead.activities
      ],
      updatedAt: now
    };

    try {
      const saved = await saveCRMLead(updatedLead);
      setLeads(prev => prev.map(l => l.id === saved.id ? saved : l));
      setSelectedLead(saved);
      setNewTaskTitle('');
      triggerNotification('Task added.', 'success');
    } catch (error) {
      triggerNotification('Failed to add task.', 'error');
    }
  };

  // Toggle task complete status
  const handleToggleTask = async (taskId: string) => {
    if (!selectedLead) return;

    const updatedTasks = selectedLead.tasks.map(t => {
      if (t.id === taskId) {
        return { ...t, completed: !t.completed };
      }
      return t;
    });

    const toggledTask = selectedLead.tasks.find(t => t.id === taskId);
    if (!toggledTask) return;

    const now = new Date().toISOString();
    const updatedLead: CRMLead = {
      ...selectedLead,
      tasks: updatedTasks,
      activities: [
        {
          id: `act-tc-${Date.now()}`,
          type: 'system',
          description: `Marked task "${toggledTask.title}" as ${!toggledTask.completed ? 'COMPLETED' : 'INCOMPLETE'}`,
          timestamp: now
        },
        ...selectedLead.activities
      ],
      updatedAt: now
    };

    try {
      const saved = await saveCRMLead(updatedLead);
      setLeads(prev => prev.map(l => l.id === saved.id ? saved : l));
      setSelectedLead(saved);
    } catch (error) {
      triggerNotification('Failed to update task status.', 'error');
    }
  };

  // Delete Task
  const handleDeleteTask = async (taskId: string) => {
    if (!selectedLead) return;

    const updatedTasks = selectedLead.tasks.filter(t => t.id !== taskId);
    const now = new Date().toISOString();
    const updatedLead: CRMLead = {
      ...selectedLead,
      tasks: updatedTasks,
      updatedAt: now
    };

    try {
      const saved = await saveCRMLead(updatedLead);
      setLeads(prev => prev.map(l => l.id === saved.id ? saved : l));
      setSelectedLead(saved);
      triggerNotification('Task deleted.', 'success');
    } catch (error) {
      triggerNotification('Failed to delete task.', 'error');
    }
  };

  // Add custom manual Note/Activity
  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead || !newNote.trim()) return;

    const now = new Date().toISOString();
    const activity: CRMActivity = {
      id: `act-n-${Date.now()}`,
      type: 'note',
      description: newNote.trim(),
      timestamp: now
    };

    const updatedLead: CRMLead = {
      ...selectedLead,
      activities: [activity, ...selectedLead.activities],
      updatedAt: now
    };

    try {
      const saved = await saveCRMLead(updatedLead);
      setLeads(prev => prev.map(l => l.id === saved.id ? saved : l));
      setSelectedLead(saved);
      setNewNote('');
      triggerNotification('Notes and timeline updated.', 'success');
    } catch (error) {
      triggerNotification('Failed to save note.', 'error');
    }
  };

  // AI Insights generator trigger
  const handleTriggerAISales = async (type: 'pitch_email' | 'deal_strategy' | 'objection_handling') => {
    if (!selectedLead) return;
    setIsAiLoading(true);
    setAiPromptType(type);
    setAiAssistantOutput('');

    try {
      const insight = await getAISalesInsights(selectedLead, type);
      setAiAssistantOutput(insight);
      
      // Save systemic log of AI lookup
      const now = new Date().toISOString();
      const activity: CRMActivity = {
        id: `act-ai-${Date.now()}`,
        type: 'system',
        description: `Consulted AI Strategic Advisor regarding: ${type.toUpperCase().replace('_', ' ')}`,
        timestamp: now
      };
      const updatedLead = {
        ...selectedLead,
        activities: [activity, ...selectedLead.activities],
        updatedAt: now
      };
      const saved = await saveCRMLead(updatedLead);
      setLeads(prev => prev.map(l => l.id === saved.id ? saved : l));
      setSelectedLead(updatedLead);
    } catch (error: any) {
      setAiAssistantOutput(`AI Failure: ${error.message}`);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    triggerNotification('Copied to clipboard!', 'success');
  };

  // Calculations for KPI metric cards
  const filteredLeads = activeTabFilter === 'all' ? leads : leads.filter(l => l.region === activeTabFilter);
  
  const pipelineValue = filteredLeads
    .filter(l => l.status !== 'won' && l.status !== 'lost')
    .reduce((sum, l) => sum + l.dealValue, 0);

  const mrr = filteredLeads
    .filter(l => l.status === 'won')
    .reduce((sum, l) => sum + l.dealValue, 0);

  const wonDealsCount = filteredLeads.filter(l => l.status === 'won').length;
  const lostDealsCount = filteredLeads.filter(l => l.status === 'lost').length;
  const closedDealsCount = wonDealsCount + lostDealsCount;
  
  const conversionRate = closedDealsCount > 0 
    ? Math.round((wonDealsCount / closedDealsCount) * 100) 
    : 0;

  const totalActiveDeals = filteredLeads.filter(l => l.status !== 'won' && l.status !== 'lost').length;

  // Stages mapping
  const pipelineStages: { id: CRMLead['status']; name: string; color: string; border: string; bg: string }[] = [
    { id: 'lead', name: 'Lead Discovered', color: 'text-blue-600', border: 'border-blue-200', bg: 'bg-blue-50/50' },
    { id: 'contacted', name: 'Contacted', color: 'text-purple-600', border: 'border-purple-200', bg: 'bg-purple-50/50' },
    { id: 'proposal_sent', name: 'Proposal Sent', color: 'text-orange-600', border: 'border-orange-200', bg: 'bg-orange-50/50' },
    { id: 'negotiation', name: 'Negotiation', color: 'text-yellow-600', border: 'border-yellow-200', bg: 'bg-yellow-50/50' },
    { id: 'won', name: 'Closed Won (Active)', color: 'text-green-600', border: 'border-green-200', bg: 'bg-green-50/50' },
    { id: 'lost', name: 'Closed Lost', color: 'text-red-600', border: 'border-red-200', bg: 'bg-red-50/50' }
  ];

  const exportPipelineToCSV = () => {
    try {
      const activeRegion = activeTabFilter === 'all' ? 'All Regions' : `${activeTabFilter} Region`;
      const dateStr = new Date().toLocaleDateString();
      
      let csvContent = `ESWATINI FOOTBALL CRM - PIPELINE REPORT\n`;
      csvContent += `Report Date,${dateStr}\n`;
      csvContent += `Region Filter,${activeRegion}\n\n`;
      
      // Summary table
      csvContent += `PIPELINE STAGE SUMMARY\n`;
      csvContent += `Stage Name,Deal Count,Total Monthly Value (SZL)\n`;
      
      pipelineStages.forEach(stage => {
        const stageLeads = filteredLeads.filter(l => l.status === stage.id);
        const stageSum = stageLeads.reduce((sum, l) => sum + l.dealValue, 0);
        csvContent += `"${stage.name}",${stageLeads.length},E${stageSum}\n`;
      });
      
      csvContent += `"Total Active Deals (excl. Won/Lost)",${totalActiveDeals},E${pipelineValue}\n`;
      csvContent += `"Active MRR (Won Deals)",${wonDealsCount},E${mrr}\n\n\n`;
      
      // Detailed deals list
      csvContent += `DETAILED DEAL PIPELINE\n`;
      csvContent += `Club Name,Contact Person,Email,Phone,Region,Stage,Subscription Tier,Monthly Value (SZL),Pending Tasks,Created Date\n`;
      
      filteredLeads.forEach(lead => {
        const pendingTasks = lead.tasks.filter(t => !t.completed).length;
        csvContent += `"${lead.clubName.replace(/"/g, '""')}","${lead.contactName.replace(/"/g, '""')}","${(lead.email || '').replace(/"/g, '""')}","${(lead.phone || '').replace(/"/g, '""')}","${lead.region}","${lead.status.toUpperCase()}","${lead.subscriptionTier}",E${lead.dealValue},${pendingTasks},"${new Date(lead.createdAt).toLocaleDateString()}"\n`;
      });
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `Eswatini_Football_CRM_Pipeline_Report_${activeRegion.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      triggerNotification('CSV report downloaded successfully.', 'success');
    } catch (err: any) {
      console.error('CSV export failed', err);
      triggerNotification('Failed to generate CSV export.', 'error');
    }
  };

  const exportPipelineToPDF = () => {
    try {
      const doc = new jsPDF();
      const activeRegion = activeTabFilter === 'all' ? 'All Regions' : `${activeTabFilter} Region`;
      const dateStr = new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString();
      
      let yPos = 15;
      
      // Header Banner Background (Deep corporate blue)
      doc.setFillColor(0, 43, 127); // #002B7F
      doc.rect(14, yPos, 182, 32, 'F');
      
      // Header Text
      doc.setTextColor(255, 255, 255);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(16);
      doc.text('ESWATINI FOOTBALL CRM REPORT', 20, yPos + 12);
      
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(10);
      doc.text('Sales Pipeline & Subscription Revenue Summary', 20, yPos + 19);
      doc.text(`Scope: ${activeRegion} Clubs | Generated: ${dateStr}`, 20, yPos + 26);
      
      yPos += 42;
      
      // KPI Metrics Header
      doc.setTextColor(0, 43, 127);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('KEY PIPELINE METRICS', 14, yPos);
      yPos += 4;
      doc.setDrawColor(220, 225, 230);
      doc.line(14, yPos, 196, yPos);
      yPos += 8;
      
      // Draw 4 KPI cards side by side
      const cardWidth = 42;
      const cardGap = 4;
      const cardHeight = 22;
      
      // Card 1: Pipeline Value
      doc.setFillColor(255, 247, 237); // orange-50
      doc.rect(14, yPos, cardWidth, cardHeight, 'F');
      doc.setDrawColor(253, 186, 116); // orange-300
      doc.rect(14, yPos, cardWidth, cardHeight, 'S');
      doc.setTextColor(194, 65, 12); // orange-700
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(8);
      doc.text('PIPELINE VALUE', 17, yPos + 6);
      doc.setFontSize(11);
      doc.text(`E ${pipelineValue.toLocaleString()}`, 17, yPos + 14);
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(6);
      doc.setTextColor(120, 130, 140);
      doc.text('Prospective Deals', 17, yPos + 19);
      
      // Card 2: Active MRR
      let xOffset = 14 + cardWidth + cardGap;
      doc.setFillColor(240, 253, 244); // green-50
      doc.rect(xOffset, yPos, cardWidth, cardHeight, 'F');
      doc.setDrawColor(134, 239, 172); // green-300
      doc.rect(xOffset, yPos, cardWidth, cardHeight, 'S');
      doc.setTextColor(21, 128, 61); // green-700
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(8);
      doc.text('ACTIVE MRR', xOffset + 3, yPos + 6);
      doc.setFontSize(11);
      doc.text(`E ${mrr.toLocaleString()}`, xOffset + 3, yPos + 14);
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(6);
      doc.setTextColor(120, 130, 140);
      doc.text('Recurring Revenue', xOffset + 3, yPos + 19);
      
      // Card 3: Conversion Rate
      xOffset += cardWidth + cardGap;
      doc.setFillColor(239, 246, 255); // blue-50
      doc.rect(xOffset, yPos, cardWidth, cardHeight, 'F');
      doc.setDrawColor(147, 197, 253); // blue-300
      doc.rect(xOffset, yPos, cardWidth, cardHeight, 'S');
      doc.setTextColor(29, 78, 216); // blue-700
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(8);
      doc.text('CONVERSION RATE', xOffset + 3, yPos + 6);
      doc.setFontSize(11);
      doc.text(`${conversionRate}%`, xOffset + 3, yPos + 14);
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(6);
      doc.setTextColor(120, 130, 140);
      doc.text(`${wonDealsCount} Won / ${lostDealsCount} Lost`, xOffset + 3, yPos + 19);
      
      // Card 4: Active Leads
      xOffset += cardWidth + cardGap;
      doc.setFillColor(250, 245, 255); // purple-50
      doc.rect(xOffset, yPos, cardWidth, cardHeight, 'F');
      doc.setDrawColor(216, 180, 254); // purple-300
      doc.rect(xOffset, yPos, cardWidth, cardHeight, 'S');
      doc.setTextColor(109, 40, 217); // purple-700
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(8);
      doc.text('ACTIVE LEADS', xOffset + 3, yPos + 6);
      doc.setFontSize(11);
      doc.text(`${totalActiveDeals}`, xOffset + 3, yPos + 14);
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(6);
      doc.setTextColor(120, 130, 140);
      doc.text('Deals in Stages', xOffset + 3, yPos + 19);
      
      yPos += cardHeight + 12;
      
      // Table 1: Stage Summary
      doc.setTextColor(0, 43, 127);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('PIPELINE STAGE SUMMARY', 14, yPos);
      yPos += 4;
      doc.setDrawColor(220, 225, 230);
      doc.line(14, yPos, 196, yPos);
      yPos += 6;
      
      // Table 1 Headers
      doc.setFillColor(245, 247, 250);
      doc.rect(14, yPos, 182, 7, 'F');
      doc.setTextColor(70, 80, 95);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(8);
      doc.text('STAGE NAME', 18, yPos + 5);
      doc.text('DEAL COUNT', 100, yPos + 5);
      doc.text('TOTAL MONTHLY VALUE', 150, yPos + 5);
      yPos += 7;
      
      // Table 1 Rows
      pipelineStages.forEach((stage, idx) => {
        const stageLeads = filteredLeads.filter(l => l.status === stage.id);
        const stageSum = stageLeads.reduce((sum, l) => sum + l.dealValue, 0);
        
        doc.setFillColor(idx % 2 === 0 ? 255 : 250, idx % 2 === 0 ? 255 : 252, idx % 2 === 0 ? 255 : 255);
        doc.rect(14, yPos, 182, 7, 'F');
        
        doc.setTextColor(30, 40, 50);
        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(8);
        doc.text(stage.name, 18, yPos + 5);
        doc.text(stageLeads.length.toString(), 100, yPos + 5);
        doc.text(`E ${stageSum.toLocaleString()}`, 150, yPos + 5);
        
        yPos += 7;
      });
      
      yPos += 10;
      
      // Table 2: Detailed Deals List
      doc.setTextColor(0, 43, 127);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('DETAILED DEAL REGISTRY', 14, yPos);
      yPos += 4;
      doc.setDrawColor(220, 225, 230);
      doc.line(14, yPos, 196, yPos);
      yPos += 6;
      
      // Table 2 Headers
      doc.setFillColor(245, 247, 250);
      doc.rect(14, yPos, 182, 7, 'F');
      doc.setTextColor(70, 80, 95);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(8);
      doc.text('CLUB / CLIENT', 18, yPos + 5);
      doc.text('CONTACT PERSON', 65, yPos + 5);
      doc.text('REGION', 110, yPos + 5);
      doc.text('STAGE', 135, yPos + 5);
      doc.text('MONTHLY VALUE', 165, yPos + 5);
      yPos += 7;
      
      // Table 2 Rows (with Page Overflow Check)
      filteredLeads.forEach((lead, idx) => {
        // Check if we need a new page
        if (yPos > 265) {
          doc.addPage();
          yPos = 20;
          
          // Redraw table header on new page
          doc.setFillColor(245, 247, 250);
          doc.rect(14, yPos, 182, 7, 'F');
          doc.setTextColor(70, 80, 95);
          doc.setFont('Helvetica', 'bold');
          doc.setFontSize(8);
          doc.text('CLUB / CLIENT', 18, yPos + 5);
          doc.text('CONTACT PERSON', 65, yPos + 5);
          doc.text('REGION', 110, yPos + 5);
          doc.text('STAGE', 135, yPos + 5);
          doc.text('MONTHLY VALUE', 165, yPos + 5);
          yPos += 7;
        }
        
        doc.setFillColor(idx % 2 === 0 ? 255 : 250, idx % 2 === 0 ? 255 : 252, idx % 2 === 0 ? 255 : 255);
        doc.rect(14, yPos, 182, 7, 'F');
        
        doc.setTextColor(30, 40, 50);
        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(7.5);
        
        // Truncate strings to prevent overlap
        const clubNameStr = lead.clubName.length > 22 ? lead.clubName.substring(0, 20) + '..' : lead.clubName;
        const contactStr = lead.contactName.length > 20 ? lead.contactName.substring(0, 18) + '..' : lead.contactName;
        
        doc.text(clubNameStr, 18, yPos + 5);
        doc.text(contactStr, 65, yPos + 5);
        doc.text(lead.region, 110, yPos + 5);
        doc.text(lead.status.toUpperCase(), 135, yPos + 5);
        doc.text(`E ${lead.dealValue.toLocaleString()}`, 165, yPos + 5);
        
        yPos += 7;
      });
      
      // Page Number Footer
      const pageCount = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(160, 170, 180);
        doc.text(`Page ${i} of ${pageCount}`, 170, 287);
        doc.text('Eswatini Football Portal • Sales CRM Strategic Report', 14, 287);
      }
      
      doc.save(`Eswatini_Football_CRM_Pipeline_Report_${activeRegion.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
      triggerNotification('PDF report downloaded successfully.', 'success');
    } catch (err: any) {
      console.error('PDF export failed', err);
      triggerNotification('Failed to generate PDF export.', 'error');
    }
  };

  return (
    <div id="sales-crm-container" className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-100 shadow-xl space-y-8">
      
      {/* Toast Alert */}
      {alert && (
        <div className={`fixed bottom-6 right-6 z-[200] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border text-sm font-bold transition-all transform animate-in slide-in-from-bottom-5 duration-300 ${
          alert.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800 shadow-emerald-100' 
            : 'bg-rose-50 border-rose-200 text-rose-800 shadow-rose-100'
        }`}>
          {alert.type === 'success' ? <CheckCircle className="w-5 h-5 text-emerald-600" /> : <AlertTriangle className="w-5 h-5 text-rose-600" />}
          <span>{alert.message}</span>
        </div>
      )}

      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 rounded-xl">
              <Briefcase className="w-6 h-6 text-blue-700" />
            </div>
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">Sales & Subscription CRM</h2>
          </div>
          <p className="text-gray-500 text-sm mt-1">
            Manage your sales process pipeline, client communications, subscription tiers and unlock AI tactical suggestions for Eswatini clubs.
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2.5">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={refreshCRMData} 
            disabled={isRefreshing}
            className="flex items-center gap-2 border-gray-200 hover:border-gray-300 text-gray-600 text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh Pipeline
          </Button>

          <Button 
            variant="outline" 
            size="sm" 
            onClick={exportPipelineToCSV} 
            className="flex items-center gap-2 border-gray-200 hover:border-gray-300 text-gray-600 text-xs"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            Export CSV
          </Button>

          <Button 
            variant="outline" 
            size="sm" 
            onClick={exportPipelineToPDF} 
            className="flex items-center gap-2 border-gray-200 hover:border-gray-300 text-gray-600 text-xs"
          >
            <FileText className="w-3.5 h-3.5 text-rose-600" />
            Export PDF
          </Button>

          <Button 
            variant="default" 
            size="sm" 
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-xs shadow-md font-bold px-4"
          >
            <Plus className="w-4 h-4" />
            Add Custom Lead
          </Button>
        </div>
      </div>

      {/* Region filter switcher */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gray-50/50 p-3 rounded-2xl border border-gray-100/80">
        <div className="flex items-center gap-2 text-xs font-bold text-gray-500 px-2">
          <Filter className="w-3.5 h-3.5" />
          <span>Filter pipeline by club region:</span>
        </div>
        <div className="flex flex-wrap gap-1">
          {(['all', 'Hhohho', 'Manzini', 'Lubombo', 'Shiselweni'] as const).map((region) => (
            <button
              key={region}
              onClick={() => setActiveTabFilter(region)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black tracking-tight transition-all uppercase ${
                activeTabFilter === region
                  ? 'bg-blue-700 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
              }`}
            >
              {region}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-orange-500"></div>
          <div className="flex justify-between items-start">
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Pipeline Value</p>
            <TrendingUp className="w-4 h-4 text-orange-500" />
          </div>
          <p className="text-2xl font-black text-gray-900 mt-2">E{pipelineValue.toLocaleString()}</p>
          <p className="text-[10px] text-gray-400 mt-1 font-bold">Sum of non-closed prospective deals</p>
        </div>

        {/* Metric 2 */}
        <div className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
          <div className="flex justify-between items-start">
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Active MRR</p>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-emerald-700 mt-2">E{mrr.toLocaleString()}</p>
          <p className="text-[10px] text-gray-400 mt-1 font-bold">Monthly recurring subscription revenue</p>
        </div>

        {/* Metric 3 */}
        <div className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
          <div className="flex justify-between items-start">
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Conversion Rate</p>
            <Award className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-black text-blue-900 mt-2">{conversionRate}%</p>
          <p className="text-[10px] text-gray-400 mt-1 font-bold">{wonDealsCount} Won / {lostDealsCount} Lost (historical)</p>
        </div>

        {/* Metric 4 */}
        <div className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-purple-500"></div>
          <div className="flex justify-between items-start">
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Active Leads</p>
            <Users className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-2xl font-black text-purple-900 mt-2">{totalActiveDeals} Deals</p>
          <p className="text-[10px] text-gray-400 mt-1 font-bold">Unfinished prospects in stages</p>
        </div>
      </div>

      {/* Main CRM Kanban pipeline */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Spinner className="h-10 w-10 border-t-blue-700" />
          <p className="text-gray-400 text-xs font-black mt-3 uppercase tracking-widest">Loading Sales Pipelines...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 overflow-x-auto pb-4 scrollbar-thin">
          {pipelineStages.map((stage) => {
            const stageLeads = filteredLeads.filter(l => l.status === stage.id);
            const stageSum = stageLeads.reduce((sum, l) => sum + l.dealValue, 0);

            return (
              <div 
                key={stage.id} 
                className={`flex-shrink-0 min-w-[220px] rounded-2xl border ${stage.border} ${stage.bg} p-4 flex flex-col min-h-[450px] shadow-sm`}
              >
                {/* Column header */}
                <div className="flex justify-between items-center pb-3 border-b border-gray-100 mb-3.5">
                  <div>
                    <h3 className="text-xs font-extrabold text-gray-800 uppercase tracking-tight">{stage.name}</h3>
                    <p className="text-[10px] text-gray-400 font-bold mt-0.5">E{stageSum.toLocaleString()}/mo</p>
                  </div>
                  <span className="bg-white text-gray-700 text-[10px] font-black h-5 w-5 rounded-full flex items-center justify-center border border-gray-100 shadow-sm">
                    {stageLeads.length}
                  </span>
                </div>

                {/* Cards stack */}
                <div className="space-y-3 flex-grow overflow-y-auto max-h-[380px] pr-1">
                  {stageLeads.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 border border-dashed border-gray-200/60 rounded-xl">
                      <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest text-center">Empty Stage</p>
                    </div>
                  ) : (
                    stageLeads.map((lead) => (
                      <div
                        key={lead.id}
                        onClick={() => setSelectedLead(lead)}
                        className="bg-white border border-gray-100/90 hover:border-blue-400/80 p-3.5 rounded-xl shadow-sm hover:shadow transition-all cursor-pointer group hover:-translate-y-0.5 duration-200"
                      >
                        <div className="flex justify-between items-start gap-2">
                          <h4 className="text-xs font-black text-gray-900 group-hover:text-blue-700 truncate min-w-0 transition-colors">
                            {lead.clubName}
                          </h4>
                          <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${
                            lead.subscriptionTier === 'basic' ? 'bg-slate-100 text-slate-800' :
                            lead.subscriptionTier === 'premium' ? 'bg-purple-100 text-purple-800' :
                            lead.subscriptionTier === 'press' ? 'bg-indigo-100 text-indigo-800' :
                            'bg-amber-100 text-amber-800'
                          }`}>
                            {lead.subscriptionTier}
                          </span>
                        </div>
                        
                        <p className="text-[10px] text-gray-400 font-bold mt-1.5 flex items-center gap-1.5 truncate">
                          <Users className="w-3 h-3 flex-shrink-0" />
                          <span>{lead.contactName}</span>
                        </p>

                        <div className="mt-3.5 pt-2.5 border-t border-gray-50 flex justify-between items-center">
                          <span className="text-[11px] font-black text-blue-900">E{lead.dealValue}</span>
                          <span className="text-[9px] bg-gray-100 px-1.5 py-0.5 rounded-md text-gray-500 font-black tracking-tight flex items-center gap-1">
                            <MapPin className="w-2.5 h-2.5" />
                            {lead.region}
                          </span>
                        </div>
                        
                        {/* Tasks count tag */}
                        {lead.tasks.length > 0 && (
                          <div className="mt-2 text-[9px] font-black text-blue-700 bg-blue-50 px-2 py-0.5 rounded flex items-center justify-between">
                            <span>Tasks Pending:</span>
                            <span>{lead.tasks.filter(t => !t.completed).length} / {lead.tasks.length}</span>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Manual Lead Creator Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-gray-100 overflow-hidden transform animate-in zoom-in-95 duration-200">
            <div className="bg-[#002B7F] text-white px-6 py-4.5 flex justify-between items-center">
              <div>
                <h3 className="text-base font-black tracking-tight">Add New CRM Lead</h3>
                <p className="text-[11px] text-white/70">Initiate a new client interaction pipeline.</p>
              </div>
              <button 
                onClick={() => setIsCreateModalOpen(false)}
                className="text-white/80 hover:text-white p-1 hover:bg-white/10 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateLeadSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black uppercase text-gray-500 tracking-wider">Club / Client Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Moneni Pirates"
                    value={formClubName}
                    onChange={(e) => setFormClubName(e.target.value)}
                    className="w-full text-xs font-semibold px-3 py-2 border border-gray-200 rounded-xl focus:border-blue-500 outline-none transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-black uppercase text-gray-500 tracking-wider">Contact Person *</label>
                  <input
                    type="text"
                    required
                    placeholder="Full Name"
                    value={formContactName}
                    onChange={(e) => setFormContactName(e.target.value)}
                    className="w-full text-xs font-semibold px-3 py-2 border border-gray-200 rounded-xl focus:border-blue-500 outline-none transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-black uppercase text-gray-500 tracking-wider">Email Address</label>
                  <input
                    type="email"
                    placeholder="client@domain.sz"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="w-full text-xs font-semibold px-3 py-2 border border-gray-200 rounded-xl focus:border-blue-500 outline-none transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-black uppercase text-gray-500 tracking-wider">Phone / WhatsApp</label>
                  <input
                    type="text"
                    placeholder="+268 7600 0000"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full text-xs font-semibold px-3 py-2 border border-gray-200 rounded-xl focus:border-blue-500 outline-none transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-black uppercase text-gray-500 tracking-wider">Club Region</label>
                  <select
                    value={formRegion}
                    onChange={(e) => setFormRegion(e.target.value as any)}
                    className="w-full text-xs font-black px-3 py-2 border border-gray-200 rounded-xl focus:border-blue-500 outline-none transition-colors"
                  >
                    <option value="Hhohho">Hhohho (Capital)</option>
                    <option value="Manzini">Manzini (Hub)</option>
                    <option value="Lubombo">Lubombo (East)</option>
                    <option value="Shiselweni">Shiselweni (South)</option>
                    <option value="Other">Other / Commercial</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-black uppercase text-gray-500 tracking-wider">Subscription Tier Interest</label>
                  <select
                    value={formTier}
                    onChange={(e) => handleTierChange(e.target.value as any)}
                    className="w-full text-xs font-black px-3 py-2 border border-gray-200 rounded-xl focus:border-blue-500 outline-none transition-colors"
                  >
                    <option value="basic">Basic Club Portal (E150/mo)</option>
                    <option value="premium">Premium Scouting Portal (E350/mo)</option>
                    <option value="press">Press Portal Access (E500/mo)</option>
                    <option value="advertising">Sidebar Ad Banners (E800/mo)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase text-gray-500 tracking-wider">Deal Value per month (SZL/Emalangeni)</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-extrabold text-gray-400">SZL E</span>
                  <input
                    type="number"
                    value={formValue}
                    onChange={(e) => setFormValue(Number(e.target.value))}
                    className="w-full text-xs font-extrabold pl-14 pr-3 py-2 border border-gray-200 rounded-xl focus:border-blue-500 outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase text-gray-500 tracking-wider">Discovery Notes & Intent</label>
                <textarea
                  rows={3}
                  placeholder="Record what the club is looking for, initial constraints, or discount requests."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full text-xs font-semibold px-3 py-2 border border-gray-200 rounded-xl focus:border-blue-500 outline-none transition-colors"
                ></textarea>
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-gray-50">
                <Button 
                  variant="outline" 
                  size="sm" 
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  variant="default" 
                  size="sm" 
                  type="submit"
                  className="bg-blue-700 hover:bg-blue-800"
                >
                  Create Deal Card
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lead details, task manager, and AI strategist sliding sheet */}
      {selectedLead && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[150] flex justify-end">
          <div className="bg-white w-full max-w-3xl h-full shadow-2xl border-l border-gray-100 flex flex-col overflow-hidden transform animate-in slide-in-from-right duration-200">
            
            {/* Sheet header */}
            <div className="bg-[#002B7F] text-white px-6 py-5 flex justify-between items-center flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="bg-white/10 p-2 rounded-xl">
                  <Briefcase className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <h3 className="text-base font-black tracking-tight">{selectedLead.clubName}</h3>
                  <p className="text-[11px] text-white/70">Lead ID: {selectedLead.id}</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setSelectedLead(null);
                  setAiAssistantOutput('');
                  setAiPromptType(null);
                }}
                className="text-white/80 hover:text-white p-1 hover:bg-white/10 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sheet body wrapper */}
            <div className="flex-grow overflow-y-auto p-6 space-y-6">
              
              {/* Profile card metadata */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4.5 rounded-2xl border border-gray-100">
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-700" />
                    <span className="font-extrabold text-gray-500">Contact:</span>
                    <span className="font-black text-gray-800">{selectedLead.contactName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-blue-700" />
                    <span className="font-extrabold text-gray-500">Email:</span>
                    <a href={`mailto:${selectedLead.email}`} className="font-black text-blue-600 hover:underline">{selectedLead.email || 'N/A'}</a>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-blue-700" />
                    <span className="font-extrabold text-gray-500">Phone:</span>
                    <span className="font-black text-gray-800">{selectedLead.phone || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-blue-700" />
                    <span className="font-extrabold text-gray-500">Region:</span>
                    <span className="font-black text-gray-800">{selectedLead.region}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-gray-500 tracking-wider block">Status Pipeline Stage</label>
                    <select
                      value={selectedLead.status}
                      onChange={(e) => handleStageChange(selectedLead.id, e.target.value as any)}
                      className="w-full text-xs font-black px-2.5 py-1.5 border border-gray-200 rounded-xl focus:border-blue-500 outline-none transition-colors"
                    >
                      <option value="lead">Lead Discovered</option>
                      <option value="contacted">Contacted (Intro Pitch)</option>
                      <option value="proposal_sent">Proposal Sent (PDF)</option>
                      <option value="negotiation">Negotiation</option>
                      <option value="won">Closed Won (Active Subscription)</option>
                      <option value="lost">Closed Lost</option>
                    </select>
                  </div>

                  <div className="flex justify-between items-center pt-1.5 border-t border-gray-100">
                    <div>
                      <span className="text-[10px] font-black uppercase text-gray-400 block">Proposed Subscription Tier</span>
                      <span className="text-xs font-black text-purple-700 uppercase tracking-tight">{selectedLead.subscriptionTier}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-black uppercase text-gray-400 block">Deal Value</span>
                      <span className="text-sm font-black text-blue-900">E{selectedLead.dealValue}/mo</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Lead discovery description */}
              <div className="space-y-2">
                <h4 className="text-xs font-black uppercase text-gray-400 tracking-wider">Discovery Notes & Conversation History</h4>
                <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 text-xs text-gray-700 leading-relaxed font-semibold">
                  {selectedLead.notes || 'No notes currently written for this prospective client.'}
                </div>
              </div>

              {/* CRM Task Manager Section */}
              <div className="space-y-3.5 border-t border-gray-100 pt-5">
                <h4 className="text-xs font-black uppercase text-gray-400 tracking-wider flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-gray-500" />
                  Upcoming Tasks & Action Items
                </h4>

                {/* List Tasks */}
                <div className="space-y-2">
                  {selectedLead.tasks.length === 0 ? (
                    <p className="text-xs text-gray-400 font-bold italic">No pending action items or follow-ups mapped.</p>
                  ) : (
                    selectedLead.tasks.map((task) => (
                      <div 
                        key={task.id} 
                        className={`flex items-center justify-between p-3 rounded-xl border text-xs transition-all ${
                          task.completed 
                            ? 'bg-gray-50 border-gray-100/80 text-gray-400 line-through' 
                            : 'bg-white border-gray-200/80 text-gray-800 font-black'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-grow">
                          <button 
                            type="button" 
                            onClick={() => handleToggleTask(task.id)}
                            className="text-gray-400 hover:text-blue-600 transition-colors flex-shrink-0"
                          >
                            {task.completed ? <CheckSquare className="w-5 h-5 text-emerald-600" /> : <Square className="w-5 h-5" />}
                          </button>
                          <div className="truncate pr-2">
                            <p className="leading-tight">{task.title}</p>
                            <p className="text-[10px] text-gray-400 font-extrabold mt-0.5">Due: {task.dueDate}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteTask(task.id)}
                          className="text-gray-400 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                {/* Add task form */}
                <form onSubmit={handleAddTask} className="flex gap-2 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                  <input
                    type="text"
                    required
                    placeholder="Create a follow-up action..."
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    className="flex-grow text-xs font-semibold px-3 py-2 border border-gray-200 rounded-lg focus:border-blue-500 bg-white outline-none"
                  />
                  <input
                    type="date"
                    required
                    value={newTaskDueDate}
                    onChange={(e) => setNewTaskDueDate(e.target.value)}
                    className="text-xs font-extrabold px-2.5 py-1.5 border border-gray-200 rounded-lg focus:border-blue-500 bg-white outline-none w-32"
                  />
                  <Button 
                    variant="default" 
                    size="sm" 
                    type="submit"
                    className="bg-blue-700 hover:bg-blue-800 font-bold px-3 py-1.5"
                  >
                    Add
                  </Button>
                </form>
              </div>

              {/* AI Sales Tactics & Assistant Section */}
              <div className="border-t border-gray-100 pt-5 space-y-4">
                <div className="flex items-center gap-2">
                  <div className="p-1 bg-indigo-50 rounded-lg">
                    <Sparkles className="w-4.5 h-4.5 text-indigo-700 animate-pulse" />
                  </div>
                  <h4 className="text-xs font-black uppercase text-gray-400 tracking-wider">AI Sales Strategy & Outreach Engine</h4>
                </div>
                
                <p className="text-[11px] text-gray-500 font-semibold">
                  Consult the Gemini model to analyze the client's current profile, map local objections, or draft contextualized pitch proposals.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleTriggerAISales('pitch_email')}
                    className="bg-indigo-50 hover:bg-indigo-100/80 text-indigo-800 text-xs font-black py-2.5 px-3 rounded-xl transition-all border border-indigo-100 flex items-center justify-center gap-2"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    Draft Pitch Email
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => handleTriggerAISales('deal_strategy')}
                    className="bg-purple-50 hover:bg-purple-100/80 text-purple-800 text-xs font-black py-2.5 px-3 rounded-xl transition-all border border-purple-100 flex items-center justify-center gap-2"
                  >
                    <TrendingUp className="w-3.5 h-3.5" />
                    Deal Playbook Strategy
                  </button>

                  <button
                    type="button"
                    onClick={() => handleTriggerAISales('objection_handling')}
                    className="bg-amber-50 hover:bg-amber-100/80 text-amber-800 text-xs font-black py-2.5 px-3 rounded-xl transition-all border border-amber-100 flex items-center justify-center gap-2"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    Objection Scripts
                  </button>
                </div>

                {/* AI Output Terminal Display */}
                {(isAiLoading || aiAssistantOutput) && (
                  <div className="bg-slate-900 text-slate-100 rounded-2xl p-5 border border-slate-800 shadow-inner relative space-y-3.5 animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex justify-between items-center border-b border-slate-800 pb-2.5">
                      <div className="flex items-center gap-2 text-[10px] uppercase font-black text-slate-400 tracking-widest">
                        <Sparkles className="w-3.5 h-3.5 text-accent animate-pulse" />
                        <span>Tactical Sales Assistant: {aiPromptType?.toUpperCase().replace('_', ' ')}</span>
                      </div>
                      
                      {aiAssistantOutput && (
                        <button
                          onClick={() => handleCopyToClipboard(aiAssistantOutput)}
                          className="text-slate-400 hover:text-white p-1 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1 text-[10px] font-black"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          Copy Response
                        </button>
                      )}
                    </div>

                    {isAiLoading ? (
                      <div className="flex items-center justify-center py-10 gap-3 text-slate-400 text-xs font-bold">
                        <Spinner className="h-5 w-5 border-2 border-t-white" />
                        <span>Formulating tactical playbook via Gemini...</span>
                      </div>
                    ) : (
                      <div className="text-xs leading-relaxed font-sans prose prose-invert max-w-none max-h-[300px] overflow-y-auto pr-1">
                        <Markdown>{aiAssistantOutput}</Markdown>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Timeline / Activity Logs */}
              <div className="border-t border-gray-100 pt-5 space-y-4">
                <h4 className="text-xs font-black uppercase text-gray-400 tracking-wider flex items-center gap-2">
                  <FileText className="w-4 h-4 text-gray-500" />
                  Client Activity Timeline
                </h4>

                {/* Add activity form */}
                <form onSubmit={handleAddNote} className="space-y-2">
                  <textarea
                    rows={2}
                    placeholder="Record notes about your phone call, meeting, or discount negotiations..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    className="w-full text-xs font-semibold p-3 border border-gray-200 rounded-xl focus:border-blue-500 outline-none transition-colors"
                  ></textarea>
                  <div className="flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      type="submit"
                      disabled={!newNote.trim()}
                      className="text-xs border-gray-200 text-gray-600 font-bold py-1.5 px-4"
                    >
                      Save Progress Note
                    </Button>
                  </div>
                </form>

                {/* Timeline display list */}
                <div className="space-y-3.5 mt-2 max-h-[240px] overflow-y-auto pr-1">
                  {selectedLead.activities.map((act) => (
                    <div key={act.id} className="border-l-2 border-blue-100 pl-3.5 py-0.5 relative">
                      <div className="absolute top-2 -left-[5px] w-2 h-2 rounded-full bg-blue-500"></div>
                      <div className="flex justify-between items-center">
                        <span className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded-md ${
                          act.type === 'system' ? 'bg-slate-100 text-slate-500' :
                          act.type === 'meeting' ? 'bg-yellow-50 text-yellow-800' :
                          act.type === 'proposal' ? 'bg-orange-50 text-orange-800' :
                          act.type === 'call' ? 'bg-sky-50 text-sky-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {act.type}
                        </span>
                        <span className="text-[9px] text-gray-400 font-semibold">{new Date(act.timestamp).toLocaleString()}</span>
                      </div>
                      <p className="text-[11px] text-gray-700 leading-relaxed font-semibold mt-1.5">{act.description}</p>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Sheet footer */}
            <div className="border-t border-gray-100 p-4.5 bg-gray-50 flex justify-between items-center flex-shrink-0">
              <button
                type="button"
                onClick={() => handleDeleteLead(selectedLead.id)}
                className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 text-xs font-black py-2 px-3 rounded-xl transition-all flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                Delete Prospect
              </button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedLead(null);
                  setAiAssistantOutput('');
                  setAiPromptType(null);
                }}
                className="font-bold py-1.5 px-4 text-gray-600"
              >
                Close Panel
              </Button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default SalesCRM;
