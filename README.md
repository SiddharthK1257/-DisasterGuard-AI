# DisasterGuard AI - Multi-Agent Crisis Network 🛡️

DisasterGuard AI is a production-ready, full-stack AI-driven web application designed for real-time natural hazard tracking, predictive vulnerability modeling, evacuation routing, and community responder mobilization.

Built for AI competitions, the application showcases a high-fidelity glassmorphism dark-mode UI, live integrations with NASA/USGS/Open-Meteo telemetry, real-time WebSockets alert distribution, and an 8-Agent AI coordinator model.

---

## 🚀 Quick Start (Docker)

To spin up the entire multi-container network (Frontend + Backend + MongoDB) instantly:

```bash
docker-compose up --build
```
- **Frontend Panel**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **MongoDB Database**: port 27017

---

## 🔑 Preset Credentials (For Evaluation)

The system is pre-seeded with three demo profiles. Use these in the login window to evaluate various user perspectives:

| Role | Email | Password | Clearance / Privileges |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@disasterguard.ai` | `adminpassword123` | Broadcast warnings, review reports, promotion access |
| **Responder** | `responder@disasterguard.ai` | `responderpassword123` | Dispatch volunteers, update shelter bed levels |
| **Citizen** | `citizen@disasterguard.ai` | `citizenpassword123` | Submit map incidents, plan routing, signup to help |

---

## 🛸 Key Features

### 1. AI Multi-Agent Coordinator Console
Interact with 8 specialized AI agents via the AI Chatbot Panel. The agents maintain contextual history and target separate problem domains:
- **Weather Agent**: Hurricane, monsoon, and wind index warnings.
- **Disaster Prediction Agent**: Coordinates regional fault line and humidity sensors to predict risk indices.
- **News Agent**: Compiles verified reports, omitting rumors.
- **Satellite Agent**: Hotspots and thermal anomaly reports.
- **Evacuation Agent**: Survival gear checklists and route navigation.
- **Volunteer Agent**: Coordinates deployable tasks.
- **Resource Agent**: Tracks available shelter bed capacities and food rations.
- **Alert Agent**: Common Alerting Protocol (CAP) warning template drafts.

*If the Gemini API key is rate-limited or offline, the app switches to a robust rule-based model generator in "Demo Mode" automatically.*

### 2. Live Threat Telemetry & Synced Map Overlay
Plots active geological events on a dark-themed Leaflet.js map:
- **USGS Earthquakes Feed**: Real-time magnitude tracker.
- **NASA EONET Events Feed**: Active wildfire and severe weather tracks.
- **Citizen Incidents**: Citizens click on the map to log localized blocks or hazards. Admins review and verify these, instantly broadcasting new active markers.
- **WebSocket Broadcasts**: Alerts and incident updates update live for all clients instantly via Socket.io.

### 3. Evacuation pathfinder
- Interactive router connecting the user's start location with the nearest shelter.
- Automatically calculates waypoints avoiding active hazards on the map.
- Prints turn-by-step safety guidelines.

### 4. Analytics & Situation Reports
- Real-time weather readings from the **Open-Meteo API**.
- Radar chart plots for multi-hazard likelihood assessments.
- Bar charts for active sensor warnings and shelter capacities.
- **Briefing PDF Generation**: Generates and downloads a beautifully structured situation summary including active alerts, shelter occupancies, and volunteer statuses.

---

## 🛠️ Technology Stack

- **Frontend**: React, TypeScript, Vite, Tailwind CSS, Recharts, Framer Motion, Leaflet.
- **Backend**: Node.js, Express, Socket.io, JWT, Mongoose, PDFKit, `@google/generative-ai`.
- **Database**: MongoDB.
- **Deployment**: Docker, Docker-Compose.

---

## 💻 Running Locally (Manual setup)

### Prerequisites
- Node.js (v18+)
- MongoDB running locally on `mongodb://localhost:27017/disasterguard`

### 1. Set Up Backend
```bash
cd backend
npm install
npm run dev
```

### 2. Set Up Frontend
```bash
cd ../frontend
npm install
npm run dev
```
Open http://localhost:3000 in your browser.
