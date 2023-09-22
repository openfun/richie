import { fireEvent, within } from '@testing-library/dom';
import { act } from '@testing-library/react';
import userEvent, { UserEvent } from '@testing-library/user-event';

export const changeSelect = async (
  $input: HTMLElement,
  value: string,
  user: UserEvent = userEvent.setup(),
) => {
  await userEvent.click($input);
  const $selectListBox = within($input.closest('.c__field')!).getByRole('listbox');
  await user.click(
    within($selectListBox).getByRole('option', {
      name: value,
    }),
  );
};

export const clearSelect = async ($input: HTMLElement) => {
  await act(async () => {
    fireEvent.click(
      within($input.closest('.c__field')!).getByRole('button', { name: 'Clear selection' }),
    );
  });
};
