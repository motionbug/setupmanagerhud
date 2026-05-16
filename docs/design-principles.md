# Dashboard Design Principles

Setup Manager HUD is an IT operations console for Jamf and Apple admins. It should feel reliable, fast, and easy to scan during active device enrollment work.

## Product Shape

- Build the usable dashboard first. Do not turn this project into a marketing site.
- Prioritize live operational clarity over decorative composition.
- Favor dense but organized information: KPIs, charts, filters, and tables should remain visible without excessive scrolling.
- Make failure states obvious without making the entire interface feel alarmist.

## Layout

- Keep dashboard sections as full-width page structure with constrained inner content.
- Use cards/panels for repeated data groups and framed tools, not nested decorative sections.
- Tables must remain readable at a glance. Preserve stable column widths, tabular numbers, and enough row density for repeated monitoring.
- Charts should support comparison and trend detection. Avoid chart motion that competes with live event updates.

## Motion

- High-frequency interactions should be instant or nearly instant.
- Use animation only when it improves feedback, spatial continuity, or error comprehension.
- Avoid `transition-all`; transition specific properties.
- Avoid `ease-in` for UI entrances. Prefer strong ease-out curves for appearing elements.
- Keep most UI transitions under 300ms. Button press feedback should be roughly 100-160ms.
- Pressable controls should include subtle active feedback such as a small scale change.

## Typography

- Use uppercase labels sparingly and with enough letter spacing for quick scanning.
- Reserve underlines for links.
- Use weight, size, and color for hierarchy before adding decorative text treatments.
- Keep dashboard panel headings compact; reserve large type for page-level identity only.

## Cloudflare-Aware UX

- If D1 or Durable Objects are degraded, show a direct operational warning instead of letting the dashboard look empty.
- Keep Cloudflare Access, webhook token, D1 binding, and migration setup language precise in docs.
- Avoid exposing sensitive deployment values in screenshots, docs, tests, or examples.
