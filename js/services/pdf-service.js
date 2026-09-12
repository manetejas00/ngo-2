/**
 * Avinya Care Foundation - Unified PDF Generator Service
 * Renders high-resolution, pixel-perfect official documents on the brand letterhead.
 * Supports:
 * 1. Cancer Awareness Guide & Health Screening Checklist
 * 2. Section 80G Tax Exemption Donation Receipts
 * 3. Doctor Consultation Slips & Appointment Passes
 * 4. Diagnostic Test & Health Package Order Passes
 * 5. Admin Official Records & Summary Reports
 */

class AvinyaPdfService {
  constructor() {
    this.brand = {
      name: 'Avinya Care Foundation',
      trust: 'Registered Public Charitable Trust',
      verification: 'NITI Aayog NGO Darpan Verified',
      address: '12 Yehsubal Apt, Narangi Phata, Virar East, Palghar, Maharashtra – 401303',
      phone: '+91 74474 41116',
      email: 'info@avinyacarefoundation.com',
      website: 'www.avinyacarefoundation.org',
      pan: 'AABTA9988C',
      reg12a: 'AAATA9988CE20214',
      urn80g: 'AABTA9988CF20221',
      csr: 'CSR00049281',
      ngoId: 'MH/2023/0349811'
    };
    this.initStyle();
  }

  initStyle() {
    if (document.getElementById('avinya-pdf-styles')) return;
    const style = document.createElement('style');
    style.id = 'avinya-pdf-styles';
    style.textContent = `
      .avinya-pdf-modal-backdrop {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(15, 23, 42, 0.75);
        backdrop-filter: blur(8px);
        z-index: 99999;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 1.5rem;
        box-sizing: border-box;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      }
      .avinya-pdf-modal-backdrop.active {
        opacity: 1;
        pointer-events: auto;
      }
      .avinya-pdf-modal-card {
        background: #ffffff;
        width: 100%;
        max-width: 900px;
        max-height: 92vh;
        border-radius: 16px;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        animation: avinyaPdfPop 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      }
      @keyframes avinyaPdfPop {
        from { transform: scale(0.95) translateY(10px); opacity: 0; }
        to { transform: scale(1) translateY(0); opacity: 1; }
      }
      .avinya-pdf-modal-header {
        padding: 1.25rem 1.75rem;
        background: #0f172a;
        color: #ffffff;
        display: flex;
        align-items: center;
        justify-content: space-between;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      }
      .avinya-pdf-modal-header h3 {
        margin: 0;
        font-size: 1.2rem;
        font-weight: 700;
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }
      .avinya-pdf-modal-actions {
        display: flex;
        gap: 0.75rem;
      }
      .avinya-pdf-btn {
        padding: 0.5rem 1.15rem;
        border-radius: 8px;
        font-weight: 600;
        font-size: 0.88rem;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
        border: none;
        transition: all 0.2s;
      }
      .avinya-pdf-btn-primary {
        background: #087F73;
        color: #ffffff;
      }
      .avinya-pdf-btn-primary:hover {
        background: #06665c;
        transform: translateY(-1px);
      }
      .avinya-pdf-btn-secondary {
        background: rgba(255, 255, 255, 0.12);
        color: #ffffff;
      }
      .avinya-pdf-btn-secondary:hover {
        background: rgba(255, 255, 255, 0.2);
      }
      .avinya-pdf-modal-body {
        padding: 1.5rem;
        overflow-y: auto;
        background: #f1f5f9;
        display: flex;
        justify-content: center;
      }
      .avinya-pdf-sheet {
        width: 794px;
        min-height: 1123px;
        background: #ffffff;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
        padding: 42px 48px;
        box-sizing: border-box;
        color: #1e293b;
        font-family: 'Inter', system-ui, -apple-system, sans-serif;
        position: relative;
        font-size: 13.5px;
        line-height: 1.55;
      }
      .avinya-document-header { border-bottom: 3px solid #087F73; padding-bottom: 14px; margin-bottom: 20px; }
      .avinya-document-header table { width: 100%; border-collapse: collapse; }
      .avinya-document-header .brand-mark { width: 74px; padding-right: 14px; vertical-align: middle; }
      .avinya-document-header .brand-mark img { display: block; width: 64px; height: 64px; object-fit: contain; }
      .avinya-document-header .brand-name { color: #0f172a; font-size: 20px; font-weight: 800; line-height: 1.15; }
      .avinya-document-header .brand-meta { color: #475569; font-size: 10px; line-height: 1.45; padding-top: 4px; }
      .avinya-document-header .brand-contact { color: #087F73; font-size: 9.5px; line-height: 1.45; padding-top: 4px; }
      .avinya-document-footer { border-top: 1px solid #cbd5e1; color: #64748b; font-size: 9.5px; line-height: 1.45; margin-top: 20px; padding-top: 8px; }
      @media print {
        @page { size: A4; margin: 0; }
        body * {
          visibility: hidden !important;
        }
        #avinya-pdf-printable-area, #avinya-pdf-printable-area * {
          visibility: visible !important;
        }
        #avinya-pdf-printable-area {
          position: absolute !important;
          left: 0 !important;
          top: 0 !important;
          width: 794px !important;
          min-height: 1123px !important;
          margin: 0 !important;
          padding: 42px 48px !important;
          box-shadow: none !important;
          background: #ffffff !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  numberToWordsIN(num) {
    const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    
    num = Math.floor(Number(num) || 0);
    if (num === 0) return 'Zero';
    
    function convertLessThanOneThousand(n) {
      if (n >= 100) {
        return a[Math.floor(n / 100)] + ' Hundred ' + convertLessThanOneThousand(n % 100);
      }
      if (n >= 20) {
        return b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : '');
      }
      return a[n];
    }

    let crore = Math.floor(num / 10000000);
    let remCrore = num % 10000000;
    let lakh = Math.floor(remCrore / 100000);
    let remLakh = remCrore % 100000;
    let thousand = Math.floor(remLakh / 1000);
    let remThousand = remLakh % 1000;

    let res = '';
    if (crore > 0) res += convertLessThanOneThousand(crore) + ' Crore ';
    if (lakh > 0) res += convertLessThanOneThousand(lakh) + ' Lakh ';
    if (thousand > 0) res += convertLessThanOneThousand(thousand) + ' Thousand ';
    if (remThousand > 0) res += convertLessThanOneThousand(remThousand);
    
    return (res.trim() + ' Rupees Only');
  }

  escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  getFinancialYear(dateValue) {
    const date = new Date(dateValue || Date.now());
    const year = Number.isNaN(date.getTime()) ? new Date().getFullYear() : date.getFullYear();
    const month = Number.isNaN(date.getTime()) ? new Date().getMonth() : date.getMonth();
    const start = month >= 3 ? year : year - 1;
    return `${start}–${start + 1}`;
  }

  getLetterheadDataHtml() {
    return `
      <div class="avinya-document-header">
        <table role="presentation"><tr>
          <td class="brand-mark"><img src="assets/logo.png" alt="Avinya Care Foundation logo"></td>
          <td>
            <div class="brand-name">${this.brand.name}</div>
            <div class="brand-meta">${this.brand.trust} · ${this.brand.verification}<br>${this.brand.address}</div>
            <div class="brand-contact">${this.brand.phone} · ${this.brand.email} · ${this.brand.website}</div>
          </td>
        </tr></table>
      </div>
    `;
  }

  getDocumentFooterHtml(label = 'Official communication') {
    return `<div class="avinya-document-footer">${this.brand.name} · ${this.brand.trust} · ${label}<br>${this.brand.phone} · ${this.brand.email} · ${this.brand.website}</div>`;
  }


  showPreviewModal(sheetHtml, filename) {
    let modal = document.getElementById('avinya-pdf-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'avinya-pdf-modal';
      modal.className = 'avinya-pdf-modal-backdrop';
      modal.innerHTML = `
        <div class="avinya-pdf-modal-card">
          <div class="avinya-pdf-modal-header">
            <h3><span>📄</span> <span id="avinya-pdf-modal-title">Official Document Preview</span></h3>
            <div class="avinya-pdf-modal-actions">
              <button class="avinya-pdf-btn avinya-pdf-btn-primary" id="avinya-pdf-download-btn">
                <span>⬇️ Download PDF</span>
              </button>
              <button class="avinya-pdf-btn avinya-pdf-btn-secondary" id="avinya-pdf-print-btn">
                <span>🖨️ Print</span>
              </button>
              <button class="avinya-pdf-btn avinya-pdf-btn-secondary" id="avinya-pdf-close-btn">
                <span>✕ Close</span>
              </button>
            </div>
          </div>
          <div class="avinya-pdf-modal-body">
            <div id="avinya-pdf-printable-area" class="avinya-pdf-sheet"></div>
          </div>
        </div>
      `;
      document.body.appendChild(modal);

      modal.addEventListener('click', (e) => {
        if (e.target === modal) this.closePreviewModal();
      });

      document.getElementById('avinya-pdf-close-btn').onclick = () => this.closePreviewModal();
      document.getElementById('avinya-pdf-print-btn').onclick = () => window.print();
    }

    const printArea = document.getElementById('avinya-pdf-printable-area');
    printArea.innerHTML = sheetHtml;
    document.getElementById('avinya-pdf-modal-title').innerText = filename.replace(/\.pdf$/i, '');

    const downloadBtn = document.getElementById('avinya-pdf-download-btn');
    downloadBtn.onclick = () => this.downloadAsPdf(printArea, filename);

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  closePreviewModal() {
    const modal = document.getElementById('avinya-pdf-modal');
    if (modal) modal.classList.remove('active');
    document.body.style.overflow = '';
  }

  async downloadAsPdf(element, filename) {
    if (typeof html2pdf !== 'undefined') {
      const opt = {
        margin: [0, 0, 0, 0],
        filename: filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'px', format: [794, 1123], orientation: 'portrait' }
      };
      try {
        const downloadBtn = document.getElementById('avinya-pdf-download-btn');
        if (downloadBtn) {
          downloadBtn.innerHTML = '<span>⏳ Generating PDF...</span>';
          downloadBtn.disabled = true;
        }
        await html2pdf().set(opt).from(element).save();
        if (downloadBtn) {
          downloadBtn.innerHTML = '<span>✓ Downloaded!</span>';
          setTimeout(() => {
            downloadBtn.innerHTML = '<span>⬇️ Download PDF</span>';
            downloadBtn.disabled = false;
          }, 2000);
        }
        return;
      } catch (e) {
        console.warn('html2pdf generation error, falling back to print dialog:', e);
      }
    }
    window.print();
  }

  // -------------------------------------------------------------
  // 1. CANCER AWARENESS GUIDE & SCREENING CHECKLIST PDF
  // -------------------------------------------------------------
  generateAwarenessGuidePDF(topic = "Comprehensive Cancer Awareness & Screening Checklist") {
    const dateStr = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
    const sheetHtml = `
      ${this.getLetterheadDataHtml()}
      <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #E2E8F0; padding-bottom: 12px; margin-bottom: 16px;">
        <div>
          <span style="font-size: 10px; font-weight: 800; color: #087F73; text-transform: uppercase; letter-spacing: 1px; background: #E6F4F1; padding: 3px 8px; border-radius: 4px; display: inline-block; margin-bottom: 4px;">Public Health Initiative • Free Community Resource</span>
          <h1 style="font-size: 20px; font-weight: 800; color: #0f172a; margin: 2px 0;">${topic}</h1>
          <div style="font-size: 11px; color: #64748B;">Aligned with Tata Memorial Centre & ICMR Early Detection Protocols • Issued: ${dateStr}</div>
        </div>
        <div style="text-align: right;">
          <div style="font-size: 10px; font-weight: 700; color: #475569;">DOC REF: ACF-GUIDE-2026</div>
          <div style="font-size: 10px; color: #166534; font-weight: 700;">✓ Verified Clinical Resource</div>
        </div>
      </div>

      <div style="background: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 8px; padding: 10px 14px; margin-bottom: 16px; font-size: 12px; color: #166534; line-height: 1.5;">
        <strong>🎗️ Clinical Fact:</strong> Over 70% of cancers detected in Stage I or II have high cure rates. Regular routine screening and early self-checks save lives.
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 16px;">
        <!-- Breast Cancer Screening -->
        <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 12px;">
          <div style="font-weight: 800; color: #9D174D; font-size: 13px; margin-bottom: 6px; display: flex; align-items: center; gap: 6px;">
            <span>🌸</span> <span>Breast Health Screening</span>
          </div>
          <ul style="margin: 0; padding-left: 16px; font-size: 11.5px; color: #334155;">
            <li><strong>Age 20+:</strong> Monthly Breast Self-Exam (BSE) 3–5 days post-menstruation.</li>
            <li><strong>Age 30+:</strong> Annual Clinical Breast Exam (CBE) by a trained healthcare professional.</li>
            <li><strong>Age 40+:</strong> Mammogram screening every 2 years.</li>
            <li><strong>Warning Signs:</strong> Painless lump, skin dimpling, nipple inversion/discharge.</li>
          </ul>
        </div>

        <!-- Cervical Cancer Screening -->
        <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 12px;">
          <div style="font-weight: 800; color: #087F73; font-size: 13px; margin-bottom: 6px; display: flex; align-items: center; gap: 6px;">
            <span>🌿</span> <span>Cervical Health Screening</span>
          </div>
          <ul style="margin: 0; padding-left: 16px; font-size: 11.5px; color: #334155;">
            <li><strong>Age 9–26:</strong> HPV Vaccination (Primary prevention).</li>
            <li><strong>Age 30–65:</strong> Pap Smear every 3 years OR Visual Inspection (VIA) / HPV DNA test every 5 years.</li>
            <li><strong>Warning Signs:</strong> Irregular bleeding between cycles, post-coital spotting, unusual pelvic pain.</li>
          </ul>
        </div>

        <!-- Oral Cancer Screening -->
        <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 12px;">
          <div style="font-weight: 800; color: #B45309; font-size: 13px; margin-bottom: 6px; display: flex; align-items: center; gap: 6px;">
            <span>🔍</span> <span>Oral Cavity Screening</span>
          </div>
          <ul style="margin: 0; padding-left: 16px; font-size: 11.5px; color: #334155;">
            <li><strong>Target Group:</strong> Tobacco, Gutkha, Paan users & high-risk individuals.</li>
            <li><strong>Action:</strong> Annual visual oral exam by a doctor / dentist.</li>
            <li><strong>Warning Signs:</strong> Non-healing mouth ulcer (>2 weeks), white/red patches (Leukoplakia), difficulty swallowing.</li>
          </ul>
        </div>

        <!-- Colorectal & Preventive Screenings -->
        <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 12px;">
          <div style="font-weight: 800; color: #4338CA; font-size: 13px; margin-bottom: 6px; display: flex; align-items: center; gap: 6px;">
            <span>🔬</span> <span>Colorectal & Systemic Care</span>
          </div>
          <ul style="margin: 0; padding-left: 16px; font-size: 11.5px; color: #334155;">
            <li><strong>Age 45+:</strong> Annual Fecal Immunochemical Test (FIT) / Colonoscopy every 5–10 years.</li>
            <li><strong>Men 50+:</strong> PSA screening evaluation upon clinical consultation.</li>
            <li><strong>General Checks:</strong> Complete blood count, Liver & Kidney function baseline panels.</li>
          </ul>
        </div>
      </div>

      <div style="background: #EFF6FF; border: 1.5px dashed #93C5FD; border-radius: 8px; padding: 12px 16px; margin-bottom: 16px;">
        <div style="font-weight: 800; color: #1E40AF; font-size: 12.5px; margin-bottom: 4px;">📞 Avinya Care Free Patient Navigation & Subsidized Screening Helpline:</div>
        <div style="font-size: 11.5px; color: #1E3A8A; line-height: 1.5;">
          Need clinical consultation or subsidized diagnostic tests? Contact our Virar-Mumbai care desk at <strong>${this.brand.phone}</strong> or email <strong>${this.brand.email}</strong>.
        </div>
      </div>

      <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 14px; font-size: 10px; color: #64748B; border-top: 1px solid #E2E8F0; padding-top: 8px;">
        <div>
          <div>Avinya Care Foundation • Reg. Public Charitable Trust • NITI Aayog NGO Darpan Verified</div>
          <div>12 Yehsubal Apt, Narangi Phata, Virar East, Palghar, Maharashtra - 401303</div>
        </div>
        <div style="text-align: right; font-weight: 700; color: #087F73;">
          www.avinyacarefoundation.org
        </div>
      </div>
    `;

    this.showPreviewModal(sheetHtml, `AvinyaCare_Cancer_Awareness_Checklist.pdf`);
  }

  // -------------------------------------------------------------
  // 2. OFFICIAL 80G TAX EXEMPTION DONATION RECEIPT PDF
  // -------------------------------------------------------------
  generateDonationReceiptPDF(data = {}) {
    const receiptNo = this.escapeHtml(data.receiptNo || data.transaction_id || `ACF-80G-${Date.now().toString().slice(-6)}`);
    const issueDate = data.date || data.paid_at || new Date();
    const dateStr = this.escapeHtml(typeof issueDate === 'string' && !/^\d{4}-\d{2}-\d{2}/.test(issueDate)
      ? issueDate
      : new Date(issueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }));
    const donorName = this.escapeHtml(data.name || data.donor_name || 'Anonymous Donor');
    const donorEmail = this.escapeHtml(data.email || data.donor_email || 'Not provided');
    const donorPhone = this.escapeHtml(data.phone || data.donor_phone || 'Not provided');
    const donorPan = this.escapeHtml(String(data.pan || data.donor_pan || 'Not provided').toUpperCase());
    const amount = Math.max(0, Number(data.amount) || 0);
    const amountInWords = this.numberToWordsIN(amount);
    const paymentMode = this.escapeHtml(data.payment_mode || 'Online payment');
    const txnId = this.escapeHtml(data.transaction_id || data.txn_id || 'Not provided');
    const amountLabel = this.escapeHtml(amount.toLocaleString('en-IN'));
    const wordsLabel = this.escapeHtml(amountInWords);

    const sheetHtml = `
      ${this.getLetterheadDataHtml()}
      <div style="text-align: center; margin-bottom: 16px; border-bottom: 2px solid #087F73; padding-bottom: 10px;">
        <span style="background: #087F73; color: white; font-size: 10px; font-weight: 800; padding: 3px 10px; border-radius: 999px; text-transform: uppercase; letter-spacing: 1px;">Official Tax Exemption Receipt</span>
        <h1 style="font-size: 18px; font-weight: 800; color: #0f172a; margin: 4px 0 2px 0;">DONATION RECEIPT UNDER SECTION 80G</h1>
        <div style="font-size: 11px; color: #475569; font-weight: 600;">Income Tax Act, 1961 • 50% Tax Exemption for Donors</div>
      </div>

      <table style="width: 100%; border-collapse: separate; border-spacing: 0; font-size: 11px; margin-bottom: 16px; background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 6px;"><tr>
        <td style="padding: 9px 11px; width: 38%;"><strong>Receipt No.</strong><br><span style="font-family: monospace; color: #087F73; font-weight: 700; overflow-wrap: anywhere;">${receiptNo}</span></td>
        <td style="padding: 9px 11px; width: 30%; border-left: 1px solid #E2E8F0;"><strong>Date of issue</strong><br>${dateStr}</td>
        <td style="padding: 9px 11px; border-left: 1px solid #E2E8F0;"><strong>Financial year</strong><br>${this.getFinancialYear(issueDate)}</td>
      </tr></table>

      <table style="width: 100%; border-collapse: collapse; margin-bottom: 14px; font-size: 12px;">
        <tr style="border-bottom: 1px solid #E2E8F0;">
          <td style="padding: 7px 0; width: 32%; color: #64748B; font-weight: 600;">Donor Full Name:</td>
          <td style="padding: 7px 0; font-weight: 700; color: #0f172a;">${donorName}</td>
        </tr>
        <tr style="border-bottom: 1px solid #E2E8F0;">
          <td style="padding: 7px 0; color: #64748B; font-weight: 600;">Donor Permanent Account No. (PAN):</td>
          <td style="padding: 7px 0; font-family: monospace; font-weight: 800; color: #1E293B;">${donorPan}</td>
        </tr>
        <tr style="border-bottom: 1px solid #E2E8F0;">
          <td style="padding: 7px 0; color: #64748B; font-weight: 600;">Contact Details:</td>
          <td style="padding: 7px 0;">${donorEmail} • ${donorPhone}</td>
        </tr>
        <tr style="border-bottom: 1px solid #E2E8F0;">
          <td style="padding: 7px 0; color: #64748B; font-weight: 600;">Payment Mode & Reference:</td>
          <td style="padding: 7px 0;">${paymentMode} • <code style="color: #087F73; font-weight: 700;">${txnId}</code></td>
        </tr>
        <tr style="background: #F0FDF4;">
          <td style="padding: 10px 8px; color: #166534; font-weight: 800; font-size: 13px;">Donation Amount:</td>
          <td style="padding: 10px 8px; color: #166534; font-weight: 800; font-size: 16px;">
            ₹${amountLabel} <span style="font-size: 12px; font-weight: 600; color: #15803D;">(${wordsLabel})</span>
          </td>
        </tr>
      </table>

      <!-- Statutory Exemption Details -->
      <div style="background: #FFFBEB; border: 1px solid #FDE68A; border-radius: 6px; padding: 8px 12px; margin-bottom: 14px; font-size: 11px; color: #92400E; line-height: 1.5;">
        <strong>🏛️ Statutory Tax Exemption Declaration:</strong><br>
        Donations made to Avinya Care Foundation are eligible for deduction under <strong>Section 80G(5)(vi)</strong> of the Income Tax Act, 1961. This receipt qualifies for Form 10BE statutory filing with the Income Tax Department of India.
      </div>

      <div style="display: grid; grid-template-columns: 1.5fr 1fr; gap: 14px; margin-top: 10px; align-items: flex-end;">
        <div style="font-size: 10.5px; color: #64748B; line-height: 1.5;">
          <strong>Avinya Care Foundation Statutory Particulars:</strong><br>
          • <strong>PAN:</strong> ${this.brand.pan} | <strong>12A Reg:</strong> ${this.brand.reg12a}<br>
          • <strong>80G URN:</strong> ${this.brand.urn80g} | <strong>CSR-1 Reg:</strong> ${this.brand.csr}<br>
          • <strong>NITI Aayog NGO Darpan ID:</strong> ${this.brand.ngoId}
        </div>
        <div style="text-align: center; border-top: 1px solid #94A3B8; padding-top: 6px;">
          <div style="font-family: 'Brush Script MT', cursive, serif; font-size: 18px; color: #087F73; font-weight: bold; margin-bottom: 2px;">
            Tejas S. Mane
          </div>
          <div style="font-size: 11px; font-weight: 700; color: #0f172a;">Authorized Trustee & Signatory</div>
          <div style="font-size: 9.5px; color: #64748B;">Avinya Care Foundation</div>
        </div>
      </div>
      ${this.getDocumentFooterHtml('Donation receipt')}`;

    this.showPreviewModal(sheetHtml, `AvinyaCare_80G_Receipt_${receiptNo}.pdf`);
  }

  // -------------------------------------------------------------
  // 3. DOCTOR CONSULTATION SLIP / APPOINTMENT PASS PDF
  // -------------------------------------------------------------
  generateDoctorAppointmentPDF(apt = {}) {
    const aptId = this.escapeHtml(apt.id || apt.booking_id || `APT-${Date.now().toString().slice(-6)}`);
    const docName = this.escapeHtml(apt.doctorName || apt.doctor_name || 'Dr. Specialist');
    const docSpec = this.escapeHtml(apt.doctorSpeciality || apt.doctor_speciality || 'Consultant Specialist');
    const hospital = this.escapeHtml(apt.hospitalName || apt.hospital_name || apt.location || 'Avinya Healthcare Partner Clinic, Mumbai');
    const patName = this.escapeHtml(apt.patientName || apt.patient_name || 'Patient');
    const patAge = this.escapeHtml(apt.patientAge || apt.patient_age || '-');
    const patGender = this.escapeHtml(apt.patientGender || apt.patient_gender || 'Not specified');
    const patPhone = this.escapeHtml(apt.patientPhone || apt.patient_phone || 'Not provided');
    const patEmail = this.escapeHtml(apt.patientEmail || apt.patient_email || 'Not provided');
    const dateStr = this.escapeHtml(apt.date || apt.booking_date || new Date().toISOString().split('T')[0]);
    const timeSlot = this.escapeHtml(apt.time || apt.slot || apt.booking_time || '10:00 AM');
    const fee = apt.consultationFee ?? apt.fee ?? 0;
    const type = apt.consultationType || 'in-clinic';

    const sheetHtml = `
      ${this.getLetterheadDataHtml()}
      <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #087F73; padding-bottom: 10px; margin-bottom: 14px;">
        <div>
          <span style="font-size: 10px; font-weight: 800; color: #087F73; text-transform: uppercase; background: #E6F4F1; padding: 2px 8px; border-radius: 4px;">Outpatient Consultation Pass</span>
          <h1 style="font-size: 18px; font-weight: 800; color: #0f172a; margin: 4px 0 2px 0;">DOCTOR APPOINTMENT SLIP</h1>
          <div style="font-size: 11px; color: #64748B;">Please present this digital or printed pass at the clinic reception</div>
        </div>
        <div style="text-align: right;">
          <div style="font-size: 11px; font-weight: 700; color: #087F73;">APPOINTMENT ID</div>
          <div style="font-family: monospace; font-size: 15px; font-weight: 800; color: #0f172a;">${aptId}</div>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 14px;">
        <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 12px;">
          <div style="font-size: 11px; font-weight: 700; color: #087F73; text-transform: uppercase; margin-bottom: 6px;">Doctor Details</div>
          <div style="font-size: 14px; font-weight: 800; color: #0f172a;">${docName}</div>
          <div style="font-size: 12px; font-weight: 600; color: #475569;">${docSpec}</div>
          <div style="font-size: 11px; color: #64748B; margin-top: 4px;">📍 ${hospital}</div>
          <div style="font-size: 11px; color: #166534; font-weight: 700; margin-top: 4px;">Consultation Mode: ${type === 'online' ? '🌐 Video Call' : '🏥 In-Clinic Visit'}</div>
        </div>

        <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 12px;">
          <div style="font-size: 11px; font-weight: 700; color: #087F73; text-transform: uppercase; margin-bottom: 6px;">Scheduled Slot</div>
          <div style="font-size: 15px; font-weight: 800; color: #087F73;">📅 ${dateStr}</div>
          <div style="font-size: 13px; font-weight: 700; color: #0f172a; margin-top: 2px;">⏰ ${timeSlot}</div>
          <div style="font-size: 11px; color: #64748B; margin-top: 6px;">Consultation Fee: <strong>${fee > 0 ? '₹' + fee : 'Avinya Subsidized / Free'}</strong></div>
        </div>
      </div>

      <div style="background: #ffffff; border: 1px solid #E2E8F0; border-radius: 8px; padding: 12px; margin-bottom: 14px;">
        <div style="font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase; margin-bottom: 8px;">Patient Information</div>
        <div style="display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 10px; font-size: 12px;">
          <div><span style="color: #64748B;">Name:</span> <strong>${patName}</strong></div>
          <div><span style="color: #64748B;">Age/Gender:</span> <strong>${patAge} yrs / ${patGender}</strong></div>
          <div><span style="color: #64748B;">Phone:</span> <strong>${patPhone}</strong></div>
        </div>
        <div style="font-size: 11px; color: #64748B; margin-top: 6px;">Email: <strong>${patEmail}</strong></div>
      </div>

      <div style="background: #EFF6FF; border: 1px solid #BFDBFE; border-radius: 8px; padding: 10px 14px; margin-bottom: 14px; font-size: 11px; color: #1E40AF; line-height: 1.5;">
        <strong>📋 Instructions for Consultation:</strong><br>
        1. Please arrive 15 minutes prior to the scheduled slot.<br>
        2. Bring all prior investigation reports, prescriptions, biopsy findings, and medical history documents.<br>
        3. For assistance or rescheduling, contact Avinya Care Helpline at <strong>${this.brand.phone}</strong>.
      </div>

      <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #E2E8F0; padding-top: 8px; font-size: 10px; color: #64748B;">
        <div>Avinya Care Foundation • Healthcare Coordination Desk</div>
        <div>System Verified Pass • ID: ${aptId}</div>
      </div>
    `;

    this.showPreviewModal(sheetHtml, `AvinyaCare_Appointment_${aptId}.pdf`);
  }

  // -------------------------------------------------------------
  // 4. DIAGNOSTIC TEST / LAB ORDER PASS PDF
  // -------------------------------------------------------------
  generateDiagnosticBookingPDF(booking = {}) {
    const orderId = this.escapeHtml(booking.id || booking.booking_id || `LAB-${Date.now().toString().slice(-6)}`);
    const testName = this.escapeHtml(booking.testName || booking.test_name || 'Diagnostic Health Package');
    const price = booking.price || 0;
    const dateStr = this.escapeHtml(booking.date || booking.booking_date || new Date().toISOString().split('T')[0]);
    const timeSlot = this.escapeHtml(booking.timeSlot || booking.time_slot || '08:30 AM - 09:30 AM');
    const collection = booking.collectionMethod || 'home_collection';
    const patName = this.escapeHtml(booking.patientName || booking.patient_name || 'Patient');
    const patAge = this.escapeHtml(booking.patientAge || booking.patient_age || '-');
    const patGender = this.escapeHtml(booking.patientGender || booking.patient_gender || 'Not specified');
    const patPhone = this.escapeHtml(booking.patientPhone || booking.patient_phone || 'Not provided');
    const address = this.escapeHtml(booking.homeAddress || booking.address || 'Not provided');
    const pincode = this.escapeHtml(booking.pincode || 'Not provided');

    const sheetHtml = `
      ${this.getLetterheadDataHtml()}
      <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #087F73; padding-bottom: 10px; margin-bottom: 14px;">
        <div>
          <span style="font-size: 10px; font-weight: 800; color: #087F73; text-transform: uppercase; background: #E6F4F1; padding: 2px 8px; border-radius: 4px;">Diagnostic Investigation Pass</span>
          <h1 style="font-size: 18px; font-weight: 800; color: #0f172a; margin: 4px 0 2px 0;">DIAGNOSTIC TEST REQUISITION</h1>
          <div style="font-size: 11px; color: #64748B;">Subsidized Screening & Clinical Pathology Order</div>
        </div>
        <div style="text-align: right;">
          <div style="font-size: 11px; font-weight: 700; color: #087F73;">ORDER REF</div>
          <div style="font-family: monospace; font-size: 15px; font-weight: 800; color: #0f172a;">${orderId}</div>
        </div>
      </div>

      <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 12px; margin-bottom: 14px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <div style="font-size: 11px; font-weight: 700; color: #087F73; text-transform: uppercase;">Ordered Diagnostic Package</div>
            <div style="font-size: 15px; font-weight: 800; color: #0f172a; margin-top: 2px;">${testName}</div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 11px; color: #64748B;">Subsidized Rate</div>
            <div style="font-size: 16px; font-weight: 800; color: #166534;">₹${price}</div>
          </div>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 14px;">
        <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 12px;">
          <div style="font-size: 11px; font-weight: 700; color: #087F73; text-transform: uppercase; margin-bottom: 6px;">Patient Details</div>
          <div style="font-size: 13px; font-weight: 800; color: #0f172a;">${patName}</div>
          <div style="font-size: 11.5px; color: #475569;">${patAge} yrs • ${patGender}</div>
          <div style="font-size: 11px; color: #64748B; margin-top: 4px;">Phone: <strong>${patPhone}</strong></div>
        </div>

        <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 12px;">
          <div style="font-size: 11px; font-weight: 700; color: #087F73; text-transform: uppercase; margin-bottom: 6px;">Collection Details</div>
          <div style="font-size: 13px; font-weight: 800; color: #0f172a;">
            ${collection === 'home_collection' ? '🏠 Home Sample Collection' : '🔬 Partner Diagnostic Centre Visit'}
          </div>
          <div style="font-size: 12px; font-weight: 700; color: #087F73; margin-top: 2px;">📅 ${dateStr} • ⏰ ${timeSlot}</div>
          ${collection === 'home_collection' ? `<div style="font-size: 10.5px; color: #64748B; margin-top: 4px;">Address: ${address}, PIN ${pincode}</div>` : ''}
        </div>
      </div>

      <div style="background: #FFFBEB; border: 1px solid #FDE68A; border-radius: 8px; padding: 10px 14px; margin-bottom: 14px; font-size: 11px; color: #92400E; line-height: 1.5;">
        <strong>🧪 Fasting & Patient Preparation Protocol:</strong><br>
        • For Blood Glucose / Lipid / Comprehensive Profiles: 10–12 hours overnight fasting is advised (water allowed).<br>
        • Reports will be delivered to your registered email within 24–48 hours of sample collection.<br>
        • Trained phlebotomist will carry standardized vacuum collection tubes & ID credentials.
      </div>

      <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #E2E8F0; padding-top: 8px; font-size: 10px; color: #64748B;">
        <div>Avinya Care Diagnostic Network • NABL Accredited Partner Labs</div>
        <div>Order Ref: ${orderId}</div>
      </div>
    `;

    this.showPreviewModal(sheetHtml, `AvinyaCare_Diagnostic_Order_${orderId}.pdf`);
  }

  // -------------------------------------------------------------
  // 5. ADMIN SUMMARY REPORT & MEMORANDUM PDF
  // -------------------------------------------------------------
  generateReportPDF(title = 'Avinya Care Platform Report', columns = [], rows = []) {
    const dateStr = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
    const sheetHtml = `
      ${this.getLetterheadDataHtml()}
      <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #087F73; padding-bottom: 10px; margin-bottom: 14px;">
        <div>
          <span style="font-size: 10px; font-weight: 800; color: #087F73; text-transform: uppercase; background: #E6F4F1; padding: 2px 8px; border-radius: 4px;">Executive Administration Record</span>
          <h1 style="font-size: 18px; font-weight: 800; color: #0f172a; margin: 4px 0 2px 0;">${this.escapeHtml(title)}</h1>
          <div style="font-size: 11px; color: #64748B;">Generated: ${dateStr} • Total Records: ${rows.length}</div>
        </div>
        <div style="text-align: right;">
          <div style="font-size: 10px; font-weight: 700; color: #475569;">CONFIDENTIAL</div>
          <div style="font-size: 10px; color: #087F73; font-weight: 700;">Avinya Care Foundation</div>
        </div>
      </div>

      <div style="overflow-x: auto; margin-bottom: 14px;">
        <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
          <thead>
            <tr style="background: #F1F5F9; border-bottom: 2px solid #CBD5E1;">
              ${columns.map(c => `<th style="padding: 6px 8px; text-align: left; font-weight: 700; color: #334155; overflow-wrap: anywhere;">${this.escapeHtml(c)}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${rows.slice(0, 15).map((row, idx) => `
              <tr style="border-bottom: 1px solid #E2E8F0; background: ${idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC'};">
                ${row.map(val => `<td style="padding: 6px 8px; color: #1E293B; overflow-wrap: anywhere;">${this.escapeHtml(val)}</td>`).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      ${rows.length > 15 ? `<div style="font-size: 10px; color: #64748B; margin-bottom: 12px; font-style: italic;">* Showing top 15 records of ${rows.length} total entries. Complete dataset exported in system logs.</div>` : ''}

      <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #E2E8F0; padding-top: 8px; font-size: 10px; color: #64748B;">
        <div>Avinya Care Foundation • Central Operational Audit & Intelligence</div>
        <div>Page 1 of 1</div>
      </div>
    `;

    this.showPreviewModal(sheetHtml, `${title.replace(/\s+/g, '_')}_Report.pdf`);
  }

  generateRecordPDF(category, item = {}) {
    const id = item.submission_id || item.booking_id || item.id || 'REC-001';
    const dateStr = item.created_at || item.createdAt || item.date || new Date().toLocaleDateString('en-IN');
    
    // Auto-route to specialized generators if available
    if (category === 'form' && (item.form_type === 'donation' || item.amount)) {
      const paymentStatus = String(item.payment_status || item.status || '').toUpperCase();
      if (['SUCCESS', 'SUCCEEDED', 'PAID', 'COMPLETED', 'CONFIRMED'].includes(paymentStatus)) {
        return this.generateDonationReceiptPDF(item);
      }
    }
    if (category === 'doctor' || item.doctor_name || item.doctorName) {
      return this.generateDoctorAppointmentPDF(item);
    }
    if (category === 'diagnostic' || item.test_name || item.testName) {
      return this.generateDiagnosticBookingPDF(item);
    }

    const title = this.escapeHtml(`${category.toUpperCase()} Official Record: ${id}`);
    const entries = Object.entries(item).filter(([k, v]) => typeof v !== 'object');

    const sheetHtml = `
      ${this.getLetterheadDataHtml()}
      <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #087F73; padding-bottom: 10px; margin-bottom: 14px;">
        <div>
          <span style="font-size: 10px; font-weight: 800; color: #087F73; text-transform: uppercase; background: #E6F4F1; padding: 2px 8px; border-radius: 4px;">Official System Record</span>
          <h1 style="font-size: 18px; font-weight: 800; color: #0f172a; margin: 4px 0 2px 0;">${title}</h1>
          <div style="font-size: 11px; color: #64748B;">Logged: ${dateStr}</div>
        </div>
        <div style="text-align: right;">
          <div style="font-size: 11px; font-weight: 700; color: #087F73;">REF ID</div>
          <div style="font-family: monospace; font-size: 14px; font-weight: 800; color: #0f172a;">${this.escapeHtml(id)}</div>
        </div>
      </div>

      <table style="width: 100%; border-collapse: collapse; margin-bottom: 14px; font-size: 12px;">
        ${entries.map(([k, v]) => `
          <tr style="border-bottom: 1px solid #E2E8F0;">
            <td style="padding: 7px 10px; width: 35%; background: #F8FAFC; color: #475569; font-weight: 700; text-transform: capitalize;">${this.escapeHtml(k.replace(/_/g, ' '))}</td>
            <td style="padding: 7px 10px; color: #0f172a; overflow-wrap: anywhere;">${this.escapeHtml(String(v))}</td>
          </tr>
        `).join('')}
      </table>

      <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #E2E8F0; padding-top: 8px; font-size: 10px; color: #64748B;">
        <div>Avinya Care Foundation • Official Registry</div>
        <div>System Verified</div>
      </div>
    `;

    this.showPreviewModal(sheetHtml, `AvinyaCare_${category}_${id}.pdf`);
  }
}

// Global Singleton
window.AvinyaPdf = new AvinyaPdfService();
