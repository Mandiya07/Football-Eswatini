import { db, handleFirestoreError, OperationType } from './firebase';
import { collection, getDocs, doc, addDoc, updateDoc, deleteDoc, setDoc, writeBatch, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { GoogleGenAI } from '@google/genai';

export interface CRMTask {
  id: string;
  title: string;
  dueDate: string;
  completed: boolean;
}

export interface CRMActivity {
  id: string;
  type: 'email' | 'call' | 'proposal' | 'meeting' | 'note' | 'system';
  description: string;
  timestamp: string;
}

export interface CRMLead {
  id: string;
  clubName: string;
  contactName: string;
  email: string;
  phone: string;
  region: 'Hhohho' | 'Manzini' | 'Lubombo' | 'Shiselweni' | 'Other';
  status: 'lead' | 'contacted' | 'proposal_sent' | 'negotiation' | 'won' | 'lost';
  subscriptionTier: 'basic' | 'premium' | 'press' | 'advertising';
  dealValue: number; // monthly fee in SZL / Emalangeni
  notes: string;
  tasks: CRMTask[];
  activities: CRMActivity[];
  createdAt: string;
  updatedAt: string;
}

const CRM_LEADS_COLLECTION = 'crm_leads';

const INITIAL_CRM_LEADS: CRMLead[] = [];

// CRM Fetch API
export const fetchCRMLeads = async (): Promise<CRMLead[]> => {
  try {
    const snapshot = await getDocs(collection(db, CRM_LEADS_COLLECTION));
    if (snapshot.empty) {
      return [];
    }
    const leads: CRMLead[] = [];
    snapshot.forEach((doc) => {
      leads.push({ ...doc.data(), id: doc.id } as CRMLead);
    });
    return leads;
  } catch (error) {
    console.error("Firestore CRM fetch failed.", error);
    throw error;
  }
};

// CRM Save / Update API
export const saveCRMLead = async (lead: CRMLead): Promise<CRMLead> => {
  const updatedLead = {
    ...lead,
    updatedAt: new Date().toISOString()
  };

  try {
    await setDoc(doc(db, CRM_LEADS_COLLECTION, updatedLead.id), updatedLead);
    return updatedLead;
  } catch (error) {
    console.error("Firestore CRM save failed.", error);
    throw error;
  }
};

// CRM Delete API
export const deleteCRMLead = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, CRM_LEADS_COLLECTION, id));
  } catch (error) {
    console.error("Firestore CRM delete failed.", error);
    throw error;
  }
};

// AI CRM Sales assistant functions using Gemini
export const getAISalesInsights = async (lead: CRMLead, promptType: 'pitch_email' | 'deal_strategy' | 'objection_handling'): Promise<string> => {
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!apiKey) {
    return `**[Demo Mode: API Key Not Configured]**
Here is a simulated AI response tailored for **${lead.clubName}** (${lead.subscriptionTier.toUpperCase()} Tier):

Since the Gemini API Key is not set in this environment, we have generated this strategic baseline:
1. **Club Context**: ${lead.clubName} is located in the ${lead.region} region. Their subscription interest is ${lead.subscriptionTier} with a deal value of E${lead.dealValue}/month.
2. **Current Status**: ${lead.status.toUpperCase()}
3. **Recommendation**: Initiate high-touch contact with ${lead.contactName} at ${lead.phone} or ${lead.email}. Highlight how this custom digital integration will save them hours of manual stats reporting and boost their sponsor visibility with companies like MTN Eswatini.`;
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    let promptText = '';

    if (promptType === 'pitch_email') {
      promptText = `Draft a personalized, highly professional and convincing sales outreach email to ${lead.contactName}, representing the football website subscription for ${lead.clubName} located in ${lead.region}, Eswatini.
      The subscription tier they are interested in is "${lead.subscriptionTier}" valued at E${lead.dealValue} SZL per month.
      
      Tier Guide:
      - basic (E150): Access to Club Portal, roster management, fixture submission.
      - premium (E350): Custom Scouting dashboard, advanced player heatmaps and stats exports for international scouts.
      - press (E500): Live match reports, photo galleries, official journalists credentials.
      - advertising (E800): High-exposure banner slots, media intelligence, sponsor visibility.

      Use active tone, reference localized details if applicable (like Mavuso Sports Centre, Somhlolo Stadium, or MTN league hype) and outline clear benefits.`;
    } else if (promptType === 'deal_strategy') {
      promptText = `Provide a comprehensive strategic sales playbook to win the deal for ${lead.clubName}.
      Lead Details:
      - Contact: ${lead.contactName}
      - Region: ${lead.region}
      - Status: ${lead.status}
      - Subscription Interest: ${lead.subscriptionTier} (Deal Value: E${lead.dealValue} SZL/month)
      - Notes: ${lead.notes}
      
      Give:
      1. Deal Probability Estimation (%).
      2. Step-by-step conversion roadmap.
      3. Tailored value propositions for this club.
      4. Upsell opportunities (e.g., MTN sponsorship alignment, custom domain integration).`;
    } else {
      promptText = `Generate a guide to address potential objections from ${lead.contactName} at ${lead.clubName} regarding their subscription.
      Objections can include budget limitations (value vs cost of E${lead.dealValue}/mo), lack of internet/staff at local matches in Eswatini, or preference for free social media platforms.
      
      Provide 3-4 professional rebuttal scripts that re-establish the digital transformation value, sponsor engagement returns, and time-saving automation.`;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: promptText,
      config: {
        systemInstruction: `You are an elite, highly professional Sales Strategist and CRM specialist for Eswatini Football digital transformations. You speak with business-savvy eloquence, clear structure, and absolute confidence. Focus on helping regional Eswatini clubs digitize their operations.`,
        temperature: 0.7
      }
    });

    return response.text || 'Failed to generate strategic AI insights.';
  } catch (error: any) {
    console.error('Gemini Sales CRM Assistant error:', error);
    return `AI Generation failed: ${error.message}. Please verify your GEMINI_API_KEY settings.`;
  }
};
