#!/usr/bin/env python3
"""
Avinya Care Foundation - Security & RBAC Audit Test Suite (Python)
"""

import sys
import json
import urllib.request
import urllib.error

BASE_URL = "http://localhost:3000"

def make_request(path, method="GET", headers=None, data=None):
    url = BASE_URL + path
    req_headers = headers or {}
    encoded_data = None
    if data:
        if isinstance(data, dict):
            encoded_data = json.dumps(data).encode('utf-8')
            if 'Content-Type' not in req_headers:
                req_headers['Content-Type'] = 'application/json'
        elif isinstance(data, str):
            encoded_data = data.encode('utf-8')

    req = urllib.request.Request(url, data=encoded_data, headers=req_headers, method=method)
    try:
        with urllib.request.urlopen(req) as response:
            resp_body = response.read().decode('utf-8')
            json_body = None
            try:
                json_body = json.loads(resp_body)
            except Exception:
                pass
            return response.status, dict(response.headers), json_body, resp_body
    except urllib.error.HTTPError as e:
        resp_body = e.read().decode('utf-8')
        json_body = None
        try:
            json_body = json.loads(resp_body)
        except Exception:
            pass
        return e.code, dict(e.headers), json_body, resp_body
    except Exception as e:
        return 0, {}, None, str(e)

def run_tests():
    print("====================================================")
    print("  AVINYA CARE SECURITY & PRIVACY AUDIT TEST SUITE   ")
    print("====================================================\n")

    passed = 0
    failed = 0

    # Test 1: Diagnostic Booking Unauthenticated GET Leak Protection
    status, headers, body, raw = make_request("/api/diagnostic-booking.php")
    if status in (401, 403):
        print(f"✓ TEST 1 PASSED: Public GET /api/diagnostic-booking.php correctly rejected with HTTP {status}.")
        passed += 1
    else:
        print(f"✗ TEST 1 FAILED: Expected 401 or 403, got {status}")
        failed += 1

    # Test 2: Doctor Appointment Unauthenticated GET List Leak Protection
    status, headers, body, raw = make_request("/api/booking/index.php?action=list")
    if status in (401, 403):
        print(f"✓ TEST 2 PASSED: Public GET /api/booking/index.php?action=list correctly rejected with HTTP {status}.")
        passed += 1
    else:
        print(f"✗ TEST 2 FAILED: Expected 401 or 403, got {status}")
        failed += 1

    # Test 3: Account Enumeration Prevention on Forgot Password
    status, headers, body, raw = make_request("/api/admin-auth.php?action=forgot_password", method="POST", data={"email": "nonexistent.user.98765@gmail.com"})
    if status == 200 and body and "If an account exists" in body.get("message", ""):
        print("✓ TEST 3 PASSED: Account enumeration prevented (generic response returned).")
        passed += 1
    else:
        print(f"✗ TEST 3 FAILED: Expected generic 200 response, got status {status}, body: {body}")
        failed += 1

    # Test 4: Unauthenticated Admin Action Escalation Rejection
    status, headers, body, raw = make_request("/api/admin-data.php", method="POST", data={"action": "delete_user", "id": "usr-admin-01"})
    if status == 401:
        print("✓ TEST 4 PASSED: Unauthenticated admin manipulation rejected with 401 Unauthorized.")
        passed += 1
    else:
        print(f"✗ TEST 4 FAILED: Expected 401, got {status}")
        failed += 1

    # Test 5: Security Health Headers Check
    status, headers, body, raw = make_request("/api/security-health.php")
    has_nosniff = headers.get("X-Content-Type-Options") == "nosniff" or headers.get("x-content-type-options") == "nosniff"
    has_frame = headers.get("X-Frame-Options") == "SAMEORIGIN" or headers.get("x-frame-options") == "SAMEORIGIN"
    if status == 200 and has_nosniff and has_frame:
        print("✓ TEST 5 PASSED: Security health endpoint active with required headers.")
        passed += 1
    else:
        print(f"✗ TEST 5 FAILED: Security health check failed. Status: {status}, Headers: {headers}")
        failed += 1

    print("\n====================================================")
    print(f"  RESULTS: {passed} PASSED, {failed} FAILED")
    print("====================================================")

    if failed > 0:
        sys.exit(1)

if __name__ == "__main__":
    run_tests()
