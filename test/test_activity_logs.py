#!/usr/bin/env python3
"""
Project-Wide Activity Audit Log Test Suite
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
    print("PROJECT-WIDE ACTIVITY AUDIT LOG INTEGRATION TEST SUITE")
    print("==========================================================\n")

    # 1. Admin Login to get token
    print("1. Logging into Admin Panel to fetch Activity Logs...")
    code1, res1 = post_json('/api/admin-auth.php', {
        'action': 'login',
        'email': 'admin@gmail.com',
        'password': 'Admin@1230'
    })
    assert code1 == 200, "Admin login failed!"
    token = res1.get('token')
    print(f"   Admin Token: {token}\n")

    # 2. Trigger a Form Submission Activity
    print("2. Triggering Form Submission Activity...")
    code2, res2 = post_json('/api/submit-form.php', {
        'form_type': 'contact',
        'name': 'Activity Audit Logger Test User',
        'email': 'activity.test@avinyacarefoundation.org',
        'message': 'Testing project-wide activity logger'
    })
    print(f"   Form Submit HTTP Status: {code2}\n")
    assert code2 == 200, "Form submission failed!"

    # 3. Fetch Admin Data & Verify Activity Logs Array
    print("3. Fetching Admin Data & Activity Log Timeline...")
    code3, res3 = post_json('/api/admin-data.php', {'action': 'all'}, {'Authorization': f'Bearer {token}'})
    print(f"   Admin Data HTTP Status: {code3}")
    
    analytics = res3.get('analytics', {})
    activity_logs = res3.get('data', {}).get('activityLogs', [])
    
    print(f"   📊 Total Activity Logs Count: {analytics.get('totalActivityLogs')}")
    print(f"   Fetched {len(activity_logs)} Activity Log items:")
    for log in activity_logs[:5]:
        print(f"   - [{log.get('created_at')}] {log.get('event_type')} | Actor: {log.get('actor_identifier')} | Action: {log.get('action')}")
    print()

    assert code3 == 200 and len(activity_logs) > 0, "No activity logs returned!"

    print("==========================================================")
    print("✅ PROJECT-WIDE ACTIVITY AUDIT LOG TESTS PASSED!")
    print("==========================================================")

if __name__ == '__main__':
    main()
