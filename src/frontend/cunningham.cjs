/* Custom Cunningham Tokens for Richie

   In a child project, you can override those tokens by creating a token file like this one,
   merge your custom tokens with default Richie ones then by using cunningham cli to generate
   sass and ts tokens files (take a look to the `build-theme` command within package.json
   see it in action).

   E.g:
     const tokens = require('richie-education/cunningham.cjs')
     module.exports = {
       theme: {
          ...tokens.theme
          colors: {
            ...tokens.colors,
            'your-black': '#1E1E1E',
          },
       },
*/

module.exports = {
  theme: {
    font: {
      families: { base: 'Hind', accent: 'Montserrat' },
    },
    colors: {
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
    },
  },
};
