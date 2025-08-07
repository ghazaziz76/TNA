from pytrends.request import TrendReq
import urllib3

# Disable SSL Warnings
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

def fetch_google_trends(keyword):
    print("🔄 Initializing Pytrends...")

    # Set retries and timeout
    pytrends = TrendReq(hl="en-US", tz=360, timeout=(10, 25), retries=3, backoff_factor=2, requests_args={"verify": False})

    print(f"📡 Fetching trends for '{keyword}'...")
    
    try:
        # **Use Interest Over Time Instead**
        pytrends.build_payload([keyword], cat=0, timeframe="now 7-d", geo="", gprop="")
        trends_data = pytrends.interest_over_time()  # ✅ Fetch Interest Over Time

        # 🚨 Print Everything for Debugging
        print(f"📊 Full Google Trends Data for '{keyword}':\n{trends_data}")

        # ✅ If no data is returned, print a message
        if trends_data.empty:
            print("⚠️ No data returned for this keyword. Google might be blocking requests.")
            return []

        return trends_data.to_dict()  # Convert DataFrame to JSON Format

    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return []

# Test with different terms
fetch_google_trends("Technology")
fetch_google_trends("AI")
fetch_google_trends("Cybersecurity")





