/**
 * AvinyaCareFoundation - Client-Side Layout Injector
 * 
 * Safely injects reusable Navbar and Footer components into the DOM when the site 
 * is served statically (e.g. Hostinger LiteSpeed) where Node.js SSI is bypassed.
 */
document.addEventListener('DOMContentLoaded', async () => {
  async function injectComponent(commentKeyword, fetchUrl) {
    // 1. Locate the exact comment node in the DOM
    const iterator = document.createNodeIterator(
      document.body,
      NodeFilter.SHOW_COMMENT,
      null,
      false
    );

    let targetNode = null;
    let currentNode;
    while ((currentNode = iterator.nextNode())) {
      if (currentNode.nodeValue.trim() === commentKeyword) {
        targetNode = currentNode;
        break;
      }
    }

    if (!targetNode) return false;

    // 2. Fetch the component HTML
    try {
      const response = await fetch(`${fetchUrl}?v=4.3.5`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const htmlString = await response.text();

      // 3. Convert string to DOM nodes
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = htmlString.trim();

      // 4. Safely insert nodes before the comment without destroying the document
      const parent = targetNode.parentNode;
      while (tempDiv.firstChild) {
        parent.insertBefore(tempDiv.firstChild, targetNode);
      }

      // 5. Remove the comment node
      parent.removeChild(targetNode);
      return true;

    } catch (error) {
      console.error(`[Layout Injector] Failed to load ${commentKeyword}:`, error);
      return false;
    }
  }

  // Inject both components concurrently
  const [navbarInjected, footerInjected] = await Promise.all([
    injectComponent('REUSABLE_NAVBAR', '/components/navbar'),
    injectComponent('REUSABLE_FOOTER', '/components/footer')
  ]);

  // Re-initialize GSAP Navbar and Radial FAB Menu if they were just injected
  if (navbarInjected) {
    const initNavbarEngine = () => {
      if (typeof AvinyaGsapNavbar !== 'undefined') {
        if (typeof initSocialDropdown === 'function') initSocialDropdown();
        window.AvinyaNavbarEngine = new AvinyaGsapNavbar();
      }
    };
    if (typeof AvinyaGsapNavbar !== 'undefined') {
      initNavbarEngine();
    } else {
      const script = document.createElement('script');
      script.src = '/js/components/navbar-gsap.js?v=4.3.2';
      script.onload = () => { if (!window.AvinyaNavbarEngine) initNavbarEngine(); };
      document.body.appendChild(script);
    }
  }
  if (footerInjected && typeof window.initRadialMenu === 'function') {
    window.initRadialMenu();
  }

  // Apply only administrator-managed identity/contact values.  Page copy,
  // navigation and API/system data intentionally remain outside this setting.
  try {
    const response = await fetch('/api/site-settings.php', { cache: 'no-store' });
    const payload = await response.json();
    const settings = payload?.settings;
    if (!response.ok || !settings) return;
    function isValidSocialUrl(val) {
      if (!val || typeof val !== 'string') return false;
      const t = val.trim();
      if (!t || t === '#' || t.toLowerCase() === 'pending') return false;
      // Do not accept bare generic root domain without account/handle
      if (/^https?:\/\/(www\.)?(facebook\.com|linkedin\.com|instagram\.com|youtube\.com|threads\.(com|net)|x\.com|twitter\.com)\/?$/i.test(t)) return false;
      try {
        const u = new URL(t);
        return u.protocol === 'http:' || u.protocol === 'https:';
      } catch (_) {
        return false;
      }
    }

    function getVerifiedWhatsAppDigits(val) {
      if (!val || typeof val !== 'string') return null;
      const digits = val.replace(/\D/g, '');
      if (digits.length === 10) return '91' + digits; // Add default India country code
      if (digits.length >= 11 && digits.length <= 15) return digits;
      return null;
    }

    window.AvinyaSiteSettings = settings;

    document.querySelectorAll('[data-site-setting]').forEach((node) => {
      const key = node.dataset.siteSetting;
      const value = settings[key];

      if (key === 'phone') {
        if (!value) return;
        node.textContent = value;
        if (node.tagName === 'A') node.href = `tel:${value.replace(/[^+\d]/g, '')}`;
      } else if (key === 'email') {
        if (!value) return;
        node.textContent = value;
        if (node.tagName === 'A') node.href = `mailto:${value}`;
      } else if (key === 'whatsapp') {
        const digits = getVerifiedWhatsAppDigits(value);
        if (digits) {
          if (node.tagName === 'A') {
            node.href = `https://wa.me/${digits}`;
            if (node.textContent.includes('wa.me/') || node.textContent.includes('WhatsApp:')) {
              node.textContent = `WhatsApp: wa.me/${digits}`;
            }
          } else {
            node.textContent = value;
          }
          node.style.display = '';
          node.removeAttribute('hidden');
        } else if (value === undefined || value === null) {
          // Setting not returned by API — retain valid hardcoded link from HTML
          const fallback = node.getAttribute('href');
          if (fallback && fallback.includes('wa.me/')) {
            node.style.display = '';
            node.removeAttribute('hidden');
          }
        } else {
          // Explicitly cleared by administrator
          node.style.display = 'none';
          node.setAttribute('hidden', '');
        }
      } else if (['instagram_url', 'youtube_url', 'facebook_url', 'linkedin_url', 'threads_url', 'x_url', 'twitter_url'].includes(key)) {
        if (isValidSocialUrl(value)) {
          if (node.tagName === 'A') {
            node.href = value.trim();
          } else {
            node.textContent = value.trim();
          }
          node.style.display = '';
          node.removeAttribute('hidden');
        } else if (value === undefined || value === null) {
          // Backend did not provide this key yet (e.g. cached settings or new platform)
          // NEVER hide an element if it already has a valid hardcoded fallback URL in href!
          const fallback = node.getAttribute('href');
          if (isValidSocialUrl(fallback)) {
            node.style.display = '';
            node.removeAttribute('hidden');
          } else {
            node.style.display = 'none';
            node.setAttribute('hidden', '');
          }
        } else if (value === '' || value === '#' || value.toLowerCase() === 'pending') {
          // Explicitly removed by administrator
          node.style.display = 'none';
          node.setAttribute('hidden', '');
        } else {
          // Invalid format from admin - check fallback href
          const fallback = node.getAttribute('href');
          if (isValidSocialUrl(fallback)) {
            node.style.display = '';
            node.removeAttribute('hidden');
          } else {
            node.style.display = 'none';
            node.setAttribute('hidden', '');
          }
        }
      } else {
        if (value) node.textContent = value;
      }
    });
  } catch (_) {
    // Defaults embedded in the layout keep the public site usable if storage is down.
  }
});
