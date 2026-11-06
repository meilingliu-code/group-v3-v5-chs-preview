# GROUP V3/V5 — V4 working preview

https://meilingliu-code.github.io/group-v3-v5-chs-preview/versions/v4/

Created from completed V3 commit cf09dbfc746234f3b4085adc59fcab6d8f14714d. V0–V3, the CHS study, and original reference studies are preserved. Continue editing V4.

The pause illustration contains only a vertically centered P key and bold “Press P to pause.” Existing narration, animations, timing, and review safeguards are preserved.

## Optional camera preview

V4 now provides an opt-in, local-only camera check with camera selection. It follows the setup/display/cleanup pattern of CHS `exp-lookit-webcam-display`, implemented using browser media APIs rather than the Ember/CHS recording service. It requests video only after Enable camera is clicked, stops tracks on navigation or hiding the page, and never records, stores, or uploads the stream. Recording and response collection remain disabled.

Reference: https://lookit.readthedocs.io/projects/frameplayer/en/latest/components/exp-lookit-webcam-display/doc.html

Researcher skips are available on every page and never count as passed practice.

## Attention getters and calibration

The supplied calibration clip plays once at the start. The supplied shapes and blue-stars clips alternate in the 14 existing attention-getter slots immediately before infant-controlled trials. Each clip automatically advances to its trial. Original trial ordering and measurement delays are unchanged. See attention-getters.json for source filenames and reference-video timestamps.
