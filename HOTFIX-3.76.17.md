# FormAI 3.76.17

This repository contains a compiled static distribution, not the current application source or the Cloud Run backend. These targeted fixes apply to the distribution uploaded at `ed805cb51afa60877e9497c670f57e2d2a79836a`. Port them to the source before the next build, or a later upload can overwrite them.

## Changes

- `actions-D6Wf0Sxp.js`: explicit food masses are converted to fractional pieces without rounding to half-pieces or tenths. Fractional pieces with a known reference mass display as grams. Using the existing catalog, 100 g banana gives 88 kcal and 200 g gives 175 kcal; this is still a catalog estimate, not laboratory precision.
- `start-BRLivjHr.js`: the weekly training summary uses the existing hours-and-minutes formatter. Three 45-minute sessions show 2 h 15 min.
- `Sestavi-f9G-etRO.js`: introductory weekly volume preserves hundredths of an hour rather than rounding to half-hours. Planning constraints and prescribed sessions are unchanged.
- `Prehrana-DNMBZnT3.js`: unlogged meals say "ni vpisa"; the evening notice no longer implies the person did not eat. English and German translations use fresh asset URLs.
- `pager-Dj7_ZNIM.js`: an additional finger during a drag cancels and settles the gesture. Disposing the pager clears an in-progress translation and overlays.
- `index-CVr2kr2U.js` and `sw.js`: version 3.76.17 and explicit content revisions for changed precached modules. Existing installed clients use the app's normal service-worker update flow. Uncontrolled browser caches can retain same-path assets until their HTTP cache expires.

## Repeatable checks

With Node 20 or newer:

```sh
npm install --prefix tests
npm test --prefix tests
```

The tests execute the shipped calculation functions, routing predicates and pager module. Food cases cover grams, kilograms, decagrams, comma-separated amounts, fractions, pieces, multipliers and mixed ingredients. Pager tests cover both directions, boundaries, short/vertical/cancelled gestures, an extra finger, blocked inputs/modals, rapid navigation, disposal and reduced motion. Module syntax, direct imports, language URLs and service-worker revision digests are also checked.

The pager tests use jsdom and synthetic touch events. They validate route/state/cleanup behavior, not frame rate, device rendering or real iOS/Android gesture recognition.

## Manual checks and limits

Guest onboarding, plan creation and reload persistence, all five main tabs, exercise detail, nutrition entry, coach/activity/settings screens and 390 px overflow were checked in the browser. The local HTTP preview was unreachable in the available environment; post-deployment browser checks are required for the changed UI.

Authenticated AI, billing, wearable OAuth, account deletion, notifications and real device performance are not certified by this hotfix. The server code was unavailable. In particular, the existing Strava/Wahoo authentication flow places a Firebase ID token in the authorization URL; replacing that flow requires a compatible backend change to exchange an authenticated POST for a short-lived one-use redirect. No unsupported backend endpoint was invented here.
