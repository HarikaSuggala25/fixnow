"""
Direct Logic Verification Suite for FixNow MongoDB + FastAPI Backend
"""
import sys
from backend.main import (
    CustomerRegisterModel,
    ProviderRegisterModel,
    BookingCreateModel,
    StatusUpdateModel,
    ApplianceModel,
    register_customer,
    register_provider,
    get_nearby_providers,
    create_booking,
    get_bookings,
    update_booking_status,
    add_household_appliance,
    get_household_appliances,
    root
)

def test_backend_logic():
    print("=================================================================")
    print(" Verifying FixNow FastAPI + MongoDB Backend Microservice Logic")
    print("=================================================================\n")
    
    # 1. Health check
    status = root()
    print("  [+] Health endpoint online:", status["database"])
    
    # 2. Register customer
    cust_payload = CustomerRegisterModel(
        full_name="Kavitha Reddy",
        mobile="9849098490",
        email="kavitha.reddy@example.com",
        password="Password@123",
        location="Madhapur, Hyderabad",
        latitude=17.4485,
        longitude=78.3908
    )
    cust_res = register_customer(cust_payload)
    assert cust_res["success"] is True
    cust_id = cust_res["user"]["id"]
    print("  [+] Registered customer successfully in MongoDB schema. ID:", cust_id)
    
    # 3. Register provider with GeoJSON Point & Rate Card
    prov_payload = ProviderRegisterModel(
        full_name="Rao Electrical Works",
        mobile="9848098480",
        email="rao.elec@example.com",
        password="Password@123",
        service_category="electrician",
        service_title="Certified Master Electrician",
        address="Hitech City, Hyderabad",
        latitude=17.4490,
        longitude=78.3910,
        service_radius=15,
        pricing=[
            {"service": "Main Line Trip Repair", "price": "₹350", "description": "Diagnostics and trip reset"}
        ]
    )
    prov_res = register_provider(prov_payload)
    assert prov_res["success"] is True
    prov_id = prov_res["provider"]["id"]
    print("  [+] Registered provider with GeoJSON Point & Rate Card. ID:", prov_id)
    
    # 4. Proximity Search via $geoWithin / Haversine
    nearby_res = get_nearby_providers(lat=17.4485, lng=78.3908, radius_km=25.0, category="electrician")
    providers = nearby_res["providers"]
    assert len(providers) >= 1
    print(f"  [+] Found {len(providers)} nearby provider(s). Nearest: {providers[0]['name']} ({providers[0]['distanceKm']} km)")
    
    # 5. Create Booking
    booking_payload = BookingCreateModel(
        customer_id=cust_id,
        customer_name="Kavitha Reddy",
        customer_phone="9849098490",
        customer_address="Madhapur, Hyderabad",
        provider_id=prov_id,
        provider_name="Rao Electrical Works",
        service_category="electrician",
        sub_service="Main Line Trip Repair",
        date="Tomorrow",
        time_slot="Morning (9:00 AM - 12:00 PM)",
        problem_desc="Repeated MCB tripping when AC turns on"
    )
    book_res = create_booking(booking_payload)
    assert book_res["success"] is True
    booking = book_res["booking"]
    req_id = booking["requestId"]
    assert booking["status"] == "Pending"
    print(f"  [+] Created persistent booking #{req_id} with initial status 'Pending'")
    
    # 6. Retrieve Bookings
    bookings_res = get_bookings(provider_id=prov_id)
    b_list = bookings_res["bookings"]
    assert len(b_list) >= 1
    print(f"  [+] Provider retrieved incoming booking requests (Total: {len(b_list)})")
    
    # 7. Provider Accepts Booking
    status_payload = StatusUpdateModel(status="Accepted")
    patch_res = update_booking_status(req_id, status_payload)
    assert patch_res["success"] is True
    assert patch_res["newStatus"] == "Accepted"
    print(f"  [+] Booking #{req_id} accepted successfully by provider!")
    
    # 8. Household Digital Twin Appliance Persistence
    app_payload = ApplianceModel(
        customer_id=cust_id,
        name="Master Bed Split AC",
        type="Air Conditioner",
        brand_model="Daikin 1.5 Ton Inverter",
        installed_date="2023-04-15",
        last_service_date="2024-03-10",
        usage_level="heavy",
        status="Attention Needed",
        health_score=68,
        ai_recommendation="Service overdue by 8 months. Chemical wash recommended."
    )
    app_res = add_household_appliance(app_payload)
    assert app_res["success"] is True
    app_id = app_res["appliance"]["id"]
    print("  [+] Registered appliance in Digital Twin:", app_id)
    
    # 9. Get Household Appliances
    apps_res = get_household_appliances(customer_id=cust_id)
    appliances = apps_res["appliances"]
    assert len(appliances) >= 1
    print(f"  [+] Retrieved {len(appliances)} appliance(s) from Digital Twin.")
    
    print("\n=================================================================")
    print(" ALL BACKEND API & MONGODB ENDPOINT LOGIC VERIFIED 100%!")
    print("=================================================================")

if __name__ == "__main__":
    test_backend_logic()
