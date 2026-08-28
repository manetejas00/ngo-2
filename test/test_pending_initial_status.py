#!/usr/bin/env python3
"""
Test Initial Booking Status is 'pending'
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

def get_json(endpoint):
    url = f"{TARGET_HOST}{endpoint}"
    req = urllib.request.Request(url, method='GET')
    try:
        with urllib.request.urlopen(req, timeout=15) as response:
            return response.getcode(), json.loads(response.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode('utf-8'))
    except Exception as e:
        return 0, {"error": str(e)}

def main():
    print("==========================================================")
    print("TEST INITIAL BOOKING STATUS ('pending') VERIFICATION")
    print("==========================================================\n")

    # 1. Book a new Doctor Appointment
    print("1. Fetching available slots and booking a new Doctor Appointment...")
    slot_code, slot_res = get_json('/api/booking/index.php?action=slots&doctorId=doc-1&date=2026-11-20')
    slots = slot_res.get('slots', [])
    test_slot = slots[0]['time'] if slots else '02:00 PM'

    code1, res1 = post_json('/api/booking/index.php?action=create', {
        'doctorId': 'doc-1',
        'patientName': 'Pending Status Test Patient',
        'patientEmail': 'pending.test@avinyacarefoundation.org',
        'patientPhone': '+91 98765 43210',
        'date': '2026-11-20',
        'time': test_slot
    })
    print(f"   HTTP Status: {code1}")
    booking1 = res1.get('booking') or res1.get('appointment') or {}
    status1 = booking1.get('status')
    print(f"   Created Doctor Booking ID: {booking1.get('id')} | Initial Status: '{status1}'")
    assert code1 == 201 and status1 == 'pending', f"Doctor booking initial status is not 'pending'! Got '{status1}'"

    # 2. Book a new Diagnostic Test Package
    print("\n2. Booking a new Diagnostic Test Package...")
    code2, res2 = post_json('/api/diagnostic-booking.php', {
        'testId': 'test-1',
        'patientName': 'Pending Diagnostic Patient',
        'patientEmail': 'pending.diag@avinyacarefoundation.org',
        'patientPhone': '+91 98765 43210',
        'date': '2026-11-25',
        'timeSlot': '09:00 AM - 11:00 AM',
        'collectionMethod': 'home_collection',
        'city': 'Mumbai'
    })
    print(f"   HTTP Status: {code2}")
    booking2 = res2.get('booking') or {}
    status2 = booking2.get('status')
    print(f"   Created Diagnostic Booking ID: {booking2.get('id')} | Initial Status: '{status2}'")
    assert code2 == 201 and status2 == 'pending', f"Diagnostic booking initial status is not 'pending'! Got '{status2}'"

    print("\n==========================================================")
    print("✅ INITIAL BOOKING STATUS ('pending') VERIFICATION PASSED!")
    print("==========================================================")

if __name__ == '__main__':
    main()
