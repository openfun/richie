// List of projects/orgs using your project for the users page.
const users = [
  {
    caption: 'France Université Numérique',
    image: '/img/users/funmooc.png',
    infoLink: 'https://www.fun-mooc.fr',
    pinned: true,
  },
  {
    caption: 'EDUlib',
    image: '/img/users/edulib.png',
    infoLink: 'https://cours.edulib.org/',
    pinned: true,
  },
  {
    caption: 'CEA',
    image: '/img/users/cea.jpg',
    infoLink: 'https://github.com/cea-instn/instart',
    pinned: true,
  },
];

const repoUrl = 'https://github.com/openfun/richie';

module.exports = {
  // General website information
  title: 'Richie',
  tagline: 'A CMS for Open Education',
  url: 'https://richie.education',
  baseUrl: '/',

  // Github information, used to publish the website
  projectName: 'richie',
  organizationName: 'openfun',

  // For no header links in the top nav bar -> headerLinks: [],
  headerLinks: [
    { href: '/', label: 'Home' },
    { href: repoUrl, label: 'GitHub' },
    { doc: 'quick-start', label: 'Documentation' },
    { page: 'help', label: 'Help' },
  ],

  // If you have users set above, you add it here:
  users,

  /* path to images for header/footer */
  headerIcon: undefined,
  footerIcon: undefined,
  favicon: undefined,

  /* Colors for website */
  colors: {
    primaryColor: '#028074',
    secondaryColor: '#483d8b',
  },

  // This copyright info is used in /core/Footer.js and blog RSS/Atom feeds.
  copyright: `Creative Commons ${new Date().getFullYear()} — Richie contributors / Illustrations Katerina Limpitsouni`,

  highlight: {
    // Highlight.js theme to use for syntax highlighting in code blocks.
    theme: 'default',
  },

  // Add custom scripts here that would be placed in <script> tags.
  scripts: ['https://buttons.github.io/buttons.js'],

  // On page navigation for the current documentation page.
  onPageNav: 'separate',
  // No .html extensions for paths.
  cleanUrl: true,

  // Open Graph and Twitter card images.
  ogImage: 'img/undraw_online.svg',
  twitterImage: 'img/undraw_tweetstorm.svg',

  // For sites with a sizable amount of content, set collapsible to true.
  // Expand/collapse the links and subcategories under categories.
  // docsSideNavCollapsible: true,

  // Show documentation's last contributor's name.
  // enableUpdateBy: true,

  // Show documentation's last update time.
  enableUpdateTime: true,

  // You may provide arbitrary config keys to be used as needed by your
  // template. For example, if you need your repo's URL...
  repoUrl: repoUrl,
};
