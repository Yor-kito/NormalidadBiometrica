from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import Optional
import data_processing
import os

app = FastAPI(title="Biometric Normality Analysis API")

# Configure CORS (still useful for dev, though in prod it's same origin)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class PatientData(BaseModel):
    wtw: float
    acd: float
    al: Optional[float] = None
    source: str = "Topo" 

@app.get("/api/normality-stats")
def get_normality_stats():
    # Renamed to /api/ to distinguish from frontend routes cleanly if needed
    # But for backward compat with my frontend code which looks for /normality-stats
    # I will keep the original route or add an alias. 
    # Let's keep original route for simplicity with the React code I already wrote.
    try:
        stats = data_processing.get_stats()
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Alias for cleanliness if we wanted to change frontend later
@app.get("/normality-stats")
def get_normality_stats_alias():
    return get_normality_stats()

@app.post("/analyze")
def analyze_patient(data: PatientData):
    try:
        stats = data_processing.get_stats()
        suffix = "_Topo" if data.source == "Topo" else "_Bio"
        wtw_key = f"WTW{suffix}"
        acd_key = f"ACD{suffix}"
        ratio_key = f"Ratio{suffix}"
        
        results = {}
        
        def process_metric(name, key, value):
            if key in stats and value is not None:
                mean = stats[key]["mean"]
                std = stats[key]["std"]
                z = data_processing.calculate_z_score(value, mean, std)
                percentile = data_processing.get_percentile(z)
                is_normal = abs(z) <= 2 
                results[name] = {
                    "value": value,
                    "mean": mean,
                    "std": std,
                    "z_score": z,
                    "percentile": percentile,
                    "is_normal": is_normal
                }

        process_metric("WTW", wtw_key, data.wtw)
        process_metric("ACD", acd_key, data.acd)
        if data.al:
            process_metric("AL", "AL", data.al)
        if data.wtw and data.acd and data.acd != 0:
            ratio_val = data.wtw / data.acd
            process_metric("WTW/ACD Ratio", ratio_key, ratio_val)
            
        return results

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- Static Files Serving for Frontend ---
# This serves the React build. 
# We expect the 'frontend_dist' directory to be in the same folder as main.py (working dir)
# or relative to it. In Docker, we will place it in /code/frontend_dist

frontend_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "frontend_dist")

# Check if dist folder exists (it might not during local python-only dev)
if os.path.exists(frontend_path):
    # Mount assets
    app.mount("/assets", StaticFiles(directory=os.path.join(frontend_path, "assets")), name="assets")
    
    # Catch-all to serve index.html for any other route (React Router)
    @app.get("/{full_path:path}")
    async def serve_app(full_path: str):
        # Allow API routes to pass through (FastAPI matches them first usually, but specific overrides help)
        if full_path.startswith("api/") or full_path == "normality-stats" or full_path == "analyze":
             # This block shouldn't technically be reached if routes are defined above, 
             # but catch-all is greedy.
             pass 

        # Check for specific files (favicon, etc)
        file_path = os.path.join(frontend_path, full_path)
        if os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
            
        # Fallback to index.html
        return FileResponse(os.path.join(frontend_path, "index.html"))
else:
    print("Warning: Frontend build not found. Running in API-only mode.")
