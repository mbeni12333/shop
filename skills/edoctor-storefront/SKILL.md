---
name: edoctor-storefront
description: Build and maintain the EDoctor Next.js and WooGraphQL storefront, its France-to-Algeria hardware catalog, brand assets and Coolify deployment. Use for EDoctor work, not unrelated ecommerce projects.
---

# EDoctor storefront

EDoctor is a French company selling new computer hardware primarily to Algerian customers. Maintain the existing Next.js Pages Router, Apollo and WPGraphQL/WooGraphQL architecture. Do not replace catalog queries with REST. WordPress owns products, prices, stock, orders and blog content. The bridge only extends GraphQL metadata and handles the browser checkout session/contact workflow.

Locate the `shop` checkout before editing. The original references are in the sibling `website/edoctor-design-system` and `inspirations/brand` directories; the production assets and tokens are versioned in the repository. Never require the original absolute Windows path.

- For pages, components, copy or mascot compositions, read [design.md](references/design.md).
- For product research, CSV exports or images, read [catalog.md](references/catalog.md).
- For data flows, checkout, search, tests or deployment, read [operations.md](references/operations.md).

Use French storefront copy, EUR HT product presentation, contextual mascot art and the light purple identity. The blog may contain Arabic: preserve article language/direction and isolate French technical phrases. Do not translate the whole store implicitly.

Commercial claims are configuration, not creative copy. Never invent delivery deadlines, carrier coverage, sale prices, stock, customer reviews, guarantees or legal company details. Unconfigured payments remain disabled; unquoted export uses an advisor. A generated editorial illustration is never a product photograph.

Preserve public-page caching and isolate all customer data. Check the relevant tests and report precisely what was verified against fixtures versus live WooCommerce. A local successful build does not prove live payments or import compatibility.

This skill supplies project conventions, not permission to import a catalog, send customer messages, publish, deploy or modify production. Follow the authorization for the current request.
