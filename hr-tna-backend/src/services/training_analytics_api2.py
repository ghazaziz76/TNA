import requests
import os
import json
import pdfplumber
import re
import random
import string
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from sentence_transformers import SentenceTransformer, util

# ✅ Initialize FastAPI app
app = FastAPI()
ORG_FILE = "organizations.json"

# Sector/Industry cleanup
def clean_text(text):
    """Remove special characters, keeping only letters, numbers, spaces, and dashes."""
    return re.sub(r"[^a-zA-Z0-9\s\-]", "", text)

@app.post("/organization/")
async def add_organization(data: dict):
    """Sanitize and save organization data."""
    try:
        # Sanitize all text-based fields in the request
        if "name" in data:
            data["name"] = clean_text(data["name"])

        if "industry" in data:
            data["industry"] = clean_text(data["industry"])

        # Save sanitized data to `organizations.json`
        with open(ORG_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=4)

        return {"message": "Organization data saved successfully!", "data": data}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ✅ Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all domains for now
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods
    allow_headers=["*"],  # Allow all headers
)

# ✅ Load SBERT Model for AI-powered Training Recommendations
model = SentenceTransformer('all-MiniLM-L6-v2')

# ✅ Organization Model
class Organization(BaseModel):
    name: str
    companyRegistrationNumber: str
    industry: str
    customIndustry: Optional[str] = None  # ✅ Added to store "Other" industry
    vision: Optional[str] = None
    mission: Optional[str] = None
    objectives: Optional[List[str]] = None
    client_charter: Optional[str] = None

# ✅ Persistent Storage (Only One Company)
ORG_FILE = "organizations.json"

def generate_short_id():
    """Generate a random 11-character alphanumeric ID."""
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=11))

def load_organization():
    """Load the organization data from JSON file."""
    if os.path.exists(ORG_FILE):
        try:
            with open(ORG_FILE, "r", encoding="utf-8") as file:
                data = json.load(file)
                if isinstance(data, dict):  # Ensure valid structure
                    return data
                return None  # Invalid data format
        except (json.JSONDecodeError, FileNotFoundError):
            return None
    return None

def save_organization(org_data):
    """Save the organization data to JSON file."""
    with open(ORG_FILE, "w", encoding="utf-8") as file:
        json.dump(org_data, file, indent=4)

# ✅ API to Add Organization
@app.post("/organization/")
def add_organization(org: Organization):
    existing_org = load_organization()

    if existing_org:
        return {"error": "Organization already exists. Contact support to modify details."}

    # ✅ Generate Unique ID
    org_id = generate_short_id()

    # ✅ Store organization
    org_dict = {
        "organizationID": org_id,
        "name": org.name,
        "companyRegistrationNumber": org.companyRegistrationNumber,
        "industry": org.industry,
        "customIndustry": org.customIndustry,  # ✅ Save custom industry if provided
        "vision": org.vision,
        "mission": org.mission,
        "objectives": org.objectives or [],
        "client_charter": org.client_charter,
    }

    save_organization(org_dict)

    return {"message": "Organization added successfully", "organizationID": org_id}

# ✅ API to Get Organization Details
@app.get("/organization/")
def get_organization():
    org_data = load_organization()
    if not org_data:
        return {"error": "No organization found. Please add one first."}
    return org_data

# ✅ AI-Powered Training Recommendations
def generate_training_recommendations(org):
    wef_skills = ["AI & Big Data", "Cybersecurity", "Cloud Computing", "Analytical Thinking"]  # Placeholder

    objectives = org.get("objectives", [])
    if not objectives:
        return {"error": "No objectives provided"}

    # ✅ Encode objectives & skills
    objective_embeddings = model.encode(objectives, convert_to_tensor=True)
    skill_embeddings = model.encode(wef_skills, convert_to_tensor=True)

    # ✅ Compute cosine similarity
    similarity_scores = util.pytorch_cos_sim(objective_embeddings, skill_embeddings)

    # ✅ Get top 5 matching skills for each objective
    recommended_skills = set()
    for i in range(len(objectives)):
        if i >= similarity_scores.shape[0]:  
            continue  # Skip if index out of bounds

        top_matches = similarity_scores[i].argsort(descending=True)[:5].tolist()
        for idx in top_matches:
            recommended_skills.add(wef_skills[idx])

    return list(recommended_skills) if recommended_skills else ["No relevant skills found"]

@app.get("/generate_training_recommendations/")
def generate_training_recommendations_for_org():
    org = load_organization()
    if not org:
        return {"error": "No organization found. Please add one first."}

    recommendations = generate_training_recommendations(org)
    return {"training_recommendations": recommendations}

@app.get("/industries/")
def get_industries():
    sectors = {
        "Primary Sector (Raw Materials)": [
            "Agriculture",
            "Fisheries & Aquaculture",
            "Forestry & Logging",
            "Mining & Quarrying",
            "Oil & Gas",
        ],
        "Secondary Sector (Manufacturing & Construction)": [
            "Automotive & Transportation Equipment",
            "Chemical Manufacturing",
            "Construction",
            "Electronics & Electrical Manufacturing",
            "Food & Beverage Processing",
            "Metal & Machinery",
            "Pharmaceuticals & Biotech Manufacturing",
            "Textile & Apparel Manufacturing",
        ],
        "Tertiary Sector (Services & Retail)": [
            "Banking & Finance",
            "E-commerce & Retail",
            "Education",
            "Entertainment & Media",
            "Healthcare & Pharmaceuticals",
            "Hospitality & Tourism",
            "Insurance",
            "Logistics & Supply Chain",
            "Professional & Business Services",
            "Real Estate & Property Management",
            "Telecommunications",
            "Wholesale & Distribution",
        ],
        "Quaternary Sector (Knowledge & Information)": [
            "Artificial Intelligence & Big Data",
            "Biotechnology & Life Sciences",
            "Cybersecurity",
            "Information Technology & Software Development",
            "Research & Development",
            "Space & Aerospace Technology",
        ],
        "Quinary Sector (Government & Non-Profit)": [
            "Defense & Public Safety",
            "Environmental & Waste Management",
            "Government & Public Administration",
            "Non-Profit Organizations",
            "Social Services",
        ]
    }
    
    return {"sectors": sectors}
