import { screen, within } from '@testing-library/dom';
import userEvent, { UserEvent } from '@testing-library/user-event';

export const changeSelect = async (
  $input: HTMLElement,
  value: string,
  user: UserEvent = userEvent.setup(),
) => {
  await userEvent.click($input);
  const $label = document.getElementById($input.getAttribute('aria-labelledby')!)!;
  const inputName = $label.textContent!;
  const $selectListBox = screen.getByRole('listbox', {
    name: inputName,
  });
  await user.click(
    within($selectListBox).getByRole('option', {
      name: value,
    }),
  );
};

export const clearSelect = async ($input: HTMLElement, user: UserEvent = userEvent.setup()) =>
  user.click(within($input.closest('.c__field')!).getByRole('button', { name: 'Clear selection' }));
