const fs = require('fs');
let css = fs.readFileSync('src/app/globals.css', 'utf8');

// Change align-items: start to align-items: center
css = css.replace(
  `.art-hero { display: grid; grid-template-columns: 1fr 1fr; gap: 56px; align-items: start; }`,
  `.art-hero { display: grid; grid-template-columns: 1fr 1fr; gap: 56px; align-items: center; }`
);

// Change prose-wide max-width
css = css.replace(
  `.prose-wide { max-width: 840px; margin: 0 auto; }`,
  `.prose-wide { max-width: 100%; margin: 0; }`
);

fs.writeFileSync('src/app/globals.css', css);
console.log("Updated globals.css");
