"""
FixNow Backend Launcher
Run this script to start the FastAPI + MongoDB backend service on port 8000.
"""
import sys
import uvicorn

if __name__ == "__main__":
    print("=================================================================")
    print(" [*] Launching FixNow FastAPI + MongoDB Backend Microservice")
    print(" Database: MongoDB Atlas / Local MongoDB (port 27017)")
    print(" API Base URL: http://localhost:8000")
    print(" Interactive Swagger Docs: http://localhost:8000/docs")
    print("=================================================================\n")
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
