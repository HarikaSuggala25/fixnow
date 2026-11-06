# FixNow Backend Microservice Architecture (FastAPI + MongoDB Atlas)

This backend microservice powers **FixNow**, replacing single-browser `localStorage` with a persistent, cross-device, cloud-synchronized architecture.

---

## 1. Why FastAPI + MongoDB Atlas?

| Requirement | LocalStorage (Prototype) | FastAPI + MongoDB Atlas (Production) |
| :--- | :--- | :--- |
| **Cross-Device Sharing** | Isolated to single browser session | Real-time cloud sync across phones, laptops, and tablets |
| **GPS Distance Search** | Frontend Haversine calculation | Database-level MongoDB `2dsphere` geospatial indexing |
| **Provider Coverage** | Client-side array filtering | Query execution using `$geoWithin` & `$centerSphere` |
| **Chat & Bookings** | Mock records in storage | Persistent real-time collections with ACID transactions |

---

## 2. Geospatial Indexing & GeoJSON Points

Each service provider registered on FixNow stores their verified workshop or home base coordinates as a standardized **GeoJSON Point**:

```json
{
  "location": {
    "type": "Point",
    "coordinates": [78.4980, 17.4400]
  },
  "serviceRadius": 10
}
```

> **Note**: GeoJSON follows `[longitude, latitude]` order.

### MongoDB `2dsphere` Index Creation

```python
db.providers.create_index([("location", "2dsphere")])
```

### Geospatial Query ($centerSphere)

When a customer searches for nearby beauticians or technicians:

```python
radians = search_radius_km / 6378.1  # Earth radius in km
query = {
    "role": "provider",
    "serviceCategory": "beautician",
    "location": {
        "$geoWithin": {
            "$centerSphere": [[customer_lng, customer_lat], radians]
        }
    }
}
```

---

## 3. Quickstart & Local Setup

### Step 1: Install Dependencies

```bash
pip install fastapi uvicorn pymongo pydantic email-validator python-multipart
```

### Step 2: Set MongoDB Atlas URI (Optional for Cloud Mode)

```bash
# Windows PowerShell:
$env:MONGODB_URI="mongodb+srv://<username>:<password>@cluster0.mongodb.net/fixnow_db"

# Linux / Mac:
export MONGODB_URI="mongodb+srv://<username>:<password>@cluster0.mongodb.net/fixnow_db"
```

*Note: If no URI is provided, the API operates in resilient in-memory development mode automatically.*

### Step 3: Run FastAPI Application

```bash
uvicorn backend.main:app --reload --port 8001
```

### Step 4: Interactive API Documentation

Open Swagger UI in your browser:
- **Swagger Docs**: `http://localhost:8001/docs`
- **ReDoc**: `http://localhost:8001/redoc`

---

## 4. API Endpoints Reference

### Authentication
- `POST /api/v1/auth/customer/register` — Register new customer
- `POST /api/v1/auth/provider/register` — Register provider with GPS point & coverage radius
- `POST /api/v1/auth/login` — Login with email/mobile and password

### GPS & Discovery
- `GET /api/v1/providers/nearby?lat=17.44&lng=78.49&radius_km=10&category=beautician` — Haversine & 2dsphere proximity search

### Bookings & Lifecycle
- `POST /api/v1/bookings` — Create service booking
- `PATCH /api/v1/bookings/{request_id}/status` — Accept, Reject, Mark Completed

### Communication
- `GET /api/v1/chat/{request_id}` — Get booking chat history
- `POST /api/v1/chat/{request_id}` — Send chat message
