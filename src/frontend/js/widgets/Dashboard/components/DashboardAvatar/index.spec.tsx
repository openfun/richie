import { render } from '@testing-library/react';
import { UserFactory } from 'utils/test/factories/richie';
import { User } from 'types/User';
import { DashboardAvatar } from '.';

describe('<DashboardAvatar/>', () => {
  it('should work with empty username', () => {
    const user: User = UserFactory().one();
    user.username = '';
    render(<DashboardAvatar user={user} />);
    const container = document.querySelector('.dashboard__avatar')!;
    expect(container.textContent).toEqual('');
  });

  it('should display the first letter of username', () => {
    const user: User = UserFactory().one();
    user.username = 'Bob';
    render(<DashboardAvatar user={user} />);
    const container = document.querySelector('.dashboard__avatar')!;
    expect(container.textContent).toEqual('B');
  });
});
