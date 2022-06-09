module.exports = {
  title: 'Richie',
  tagline: 'A CMS for Open Education',
  url: 'https://richie.education',
  baseUrl: '/',
  organizationName: 'openfun',
  projectName: 'richie',
  scripts: ['https://buttons.github.io/buttons.js'],
  customFields: {
    users: [
      {
        caption: 'France Université Numérique',
        image: '/img/users/fun.svg',
        infoLink: 'https://www.fun-mooc.fr',
        pinned: true,
      },
      {
        caption: 'NAU',
        image: '/img/users/nau.svg',
        infoLink: 'https://www.nau.edu.pt',
        pinned: true,
      },
      {
        caption: 'EDUlib',
        image: '/img/users/edulib.png',
        infoLink: 'https://catalogue.edulib.org/',
        pinned: true,
      },
    ],
    repoUrl: 'https://github.com/openfun/richie',
  },
  onBrokenLinks: 'log',
  onBrokenMarkdownLinks: 'log',
  presets: [
    [
      '@docusaurus/preset-classic',
      {
        docs: {
          showLastUpdateAuthor: true,
          showLastUpdateTime: true,
          path: '../docs',
          sidebarPath: './sidebars.json',
        },
        blog: {},
        theme: {
          customCss: [require.resolve('./src/css/customTheme.css')],
        },
      },
    ],
  ],
  plugins: [],
  themeConfig: {
    navbar: {
      title: 'Richie',
      items: [
        {
          to: 'docs/discover',
          label: 'Documentation',
          position: 'left',
        },
        {
          type: 'docsVersionDropdown',
          position: 'left',
          dropdownItemsAfter: [{ to: '/versions', label: 'All versions' }],
          dropdownActiveClassDisabled: true,
        },
        {
          to: '/help',
          label: 'Help',
          position: 'left',
        },
        {
          href: 'https://github.com/openfun/richie',
          label: 'GitHub',
          position: 'left',
        },
      ],
    },
    image: 'img/undraw_online.svg',
    footer: {
      links: [
        {
          title: 'Documentation',
          items: [
            {
              label: 'Getting started',
              to: 'docs/discover',
            },
            {
              label: 'Versions',
              to: 'versions',
            },
            {
              label: 'Contributing',
              to: 'docs/installation',
            },
          ],
        },
        {
          title: 'Community',
          items: [
            { label: 'User Showcase', to: 'users' },
            { label: 'GitHub', href: 'https://github.com/openfun/richie' },
          ],
        },
      ],
      copyright: 'Creative Commons 2022 — Richie contributors / Illustrations Katerina Limpitsouni',
    },
  },
};
