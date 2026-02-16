import requests

def test_login_api():
    url = "http://localhost:8000/auth/login-tenant"
    payload = {
        "email": "admin@agencia-growth.com",
        "password": "Admin@123",
        "tenant_slug": "agencia-growth"
    }
    try:
        response = requests.post(url, json=payload)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_login_api()
