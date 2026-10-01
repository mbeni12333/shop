# Design and content

Token source of truth: `tailwind.config.ts`; shared component rules: `src/styles/edoctor.css` using Tailwind layers. Original reference: `website/edoctor-design-system/theme.css` beside the checkout.

- Background #FCFBFE, surface #FFFFFF, pale purple #F2EDFC, text #242033, muted #686274, action #6840C6, hover #5330A6.
- System font, base 16px, four-pixel spacing grid, desktop content up to 1920px with responsive gutters, prose about 700px, 48px controls, visible focus and reduced motion. Use `page-section` for compact spacing below the header; do not add a large section gap before breadcrumbs.
- Light mode only. Do not resurrect the abandoned dark maintenance landing page.
- Keep ED's curly brown hair, round glasses, navy hoodie, white ED shirt and proportions. Choose a meaningful action: explaining a GPU, preparing a PC, comparing displays or advising a customer. No decorative mascot at payment.
- The home hero shows the full vector hardware composition in `public/brand/hardware-setup.svg`, without ED. Advice and contact use `ed-welcome.png`: full character, thumbs-up and welcoming hand. Keep heads, hands, feet and hardware completely visible; no half-screen or cropped mascot assets.
- Catalog and search filters share `FilterPanel`: a left sidebar on desktop and a disclosure on mobile. Keep results immediate, with URL persistence; controlled text inputs must not rely solely on asynchronous router updates. Restrict technical facets and brand choices to the chosen category.
- Category artwork uses the minimal but detailed flat vector hardware illustrations from the HTML design system: gray/purple filled shapes, visible hardware details and a subtle grounding shadow. Original screen/GPU SVGs and twelve matching illustrations live in `public/univers/vector`. Do not use ED poses or simple outline pictograms as category icons. Keep ED for editorial advice and export sections.
- Category links inside navigation dropdowns use the same detailed vector hardware illustrations as category cards, rendered at 80×58px within a 80×64px frame. Do not substitute outline pictograms or mascot poses. Compact icons in `src/edoctor/Icon.tsx` remain for navigation controls (20px) and the cart (24px). `Navigation.tsx` exposes all fourteen universes, eight component categories and four peripherals through click/keyboard disclosures; preserve Escape/focus restoration, outside-click dismissal and mobile route closure. Use the collapsed navigation below 1280px to avoid squeezing labels. Controls remain at least 44px tall.
- Real product photography must identify the exact reference. Universe artwork is editorial and labelled as such. Preserve alpha in product PNG masters; SVG category art remains vector.
- Use warm, specific, restrained French. Position EDoctor as a human advisor for new hardware and France-to-Algeria export. Avoid unsupported superlatives and fabricated guarantees.
- Blog: `lang=ar`, `dir=rtl` per Arabic article; use `<bdi dir="ltr">RTX 5070 Ti</bdi>` for mixed fragments and CSS logical properties.

For a new category, update the catalog category mapping, routes, index facets, import taxonomy and representative mobile tests together. Reuse shared Shell, ProductCard and Catalog components.
