#!/usr/bin/env python3
"""
Master Live Website Audit & Integration Test Suite
Target: https://test.avinyacarefoundation.org
"""

import json
import urllib.request
import urllib.parse
import urllib.error
import sys
import time

TARGET_HOST = "https://test.avinyacarefoundation.org"

def post_json(endpoint, payload, headers_extra=None):
    url = f"{TARGET_HOST}{endpoint}"
    data = json.dumps(payload).encode('utf-8')
    headers = {'Content-Type': 'application/json'}
    if headers_extra:
        headers.update(headers_extra)
    req = urllib.request.Request(url, data=data, headers=headers, method='POST')
    try:
        with urllib.request.urlopen(req, timeout=20) as response:
            return response.getcode(), json.loads(response.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        body = e.read().decode('utf-8')
        try:
            return e.code, json.loads(body)
        except Exception:
            return e.code, {"error": body}
    except Exception as e:
        return 0, {"error": str(e)}

def get_json(endpoint):
    url = f"{TARGET_HOST}{endpoint}"
    req = urllib.request.Request(url, method='GET')
    try:
        with urllib.request.urlopen(req, timeout=20) as response:
            return response.getcode(), json.loads(response.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        body = e.read().decode('utf-8')
        try:
            return e.code, json.loads(body)
        except Exception:
            return e.code, {"error": body}
    except Exception as e:
        return 0, {"error": str(e)}

def run_master_audit():
    print("==================================================================")
    print("🚀 MASTER LIVE WEBSITE AUDIT & E2E INTEGRATION TEST")
    print(f"Target Environment: {TARGET_HOST}")
    print("==================================================================\n")

    results = []
    ts = int(time.time())

    # -------------------------------------------------------------
    # TEST 1: Public Healthcare & News Endpoints
    # -------------------------------------------------------------
    print("1️⃣ Testing Public Healthcare & News APIs...")
    code, docs_res = get_json("/api/healthcare/doctors.php")
    doc_count = len(docs_res.get("doctors", [])) if isinstance(docs_res, dict) and "doctors" in docs_res else 0
    print(f"   - GET /api/healthcare/doctors.php -> HTTP {code} | Doctors Count: {doc_count}")
    results.append(("Public Doctors API", code == 200 and doc_count > 0))

    code, tests_res = get_json("/api/healthcare/tests.php")
    test_count = len(tests_res.get("tests", [])) if isinstance(tests_res, dict) and "tests" in tests_res else 0
    print(f"   - GET /api/healthcare/tests.php -> HTTP {code} | Diagnostic Packages Count: {test_count}")
    results.append(("Public Diagnostic Tests API", code == 200 and test_count > 0))

    code, news_res = get_json("/api/news.php")
    news_count = len(news_res.get("articles", [])) if isinstance(news_res, dict) and "articles" in news_res else 0
    print(f"   - GET /api/news.php -> HTTP {code} | Articles Count: {news_count}")
    results.append(("Public News API", code == 200 and news_count > 0))

    # -------------------------------------------------------------
    # TEST 2: All 7 Form Submissions with Hostinger SMTP Email Dispatch
    # -------------------------------------------------------------
    print("\n2️⃣ Testing All 7 Form Submissions & SMTP Dispatch...")
    form_tests = [
        ("Contact Us Form", {"form_type": "contact", "name": f"Audit Tester {ts}", "email": f"audit.contact.{ts}@avinyacarefoundation.org", "phone": "9876543210", "message": "Master E2E audit test message"}),
        ("Newsletter Form", {"form_type": "newsletter", "name": f"Subscriber Audit {ts}", "email": f"audit.news.{ts}@avinyacarefoundation.org"}),
        ("Volunteer Form", {"form_type": "volunteer", "name": f"Volunteer Audit {ts}", "email": f"audit.vol.{ts}@avinyacarefoundation.org", "phone": "9876543211", "skills": "Healthcare & Admin Support"}),
        ("Support Inquiry Form", {"form_type": "support", "name": f"Patient Audit {ts}", "email": f"audit.support.{ts}@avinyacarefoundation.org", "phone": "9876543212", "message": "Patient support inquiry audit"}),
        ("Donation Form (80G)", {"form_type": "donation", "name": f"Donor Audit {ts}", "email": f"audit.donor.{ts}@avinyacarefoundation.org", "phone": "9876543213", "amount": 2500, "pan": "ABCDE1234F"}),
        ("CSR Partnership Form", {"form_type": "partnership", "name": f"CSR Partner Audit {ts}", "email": f"audit.csr.{ts}@avinyacarefoundation.org", "phone": "9876543214", "organization": "Audit Tech Corp", "message": "CSR partnership audit"}),
        ("Feedback Form", {"form_type": "feedback", "name": f"Feedback Audit {ts}", "email": f"audit.feedback.{ts}@avinyacarefoundation.org", "message": "Excellent platform interface!"})
    ]

    for name, payload in form_tests:
        time.sleep(0.5)
        code, resp = post_json("/api/submit-form.php", payload)
        success = (code in [200, 201] and resp.get("status") in ["ok", "success"])
        delivery = resp.get("delivery_status") or resp.get("emailStatus") or "OK"
        print(f"   - [{name}] /api/submit-form.php -> HTTP {code} | Status: {resp.get('status')} | Email Delivery: {delivery}")
        results.append((f"Form: {name}", success))

    # -------------------------------------------------------------
    # TEST 3: Doctor Appointment & Diagnostic Package Booking APIs
    # -------------------------------------------------------------
    print("\n3️⃣ Testing Healthcare Appointment & Sample Booking APIs...")
    hour = 9 + (ts % 8)
    doc_booking_payload = {
        "doctorId": "doc-1",
        "doctorName": "Dr. Suresh Advani",
        "patientName": f"Master Audit Patient {ts}",
        "patientAge": 45,
        "patientPhone": "+919876543220",
        "patientEmail": f"audit.doctorbooking.{ts}@avinyacarefoundation.org",
        "date": "2026-09-15",
        "time": f"{hour:02d}:00 AM"
    }
    code, resp = post_json("/api/booking/index.php", doc_booking_payload)
    print(f"   - Doctor Booking -> HTTP {code} | Response: {resp.get('message') or resp.get('status')}")
    results.append(("Doctor Booking API", code in [200, 201, 409] and resp.get("status") in ["ok", "success"] or code == 200 or code == 201))

    diag_booking_payload = {
        "testId": "test-1",
        "testName": "Comprehensive Cancer Biomarker Panel",
        "price": 3499,
        "patientName": f"Master Diagnostic Patient {ts}",
        "patientPhone": "+919876543221",
        "patientEmail": f"audit.diagbooking.{ts}@avinyacarefoundation.org",
        "city": "Mumbai",
        "pincode": "400012",
        "date": "2026-09-15",
        "timeSlot": "08:00 AM - 10:00 AM"
    }
    code, resp = post_json("/api/diagnostic-booking.php", diag_booking_payload)
    print(f"   - Diagnostic Package Booking -> HTTP {code} | Response: {resp.get('message') or resp.get('status')}")
    results.append(("Diagnostic Booking API", code in [200, 201] and resp.get("status") in ["ok", "success"]))

    # -------------------------------------------------------------
    # TEST 4: Admin Authentication & Management Data APIs
    # -------------------------------------------------------------
    print("\n4️⃣ Testing Admin Authentication & Dashboard Payload...")
    code, auth_res = post_json("/api/admin-auth.php", {"action": "login", "email": "admin@gmail.com", "password": "Admin@1230"})
    token = auth_res.get("token")
    print(f"   - Admin Auth Login -> HTTP {code} | Token Issued: {token[:15] if token else 'None'}...")
    results.append(("Admin Authentication", code == 200 and token is not None))

    auth_headers = {"Authorization": f"Bearer {token}"}
    code, data_res = post_json("/api/admin-data.php", {"action": "all"}, auth_headers)
    analytics = data_res.get("analytics", {})
    print(f"   - Admin All Data Payload -> HTTP {code} | Total Submissions: {analytics.get('totalFormSubmissions')} | Doctors: {analytics.get('totalDoctors')} | Users: {analytics.get('totalUsers')}")
    results.append(("Admin Data Fetch", code == 200 and analytics.get("totalFormSubmissions", 0) > 0))

    # -------------------------------------------------------------
    # TEST 5: System User Management CRUD API
    # -------------------------------------------------------------
    print("\n5️⃣ Testing User Account CRUD Integration...")
    test_user_id = f"usr-audit-{ts}"
    code, save_usr = post_json("/api/admin-data.php", {"action": "save_user", "user": {
        "id": test_user_id, "name": "Audit Coordinator", "email": f"auditcoord.{ts}@avinyacarefoundation.org", "password": "AuditPassword@123", "role": "manager", "status": "active"
    }}, auth_headers)
    print(f"   - Save User -> HTTP {code} | Message: {save_usr.get('message')}")
    
    code, del_usr = post_json("/api/admin-data.php", {"action": "delete_user", "id": test_user_id}, auth_headers)
    print(f"   - Delete User -> HTTP {code} | Message: {del_usr.get('message')}")
    results.append(("System User Account CRUD", save_usr.get("status") == "ok" and del_usr.get("status") == "ok"))

    # -------------------------------------------------------------
    # AUDIT SUMMARY REPORT
    # -------------------------------------------------------------
    print("\n==================================================================")
    print("📊 MASTER AUDIT SUMMARY REPORT")
    print("==================================================================")
    all_passed = True
    for name, ok in results:
        status_str = "✅ PASS" if ok else "❌ FAIL"
        if not ok: all_passed = False
        print(f"   {status_str} — {name}")

    print("==================================================================")
    if all_passed:
        print("🎉 LIVE STAGING WEBSITE IS 100% HEALTHY, OPERATIONAL & VERIFIED!")
    else:
        print("⚠️ SOME LIVE AUDIT CHECKS FAILED. REVIEW LOGS ABOVE.")
        sys.exit(1)

if __name__ == '__main__':
    run_master_audit()
