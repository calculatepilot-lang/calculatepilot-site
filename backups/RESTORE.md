# Homepage rollback

Snapshot point: main @ e47653ee31597c71f20afe966df83c8cd0dee5b7 (2026-09-13)

Branches:
- `backup/homepage-pre-redesign-2026-09-13` — pre-change main plus this note
- `design/homepage-precision-emerald` — new homepage CSS + index.html

To revert after merge:
1. Restore `index.html` from the backup branch (it is unchanged main homepage).
2. Delete or stop linking `/css/home-redesign.css`.
