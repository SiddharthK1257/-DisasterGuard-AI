import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini SDK with the API Key
const apiKey = process.env.GEMINI_API_KEY || '';
let genAI: GoogleGenerativeAI | null = null;

if (apiKey && !apiKey.includes('placeholder')) {
  try {
    genAI = new GoogleGenerativeAI(apiKey);
  } catch (err) {
    console.warn('⚠️  Could not initialize GoogleGenerativeAI SDK:', err);
  }
}

export interface AgentContext {
  agentName: string;
  roleDescription: string;
  systemPrompt: string;
}

const AGENTS: Record<string, AgentContext> = {
  weather: {
    agentName: 'Weather Agent',
    roleDescription: 'Monitors real-time weather, predicts storms, hurricanes, heatwaves, and advises on weather preparedness.',
    systemPrompt: 'You are the DisasterGuard Weather Agent. Your role is to provide detailed weather analysis, warning notices, and safety guidelines. Keep your tone professional, authoritative, and helpful.'
  },
  prediction: {
    agentName: 'Disaster Prediction Agent',
    roleDescription: 'Uses historical and geological data to assess current risks of Floods, Earthquakes, Cyclones, Wildfires, Landslides, and Drought.',
    systemPrompt: 'You are the DisasterGuard Disaster Prediction Agent. Based on inputs (like seismic activity, humidity, soil conditions), evaluate the probability and risk levels of disasters. Explain the science briefly and outline immediate prevention strategies.'
  },
  news: {
    agentName: 'News Agent',
    roleDescription: 'Aggregates, filters, and reports verified emergency broadcasts, local hazards, and global disaster incidents.',
    systemPrompt: 'You are the DisasterGuard News Agent. Summarize active news reports, emphasize verified information, filter out rumors, and highlight official government or NGO response statements.'
  },
  satellite: {
    agentName: 'Satellite Agent',
    roleDescription: 'Analyzes satellite imaging indicators (hotspots, moisture profiles, flood inundation maps) to detect anomalies.',
    systemPrompt: 'You are the DisasterGuard Satellite Agent. Describe structural observations, terrain elevations, smoke plume expansion, and flood extensions based on mock or real satellite telemetries.'
  },
  evacuation: {
    agentName: 'Evacuation Agent',
    roleDescription: 'Calculates safest paths, monitors road blockages, and guides citizens to designated emergency shelters.',
    systemPrompt: 'You are the DisasterGuard Evacuation Agent. Recommend safe travel protocols, warning points to avoid, items to pack in a Go-Bag, and step-by-step directions to safety.'
  },
  volunteer: {
    agentName: 'Volunteer Agent',
    roleDescription: 'Coordinates volunteers, schedules task assignments, matches responder skills with target locations.',
    systemPrompt: 'You are the DisasterGuard Volunteer Agent. Welcome volunteers, assign tasks (e.g. search & rescue, shelter support, medical triage, food distribution) based on their skills, and coordinate operations.'
  },
  resource: {
    agentName: 'Resource Agent',
    roleDescription: 'Tracks hospital beds, emergency shelters, food, water, medical supplies, and lists missing resource needs.',
    systemPrompt: 'You are the DisasterGuard Resource Agent. Help users identify where supplies are located, coordinate distribution logistics, and flag critical shortages in affected sectors.'
  },
  alert: {
    agentName: 'Alert Agent',
    roleDescription: 'Generates urgent emergency broadcasts, siren triggers, SMS alerts, and app notifications.',
    systemPrompt: 'You are the DisasterGuard Alert Agent. Draft urgent, actionable alert templates (e.g., CAP - Common Alerting Protocol) with clear titles, hazard levels, instructions, and target areas.'
  }
};

// Realistic mock responses if Gemini API is unavailable/fails
const getMockResponse = (agentName: string, query: string): string => {
  const q = query.toLowerCase();
  
  switch (agentName.toLowerCase()) {
    case 'weather':
      if (q.includes('storm') || q.includes('rain') || q.includes('monsoon')) {
        return `[Weather Agent] 🌧️ ALERT: Deep depression detected in the Bay of Bengal. Heavy to very heavy rainfall (115-200mm) is expected over the coastal sectors in the next 24-48 hours. Winds peaking at 65-75 km/h. High wave warning active. Please secure loose outdoor items and avoid coastal trips.`;
      }
      return `[Weather Agent] ☀️ Current Conditions: Temperature 29°C, Humidity 74%, Wind Speed 12 km/h. A warm, humid weather system remains stable. No critical atmospheric warnings are active for your current coordinates. Live radar shows clean visibility.`;
      
    case 'prediction':
      if (q.includes('earthquake') || q.includes('seismic')) {
        return `[Disaster Prediction Agent] 🌋 Risk Assessment: Moderate risk (Yellow Status). The region is near active tectonic fault lines. USGS reports a cluster of minor micro-tremors (magnitude 1.5 - 2.8) in the last 12 hours. Tectonic stress accumulation is currently normal, but structure retrofitting is advised.`;
      }
      if (q.includes('fire') || q.includes('wildfire')) {
        return `[Disaster Prediction Agent] 🔥 Risk Assessment: High Wildfire Risk (Orange Status). High ambient temperatures (38°C), critically low relative humidity (14%), and dry vegetative fuels have raised the Keetch-Byram Drought Index (KBDI) to 620. Fire spread potential is extremely high. Avoid open fires or clearing brush.`;
      }
      return `[Disaster Prediction Agent] 🤖 Risk Matrix Update:
- Flood: Low (15% chance - dry soil absorption)
- Wildfire: High (72% chance - high heat index & low humidity)
- Earthquake: Low-Moderate (24% chance - standard fault line slip)
- Cyclone: Low (10% chance - no active tropical disturbances)
Preparedness levels are currently optimal, but continuous monitoring of telemetry is ongoing.`;

    case 'news':
      return `[News Agent] 📰 VERIFIED LOG:
1. [02:30 PM] Local authorities issue evacuation warnings for low-lying areas in District 4 due to rising river run-offs.
2. [11:15 AM] National Red Cross establishes 3 secondary relief warehouses with emergency kits in the metropolitan sector.
3. [08:00 AM] Port operations suspended temporarily due to gale-force winds exceeding 35 knots.`;

    case 'satellite':
      return `[Satellite Agent] 🛰️ Sentinel-2 / Landsat-9 Data Feed:
- Thermal Anomalies: 3 hotspots detected near the eastern ridge coordinate cluster [42.36, -71.05]. Infrared signatures indicate expanding wildfire front.
- Soil Moisture Index (SMAP): Soil moisture has dropped to 8% in agricultural zones.
- Inundation Mapping: Synthetic Aperture Radar (SAR) reveals water level overflow covering approx. 4.2 sq km of low-lying floodplains.`;

    case 'evacuation':
      return `[Evacuation Agent] 🗺️ ROUTE DIRECTIVE:
1. SAFE PATHWAY: Route A-5 (Westbound Expressway) is clear. Avoid Sector 3 Ring Road due to structural debris and power lines down.
2. NEAREST SHELTERS: 
   - Civic Community Center (Capacity: 350 spots left, Medical Triage unit active)
   - North High Gymnasium (Capacity: 120 spots left, Pet friendly)
3. Checklist: Ensure you carry your Go-Bag (Water, 3 days dry food, flashlight, medication, copies of ID, phone powerbank).`;

    case 'volunteer':
      return `[Volunteer Agent] 🤝 COORDINATION REPORT:
- ACTIVE INCIDENT: Sector 4 Relief Distribution Hub.
- NEEDED SKILLS: Medical first-responders (2), Logistics/Sorting (6), Ham Radio operators (1).
- NEXT SHIFT: Commences at 08:00 AM.
- DEPLOYMENT: Please register in the Volunteer Portal, retrieve your badge QR code, and report to Shift Lead Sarah at the Central Shelter.`;

    case 'resource':
      return `[Resource Agent] 📦 INVENTORY STATUS:
- Shelter Capacity: 84% occupied district-wide. 420 additional beds available across 3 primary shelters.
- Supplies: 1,500 emergency rations, 2,200 liters of bottled water, 400 first-aid kits in stock.
- Critical Shortage: Pediatric medicine and heavy-duty emergency generators are in high demand at the Central Hospital.`;

    case 'alert':
      return `[Alert Agent] 🚨 BROADCAST TEMPLATE (CAP V1.2):
- Event: FLASH FLOOD WARNING
- Urgency: Immediate | Severity: Severe | Certainty: Observed
- Instruction: Move to higher ground immediately. Do not attempt to walk or drive through flooded areas. Turn around, don't drown.
- Areas affected: River valley settlements and urban basins.`;

    default:
      return `[DisasterGuard AI Agent] Connected. Please specify a query regarding weather forecasting, disaster risks, evacuation pathways, shelter statuses, or volunteering.`;
  }
};

export const getAgentResponse = async (
  agentType: string,
  userMessage: string,
  chatHistory: { role: 'user' | 'model'; parts: string }[] = []
): Promise<{ text: string; isMock: boolean }> => {
  const agent = AGENTS[agentType.toLowerCase()] || {
    agentName: 'DisasterGuard General Agent',
    roleDescription: 'General AI Assistant for emergency response and safety questions.',
    systemPrompt: 'You are the DisasterGuard General Agent. Provide clear, accurate, and helpful answers.'
  };

  if (!genAI) {
    // If Gemini client not initialized, fallback to mock responses
    return {
      text: getMockResponse(agentType, userMessage),
      isMock: true
    };
  }

  try {
    // Choose model
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: {
        maxOutputTokens: 500,
        temperature: 0.7,
      }
    });

    // Format chat history to match Gemini SDK signature
    const contents = [
      {
        role: 'user',
        parts: [{ text: `SYSTEM DIRECTIVE: ${agent.systemPrompt}\n\nUser request: ${userMessage}` }]
      }
    ];

    // Inject history if any
    if (chatHistory && chatHistory.length > 0) {
      const formattedHistory = chatHistory.map(h => ({
        role: h.role === 'user' ? 'user' : 'model',
        parts: [{ text: h.parts }]
      }));
      contents.unshift(...formattedHistory);
    }

    const result = await model.generateContent({
      contents: contents as any
    });
    
    const response = await result.response;
    const responseText = response.text();

    if (!responseText) {
      throw new Error('Empty response from Gemini API');
    }

    return {
      text: responseText,
      isMock: false
    };
  } catch (error: any) {
    console.error(`🔴 Gemini API failure for Agent [${agent.agentName}]:`, error.message);
    // Graceful fallback to mock data (Demo Mode active)
    return {
      text: `[Demo Mode] ${getMockResponse(agentType, userMessage)}`,
      isMock: true
    };
  }
};
