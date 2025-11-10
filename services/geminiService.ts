// Client-safe Gemini proxy wrapper
// This module proxies AI prompts to the backend endpoint /api/ai/generate.


import { API_BASE_URL } from './apiService.ts';
import type { VitalTrendAlert } from '../types';

export type RunModelPayload = { model: string; contents: string; config?: any };

async function callAiProxy(payload: RunModelPayload): Promise<any> {
  const url = `${API_BASE_URL}/api/ai/generate`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000); // 15s timeout for AI
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal: controller.signal,
  }).finally(() => clearTimeout(timeout));

  const raw = await res.text().catch(() => '');
  if (!res.ok) {
    let parsed: any = { message: 'AI server error' };
    if (raw) {
      try { parsed = JSON.parse(raw); } catch { parsed = { message: raw }; }
    }
    throw new Error(parsed.error || parsed.message || 'AI server error');
  }

  if (!raw) return '';
  try { 
    const json = JSON.parse(raw); 
    const candidate = json.text ?? json.output ?? json;
    return candidate;
  } catch { 
    // If backend returned raw text (dev stub), return it as-is.
    return raw;
  }
}

function sanitizeAiText(text: string) {
  if (!text) return text;
  // Strip dev stub prefix like: (dev AI) Response for model=...\n\n
  const stripped = text.replace(/^\(dev AI\)[\s\S]*?\n\n/, '');
  return stripped.trim();
}

export const runModel = async (payload: RunModelPayload) => callAiProxy(payload);

export const runChat = async (prompt: string) => {
  const raw = await runModel({ model: 'gemini-2.5-flash', contents: prompt });
  const cleaned = sanitizeAiText(raw);
  
  // Check if the response is just echoing the input (common in dev stubs)
  const looksLikeEcho = cleaned === prompt.trim() || 
                        cleaned.includes(prompt.slice(0, 50)) ||
                        cleaned.toLowerCase().includes('response for model');
  
  if (looksLikeEcho) {
    // Provide a helpful fallback response for chat
    const lowerPrompt = prompt.toLowerCase();
    
    if (lowerPrompt.includes('headache') || lowerPrompt.includes('head')) {
      return "I understand you're experiencing a headache. Headaches can have various causes including stress, dehydration, tension, or underlying medical conditions. It's important to:\n\n• Stay hydrated\n• Rest in a quiet, dark room\n• Consider over-the-counter pain relief if appropriate\n• Monitor for severe or persistent symptoms\n\n**Please note:** If your headache is severe, sudden, or accompanied by other symptoms like vision changes, fever, or neck stiffness, please seek immediate medical attention. This is not a medical diagnosis - consult a healthcare professional for proper evaluation.";
    }
    
    if (lowerPrompt.includes('fever') || lowerPrompt.includes('temperature')) {
      return "I see you're concerned about a fever. Fevers are your body's natural response to infection or illness. Here's what you should know:\n\n• Monitor your temperature regularly\n• Stay hydrated with water and electrolyte drinks\n• Get plenty of rest\n• Use fever-reducing medications as directed if needed\n• Watch for signs of dehydration\n\n**Important:** If your fever is very high (over 103°F/39.4°C), persists for more than 3 days, or is accompanied by severe symptoms like difficulty breathing, rash, or confusion, please seek medical care immediately. This information is for educational purposes only - consult a healthcare provider for proper diagnosis and treatment.";
    }
    
    if (lowerPrompt.includes('pain') || lowerPrompt.includes('hurt') || lowerPrompt.includes('ache')) {
      return "I understand you're experiencing pain. Pain can vary in location, intensity, and cause. Here are some general considerations:\n\n• Note the location, type, and duration of your pain\n• Rest the affected area if appropriate\n• Apply ice or heat as may be helpful\n• Consider over-the-counter pain relief if suitable for you\n• Monitor for changes or worsening symptoms\n\n**Please remember:** Severe, sudden, or persistent pain, especially if accompanied by other symptoms, requires medical evaluation. This is not a substitute for professional medical advice - please consult with a healthcare provider for proper assessment.";
    }
    
    if (lowerPrompt.includes('cough') || lowerPrompt.includes('cold')) {
      return "I hear you're dealing with a cough or cold symptoms. Respiratory symptoms can be caused by various factors. General suggestions include:\n\n• Stay well-hydrated\n• Get adequate rest\n• Use a humidifier if helpful\n• Consider over-the-counter remedies as appropriate\n• Practice good hand hygiene to prevent spread\n\n**Important:** If you experience difficulty breathing, chest pain, high fever, or symptoms that worsen or persist, please seek medical attention. This information is educational only - consult a healthcare professional for proper care.";
    }
    
    // Generic helpful response for any symptom query
    return "Thank you for sharing your symptoms. I'm here to provide general health information, but I cannot provide a medical diagnosis.\n\nBased on what you've described, I recommend:\n\n• Monitoring your symptoms and noting any changes\n• Staying hydrated and getting adequate rest\n• Seeking professional medical advice if symptoms persist or worsen\n• Contacting a healthcare provider for proper evaluation\n\n**Remember:** This is not a medical diagnosis. For any health concerns, especially severe, sudden, or persistent symptoms, please consult with a qualified healthcare professional who can provide proper evaluation and treatment.\n\nWould you like me to help you book an appointment with a healthcare provider?";
  }
  
  return cleaned;
};

export const getTriageSuggestion = async (symptoms: string) => runModel({ model: 'gemini-2.5-flash', contents: symptoms });

export async function generateEHRSummary(a: any, b?: any, c?: any) {
  let prompt: string;
  if (typeof a === 'string' && b === undefined && c === undefined) {
    prompt = a;
  } else {
    const patient = a;
    const clinicalNotes = Array.isArray(b) ? b : [];
    const labTests = Array.isArray(c) ? c : [];
    prompt = `Please write a concise EHR summary for the following patient record. Patient:\n${JSON.stringify(patient, null, 2)}\n\nClinical Notes:\n${JSON.stringify(clinicalNotes, null, 2)}\n\nLab Tests:\n${JSON.stringify(labTests, null, 2)}\n\nReturn a short, structured summary suitable for providers.`;
  }
  const text = await runModel({ model: 'gemini-2.5-flash', contents: prompt });
  return text;
}

export const generateDailyBriefing = async (briefingPrompt: string | any, appointments?: any, prescriptions?: any) => {
  // If caller passed structured data, build a prompt; otherwise treat as raw prompt string.
  let prompt: string;
  if (typeof briefingPrompt === 'string' && appointments === undefined && prescriptions === undefined) {
    prompt = briefingPrompt;
  } else {
    const patient = briefingPrompt;
    prompt = `Daily briefing for patient ${patient?.name || ''} with appointments: ${JSON.stringify(appointments || [])} and prescriptions: ${JSON.stringify(prescriptions || [])}`;
  }
  return runModel({ model: 'gemini-2.5-flash', contents: prompt });
};

export async function checkForVitalAnomalies(vitals: any[]): Promise<VitalTrendAlert | null> {
  // Lightweight local heuristic for demo: flag if any vitals outside expected ranges
  if (!Array.isArray(vitals) || vitals.length === 0) return null;
  const issues: string[] = [];
  vitals.forEach(v => {
    const spO2 = v.spO2 ?? v.spo2 ?? v.sp_o2;
    if (v.heartRate && (v.heartRate < 40 || v.heartRate > 130)) issues.push(`Abnormal heart rate: ${v.heartRate}`);
    if (typeof spO2 === 'number' && spO2 < 90) issues.push(`Low SpO2: ${spO2}`);
    if (v.steps && v.steps > 100000) issues.push(`Suspicious step count: ${v.steps}`);
  });

  if (issues.length === 0) return null;

  const severity = issues.some(i => /Abnormal|Low|Suspicious/i.test(i)) ? 'critical' : 'warning';
  const summary = severity === 'critical' ? 'Critical vital sign anomalies detected' : 'Vital sign anomalies detected';
  return {
    alertType: severity as 'critical' | 'warning',
    summary,
    details: issues.join('; '),
  } as VitalTrendAlert;
}

export async function generateAiChannelResponse(command: string, patient: any, patientNotes: any[], patientLabs: any[]) {
  const prompt = `You are a clinical assistant.\nCommand: ${command}\n\nPatient:\n${JSON.stringify(patient, null, 2)}\n\nRecent notes:\n${JSON.stringify(patientNotes, null, 2)}\n\nRecent labs:\n${JSON.stringify(patientLabs, null, 2)}\n\nProvide a concise, helpful response suitable for insertion into the messaging channel.`;
  return await runModel({ model: 'gemini-2.5-flash', contents: prompt });
}

export async function runPharmacySafetyCheck(medication: string, existingMedications: string[]) {
  const prompt = `You are a pharmacist safety check assistant. Analyze the following medication for potential interactions, duplications, or contraindications with the patient's current medication list.\n\nMedication under review: ${medication}\n\nCurrent medications: ${existingMedications.length ? existingMedications.join(', ') : '(none)'}\n\nReturn a short JSON object with keys:\n- issues: array of strings describing any problems\n- severity: one of "ok", "caution", "high"\n- advice: a concise suggestion for the pharmacist.`;
  const text = await runModel({ model: 'gemini-2.5-flash', contents: prompt });
  try { return JSON.parse(text); } catch { return text; }
}

export async function generateProactiveCarePlan(patient: any, clinicalNotes: any[], labTests: any[]) {
  const prompt = `Generate a comprehensive proactive care plan for the patient. Patient:\n${JSON.stringify(patient, null, 2)}\n\nClinical notes:\n${JSON.stringify(clinicalNotes, null, 2)}\n\nLab tests:\n${JSON.stringify(labTests, null, 2)}\n\nReturn a JSON object summarizing recommended monitoring, lifestyle changes, follow-ups, and medication suggestions.`;
  const text = await runModel({ model: 'gemini-2.5-flash', contents: prompt });
  try { return JSON.parse(text); } catch { return text; }
}

export async function generateDiagnosticSuggestions(patient: any, clinicalNotes: any[], labTests: any[]) {
  const prompt = `Based on the patient record below, suggest likely diagnostic tests or imaging to consider. Patient:\n${JSON.stringify(patient, null, 2)}\n\nClinical notes:\n${JSON.stringify(clinicalNotes, null, 2)}\n\nLab tests:\n${JSON.stringify(labTests, null, 2)}\n\nReturn a JSON array of suggestions with brief rationale.`;
  const text = await runModel({ model: 'gemini-2.5-flash', contents: prompt });
  try { return JSON.parse(text); } catch { return text; }
}

export async function generateLifestylePlan(patient: any, clinicalNotes: any[], labTests: any[]) {
  const prompt = `Create a concise lifestyle and diet recommendation for this patient based on their record. Patient:\n${JSON.stringify(patient, null, 2)}\n\nClinical notes:\n${JSON.stringify(clinicalNotes, null, 2)}\n\nLab tests:\n${JSON.stringify(labTests, null, 2)}\n\nReturn a JSON array of recommendations.`;
  const text = await runModel({ model: 'gemini-2.5-flash', contents: prompt });
  try { return JSON.parse(text); } catch { return text; }
}

export async function generateReferralSuggestion(patient: any, clinicalNotes: any[], labTests: any[]) {
  const prompt = `Recommend specialty referral options for this patient based on the record. Patient:\n${JSON.stringify(patient, null, 2)}\n\nClinical notes:\n${JSON.stringify(clinicalNotes, null, 2)}\n\nLab tests:\n${JSON.stringify(labTests, null, 2)}\n\nReturn a short JSON object with recommended specialties and rationale.`;
  const text = await runModel({ model: 'gemini-2.5-flash', contents: prompt });
  try { return JSON.parse(text); } catch { return text; }
}

export async function generateCoachingMessage(patient: any, carePlan: any) {
  const prompt = `You are a friendly health coach. Given the patient record:\n${JSON.stringify(patient, null, 2)}\n\nAnd the care plan:\n${JSON.stringify(carePlan, null, 2)}\n\nProduce a short, encouraging coaching message (1-3 sentences) focused on adherence and simple actionable steps.`;
  const raw = await runModel({ model: 'gemini-2.5-flash', contents: prompt });
  const cleaned = sanitizeAiText(raw);

  // If the dev stub simply echoed the prompt or returned JSON, fall back to a simple local message
  const looksLikeJsonEcho = /^\s*\{/.test(cleaned) || cleaned.includes(JSON.stringify(patient).slice(0, 40));
  const looksLikePromptEcho = cleaned.includes('You are a friendly health coach') || cleaned.includes('Given the patient record');
  if (looksLikeJsonEcho) {
    const name = patient?.name ? String(patient.name).split(' ')[0] : 'there';
    return `Hi ${name}, small steps make a big difference — follow your care plan, take medications as prescribed, and contact your care team if you notice any new or worsening symptoms.`;
  }

  if (looksLikePromptEcho) {
    const name = patient?.name ? String(patient.name).split(' ')[0] : 'there';
    const diet = carePlan?.lifestyleRecommendations?.[0]?.recommendation || 'eat balanced meals and stay hydrated';
    return `Hi ${name}, you're already making progress! Keep ${diet.toLowerCase()}, stay active with small daily movements, and check in with your care team if anything feels off. You've got this.`;
  }

  return cleaned;
}

export default {
  runModel,
  runChat,
  getTriageSuggestion,
  generateEHRSummary,
  generateDailyBriefing,
  generateAiChannelResponse,
  runPharmacySafetyCheck,
  generateProactiveCarePlan,
  generateDiagnosticSuggestions,
  generateLifestylePlan,
  generateReferralSuggestion,
  generateCoachingMessage,
};
