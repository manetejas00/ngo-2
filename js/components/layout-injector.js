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
      const response = await fetch(fetchUrl);
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
    injectComponent('REUSABLE_NAVBAR', '/components/navbar.html'),
    injectComponent('REUSABLE_FOOTER', '/components/footer.html')
  ]);

  // Re-initialize GSAP Navbar and Radial FAB Menu if they were just injected
  if (navbarInjected) {
    const initNavbarEngine = () => {
      if (typeof AvinyaGsapNavbar !== 'undefined') {
        window.AvinyaNavbarEngine = new AvinyaGsapNavbar();
      }
    };
    if (typeof AvinyaGsapNavbar !== 'undefined') {
      initNavbarEngine();
    } else {
      const script = document.createElement('script');
      script.src = '/js/components/navbar-gsap.js?v=3.5';
      script.onload = initNavbarEngine;
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
    document.querySelectorAll('[data-site-setting]').forEach((node) => {
      const key = node.dataset.siteSetting;
      const value = settings[key];
      if (!value) return;
      if (key === 'phone') {
        node.textContent = value;
        if (node.tagName === 'A') node.href = `tel:${value.replace(/[^+\d]/g, '')}`;
      } else if (key === 'email') {
        node.textContent = value;
        if (node.tagName === 'A') node.href = `mailto:${value}`;
      } else if (key === 'whatsapp') {
        if (node.tagName === 'A') {
          const rawDigits = value.replace(/\D/g, '');
          node.href = value.startsWith('http') ? value : `https://wa.me/${rawDigits}`;
          if (node.textContent.includes('wa.me/') || node.textContent.includes('WhatsApp:')) {
            node.textContent = `WhatsApp: wa.me/${rawDigits}`;
          }
        } else {
          node.textContent = value;
        }
      } else if (['instagram_url', 'facebook_url', 'linkedin_url', 'youtube_url'].includes(key)) {
        if (node.tagName === 'A') {
          node.href = value;
        } else {
          node.textContent = value;
        }
      } else {
        node.textContent = value;
      }
    });
  } catch (_) {
    // Defaults embedded in the layout keep the public site usable if storage is down.
  }
});
