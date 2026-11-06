# FixNow - Frontend Prototype

**AI-Powered GPS-Based Local Service Finder with Multilingual Voice Assistance for Rural and Low-Literacy Users**

FixNow is a local service-finder platform engineered for rural, semi-urban, and low-literacy users. It allows users to quickly discover verified nearby technicians (mechanics, plumbers, electricians, AC/fridge/washing machine repairers, carpenters, and labourers) through GPS proximity or multilingual voice commands in English, Telugu, and Tamil. Additionally, it features a **Household Digital Twin** with a **Household Health Score** and **AI-based preventive maintenance risk recommendations**.

---

## 1. Complete File Structure

```text
FixNow/
│
├── index.html              # Home page: Hero, GPS radar, 12 categories, How It Works, AI overview
├── services.html           # Find Services: Category filter, search, sorting, GPS, Leaflet map
├── provider.html           # Provider Profile: Bio, pricing, media gallery, reviews & ratings
├── household.html          # Household Digital Twin: Health Score (82/100), AI risk insights, appliance cards
├── voice.html              # Multilingual Voice Assistant: Web Speech API (English, Telugu, Tamil)
│
├── css/
│   └── style.css           # Master stylesheet: Design tokens, high contrast, mobile responsive
│
├── js/
│   ├── mockData.js         # Central mock data store (12 providers, household data, voice intents)
│   ├── main.js             # Global navigation, mobile drawer, toast notifications, booking modal
│   ├── services.js         # Find services controller, Leaflet OpenStreetMap, GPS calculation
│   ├── household.js        # Digital twin manager, health score computation, AI risk recommendations
│   └── voice.js            # Multilingual voice recognition, speech synthesis, intent parsing
│
└── assets/
    ├── images/             # Provider avatars, appliance diagrams, photos
    └── icons/              # UI vector and service category icons
```

---

## 2. How to Run the Project Locally

### Method A: Using Python Built-in Server (Recommended)
Open your terminal (PowerShell, Command Prompt, or Bash) and run:

```bash
cd "C:\Users\Harika\.gemini\antigravity\scratch\FixNow"
python -m http.server 8000
```

Then open your browser at:
```text
http://localhost:8000/
```
*(Running via HTTP server ensures all Web Speech API, Geolocation API, and Leaflet map tiles function with standard web permissions).*

### Method B: Direct File Opening
You can directly double-click `index.html` to open it in Chrome, Edge, Firefox, or Safari.

---

## 3. What Each File Does

| File | Purpose & Capabilities |
| :--- | :--- |
| `index.html` | Entry landing page. Presents the brand tagline *"Find the right help. Right when you need it."*, simulated GPS radar concept, 12 service categories, 4-step workflow, and AI feature showcase. |
| `services.html` | Service directory page. Integrates Leaflet.js / OpenStreetMap with interactive pins, live GPS location detection via `navigator.geolocation`, Haversine distance recalculation, keyword search, and category pills. |
| `provider.html` | Deep profile page. Reads provider ID from URL query string (e.g. `?id=1`), showing verified badges, itemized pricing, work proof gallery (photos and video preview), customer reviews, and review submission. |
| `household.html` | Household Digital Twin page. Displays the 82/100 Household Health Score, breakdown bars, AI preventive maintenance insights, appliance records, and a modal to register new appliances. |
| `voice.html` | Accessible voice page. Features a large microphone UI, language toggle (English, Telugu, Tamil), Web Speech recognition, speech playback synthesis, and interactive fallback chips. |
| `css/style.css` | Comprehensive responsive design system. Employs CSS custom properties, WCAG AA high-contrast text, 48px+ touch targets for low-literacy users, and fluid mobile layouts. |
| `js/mockData.js` | Central repository for 12 realistic local service providers, household appliances, and multilingual conversational intents. Serves as the blueprint for MongoDB collections. |
| `js/main.js` | Controls mobile hamburger drawer, active navigation state, toast messages (`FixNow.showToast`), and the universal 2-step booking modal. |
| `js/services.js` | Handles Leaflet map rendering, provider filtering, sorting by distance/rating, and dynamic card generation. |
| `js/household.js` | Computes system health averages, renders preventive maintenance cards with approved non-absolute risk phrasing, and persists data in `localStorage`. |
| `js/voice.js` | Bridges browser SpeechRecognition & SpeechSynthesis, maps spoken queries to local intent triggers, and displays matched provider cards inside the conversation feed. |

---

## 4. Which Parts Are Mock Data

1. **Service Providers (`FixNowData.providers` in `js/mockData.js`)**:
   - 12 verified local providers across AC Repair, Plumbing, Electrical, Mechanic, Refrigerator, Washing Machine, RO, TV, Carpenter, Painter, Labourer, and Salon.
   - Includes mock GPS coordinates (clustered around Rampur / Secunderabad), star ratings, reviews, itemized price lists, and image URLs.
2. **Household Digital Twin Records (`FixNowData.household` in `js/mockData.js`)**:
   - 7 home appliances/systems (AC, Refrigerator, Washing Machine, RO, TV, Electrical Grid, Plumbing).
   - Mock installation dates, past service dates, replaced parts history, technician notes, and risk tags.
3. **Voice Recognition Intents (`FixNowData.voiceIntents` in `js/mockData.js`)**:
   - Spoken phrases in English, Telugu, and Tamil mapped to categories and specific provider recommendations.
4. **Active Bookings**:
   - Stored in browser `localStorage` under `fixnow_bookings`.

---

## 5. Where FastAPI APIs Can Later Be Connected

When transitioning from mock data to FastAPI backend, replace frontend local calls with standard `fetch()` requests:

### A. Provider Directory & GPS Proximity
- **FastAPI Endpoint**: `GET /api/v1/providers?category={cat}&lat={lat}&lng={lng}&radius_km=10`
- **Location in Frontend**: In [`js/services.js`](file:///C:/Users/Harika/.gemini/antigravity/scratch/FixNow/js/services.js), inside `applyFiltersAndSort()`:
```javascript
// Replace local filter with FastAPI backend query:
const response = await fetch(`/api/v1/providers?category=${selectedCategory}&lat=${userCoords.lat}&lng=${userCoords.lng}&sort=${sortOption}`);
const data = await response.json();
currentProviders = data.providers;
renderProviderCards(currentProviders);
renderMapMarkers(currentProviders);
```

### B. Service Bookings
- **FastAPI Endpoint**: `POST /api/v1/bookings`
- **Location in Frontend**: In [`js/main.js`](file:///C:/Users/Harika/.gemini/antigravity/scratch/FixNow/js/main.js), inside `bookingForm.addEventListener('submit')`:
```javascript
// Send booking payload to FastAPI:
const res = await fetch('/api/v1/bookings', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(newBooking)
});
const result = await res.json();
```

### C. Household Digital Twin
- **FastAPI Endpoint**: `GET /api/v1/household/twin` & `POST /api/v1/household/appliances`
- **Location in Frontend**: In [`js/household.js`](file:///C:/Users/Harika/.gemini/antigravity/scratch/FixNow/js/household.js), inside `getHouseholdData()` and `form.addEventListener('submit')`.

---

## 6. Where MongoDB Atlas Will Later Be Connected

In your Python FastAPI project, use **PyMongo** or **Motor (Async PyMongo)** connected to MongoDB Atlas:

```text
MongoDB Database: "fixnow_db"
├── Collection: "providers"     -> Stores provider profiles, GPS GeoJSON points, services, ratings
├── Collection: "households"    -> Stores user appliance digital twins, age, past repairs, notes
├── Collection: "bookings"      -> Stores customer service requests and status (Pending, Completed)
└── Collection: "reviews"       -> Stores verified customer ratings, comments, and media URLs
```

### Sample MongoDB Geospatial Indexing for GPS Search:
```python
# In FastAPI / PyMongo:
from pymongo import MongoClient, GEOSPHERE

client = MongoClient("mongodb+srv://<user>:<password>@cluster0.mongodb.net/fixnow_db")
db = client.fixnow_db

# Create 2dsphere index for ultra-fast nearby GPS queries:
db.providers.create_index([("location", GEOSPHERE)])

# Query providers within 5 km of user's GPS:
def get_nearby_providers(user_lat: float, user_lng: float, category: str):
    query = {
        "category": category,
        "location": {
            "$near": {
                "$geometry": {"type": "Point", "coordinates": [user_lng, user_lat]},
                "$maxDistance": 5000 # 5 km in meters
            }
        }
    }
    return list(db.providers.find(query))
```

---

## 7. Where the Scikit-learn ML Model Will Later Be Connected

In the **Household Health** module, the AI Maintenance-Risk feature evaluates when an appliance needs preventive attention.

### Machine Learning Problem Formulation:
- **Task**: Predict `maintenance_risk_score` (0.0 to 1.0) and classification (`Low Risk`, `Moderate Risk`, `Elevated Risk`).
- **Algorithm**: `RandomForestClassifier` or `GradientBoostingClassifier` trained in Scikit-learn.
- **Input Features**:
  1. `appliance_age_months`: Total operational age (e.g. 33 months)
  2. `days_since_last_service`: Elapsed time since technician visit (e.g. 210 days)
  3. `past_repairs_count`: Number of breakdown records (e.g. 3)
  4. `seasonal_load_factor`: Summer (1.5 for AC/Fridge), Monsoon (1.4 for Electrical), Winter (1.0)

### FastAPI Model Inference Pipeline:
```python
import joblib
from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()
model = joblib.load("models/maintenance_risk_model.pkl")

class ApplianceFeatures(BaseModel):
    appliance_type: str
    age_months: int
    days_since_last_service: int
    past_repairs_count: int
    seasonal_load_factor: float

@app.post("/api/v1/ai/maintenance-risk-score")
def evaluate_risk(data: ApplianceFeatures):
    # Prepare feature vector
    X = [[data.age_months, data.days_since_last_service, data.past_repairs_count, data.seasonal_load_factor]]
    risk_prob = model.predict_proba(X)[0][1] # Probability of maintenance needed
    
    if risk_prob > 0.65:
        risk_level = "Elevated Risk"
        recommendation = "History of repeated service issues. Consider scheduling a preventive inspection."
    elif risk_prob > 0.35:
        risk_level = "Moderate Risk"
        recommendation = "Service interval exceeded 6 months. Regular maintenance recommended before peak load."
    else:
        risk_level = "Low Risk"
        recommendation = "Appliance operating within normal baseline."

    return {
        "risk_level": risk_level,
        "risk_score_percent": int(risk_prob * 100),
        "recommendation": recommendation
    }
```
*(Notice strict adherence: The model produces **preventive maintenance recommendations** and **risk assessments**, avoiding any claims of guaranteed failure prediction).*
