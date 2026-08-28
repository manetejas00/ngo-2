#!/usr/bin/env python3
"""
Test All Admin Panel Tabs for Data Presence vs Badge Counts
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

def test_all_tabs_data():
    print("==========================================================")
    print("VERIFYING DATA PRESENCE VS BADGE COUNTS ON LIVE SERVER")
    print("==========================================================")

    code, resp = post_json("/api/admin-auth.php", {"action": "login", "email": "admin@gmail.com", "password": "Admin@1230"})
    token = resp.get("token")
    assert code == 200 and token, "Admin authentication failed"

    auth_headers = {"Authorization": f"Bearer {token}"}
    code, resp = post_json("/api/admin-data.php", {"action": "all"}, auth_headers)
    assert code == 200, "Fetch admin data failed"

    data = resp.get("data", {})
    analytics = resp.get("analytics", {})

    print(f"📊 Analytics Summary: {json.dumps(analytics, indent=2)}\n")

    tab_checks = [
        ("Doctor Bookings", len(data.get("doctorBookings", [])), analytics.get("totalDoctorBookings", 0)),
        ("Diagnostic Bookings", len(data.get("diagnosticBookings", [])), analytics.get("totalDiagnosticBookings", 0)),
        ("Doctors Catalog", len(data.get("doctorsCatalog", [])), analytics.get("totalDoctors", 0)),
        ("Diagnostic Tests Catalog", len(data.get("diagnosticTestsCatalog", [])), analytics.get("totalDiagnosticTests", 0)),
        ("User Accounts Catalog", len(data.get("usersCatalog", [])), analytics.get("totalUsers", 0)),
        ("All Form Submissions", len(data.get("formSubmissions", [])), analytics.get("totalFormSubmissions", 0)),
        ("Email Logs", len(data.get("emailLogs", [])), analytics.get("totalEmailLogs", 0)),
        ("Activity Logs", len(data.get("activityLogs", [])), analytics.get("totalActivityLogs", 0)),
    ]

    for label, count, expected in tab_checks:
        print(f"✅ {label}: Data Array Length = {count} | Badge/Analytics Count = {expected}")
        assert count > 0, f"Expected non-empty data array for {label}"
        assert count == expected, f"Data count mismatch for {label}"

    print("\n🎉 ALL LIVE ADMIN TABS CONTAIN VALID MATCHING DATA & NO ZERO-DATA BUG EXISTS!")

if __name__ == '__main__':
    test_all_tabs_data()
