import requests
import json

url = 'https://crm-saas-t6x2.vercel.app/tenant/finances'
headers = {
    'sec-ch-ua-platform': '"Windows"',
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbkBhZ2VuY2lhLWdyb3d0aC5jb20iLCJyb2xlX2xvY2FsIjoiYWRtaW4iLCJ0ZW5hbnRfc2x1ZyI6ImFnZW5jaWEtZ3Jvd3RoIiwidGVuYW50X2lkIjoiYTg1MDkwMDItNjA5My00ZTEyLTljN2MtZjlhOGI3ODhjZDFjIiwiZXhwIjoxNzczODQ3MzE4fQ.pIVacHAzm0RHQNKzZU-_B4k4eqPOlVgfq_jwRLkE-3o',
    'Referer': 'https://crm-aster.vercel.app/',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0',
    'Accept': 'application/json, text/plain, */*',
    'sec-ch-ua': '"Not:A-Brand";v="99", "Microsoft Edge";v="145", "Chromium";v="145"',
    'sec-ch-ua-mobile': '?0'
}

try:
    r = requests.get(url, headers=headers)
    print(f"Status Code: {r.status_code}")
    if r.status_code == 500:
        data = r.json()
        error_msg = data.get("error", "").lower()
        print(f"ERROR: {error_msg}")
        for col in ["supplier_id", "appointment_id", "subscription_id", "service_id"]:
            if col in error_msg:
                print(f"FOUND_IN_ERROR: {col}")
    else:
        print("SUCCESS")
except Exception as e:
    print(f"Request failed: {e}")
