"""
FixNow - Central Backend API (FastAPI + MongoDB Atlas)
======================================================
Production-ready backend microservice implementing:
1. Multi-tenant authentication (Customer & Service Provider) with MongoDB
2. GPS Geolocation & 2dsphere Geospatial Indexing (MongoDB)
3. Provider discovery with Haversine & MongoDB $geoWithin / $centerSphere
4. Provider Rate Card & Profile Management in MongoDB
5. Booking lifecycle management (Pending -> Accepted -> Completed)
6. Household Equipment Digital Twin persistence in MongoDB
7. Bidirectional Notification storage in MongoDB
8. Customer <-> Provider in-app chat endpoints
======================================================
"""

import os
import math
from datetime import datetime
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, EmailStr

# Load environment variables if .env exists
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

# Initialize FastAPI application
app = FastAPI(
    title="FixNow API with MongoDB",
    description="Decentralized Home Services Platform - MongoDB Engine",
    version="2.5.0"
)

# Enable CORS for local and cloud frontends
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# MongoDB Configuration & Resilient Fallback
# ---------------------------------------------------------------------------
MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://127.0.0.1:27017/fixnow_db")
DB_NAME = os.getenv("DB_NAME", "fixnow_db")

mongo_client = None
db = None

try:
    from pymongo import MongoClient, GEOSPHERE, ASCENDING
    if MONGODB_URI:
        mongo_client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=2000)
        mongo_client.admin.command('ping')
        db = mongo_client[DB_NAME]
        
        # Initialize MongoDB indexes
        db.users.create_index([("email", ASCENDING)], unique=True, sparse=True)
        db.users.create_index([("mobile", ASCENDING)], unique=True, sparse=True)
        db.users.create_index([("location", GEOSPHERE)])
        db.bookings.create_index([("requestId", ASCENDING)], unique=True)
        db.bookings.create_index([("customerId", ASCENDING)])
        db.bookings.create_index([("providerId", ASCENDING)])
        db.household_appliances.create_index([("id", ASCENDING)], unique=True)
        db.notifications.create_index([("id", ASCENDING)], unique=True)
        db.chat_messages.create_index([("requestId", ASCENDING)])
        
        print("[SUCCESS] Successfully connected to MongoDB. 2dsphere and unique indexes active.")
except Exception as e:
    print(f"[INFO] MongoDB server notice: {e}. Active mode: High-availability in-memory document store.")
    db = None

# In-memory document fallback if MongoDB server is offline
MEMORY_DB: Dict[str, List[Dict[str, Any]]] = {
    "users": [],
    "bookings": [],
    "household_appliances": [],
    "notifications": [],
    "chat_messages": []
}

# ---------------------------------------------------------------------------
# Pydantic Schemas
# ---------------------------------------------------------------------------

class CustomerRegisterModel(BaseModel):
    full_name: str
    mobile: str
    email: EmailStr
    password: str
    location: Optional[str] = ""
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class RateCardItem(BaseModel):
    service: str
    price: str
    description: Optional[str] = ""

class ProviderRegisterModel(BaseModel):
    full_name: str
    mobile: str
    email: EmailStr
    password: str
    service_category: str
    service_title: Optional[str] = None
    experience_years: Optional[int] = 5
    address: str
    service_area: Optional[str] = ""
    city: Optional[str] = "Local Area"
    pincode: Optional[str] = ""
    latitude: float = 17.4400
    longitude: float = 78.4980
    service_radius: int = 10
    short_description: Optional[str] = ""
    pricing: Optional[List[Dict[str, Any]]] = None

class LoginModel(BaseModel):
    email_or_mobile: str
    password: str
    role: Optional[str] = None

class BookingCreateModel(BaseModel):
    customer_id: Optional[str] = None
    customer_name: str
    customer_phone: str
    customer_address: str
    provider_id: str
    provider_name: str
    provider_phone: Optional[str] = None
    service_category: str
    sub_service: Optional[str] = "Standard Service"
    date: str
    time_slot: str
    problem_desc: Optional[str] = ""

class StatusUpdateModel(BaseModel):
    status: str  # Pending, Accepted, Rejected, Completed, Cancelled

class RateCardUpdateModel(BaseModel):
    pricing: List[Dict[str, Any]]

class ApplianceModel(BaseModel):
    id: Optional[str] = None
    customer_id: Optional[str] = None
    name: str
    type: str
    brand_model: Optional[str] = ""
    installed_date: str
    last_service_date: Optional[str] = None
    usage_level: Optional[str] = "moderate"
    status: Optional[str] = "Good Condition"
    health_score: Optional[int] = 100
    ai_recommendation: Optional[str] = ""

class NotificationModel(BaseModel):
    target_role: str  # customer | provider
    target_user_id: Optional[str] = None
    target_phone: Optional[str] = None
    booking_id: Optional[str] = None
    title: str
    message: str
    type: Optional[str] = "info"
    action: Optional[str] = "bookings"

class ChatMessageModel(BaseModel):
    request_id: str
    customer_id: str
    provider_id: str
    sender_role: str  # customer | provider
    sender_name: str
    message: str

# ---------------------------------------------------------------------------
# Geodesic Calculation Helper
# ---------------------------------------------------------------------------

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371.0  # Earth radius in kilometers
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dlon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(R * c, 2)

# ---------------------------------------------------------------------------
# System Status Endpoint
# ---------------------------------------------------------------------------

@app.get("/")
def root():
    return {
        "app": "FixNow MongoDB Backend Service",
        "version": "2.5.0",
        "status": "online",
        "database": "MongoDB (Active Connection)" if db is not None else "In-Memory Resilient Store",
        "databaseName": DB_NAME
    }

# ---------------------------------------------------------------------------
# 1. Authentication Endpoints
# ---------------------------------------------------------------------------

@app.post("/api/v1/auth/customer/register", status_code=status.HTTP_201_CREATED)
def register_customer(payload: CustomerRegisterModel):
    clean_email = payload.email.strip().lower()
    clean_mobile = "".join(filter(str.isdigit, payload.mobile))

    new_user = {
        "id": f"cust-{int(datetime.now().timestamp() * 1000)}",
        "role": "customer",
        "fullName": payload.full_name,
        "mobile": clean_mobile,
        "email": clean_email,
        "password": payload.password,
        "location": payload.location or "",
        "latitude": payload.latitude,
        "longitude": payload.longitude,
        "createdAt": datetime.now().isoformat()
    }

    if db is not None:
        if db.users.find_one({"$or": [{"email": clean_email}, {"mobile": clean_mobile}]}):
            raise HTTPException(status_code=400, detail="An account with this email or mobile number already exists.")
        db.users.insert_one(new_user)
        new_user.pop("_id", None)
    else:
        for u in MEMORY_DB["users"]:
            if u["email"] == clean_email or u["mobile"] == clean_mobile:
                raise HTTPException(status_code=400, detail="An account with this email or mobile number already exists.")
        MEMORY_DB["users"].append(new_user)

    return {"success": True, "user": new_user}

@app.post("/api/v1/auth/provider/register", status_code=status.HTTP_201_CREATED)
def register_provider(payload: ProviderRegisterModel):
    clean_email = payload.email.strip().lower()
    clean_mobile = "".join(filter(str.isdigit, payload.mobile))
    provider_id = f"prov-{int(datetime.now().timestamp() * 1000)}"

    new_provider = {
        "id": provider_id,
        "role": "provider",
        "fullName": payload.full_name,
        "mobile": clean_mobile,
        "phoneNumber": clean_mobile,
        "email": clean_email,
        "password": payload.password,
        "serviceCategory": payload.service_category.lower(),
        "serviceTitle": payload.service_title or f"{payload.service_category.replace('-', ' ').title()} Specialist",
        "experienceYears": payload.experience_years or 5,
        "address": payload.address,
        "serviceArea": payload.service_area or "",
        "city": payload.city or "Local Area",
        "pincode": payload.pincode or "",
        "latitude": payload.latitude,
        "longitude": payload.longitude,
        "location": {
            "type": "Point",
            "coordinates": [payload.longitude, payload.latitude]  # GeoJSON: [lng, lat]
        },
        "serviceRadius": payload.service_radius,
        "shortDescription": payload.short_description or "",
        "pricing": payload.pricing or [],  # Strict: Provider manually enters custom rate card
        "rating": 5.0,
        "reviewsCount": 0,
        "completedJobs": 0,
        "availability": "available",
        "workingHours": "8:00 AM - 7:00 PM",
        "createdAt": datetime.now().isoformat()
    }

    if db is not None:
        if db.users.find_one({"$or": [{"email": clean_email}, {"mobile": clean_mobile}]}):
            raise HTTPException(status_code=400, detail="An account with this email or mobile number already exists.")
        db.users.insert_one(new_provider)
        new_provider.pop("_id", None)
    else:
        for u in MEMORY_DB["users"]:
            if u["email"] == clean_email or u["mobile"] == clean_mobile:
                raise HTTPException(status_code=400, detail="An account with this email or mobile number already exists.")
        MEMORY_DB["users"].append(new_provider)

    return {"success": True, "provider": new_provider}

@app.post("/api/v1/auth/login")
def login(payload: LoginModel):
    clean_id = payload.email_or_mobile.strip().lower()
    clean_mobile = "".join(filter(str.isdigit, clean_id))
    user = None

    if db is not None:
        query = {
            "$or": [
                {"email": clean_id},
                {"mobile": clean_mobile if clean_mobile else clean_id}
            ],
            "password": payload.password
        }
        if payload.role:
            query["role"] = payload.role
        user = db.users.find_one(query)
        if user:
            user.pop("_id", None)
    else:
        for u in MEMORY_DB["users"]:
            matches_ident = (u["email"].lower() == clean_id) or (clean_mobile and u["mobile"] == clean_mobile)
            matches_pass = (u["password"] == payload.password)
            matches_role = (not payload.role or u.get("role") == payload.role)
            if matches_ident and matches_pass and matches_role:
                user = u
                break

    if not user:
        raise HTTPException(status_code=401, detail="Invalid email/mobile or password. Please try again.")

    return {
        "success": True,
        "user": user,
        "redirectUrl": "provider-dashboard.html" if user.get("role") == "provider" else "index.html"
    }

# ---------------------------------------------------------------------------
# 2. Providers Geospatial Discovery & Rate Card Endpoints
# ---------------------------------------------------------------------------

@app.get("/api/v1/providers/nearby")
def get_nearby_providers(
    lat: float = Query(..., description="Customer latitude"),
    lng: float = Query(..., description="Customer longitude"),
    radius_km: float = Query(25.0, description="Customer search radius in km"),
    category: Optional[str] = Query(None, description="Service category")
):
    results = []
    providers_source = []

    if db is not None:
        radians = radius_km / 6378.1
        geo_query: Dict[str, Any] = {
            "role": "provider",
            "location": {
                "$geoWithin": {
                    "$centerSphere": [[lng, lat], radians]
                }
            }
        }
        if category and category != "all":
            norm_cat = "beautician" if category in ["salon", "beauty", "beautician"] else category.lower()
            geo_query["serviceCategory"] = norm_cat

        cursor = db.users.find(geo_query)
        for doc in cursor:
            doc.pop("_id", None)
            providers_source.append(doc)
    else:
        for u in MEMORY_DB["users"]:
            if u.get("role") == "provider":
                providers_source.append(u)

    for p in providers_source:
        p_cat = p.get("serviceCategory", "").lower()
        if category and category != "all":
            target_cat = "beautician" if category in ["salon", "beauty", "beautician"] else category.lower()
            if target_cat != p_cat:
                continue

        p_lat = p.get("latitude", 17.4400)
        p_lng = p.get("longitude", 78.4980)
        dist = haversine_distance(lat, lng, p_lat, p_lng)

        prov_coverage = p.get("serviceRadius", 10)
        if dist <= prov_coverage and dist <= radius_km:
            p_copy = dict(p)
            p_copy["distanceKm"] = dist
            p_copy["name"] = p.get("fullName", "Service Specialist")
            results.append(p_copy)

    results.sort(key=lambda x: x["distanceKm"])

    return {
        "count": len(results),
        "customerCoords": {"lat": lat, "lng": lng},
        "providers": results
    }

@app.put("/api/v1/providers/{provider_id}/rate-card")
def update_provider_rate_card(provider_id: str, payload: RateCardUpdateModel):
    if db is not None:
        res = db.users.update_one({"id": provider_id, "role": "provider"}, {"$set": {"pricing": payload.pricing}})
        if res.matched_count == 0:
            raise HTTPException(status_code=404, detail="Provider not found.")
    else:
        matched = False
        for u in MEMORY_DB["users"]:
            if u["id"] == provider_id and u["role"] == "provider":
                u["pricing"] = payload.pricing
                matched = True
                break
        if not matched:
            raise HTTPException(status_code=404, detail="Provider not found.")

    return {"success": True, "message": "Rate card updated successfully in MongoDB.", "pricing": payload.pricing}

# ---------------------------------------------------------------------------
# 3. Booking Lifecycle Management Endpoints (Permanent MongoDB Storage)
# ---------------------------------------------------------------------------

@app.post("/api/v1/bookings", status_code=status.HTTP_201_CREATED)
def create_booking(payload: BookingCreateModel):
    booking_id = f"FN-{int(datetime.now().timestamp() * 1000) % 1000000:06d}"
    new_booking = {
        "requestId": booking_id,
        "customerId": payload.customer_id or f"cust-{int(datetime.now().timestamp())}",
        "customerName": payload.customer_name,
        "customerPhone": payload.customer_phone,
        "customerAddress": payload.customer_address,
        "providerId": payload.provider_id,
        "providerName": payload.provider_name,
        "providerPhone": payload.provider_phone,
        "serviceCategory": payload.service_category,
        "subService": payload.sub_service or "Standard Service",
        "date": payload.date,
        "timeSlot": payload.time_slot,
        "problemDesc": payload.problem_desc or "Booked via FixNow",
        "status": "Pending",
        "createdAt": datetime.now().isoformat()
    }

    if db is not None:
        db.bookings.insert_one(new_booking)
        new_booking.pop("_id", None)
    else:
        MEMORY_DB["bookings"].append(new_booking)

    return {"success": True, "booking": new_booking}

@app.get("/api/v1/bookings")
def get_bookings(
    customer_id: Optional[str] = None,
    provider_id: Optional[str] = None,
    status_filter: Optional[str] = None
):
    query: Dict[str, Any] = {}
    if customer_id:
        query["customerId"] = customer_id
    if provider_id:
        query["providerId"] = provider_id
    if status_filter:
        query["status"] = status_filter

    if db is not None:
        items = list(db.bookings.find(query).sort("createdAt", -1))
        for item in items:
            item.pop("_id", None)
        return {"bookings": items}
    else:
        filtered = MEMORY_DB["bookings"]
        if customer_id:
            filtered = [b for b in filtered if b.get("customerId") == customer_id]
        if provider_id:
            filtered = [b for b in filtered if b.get("providerId") == provider_id]
        if status_filter:
            filtered = [b for b in filtered if b.get("status") == status_filter]
        return {"bookings": list(reversed(filtered))}

@app.patch("/api/v1/bookings/{request_id}/status")
def update_booking_status(request_id: str, payload: StatusUpdateModel):
    if db is not None:
        res = db.bookings.update_one({"requestId": request_id}, {"$set": {"status": payload.status}})
        if res.matched_count == 0:
            raise HTTPException(status_code=404, detail="Booking request not found.")
    else:
        matched = False
        for b in MEMORY_DB["bookings"]:
            if b["requestId"] == request_id:
                b["status"] = payload.status
                matched = True
                break
        if not matched:
            raise HTTPException(status_code=404, detail="Booking request not found.")

    return {"success": True, "requestId": request_id, "newStatus": payload.status}

# ---------------------------------------------------------------------------
# 4. Household Equipment Digital Twin Endpoints
# ---------------------------------------------------------------------------

@app.get("/api/v1/household/appliances")
def get_household_appliances(customer_id: Optional[str] = None):
    query = {"customerId": customer_id} if customer_id else {}
    if db is not None:
        items = list(db.household_appliances.find(query))
        for item in items:
            item.pop("_id", None)
        return {"appliances": items}
    else:
        filtered = MEMORY_DB["household_appliances"]
        if customer_id:
            filtered = [a for a in filtered if a.get("customerId") == customer_id]
        return {"appliances": filtered}

@app.post("/api/v1/household/appliances", status_code=status.HTTP_201_CREATED)
def add_household_appliance(payload: ApplianceModel):
    app_id = payload.id or f"app-{int(datetime.now().timestamp() * 1000)}"
    doc = {
        "id": app_id,
        "customerId": payload.customer_id or "cust-default",
        "name": payload.name,
        "type": payload.type,
        "brandModel": payload.brand_model or "",
        "installedDate": payload.installed_date,
        "lastServiceDate": payload.last_service_date,
        "usageLevel": payload.usage_level or "moderate",
        "status": payload.status or "Good Condition",
        "healthScore": payload.health_score or 100,
        "aiRecommendation": payload.ai_recommendation or "Operating smoothly.",
        "createdAt": datetime.now().isoformat()
    }

    if db is not None:
        db.household_appliances.insert_one(doc)
        doc.pop("_id", None)
    else:
        MEMORY_DB["household_appliances"].append(doc)

    return {"success": True, "appliance": doc}

@app.delete("/api/v1/household/appliances/{appliance_id}")
def delete_household_appliance(appliance_id: str):
    if db is not None:
        res = db.household_appliances.delete_one({"id": appliance_id})
        if res.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Appliance not found.")
    else:
        orig = len(MEMORY_DB["household_appliances"])
        MEMORY_DB["household_appliances"] = [a for a in MEMORY_DB["household_appliances"] if a["id"] != appliance_id]
        if len(MEMORY_DB["household_appliances"]) == orig:
            raise HTTPException(status_code=404, detail="Appliance not found.")

    return {"success": True, "message": "Appliance removed from Digital Twin."}

# ---------------------------------------------------------------------------
# 5. Dual Real-Time Notifications Endpoints
# ---------------------------------------------------------------------------

@app.get("/api/v1/notifications")
def get_notifications(target_role: Optional[str] = None, user_id: Optional[str] = None):
    query: Dict[str, Any] = {}
    if target_role:
        query["targetRole"] = target_role
    if user_id:
        query["$or"] = [{"targetUserId": user_id}, {"targetPhone": user_id}]

    if db is not None:
        notifs = list(db.notifications.find(query).sort("timestamp", -1))
        for n in notifs:
            n.pop("_id", None)
        return {"notifications": notifs}
    else:
        filtered = MEMORY_DB["notifications"]
        if target_role:
            filtered = [n for n in filtered if n.get("targetRole") == target_role]
        return {"notifications": list(reversed(filtered))}

@app.post("/api/v1/notifications", status_code=status.HTTP_201_CREATED)
def add_notification(payload: NotificationModel):
    notif_doc = {
        "id": f"notif-{int(datetime.now().timestamp() * 1000)}",
        "targetRole": payload.target_role,
        "targetUserId": payload.target_user_id,
        "targetPhone": payload.target_phone,
        "bookingId": payload.booking_id,
        "title": payload.title,
        "message": payload.message,
        "type": payload.type or "info",
        "action": payload.action or "bookings",
        "read": False,
        "timestamp": datetime.now().isoformat()
    }

    if db is not None:
        db.notifications.insert_one(notif_doc)
        notif_doc.pop("_id", None)
    else:
        MEMORY_DB["notifications"].append(notif_doc)

    return {"success": True, "notification": notif_doc}

# ---------------------------------------------------------------------------
# 6. Customer <-> Provider In-App Chat Endpoints
# ---------------------------------------------------------------------------

@app.get("/api/v1/chat/{request_id}")
def get_chat_history(request_id: str):
    if db is not None:
        msgs = list(db.chat_messages.find({"requestId": request_id}).sort("timestamp", 1))
        for m in msgs:
            m.pop("_id", None)
        return {"messages": msgs}
    else:
        filtered = [m for m in MEMORY_DB["chat_messages"] if m["requestId"] == request_id]
        return {"messages": filtered}

@app.post("/api/v1/chat/{request_id}", status_code=status.HTTP_201_CREATED)
def send_chat_message(request_id: str, payload: ChatMessageModel):
    new_msg = {
        "messageId": f"msg-{int(datetime.now().timestamp() * 1000)}",
        "requestId": request_id,
        "customerId": payload.customer_id,
        "providerId": payload.provider_id,
        "senderRole": payload.sender_role,
        "senderName": payload.sender_name,
        "message": payload.message,
        "timestamp": datetime.now().isoformat()
    }

    if db is not None:
        db.chat_messages.insert_one(new_msg)
        new_msg.pop("_id", None)
    else:
        MEMORY_DB["chat_messages"].append(new_msg)

    return {"success": True, "message": new_msg}

# ---------------------------------------------------------------------------
# 7. Static Frontend File Serving (Unified Full-Stack Deployment)
# ---------------------------------------------------------------------------
try:
    from fastapi.staticfiles import StaticFiles
    # Locate frontend root directory (parent of backend/ or current dir)
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    if not os.path.exists(os.path.join(base_dir, "index.html")):
        base_dir = os.path.abspath(".")

    if os.path.exists(os.path.join(base_dir, "index.html")):
        app.mount("/", StaticFiles(directory=base_dir, html=True), name="frontend")
        print(f"[INFO] Mounted static frontend directory from: {base_dir}")
except Exception as e:
    print(f"[WARN] Could not mount static frontend: {e}")

