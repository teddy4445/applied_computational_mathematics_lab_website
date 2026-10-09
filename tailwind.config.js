// Tailwind build for the ACML site (replaces the Tailwind CDN script).
// css/tailwind.css         -> pages that load js/main.js (lab colours and corner radii)
// css/tailwind-default.css -> sock.html (Tailwind's default theme, as before)
// Rebuild after adding or changing Tailwind classes:  npm install  then  npm run build:css
const shared = {
  content: ['./*.html', './js/*.js', './data/*.json', './tools/templates/*.html'],
  // main.js builds these badge classes from a colour name at run time
  safelist: ['blue', 'green', 'purple', 'orange', 'indigo'].flatMap((c) => [`bg-${c}-100`, `text-${c}-800`]),
};

const labTheme = {
  extend: {
    colors: {
      primary: '#2563eb',
      secondary: '#f43f5e',
    },
    borderRadius: {
      none: '0px',
      sm: '4px',
      DEFAULT: '8px',
      md: '12px',
      lg: '16px',
      xl: '20px',
      '2xl': '24px',
      '3xl': '32px',
      full: '9999px',
      button: '8px',
    },
  },
};

module.exports = process.env.TAILWIND_THEME === 'default' ? { ...shared } : { ...shared, theme: labTheme };
