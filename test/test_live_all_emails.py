#!/usr/bin/env python3
"""
Comprehensive Live Email Integration Test Suite (Python 3)
Target Host: https://test.avinyacarefoundation.org
Target Email: manetejas00@gmail.com

Tests all 9 live form & booking endpoints to verify deliverability for both User emails and Admin emails:
1. General Contact Form
2. Newsletter Subscription
3. Volunteer Application
4. Patient Support Inquiry
5. Donation Receipt & 80G Form
6. CSR & Corporate Partnership Inquiry
7. Website Feedback Form
8. Doctor Appointment Booking (PHP Live)
9. Diagnostic Test Package Booking (PHP Live)
"""

import json
import urllib.request
import urllib.error
import time

TARGET_HOST = "https://test.avinyacarefoundation.org"
TEST_EMAIL = "manetejas00@gmail.com"

def post_json(endpoint, payload):
    url = f"{TARGET_HOST}{endpoint}"
    data = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(
        url,
        data=data,
        headers={
            'Content-Type': 'application/json; charset=UTF-8',
            'User-Agent': 'AvinyaCare-EmailTester/1.0'
        },
        method='POST'
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as response:
            status_code = response.getcode()
            body_text = response.read().decode('utf-8')
            try:
                parsed = json.loads(body_text)
                return status_code, parsed
            except Exception:
                return status_code, {"raw": body_text}
    except urllib.error.HTTPError as e:
        body_text = e.read().decode('utf-8')
        try:
            parsed = json.loads(body_text)
            return e.code, parsed
        except Exception:
            return e.code, {"error": str(e), "raw": body_text}
    except Exception as e:
        return 0, {"error": str(e)}

def run_tests():
    print("====================================================")
    print("LIVE EMAIL INTEGRATION & ADMIN EMAIL TEST SUITE")
    print(f"Target Host: {TARGET_HOST}")
    print(f"Test Email Recipient: {TEST_EMAIL}")
    print("====================================================\n")

    test_cases = [
        (
            "1. General Contact Form",
            "/api/submit-form.php",
            {
                "form_type": "contact",
                "name": "Tejas Mane Live Test",
                "email": TEST_EMAIL,
                "phone": "+91 98765 43210",
                "subject": "Live Contact Form Email Test",
                "message": "Testing contact form email deliverability to user and admin recipients."
            }
        ),
        (
            "2. Newsletter Subscription",
            "/api/submit-form.php",
            {
                "form_type": "newsletter",
                "name": "Tejas Mane Live Test",
                "email": TEST_EMAIL
            }
        ),
        (
            "3. Volunteer Application",
            "/api/submit-form.php",
            {
                "form_type": "volunteer",
                "name": "Tejas Mane Live Test",
                "email": TEST_EMAIL,
                "phone": "+91 98765 43210",
                "skills": "Medical Outreach, Cancer Awareness",
                "availability": "Weekends"
            }
        ),
        (
            "4. Patient Support Inquiry",
            "/api/submit-form.php",
            {
                "form_type": "support",
                "name": "Tejas Mane Live Test",
                "email": TEST_EMAIL,
                "phone": "+91 98765 43210",
                "assistance_type": "Financial Subsidy & Diagnostic Navigation",
                "patient_age": "35",
                "hospital": "Tata Memorial Center"
            }
        ),
        (
            "5. Donation Receipt & 80G Form",
            "/api/submit-form.php",
            {
                "form_type": "donation",
                "name": "Tejas Mane Live Test",
                "email": TEST_EMAIL,
                "phone": "+91 98765 43210",
                "amount": 2500,
                "frequency": "one-time",
                "pan": "ABCDE1234F",
                "transaction_id": f"TXN-TEST-{int(time.time())}"
            }
        ),
        (
            "6. CSR & Corporate Partnership Inquiry",
            "/api/submit-form.php",
            {
                "form_type": "partnership",
                "name": "Tejas Mane Live Test",
                "email": TEST_EMAIL,
                "phone": "+91 98765 43210",
                "organization": "Avinya Tech Solutions",
                "message": "CSR Collaboration inquiry for mobile screening bus."
            }
        ),
        (
            "7. Website Feedback Form",
            "/api/submit-form.php",
            {
                "form_type": "feedback",
                "name": "Tejas Mane Live Test",
                "email": TEST_EMAIL,
                "message": "Great platform experience and clean responsive UI!"
            }
        ),
        (
            "8. Healthcare Doctor Appointment Booking",
            "/api/booking/index.php",
            {
                "doctorId": "doc-1",
                "date": f"2026-11-{(int(time.time()) % 25) + 1:02d}",
                "time": "02:30 PM",
                "consultationType": "in-clinic",
                "patientName": "Tejas Mane Live Test",
                "patientPhone": "+91 98765 43210",
                "patientEmail": TEST_EMAIL,
                "patientAge": 29,
                "patientGender": "Male",
                "reason": "Routine Oncology Consultation",
                "notes": "Live verification test"
            }
        ),
        (
            "9. Diagnostic Test Package Booking",
            "/api/diagnostic-booking.php",
            {
                "testId": "test-1",
                "date": "2026-09-30",
                "timeSlot": "08:00 AM - 10:00 AM",
                "collectionMethod": "home_collection",
                "patientName": "Tejas Mane Live Test",
                "patientEmail": TEST_EMAIL,
                "patientPhone": "+91 98765 43210",
                "patientAge": 29,
                "patientGender": "Male",
                "homeAddress": "Flat 402, Building A",
                "pincode": "400001",
                "city": "Mumbai"
            }
        )
    ]

    results = []
    for title, endpoint, payload in test_cases:
        print(f"Executing: {title} ({endpoint})...")
        status_code, response_data = post_json(endpoint, payload)
        print(f"  HTTP Status: {status_code}")
        print(f"  Response: {json.dumps(response_data, indent=2)}\n")
        results.append((title, status_code, response_data))
        time.sleep(1) # gentle pacing between SMTP requests

    print("====================================================")
    print("FINAL SUMMARY OF EMAIL DISPATCH VERIFICATION:")
    print("====================================================")
    for title, status_code, data in results:
        is_success = status_code in (200, 201)
        email_sent = (
            data.get("status") == "ok" or 
            data.get("emailSent") is True or 
            data.get("emailNotification", {}).get("confirmationSent") is True
        )
        icon = "✅" if (is_success and email_sent) else "❌"
        print(f"{icon} {title}: HTTP {status_code} | Email Status: {json.dumps(data.get('emailDelivery', data))}")

if __name__ == "__main__":
    run_tests()
