# R-02 decision: Should the shared theme raise every key-data text (status badges, KPI and table headers, sidebar group labels, graph kickers, navbar links) to at least 14 px?

Finding: UXF-007. Target metric: type.key_data_under_14px (text elements of key data with a computed size under 14 px), now 75 on the status page of the example site at 1366x768 (measured by the shot script, every text element under 14 px in main, navbar and sidebar), expected 0.

Yes: the theme sets a 14 px floor on those classes. Denser pieces (status table, graph node kickers, KPI tiles) grow and wrap earlier; narrow tables scroll sideways sooner at 390 px. shot: shots/decision-yes.png (14 px forced on the live page, nothing rebuilt)

No: the type scale stays; readers who need larger text use browser zoom. shot: shots/decision-no.png

Default if unanswered by the next round: yes, because heuristic 15 (key data at 14 px or more) is the loop's own rule, every sampled site shows the same small status and table text, and the change is reversible by one CSS value.

Answer:
