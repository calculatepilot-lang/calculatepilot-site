// Tailwind config for the Stitch "Guide Article" template (scoped to .cpguide).
// rebuild.sh copies this next to node_modules and sets CP_ROOT to the repo root.
const fs = require('fs'), path = require('path');
const R = process.env.CP_ROOT;
const cfg = eval('(' + fs.readFileSync(path.join(R, 'tools/guides/css/guide-theme.cfg.js'), 'utf8') + ')');
module.exports = {
  darkMode: 'class', theme: cfg.theme, important: '.cpguide',
  content: [path.join(R, 'tools/guide_build.py'), path.join(R, 'js/cp-guide.js')],
  plugins: [require('@tailwindcss/forms'), require('@tailwindcss/container-queries')],
};
