import requests
import json

BASE_URL = "http://localhost:8000"

def run_test():
    print("1. Checking Root...")
    try:
        r = requests.get(f"{BASE_URL}/")
        print(f"Root Status: {r.status_code}")
    except Exception as e:
        print(f"Server unreachable: {e}")
        return

    print("\n2. Login Master...")
    try:
        r = requests.post(f"{BASE_URL}/auth/login-master", json={
            "email": "master@seucrm.com",
            "password": "Teste@123"
        })
        print(f"Login Status: {r.status_code}")
        if r.status_code != 200:
            print(r.text)
            return
        
        token = r.json()["access_token"]
        print("Master Token obtained.")
    except Exception as e:
        print(f"Login failed: {e}")
        return

    print("\n3. Select Tenant 'nutri-fernanda'...")
    try:
        headers = {"Authorization": f"Bearer {token}"}
        r = requests.post(f"{BASE_URL}/auth/select-tenant", json={
            "tenant_slug": "nutri-fernanda"
        }, headers=headers)
        print(f"Select Tenant Status: {r.status_code}")
        if r.status_code != 200:
            print(r.text)
            # Try with 'barb-tadeus' if nutri fails, or list environments first?
            # Assuming nutri-fernanda exists from previous context
        else:
            token = r.json()["access_token"]
            print("Tenant Token obtained.")
    except Exception as e:
        print(f"Select Tenant failed: {e}")

    print("\n4. Get Admin Stats...")
    try:
        headers = {"Authorization": f"Bearer {token}"}
        r = requests.get(f"{BASE_URL}/tenant/admin-stats", headers=headers)
        print(f"Stats Status: {r.status_code}")
        print(r.text)
    except Exception as e:
        print(f"Get Stats failed: {e}")

if __name__ == "__main__":
    run_test()
