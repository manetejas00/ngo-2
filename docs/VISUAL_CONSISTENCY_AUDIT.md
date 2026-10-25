# Public website visual consistency review

Reviewed 26 October 2026. Shared stylesheet: `css/public-theme.css`.

| Before | After | Why |
| --- | --- | --- |
| Teal, blue and green branding varied by page | Orange accents, charcoal surfaces and white reading cards | Consistent foundation identity |
| White labels on bright orange buttons | Charcoal labels on orange | 6.34:1 contrast for the primary pairing |
| Dark team names on dark cards | Light names on charcoal cards | Readable profile entry points |
| Green-tinted information cards | White cards, dark headings and gray body text | Clear reading hierarchy |
| Low-contrast crowdfunding notes | Light gray notes on dark cards | Important project information remains readable |
| Different popup and footer palettes | Shared typography, colors, focus rings and controls | Continuity across pages and interactions |

## Coverage

Home, About, Assistance, Health Camp, Diagnostic Tests / Doctors, Crowdfunding,
Gallery, Get Involved, Events, Transparency, Donation Guide, Privacy, Terms,
Coming Soon, Response, and Node/PHP diagnostic-detail templates.

The admin workspace retains its separate operational theme. Email templates are unchanged.

## Verification

- Browser review at a 491px mobile viewport: no horizontal page overflow on the 15 public entry pages.
- Read-only computed-style sampling checked headings, paragraphs, buttons, links, labels and small text on solid backgrounds. Reported low-contrast pairs were corrected. This is a focused check, not a complete accessibility certification; image backgrounds, gradients, alpha blending and every interactive state require visual review.
- Primary text pairs: charcoal/orange 6.34:1, gray/white 7.00:1, light gray/charcoal 9.44:1, dark orange/white 6.79:1.
- Team modal opened and closed successfully, with readable profile copy and controls.
- Existing responsive breakpoints retained. Desktop and additional phone sizes should remain in the manual release checklist.

## Manual release checks

- Inspect desktop navigation, mobile menu and footer on light and dark pages.
- Review hero image overlays after scroll animations finish.
- Check form labels, input text, focus, errors, success and disabled states.
- Verify gallery category filters and media dialogs, diagnostic filters and booking dialogs, campaign filters and contribution forms.
- Confirm the health-camp countdown and registration section remain readable.
- Hard refresh once after deployment to receive the updated style versions.

## Home hero exception

The home page and its response-page copy retain their original stylesheet stack. The shared public theme is intentionally excluded so the original hero appearance, scroll story, media and controls remain unchanged. Other public pages retain the consistency update.
