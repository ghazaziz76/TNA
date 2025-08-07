import requests
import pdfplumber
import os

WEF_REPORT_URL = "https://www3.weforum.org/docs/WEF_Future_of_Jobs_Report_2025.pdf"  # Update with the actual URL
REPORT_PATH = "wef_report.pdf"

def download_wef_report():
    """Downloads the WEF Future of Jobs Report."""
    response = requests.get(WEF_REPORT_URL, stream=True)
    if response.status_code == 200:
        with open(REPORT_PATH, "wb") as pdf_file:
            pdf_file.write(response.content)
        print("✅ WEF Report Downloaded Successfully")
    else:
        print("❌ Failed to Download WEF Report")

def extract_wef_data():
    """Extracts key skills and training needs from the WEF report."""
    if not os.path.exists(REPORT_PATH):
        print("❌ Report not found, downloading now...")
        download_wef_report()

    skills_data = []
    with pdfplumber.open(REPORT_PATH) as pdf:
        for page in pdf.pages:
            text = page.extract_text()
            if text:
                if "Skills Outlook" in text or "Top Skills" in text:  # Adjust keywords
                    skills_data.append(text)

    return skills_data

if __name__ == "__main__":
    download_wef_report()
    extracted_data = extract_wef_data()
    print("\n📌 Extracted Data:")
    print("\n".join(extracted_data[:3]))  # Print first 3 matches
