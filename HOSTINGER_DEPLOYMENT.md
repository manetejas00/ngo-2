# 🚀 Hostinger Automated Deployment Checklist — Avinya Care Foundation

This document contains your Hostinger server details and credentials for automated deployment of `test.avinyacarefoundation.org`.

---

## 📋 Server Details & Credentials

| Setting | Value |
| :--- | :--- |
| **Website Domain** | `test.avinyacarefoundation.org` |
| **SSH Host / IP** | `82.112.239.95` |
| **SSH Port** | `65002` |
| **SSH Username** | `u382139760` |
| **SSH Password** | `@qLVTyL|J5` |
| **SSH Status** | `ACTIVE` |
| **Remote Web Directory** | `~/domains/test.avinyacarefoundation.org/public_html` |
| **Local Zip Bundle** | `avinya-care-hostinger-deployment.zip` |

---

## ⚡ Deployment Commands

```bash
# 1. Upload zip package via SCP
scp -P 65002 avinya-care-hostinger-deployment.zip u382139760@82.112.239.95:~/domains/test.avinyacarefoundation.org/public_html/

# 2. Unzip directly in public_html
ssh -p 65002 u382139760@82.112.239.95 "cd ~/domains/test.avinyacarefoundation.org/public_html && unzip -o avinya-care-hostinger-deployment.zip && rm avinya-care-hostinger-deployment.zip"
```
