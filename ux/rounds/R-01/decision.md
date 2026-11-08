# R-01 decision: Should `withProductSite` add a built-in, offline search field to the navbar of every product site?

Finding: UXF-005. Target metric: `layout.optional_missing`, now 12 per view (every page at every
viewport and theme, 120 in the round), expected 0.

Yes: the template ships a local search (index built at `docusaurus build`, no network, no keys) with
its field in the navbar, and the adapter's search entry becomes required, so gate 2 holds it on every
merge. Every consuming build gains an index step and a dependency. At 1024x768 the navbar is already
full: with the field in, the product title shrinks to "C." (shot). shot: shots/decision-yes.png
(field mocked into the page, not built)

No: the navbar stays as it is; readers find pages through the navbar, sidebar and in-page links, which
the screen-only user did for all three cards. A product site that wants search adds its own plugin,
and the gate reports it once it is there. shot: shots/decision-no.png

Default if unanswered by the next round: no, because it adds a dependency and a build step to every
consuming repository, and that is a product call, not one a round makes by default.

Answer:
