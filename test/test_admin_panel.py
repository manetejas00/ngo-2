#!/usr/bin/env python3
"""
Admin Panel Dashboard Integration & Auth Test Suite
Target: https://test.avinyacarefoundation.org
Credentials: admin@gmail.com / Admin@1230
"""

import json
import urllib.request
import urllib.error

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

def run_admin_tests():
    print("====================================================")
    print("AVINYA CARE ADMIN PANEL & AUTHENTICATION TEST SUITE")
    print("====================================================\n")

    # 1. Test Valid Admin Login (admin@gmail.com / Admin@1230)
    print("1. Testing Admin Login (admin@gmail.com / Admin@1230)...")
    status, res = post_json('/api/admin-auth.php', {
        'action': 'login',
        'email': 'admin@gmail.com',
        'password': 'Admin@1230'
    })
    print(f"   HTTP Status: {status}")
    print(f"   Response: {json.dumps(res, indent=2)}\n")
    assert status == 200 and res.get('status') == 'ok', "Admin login failed!"
    token = res.get('token')

    # 2. Test Invalid Admin Login
    print("2. Testing Invalid Password Rejection...")
    inv_status, inv_res = post_json('/api/admin-auth.php', {
        'action': 'login',
        'email': 'admin@gmail.com',
        'password': 'WrongPassword123'
    })
    print(f"   HTTP Status: {inv_status} (Expected 401)")
    print(f"   Response: {json.dumps(inv_res, indent=2)}\n")
    assert inv_status == 401, "Invalid password was not rejected!"

    # 3. Test Protected Admin Data Endpoint
    print("3. Fetching Admin Dashboard Data & Analytics...")
    data_status, data_res = post_json('/api/admin-data.php', {'action': 'all'}, {'Authorization': f'Bearer {token}'})
    print(f"   HTTP Status: {data_status}")
    print(f"   Analytics Summary: {json.dumps(data_res.get('analytics', {}), indent=2)}")
    print(f"   Submissions Count: {len(data_res.get('data', {}).get('formSubmissions', []))}")
    print(f"   Doctor Bookings Count: {len(data_res.get('data', {}).get('doctorBookings', []))}")
    print(f"   Diagnostic Bookings Count: {len(data_res.get('data', {}).get('diagnosticBookings', []))}\n")
    assert data_status == 200 and data_res.get('status') == 'ok', "Fetching admin data failed!"

    print("====================================================")
    print("🎉 ALL ADMIN PANEL AUTHENTICATION & DATA TESTS PASSED!")
    print("====================================================")

if __name__ == '__main__':
    run_admin_tests()
