import json
import os

ORG_FILE = r"E:\Temp\organizations.json"

test_data = [{"name": "Manual Test", "sector": "Technology"}]

# Ensure directory exists
dir_path = os.path.dirname(ORG_FILE)
if not os.path.exists(dir_path):
    os.makedirs(dir_path, exist_ok=True)

# Write data to the file
with open(ORG_FILE, "w", encoding="utf-8") as f:
    json.dump(test_data, f, indent=4)
    f.flush()
    os.fsync(f.fileno())  # Force save to disk

print("✅ Manual write completed. Check the file.")
