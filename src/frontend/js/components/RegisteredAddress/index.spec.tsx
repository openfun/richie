import { fireEvent, getByRole, getByTestId, getByText, render } from '@testing-library/react';
import type { PropsWithChildren } from 'react';
import { IntlProvider } from 'react-intl';
import RegisteredAddress from 'components/RegisteredAddress/index';
import type { Address } from 'types/Joanie';
import { noop } from 'utils';
import { AddressFactory } from 'utils/test/factories/joanie';

describe('RegisteredAddress', () => {
  const Wrapper = ({ children }: PropsWithChildren<{}>) => (
    <IntlProvider locale="en">{children}</IntlProvider>
  );

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('renders address information', () => {
    const address: Address = AddressFactory().one();

    const { container } = render(
      <Wrapper>
        <RegisteredAddress
          address={address}
          edit={noop}
          promote={noop}
          remove={noop}
          select={noop}
        />
      </Wrapper>,
    );

    getByText(container, address.title);
    const $details = getByTestId(container, `address-${address.id}-details`);
    expect($details.innerHTML).toContain(address.first_name);
    expect($details.innerHTML).toContain(address.last_name);
    expect($details.innerHTML).toContain(address.address);
    expect($details.innerHTML).toContain(address.postcode);
    expect($details.innerHTML).toContain(address.city);
    expect($details.innerHTML).toContain(address.country);
  });

  it('renders a button to promote the current address', () => {
    const address: Address = AddressFactory().one();
    const mockPromote = jest.fn();

    const { container } = render(
      <Wrapper>
        <RegisteredAddress
          address={address}
          edit={noop}
          promote={mockPromote}
          remove={noop}
          select={noop}
        />
      </Wrapper>,
    );

    const $button = getByRole(container, 'radio', {
      name: `Define "${address.title}" address as main`,
    });
    fireEvent.click($button);
    expect(mockPromote).toHaveBeenNthCalledWith(1, address);
  });

  it('renders a button to remove the current address ', () => {
    const address: Address = AddressFactory().one();
    const mockRemove = jest.fn();

    const { container } = render(
      <Wrapper>
        <RegisteredAddress
          address={address}
          edit={noop}
          promote={noop}
          remove={mockRemove}
          select={noop}
        />
      </Wrapper>,
    );

    const $button = getByRole(container, 'button', {
      name: `Delete "${address.title}" address`,
    });
    fireEvent.click($button);
    expect(mockRemove).toHaveBeenNthCalledWith(1, address);
  });

  it('renders a disabled button to delete the current address if this is the main one', () => {
    const address: Address = AddressFactory({ is_main: true }).one();
    const mockRemove = jest.fn();

    const { container } = render(
      <Wrapper>
        <RegisteredAddress
          address={address}
          edit={noop}
          promote={noop}
          remove={mockRemove}
          select={noop}
        />
      </Wrapper>,
    );

    const $button: HTMLButtonElement = getByRole(container, 'button', {
      name: `Delete "${address.title}" address`,
    });
    expect($button.disabled).toBe(true);
    fireEvent.click($button);
    expect(mockRemove).not.toHaveBeenCalled();
  });

  it('renders a button to edit the current address', () => {
    const address: Address = AddressFactory().one();
    const mockEdit = jest.fn();

    const { container } = render(
      <Wrapper>
        <RegisteredAddress
          address={address}
          edit={mockEdit}
          promote={noop}
          remove={noop}
          select={noop}
        />
      </Wrapper>,
    );

    const $button = getByRole(container, 'button', {
      name: `Edit "${address.title}" address`,
    });
    fireEvent.click($button);
    expect(mockEdit).toHaveBeenNthCalledWith(1, address);
  });

  it('renders a button to select the current address', () => {
    const address: Address = AddressFactory().one();
    const mockSelect = jest.fn();

    const { container } = render(
      <Wrapper>
        <RegisteredAddress
          address={address}
          edit={noop}
          promote={noop}
          remove={noop}
          select={mockSelect}
        />
      </Wrapper>,
    );

    const $button = getByRole(container, 'button', {
      name: `Select "${address.title}" address`,
    });
    fireEvent.click($button);
    expect(mockSelect).toHaveBeenNthCalledWith(1, address);
  });
});
