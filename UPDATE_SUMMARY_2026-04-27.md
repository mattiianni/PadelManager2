# Update Summary - 2026-04-27

## Scope

Targeted mobile/PWA fixes and tournament-flow reliability updates completed in this session.

## Main Changes

- Fixed mobile overflow of the date field in linked tournament and team/playoff match forms.
- Improved team-tournament mobile action bars:
  back action compact on mobile, real left-arrow icon, better spacing for primary actions.
- Fixed `Modifica Risultati` for team tournaments by routing edit actions to the dedicated matchday page instead of the generic modal.
- Added a defensive fallback message in the generic results modal to avoid blank content when no renderable matches are available.
- Improved mobile/PWA header behavior:
  safer sticky positioning under iPhone safe area, tighter metadata spacing, and better scroll isolation.
- Fixed mobile sidebar layering so the drawer opens above the header while still respecting the iPhone safe area.

## Verification

- `npm run build` completed successfully.

## Notes

- Repository had no previous commits; this session creates the initial commit state.
- No remote was configured at the time of this update, so push may require repository remote setup.
