#!/usr/bin/env python3
"""
Test Admin Panel Active Tab Persistence Across Page Refreshes
"""

import os

def test_tab_persistence():
    admin_html_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'admin.html')
    with open(admin_html_path, 'r', encoding='utf-8') as f:
        content = f.read()

    assert "getInitialTab()" in content, "❌ FAIL: getInitialTab function missing in admin.html"
    assert "avinya_active_tab" in content, "❌ FAIL: localStorage key avinya_active_tab missing in admin.html"
    assert "history.replaceState" in content, "❌ FAIL: URL hash update missing in switchTab"
    assert "'settings': 'Platform & Infrastructure Settings'" in content, "❌ FAIL: settings tab missing in pageTitles"

    print("==================================================================")
    print("✅ PASS: Admin Dashboard Active Tab Persistence Verified!")
    print("==================================================================")

if __name__ == '__main__':
    test_tab_persistence()
