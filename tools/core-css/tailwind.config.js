// Compiles the Stitch markup in tools/redesign/core/*.main.html into css/cp-core.css (scoped under .cpcore).
// Build: tailwindcss -c tools/core-css/tailwind.config.js -i tools/core-css/in.css -o out.raw.css; cat tools/core-css/extra.css >> out.raw.css; node tools/core-css/build.js
// Needs tailwindcss@3, @tailwindcss/forms, @tailwindcss/container-queries, postcss, postcss-prefix-selector, cssnano.
// css/cp-pricing.css holds only the extra rules the pricing page needs (diff of a full build against cp-core.css).
const fs = require('fs'), path = require('path');
const cfg = eval('(' + fs.readFileSync(path.join(__dirname, 'stitch-theme.cfg.js'), 'utf8') + ')');
module.exports = {
  darkMode: 'class', theme: cfg.theme, important: '.cpcore',
  content: [path.join(__dirname, '../redesign/core/*.main.html'), path.join(__dirname, '../../js/cp-core.js'), path.join(__dirname, '../../js/cp-pricing.js')],
  plugins: [require('@tailwindcss/forms'), require('@tailwindcss/container-queries')],
};
