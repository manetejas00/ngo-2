#!/usr/bin/env python3
"""
Doctor & Diagnostic Test Package CRUD & Seeding Integration Test
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

def main():
    print("==========================================================")
    print("DOCTOR & DIAGNOSTIC TEST CATALOG CRUD & SEEDING TEST")
    print("==========================================================\n")

    # 1. Admin Login
    print("1. Admin Login...")
    code1, res1 = post_json('/api/admin-auth.php', {
        'action': 'login',
        'email': 'admin@gmail.com',
        'password': 'Admin@1230'
    })
    assert code1 == 200 and 'token' in res1, "Admin authentication failed!"
    token = res1['token']
    auth_header = {'Authorization': f'Bearer {token}'}

    # 2. Seed Catalog from pre-recorded JSON
    print("2. Testing Catalog Seeding from pre-recorded JSON data...")
    code2, res2 = post_json('/api/admin-data.php', {'action': 'seed_catalog'}, auth_header)
    print(f"   Response: {res2.get('message')}")
    assert code2 == 200 and res2.get('status') == 'ok', "Catalog seeding failed!"

    # 3. Add New Doctor Profile
    print("\n3. Testing Save (Create) New Doctor Profile...")
    test_doc_id = "doc-test-999"
    code3, res3 = post_json('/api/admin-data.php', {
        'action': 'save_doctor',
        'doctor': {
            'id': test_doc_id,
            'name': 'Dr. Test Oncologist',
            'specialityName': 'Radiation Oncology',
            'qualification': 'MBBS, MD',
            'experienceYears': 12,
            'hospitalName': 'Avinya Care Center',
            'location': 'Mumbai',
            'consultationFee': 500,
            'feeDisplay': '₹500 (Subsidy)',
            'badge': 'Radiation Specialist',
            'about': 'Test doctor profile created via automated test.'
        }
    }, auth_header)
    print(f"   Response: {res3.get('message')}")
    assert code3 == 200 and res3.get('status') == 'ok', "Save Doctor profile failed!"

    # 4. Add New Diagnostic Test Package
    print("\n4. Testing Save (Create) New Diagnostic Test Package...")
    test_pkg_id = "test-pkg-999"
    code4, res4 = post_json('/api/admin-data.php', {
        'action': 'save_test',
        'test': {
            'id': test_pkg_id,
            'name': 'Advanced Genomic Tumor Panel',
            'category': 'Genomic Screening',
            'tagline': 'Comprehensive tumor DNA sequencing',
            'price': 7999,
            'originalPrice': 15000,
            'avinyaSubsidy': '47% Off',
            'reportTurnaround': '48 Hours',
            'badge': '⭐ Genomic Elite',
            'description': 'Advanced DNA biomarker sequencing panel.',
            'testsIncluded': ['BRCA1/2', 'EGFR', 'TP53', 'KRAS']
        }
    }, auth_header)
    print(f"   Response: {res4.get('message')}")
    assert code4 == 200 and res4.get('status') == 'ok', "Save Test Package failed!"

    # 5. Fetch Catalog & Verify Records Exist
    print("\n5. Fetching catalog data to verify additions...")
    code5, res5 = post_json('/api/admin-data.php', {'action': 'all'}, auth_header)
    assert code5 == 200, "Admin data fetch failed!"

    docs = res5.get('data', {}).get('doctorsCatalog', [])
    tests = res5.get('data', {}).get('diagnosticTestsCatalog', [])
    print(f"   Total Doctors in Catalog: {len(docs)}")
    print(f"   Total Diagnostic Tests in Catalog: {len(tests)}")

    doc_ids = [d.get('doctor_id') or d.get('id') for d in docs]
    test_ids = [t.get('test_id') or t.get('id') for t in tests]
    assert test_doc_id in doc_ids, f"Created doctor {test_doc_id} not found in catalog!"
    assert test_pkg_id in test_ids, f"Created test package {test_pkg_id} not found in catalog!"
    print(f"   ✅ Doctor '{test_doc_id}' and Test Package '{test_pkg_id}' verified in database catalog!")

    # 6. Delete Test Doctor Profile
    print("\n6. Cleaning up test Doctor profile...")
    code6, res6 = post_json('/api/admin-data.php', {'action': 'delete_doctor', 'id': test_doc_id}, auth_header)
    print(f"   Response: {res6.get('message')}")
    assert code6 == 200 and res6.get('status') == 'ok', "Delete Doctor failed!"

    # 7. Delete Test Diagnostic Package
    print("\n7. Cleaning up test Diagnostic Package...")
    code7, res7 = post_json('/api/admin-data.php', {'action': 'delete_test', 'id': test_pkg_id}, auth_header)
    print(f"   Response: {res7.get('message')}")
    assert code7 == 200 and res7.get('status') == 'ok', "Delete Test Package failed!"

    print("\n==========================================================")
    print("✅ ALL DOCTOR & TEST CATALOG CRUD & SEEDING TESTS PASSED!")
    print("==========================================================")

if __name__ == '__main__':
    main()
