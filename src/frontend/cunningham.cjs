/* Custom Cunningham Tokens for Richie

   In a child project, you can override those tokens by creating a token file like this one,
   merge your custom tokens with default Richie ones then by using cunningham cli to generate
   sass and ts tokens files (take a look to the `build-theme` command within package.json
   see it in action).

   E.g:
     const tokens = require('richie-education/cunningham.cjs')
     module.exports = {
       theme: {
          ...tokens.themes.default
          colors: {
            ...tokens.colors,
            'your-black': '#1E1E1E',
          },
       },
*/

module.exports = {
  themes: {
    default: {
      theme: {
        font: {
          families: { base: 'Hind', accent: 'Montserrat' },
        },
        colors: {
          'primary-100': '#ffcad1',
          'primary-200': '#f19597',
          'primary-300': '#e86a6f',
          'primary-400': '#f2444b',
          'primary-500': '#f72c30',
          'primary-600': '#e81f2f',
          'primary-700': '#d60f29',
          'primary-800': '#c90022',
          'primary-900': '#bb0014',
          'secondary-100': '#eff8ff',
          'secondary-200': '#eaf3fd',
          'secondary-300': '#e2ebf5',
          'secondary-400': '#c0c9d3',
          'secondary-500': '#a3abb4',
          'secondary-600': '#79818a',
          'secondary-700': '#656c75',
          'secondary-800': '#454d55',
          'secondary-900': '#242b32',
          black: '#090909',
          'dark-grey': '#232323',
          charcoal: '#29303b',
          'slate-grey': '#686868',
          'battleship-grey': '#686f7a',
          'light-grey': '#d2d2d2',
          silver: '#d5dbe0',
          azure2: '#eceff1',
          smoke: '#fdfdfd',
          white: '#ffffff',
          denim: '#0067b7',
          firebrick6: '#f72c30',
          'purplish-grey': '#726c74',
          grey32: '#525151',
          grey59: '#969696',
          grey87: '#dfdfdf',
          indianred3: '#df484b',
          midnightblue: '#141b2c',
          mantis: '#76ce68',
          'mantis-darken': '#006908',
        },
      },
      components: {
        tabs: {
          'border-bottom-color': 'ref(theme.colors.greyscale-300)',
        },
        button: {
          'font-family': 'Montserrat',
        },
        dashboardListAvatar: {
          saturation: 30,
          lightness: 55,
        },
      },
    },
  },
};
