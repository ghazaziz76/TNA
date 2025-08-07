import os
import json
import pdfplumber
import re
import random
import string
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from sentence_transformers import SentenceTransformer, util


app = FastAPI()

# Define the file path for organizations.json
ORG_FILE = r"E:\TNA\hr-tna-frontend\src\data\organizations.json"  # Ensure this is the correct path

print(f"📂 Full path to JSON file: {ORG_FILE}")  # Debugging the path

dir_path = os.path.dirname(ORG_FILE)  # Define dir_path before using it
if os.path.exists(dir_path):
    print(f"✅ Directory exists: {dir_path}")
else:
    print(f"❌ Directory does NOT exist: {dir_path}")

# Check if file exists
if os.path.exists(ORG_FILE):
    print(f"✅ File exists: {ORG_FILE}")
else:
    print(f"❌ File does NOT exist: {ORG_FILE}")
# Initialize FastAPI app

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Allow the frontend React app to connect
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods (GET, POST, etc.)
    allow_headers=["*"],  # Allow all headers
)

@app.post("/organization/")
async def add_organization(data: dict):
    print(f"📥 Received data: {data}")

    try:
        existing_data = []

        # **Check if the file exists BEFORE opening**
        if os.path.exists(ORG_FILE):
            print(f"✅ File exists before writing: {ORG_FILE}")
            try:
                with open(ORG_FILE, "r", encoding="utf-8") as f:
                    file_content = f.read().strip()
                    print(f"📂 Raw File Content Before Processing: {file_content}")
                    existing_data = json.loads(file_content) if file_content else []
            except json.JSONDecodeError as e:
                print(f"❌ JSON Decode Error: {e}")
                existing_data = []

        # **Ensure the existing data is a list before appending**
        if not isinstance(existing_data, list):
            print("⚠️ Existing data is not a list. Resetting.")
            existing_data = []

        # **Append new data**
        existing_data.append(data)
        print(f"📂 New Data to be Written: {existing_data}")

        # **Confirm exact file path before writing**
        abs_path = os.path.abspath(ORG_FILE)
        print(f"🔄 Writing to: {abs_path}")

        # **Open the file in read+write (`r+`) mode**
        with open(ORG_FILE, "r+", encoding="utf-8") as f:
            try:
                existing_data = json.load(f)  # Read existing data
                if not isinstance(existing_data, list):
                    existing_data = []
            except json.JSONDecodeError:
                existing_data = []

            existing_data.append(data)  # Append new entry
            f.seek(0)  # Move cursor to start of file
            json.dump(existing_data, f, indent=4)  # Write updated list
            f.truncate()  # Remove any leftover data from previous writes
            f.flush()
            os.fsync(f.fileno())  # Force save

        print(f"✅ Data successfully written to {abs_path}")

        # **Verify file content after writing**
        print(f"🔍 Verifying file content from: {abs_path}")
        with open(ORG_FILE, "r", encoding="utf-8") as f:
            file_contents = f.read()
            print(f"📖 File Contents After Write: {file_contents}")

        return {"message": "Organization data saved successfully!", "data": data}

    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        raise HTTPException(status_code=500, detail=f"Unexpected error: {e}")


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
