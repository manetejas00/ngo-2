/**
 * Avinya Care Foundation - Client-Side Layout Injector
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
  if (navbarInjected && typeof AvinyaGsapNavbar !== 'undefined') {
    window.AvinyaNavbarEngine = new AvinyaGsapNavbar();
  }
  if (footerInjected && typeof window.initRadialMenu === 'function') {
    window.initRadialMenu();
  }
});
