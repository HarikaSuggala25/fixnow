"""
FixNow Backend Launcher
Production-ready launcher for Render, Cloud & Local environments.
Automatically detects $PORT and starts Uvicorn with FastAPI.
"""
import os
import sys
import traceback

if __name__ == "__main__":
    try:
        import uvicorn
        port = int(os.environ.get("PORT", 8000))
        print("=================================================================")
        print(f" [*] Launching FixNow Server on 0.0.0.0:{port}")
        print(" Database: MongoDB Atlas / Resilient In-Memory Mode")
        print("=================================================================")
        uvicorn.run("backend.main:app", host="0.0.0.0", port=port, log_level="info")
    except Exception as e:
        print(f"[FATAL] Server startup failed: {e}", file=sys.stderr)
        traceback.print_exc()
        sys.exit(1)
