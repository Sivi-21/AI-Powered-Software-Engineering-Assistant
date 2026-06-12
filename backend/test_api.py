import requests

BASE_URL = "http://127.0.0.1:8000/api/v1"

def test_login_and_me():
    # 1. Login
    login_data = {
        "email": "dev@intellios.ai",
        "password": "DevPass1234!"
    }
    print("Sending login request...")
    r = requests.post(f"{BASE_URL}/auth/login", json=login_data)
    print("Login Status Code:", r.status_code)
    if r.status_code != 200:
        print("Login Response:", r.text)
        return
    
    token_data = r.json()
    token = token_data.get("access_token")
    print("Token received:", token[:30] + "...")
    
    # 2. Get Profile
    headers = {
        "Authorization": f"Bearer {token}"
    }
    print("Sending /me request with token...")
    r = requests.get(f"{BASE_URL}/auth/me", headers=headers)
    print("/me Status Code:", r.status_code)
    print("/me Response:", r.text)

if __name__ == "__main__":
    test_login_and_me()
