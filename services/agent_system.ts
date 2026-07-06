import { GoogleGenAI } from '@google/genai';
import { db } from './firebase';
import { collection, addDoc, getDocs } from 'firebase/firestore';

export const triggerAgentCycle = async (): Promise<boolean> => {
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!apiKey) {
    console.warn('Cannot run agent cycle: Missing Gemini API Key');
    return false;
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    
    // Fetch some context to make it real (e.g. leads count)
    const leadsSnapshot = await getDocs(collection(db, 'crm_leads'));
    const leads = leadsSnapshot.docs.map(doc => doc.data());
    const leadCount = leads.length;

    const promptText = `Generate 1 strategic recommendation and 2 action logs for a sports administration ecosystem (Eswatini Football).
    The system currently has ${leadCount} active CRM leads.

    Respond STRICTLY in the following JSON format:
    {
      "recommendation": {
        "agentType": "editor" | "admin" | "analyst" | "growth",
        "title": "Short action title",
        "description": "Why this should be done",
        "confidence": 95,
        "actionText": "Button text",
        "previewData": {
          "title": "Data specific to the agent type",
          "summary": "...",
          "message": "..."
        }
      },
      "logs": [
        { "agentName": "Digital Editor Agent", "message": "Log message 1", "type": "info" },
        { "agentName": "Performance Analyst Agent", "message": "Log message 2", "type": "success" }
      ]
    }`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: promptText,
      config: {
        responseMimeType: "application/json",
      }
    });

    const jsonStr = response.text;
    if (!jsonStr) return false;
    
    const data = JSON.parse(jsonStr);

    const now = new Date();
    
    // Save Logs
    if (data.logs && Array.isArray(data.logs)) {
      for (const log of data.logs) {
        await addDoc(collection(db, 'agent_logs'), {
          agentName: log.agentName,
          message: log.message,
          type: log.type || 'info',
          timestamp: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        });
      }
    }

    // Save Recommendation
    if (data.recommendation) {
      await addDoc(collection(db, 'agent_recommendations'), {
        agentType: data.recommendation.agentType,
        title: data.recommendation.title,
        description: data.recommendation.description,
        confidence: data.recommendation.confidence || Math.floor(Math.random() * 15) + 80,
        actionText: data.recommendation.actionText,
        status: 'pending',
        previewData: data.recommendation.previewData || {},
        timestamp: now.toISOString()
      });
    }

    return true;
  } catch (error) {
    console.error('Agent cycle failed', error);
    return false;
  }
};
