import { screen } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { render } from 'utils/test/render';
import { PresentationalAppWrapper } from 'utils/test/wrappers/PresentationalAppWrapper';
import SearchBar from '.';

describe('Dashbaord/components/SearchBar', () => {
  it('should render', () => {
    render(<SearchBar onSubmit={jest.fn()} />, { wrapper: PresentationalAppWrapper });
    expect(screen.getByRole('textbox', { name: /Search/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Search/ })).toBeInTheDocument();
  });

  it('should call onSubmit callback', async () => {
    const onSubmit = jest.fn();
    render(<SearchBar onSubmit={onSubmit} />, { wrapper: PresentationalAppWrapper });

    const user = userEvent.setup();
    await user.type(screen.getByRole('textbox', { name: /Search/ }), 'text query');
    await user.click(screen.getByRole('button', { name: /Search/ }));

    expect(onSubmit).toHaveBeenNthCalledWith(1, 'text query');
  });
});
