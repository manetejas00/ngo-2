#!/usr/bin/env python3
"""
Full Live Test Suite for Admin Panel & Filters
Target: https://test.avinyacarefoundation.org
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

def get_json(endpoint, headers_extra=None):
    url = f"{TARGET_HOST}{endpoint}"
    headers = {}
    if headers_extra:
        headers.update(headers_extra)
    req = urllib.request.Request(url, headers=headers, method='GET')
    try:
        with urllib.request.urlopen(req, timeout=15) as response:
            return response.getcode(), json.loads(response.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode('utf-8'))
    except Exception as e:
        return 0, {"error": str(e)}

def main():
    print("==========================================================")
    print("LIVE COMPREHENSIVE ADMIN PANEL & DATABASE SUITE TEST")
    print("==========================================================\n")

    # 1. Test Login with admin@gmail.com
    print("1. Testing Admin Authentication (admin@gmail.com)...")
    code, res1 = post_json('/api/admin-auth.php', {
        'action': 'login',
        'email': 'admin@gmail.com',
        'password': 'Admin@1230'
    })
    print(f"   HTTP Status: {code} | Message: {res1.get('message')}")
    token = res1.get('token')
    assert code == 200 and token, "Primary admin login failed!"

    # 2. Test Login with admin@gamil.com (Typo variant support)
    print("2. Testing Admin Authentication (admin@gamil.com)...")
    code2, res2 = post_json('/api/admin-auth.php', {
        'action': 'login',
        'email': 'admin@gamil.com',
        'password': 'Admin@1230'
    })
    print(f"   HTTP Status: {code2} | Message: {res2.get('message')}\n")
    assert code2 == 200, "Secondary email login failed!"

    # 3. Test Session Verification
    print("3. Verifying Admin Session Token...")
    code3, res3 = get_json(f'/api/admin-auth.php?action=verify&token={token}')
    print(f"   HTTP Status: {code3} | Authenticated: {res3.get('authenticated')}\n")
    assert code3 == 200 and res3.get('authenticated'), "Session verification failed!"

    # 4. Fetch Full Admin Data & Analytics
    print("4. Fetching Live Hostinger MySQL Analytics & Data Tables...")
    code4, res4 = post_json('/api/admin-data.php', {'action': 'all'}, {'Authorization': f'Bearer {token}'})
    print(f"   HTTP Status: {code4}")
    analytics = res4.get('analytics', {})
    data = res4.get('data', {})
    print(f"   📊 Form Submissions Count: {analytics.get('totalFormSubmissions')}")
    print(f"   💰 Total Donations Raised: ₹{analytics.get('totalDonationsAmount')}")
    print(f"   🩺 Doctor Appointments Count: {analytics.get('totalDoctorBookings')}")
    print(f"   🧪 Diagnostic Packages Count: {analytics.get('totalDiagnosticBookings')}")
    print(f"   📧 Email Audit Logs Count: {analytics.get('totalEmailLogs')}\n")
    assert code4 == 200 and data.get('formSubmissions') is not None, "Data fetch failed!"

    # 5. Test Doctor Booking Status Update
    doctor_bookings = data.get('doctorBookings', [])
    if doctor_bookings:
        first_doc = doctor_bookings[0]
        doc_id = first_doc.get('booking_id') or first_doc.get('id')
        print(f"5. Testing Status Update on Doctor Booking ID: {doc_id}...")
        code5, res5 = post_json('/api/admin-data.php', {
            'action': 'update_status',
            'type': 'doctor',
            'id': doc_id,
            'status': 'confirmed'
        }, {'Authorization': f'Bearer {token}'})
        print(f"   HTTP Status: {code5} | Response: {res5.get('message')}\n")
        assert code5 == 200, "Doctor booking status update failed!"

    print("==========================================================")
    print("✅ ALL LIVE ADMIN PANEL & HOSTINGER MYSQL TESTS PASSED!")
    print("==========================================================")

if __name__ == '__main__':
    main()
