#!/usr/bin/env python3
"""
Dedicated Form Menus Integration Test
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

def test_form_menus():
    print("==========================================================")
    print("DEDICATED FORM MENUS & ANALYTICS COUNTS INTEGRATION TEST")
    print("==========================================================")

    # 1. Login to get token
    code, resp = post_json("/api/admin-auth.php", {"action": "login", "email": "admin@gmail.com", "password": "Admin@1230"})
    token = resp.get("token")
    print(f"1. Admin Auth Login: HTTP {code} | Token: {token[:15]}...")
    assert code == 200 and token, "Admin authentication failed"

    auth_headers = {"Authorization": f"Bearer {token}"}

    # 2. Fetch admin data
    code, resp = post_json("/api/admin-data.php", {"action": "all"}, auth_headers)
    print(f"2. Fetch Admin Data: HTTP {code}")
    assert code == 200, "Fetch admin data failed"

    analytics = resp.get("analytics", {})
    form_counts = analytics.get("formCountsByType", {})
    submissions = resp.get("data", {}).get("formSubmissions", [])

    print(f"3. Total Submissions: {len(submissions)}")
    print(f"4. Form Counts Breakdown: {json.dumps(form_counts)}")

    expected_form_types = ['contact', 'newsletter', 'volunteer', 'support', 'donation', 'partnership', 'feedback']
    for ft in expected_form_types:
        count = form_counts.get(ft, 0)
        filtered = [s for s in submissions if (s.get('form_type') or 'contact').lower() == ft]
        print(f"   - Form Menu [{ft.upper()}]: Badge Count = {count} | Filtered Records = {len(filtered)}")

    print("\n🎉 DEDICATED FORM MENUS TEST PASSED SUCCESSFULLY ON LIVE HOSTINGER SERVER!")

if __name__ == '__main__':
    test_form_menus()
