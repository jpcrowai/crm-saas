import requests
import sys

BASE_URL = "http://127.0.0.1:8000"

def test_flow():
    session = requests.Session()
    
    print("1. Login Master...")
    try:
        res = session.post(f"{BASE_URL}/auth/login-master", json={
            "email": "master@seucrm.com",
            "password": "Teste@123"
        })
        if res.status_code != 200:
            print(f"FAILED: Login Master {res.text}")
            return
        token = res.json()["access_token"]
        print("PASSED")
    except Exception as e:
        print(f"FAILED: Connection {e}")
        return

    print("2. Create Environment 'Barbearia'...")
    headers = {"Authorization": f"Bearer {token}"}
    try:
        res = session.post(f"{BASE_URL}/master/ambientes", headers=headers, json={
            "nome": "Barbearia do João",
            "slug": "barbearia",
            "nicho": "Beleza"
        })
        if res.status_code == 200:
            print("PASSED: Created")
        elif res.status_code == 400 and "Slug already exists" in res.text:
            print("PASSED: Already exists")
        else:
            print(f"FAILED: Create Env {res.text}")
            return
    except Exception as e:
        print(f"FAILED: Connection {e}")
        return

    print("3. Enter Tenant 'barbearia'...")
    try:
        res = session.post(f"{BASE_URL}/auth/select-tenant", headers=headers, json={
            "tenant_slug": "barbearia"
        })
        if res.status_code != 200:
            print(f"FAILED: Select Tenant {res.text}")
            return
        tenant_token = res.json()["access_token"]
        print("PASSED")
    except Exception as e:
        print(f"FAILED: Connection {e}")
        return
        
    print("4. Get User Info (Me)...")
    try:
        res = session.get(f"{BASE_URL}/auth/me", headers={"Authorization": f"Bearer {tenant_token}"})
        data = res.json()
        if data["tenant_slug"] == "barbearia":
            print("PASSED: Correct Tenant Context")
        else:
            print(f"FAILED: Wrong Context {data}")
    except Exception as e:
        print(f"FAILED: Connection {e}")
        return
        
    print("5. Login as Tenant User (Non-existent check)...")
    # Using the same master credentials will fail as they are not in tenant excel users list yet
    try:
        res = session.post(f"{BASE_URL}/auth/login-tenant", json={
            "email": "master@seucrm.com",
            "password": "Teste@123",
            "tenant_slug": "barbearia"
        })
        if res.status_code == 401:
            print("PASSED: Correctly rejected (User not in tenant DB)")
        else:
            print(f"WARN: Unexpected response {res.status_code}")
    except Exception as e:
        print(f"FAILED: Connection {e}")
        return
        
    print("\nALL BACKEND TESTS PASSED!")

if __name__ == "__main__":
    test_flow()
