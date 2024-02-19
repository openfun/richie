import { Meta, StoryObj } from '@storybook/react';
import { PropsWithChildren } from 'react';
import { tokens } from 'utils/cunningham-tokens';
import DashboardListAvatar from '.';

export default {
  component: DashboardListAvatar,
} as Meta<typeof DashboardListAvatar>;

type Story = StoryObj<typeof DashboardListAvatar>;

const names = [
  'Misty Lesch',
  'Jo Schoen',
  'Ida Goyette',
  'Robin Carroll',
  'Dr. Natalie Kutch',
  'Warren Schiller',
  'Mr. Delbert Rogahn',
  'Neal Kshlerin',
  'Virginia Kuhlman',
  'Robert Baumbach',
  'Kenneth Okuneva',
  'Joe Raynor',
  'Edmond Hegmann',
  'Jaime Huels',
  'Marcos Schaden',
  'Antoinette Dietrich',
  'Lynn Jast',
  'Mrs. Edith Schamberger',
  'Dr. Leo Huels',
  'Lena Wilkinson',
  'Corey Schmidt',
  'Constance Wyman',
  'Stacy Nolan-Rempel',
  'Jo Rowe',
  'Mike Swift',
  'Yvonne Kutch V',
  'Norma Bahringer-Wiegand I',
  'Randy Berge-Goldner',
  'Gayle Denesik',
  'Kristina Stracke',
  'Kenneth Greenholt',
  'Margarita Bergstrom',
  'Kim Herman DDS',
  'Beatrice Rodriguez',
  'Lori Balistreri',
  'Priscilla Dietrich-Frami',
  'Mr. Laurence Welch',
  'Harold Pollich',
  'Percy Grimes',
  'Colin Ryan',
  'Maxine Bogisich I',
  'Vernon Hamill',
  'Ms. Eva Gusikowski',
  'Mrs. Phyllis Swaniawski',
  'Bobbie Kilback',
  'Dr. Roberto Bayer',
  'Pam Waters-Ankunding',
  'Gabriel White DVM',
  'Danny Little',
  'Leonard Ratke',
  'Jeremy Nicolas',
  'Ora Macejkovic PhD',
  'Jacquelyn Kuhlman',
  'Hattie Satterfield',
  'Tricia Heaney-Jacobson',
  'Mamie Smitham',
  'Cedric Collins',
  'Myrtle Oberbrunner IV',
  'Olga Bernier Sr.',
  'Isaac Reichel-Zieme MD',
];

const DashboardListAvatarList = ({ title, children }: PropsWithChildren<{ title: string }>) => {
  return (
    <div>
      <h2 style={{ marginBottom: '1em' }}>{title}</h2>
      <div
        style={{
          display: 'grid',
          gap: '1rem',
          gridTemplateColumns: 'repeat(15, minmax(max-content, 1fr))',
        }}
      >
        {children}
      </div>
    </div>
  );
};

export const Default: Story = {
  render: () => {
    const colorSettingList = [
      {
        title: `Current: saturation ${tokens.themes.default.components.dashboardListAvatar.saturation}, lightness: ${tokens.themes.default.components.dashboardListAvatar.lightness}`,
        saturation: tokens.themes.default.components.dashboardListAvatar.saturation,
        lightness: tokens.themes.default.components.dashboardListAvatar.lightness,
      },
      {
        title: 'saturation 50, lightness: 55',
        saturation: 50,
        lightness: 55,
      },
      {
        title: 'saturation 40, lightness: 55',
        saturation: 40,
        lightness: 55,
      },
      {
        title: 'saturation 35, lightness: 55',
        saturation: 35,
        lightness: 55,
      },
      {
        title: 'saturation 30, lightness: 55',
        saturation: 30,
        lightness: 55,
      },
    ];

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2em' }}>
        {colorSettingList.map(({ title, ...colorSetting }) => (
          <DashboardListAvatarList title={title}>
            {names.map((name) => (
              <DashboardListAvatar title={name} {...colorSetting} />
            ))}
          </DashboardListAvatarList>
        ))}
      </div>
    );
  },
};
