#!/usr/bin/env python3
"""
User Account CRUD & Seeding Integration Test
Target: https://test.avinyacarefoundation.org
"""

import json
import urllib.request
import urllib.error
import sys

TARGET_HOST = "https://test.avinyacarefoundation.org"

def post_json(endpoint, payload, headers_extra=None):
    url = f"{TARGET_HOST}{endpoint}"
    data = json.dumps(payload).encode('utf-8')
    headers = {'Content-Type': 'application/json'}
    if headers_extra:
        headers.update(headers_extra)
    req = urllib.request.Request(url, data=data, headers=headers, method='POST')
    try:
        with urllib.request.urlopen(req, timeout=15) as response:
            return response.getcode(), json.loads(response.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode('utf-8'))
    except Exception as e:
        return 0, {"error": str(e)}

def test_user_crud():
    print("==========================================================")
    print("USER ACCOUNT CRUD & SEEDING TEST ON LIVE HOSTINGER MYSQL")
    print("==========================================================")

    # 1. Login to get token
    code, resp = post_json("/api/admin-auth.php", {"action": "login", "email": "admin@gmail.com", "password": "Admin@1230"})
    token = resp.get("token")
    print(f"1. Admin Auth Login: HTTP {code} | Token: {token[:15]}...")
    assert code == 200 and token, "Admin authentication failed"

    auth_headers = {"Authorization": f"Bearer {token}"}

    # 2. Fetch all data & check seeded users
    code, resp = post_json("/api/admin-data.php", {"action": "all"}, auth_headers)
    users = resp.get("data", {}).get("usersCatalog", [])
    print(f"2. Fetch Users Catalog: HTTP {code} | Total Users: {len(users)}")
    assert code == 200, "Fetch users failed"
    assert len(users) >= 1, "Should have seeded users"

    # 3. Create User
    new_user = {
        "id": "usr-live-test-101",
        "name": "Live Test Coordinator",
        "email": "livetestcoord@avinyacarefoundation.org",
        "password": "LivePassword@2026",
        "role": "manager",
        "status": "active"
    }
    code, resp = post_json("/api/admin-data.php", {"action": "save_user", "user": new_user}, auth_headers)
    print(f"3. Create User 'usr-live-test-101': HTTP {code} | Response: {resp}")
    assert code == 200 and resp.get("status") == "ok", "Create user failed"

    # 4. Verify User Exists
    code, resp = post_json("/api/admin-data.php", {"action": "all"}, auth_headers)
    users = resp.get("data", {}).get("usersCatalog", [])
    found = any((u.get("user_id") == "usr-live-test-101" or u.get("id") == "usr-live-test-101") for u in users)
    print(f"4. Verify Created User Exists: {found}")
    assert found, "Created user was not found in catalog"

    # 5. Delete User
    code, resp = post_json("/api/admin-data.php", {"action": "delete_user", "id": "usr-live-test-101"}, auth_headers)
    print(f"5. Delete User 'usr-live-test-101': HTTP {code} | Response: {resp}")
    assert code == 200 and resp.get("status") == "ok", "Delete user failed"

    print("\n🎉 ALL USER CRUD TESTS PASSED ON LIVE HOSTINGER MYSQL ENVIRONMENT!")

if __name__ == '__main__':
    test_user_crud()
