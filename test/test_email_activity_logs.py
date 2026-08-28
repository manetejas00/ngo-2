#!/usr/bin/env python3
"""
Email Dispatch & Activity Audit Log Verification Script
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
    print("EMAIL DISPATCH & ACTIVITY AUDIT LOG VERIFICATION")
    print("==========================================================\n")

    # 1. Login to Admin Panel
    print("1. Admin Login...")
    code1, res1 = post_json('/api/admin-auth.php', {
        'action': 'login',
        'email': 'admin@gmail.com',
        'password': 'Admin@1230'
    })
    assert code1 == 200, "Admin login failed!"
    token = res1.get('token')

    # 2. Trigger Form Submission
    print("2. Submitting test contact form to generate email & activity logs...")
    code2, res2 = post_json('/api/submit-form.php', {
        'form_type': 'contact',
        'name': 'Email Activity Test User',
        'email': 'manetejas00@gmail.com',
        'message': 'Testing email activity logging system'
    })
    print(f"   Form Submission HTTP: {code2}")
    print(f"   Email Status: {json.dumps(res2.get('emailDelivery', {}), indent=2)}\n")
    assert code2 == 200, "Form submission failed!"

    # 3. Fetch Admin Data & Check Email Logs & Activity Logs
    print("3. Querying Hostinger MySQL email_logs & activity_logs tables...")
    code3, res3 = post_json('/api/admin-data.php', {'action': 'all'}, {'Authorization': f'Bearer {token}'})
    assert code3 == 200, "Admin data fetch failed!"

    email_logs = res3.get('data', {}).get('emailLogs', [])
    activity_logs = res3.get('data', {}).get('activityLogs', [])

    print(f"   📧 Total Email Audit Logs Recorded: {len(email_logs)}")
    print("   Recent Email Audit Logs:")
    for el in email_logs[:4]:
        print(f"   - Ref: {el.get('reference_id')} | Role: {el.get('recipient_role')} | Recipient: {el.get('recipient_email')} | Status: {el.get('smtp_status')}")

    print(f"\n   📜 Total Activity Audit Logs Recorded: {len(activity_logs)}")
    print("   Recent Activity Logs (including Email Events):")
    for act in activity_logs[:6]:
        print(f"   - [{act.get('created_at')}] {act.get('event_type')} | Actor: {act.get('actor_identifier')} | Action: {act.get('action')}")

    print("\n==========================================================")
    print("✅ EMAIL DISPATCH & ACTIVITY AUDIT LOG VERIFICATION COMPLETE!")
    print("==========================================================")

if __name__ == '__main__':
    main()
