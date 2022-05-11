import { act, fireEvent, render, screen } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import { Fragment } from 'react';
import { IntlProvider } from 'react-intl';
import { QueryClient, QueryClientProvider } from 'react-query';
import {
  ContextFactory as mockContextFactory,
  FonzieUserFactory,
  PersistedClientFactory,
  ProductFactory,
  QueryStateFactory,
} from 'utils/test/factories';
import { CourseCodeProvider } from 'data/CourseCodeProvider';
import { SessionProvider } from 'data/SessionProvider';
import { REACT_QUERY_SETTINGS, RICHIE_USER_TOKEN } from 'settings';
import createQueryClient from 'utils/react-query/createQueryClient';
import SaleTunnel from '.';

const StepComponent =
  (title: string) =>
  ({ next }: { next: () => void }) =>
    (
      <Fragment>
        <h2>{title}</h2>
        <button onClick={next}>Next</button>
      </Fragment>
    );

jest.mock('components/SaleTunnelStepValidation', () => ({
  SaleTunnelStepValidation: StepComponent('SaleTunnelStepValidation Component'),
}));
jest.mock('components/SaleTunnelStepPayment', () => ({
  SaleTunnelStepPayment: StepComponent('SaleTunnelStepPayment Component'),
}));
jest.mock('components/SaleTunnelStepResume', () => ({
  SaleTunnelStepResume: StepComponent('SaleTunnelStepResume Component'),
}));
jest.mock('utils/context', () => ({
  __esModule: true,
  default: mockContextFactory({
    authentication: { backend: 'fonzie', endpoint: 'https://auth.endpoint.test' },
    joanie_backend: { endpoint: 'https://joanie.test' },
  }).generate(),
}));

describe('SaleTunnel', () => {
  beforeAll(() => {
    // As dialog is rendered through a Portal, we have to add the DOM element in which the dialog will be rendered.
    const modalExclude = document.createElement('div');
    modalExclude.setAttribute('id', 'modal-exclude');
    document.body.appendChild(modalExclude);
  });

  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    fetchMock.restore();
    sessionStorage.clear();
  });

  const initializeUser = (loggedin = true) => {
    const user = loggedin ? FonzieUserFactory.generate() : null;

    sessionStorage.setItem(
      REACT_QUERY_SETTINGS.cacheStorage.key,
      JSON.stringify(
        PersistedClientFactory({ queries: [QueryStateFactory('user', { data: user })] }),
      ),
    );

    if (loggedin) {
      sessionStorage.setItem(RICHIE_USER_TOKEN, user.access_token);
    }

    return user;
  };

  const Wrapper = ({ client, children }: React.PropsWithChildren<{ client: QueryClient }>) => (
    <IntlProvider locale="en">
      <QueryClientProvider client={client}>
        <SessionProvider>
          <CourseCodeProvider code="00000">{children}</CourseCodeProvider>
        </SessionProvider>
      </QueryClientProvider>
    </IntlProvider>
  );

  it('shows a login button if user is not authenticated', async () => {
    initializeUser(false);
    const product = ProductFactory.generate();
    const queryClient = createQueryClient({ persistor: true });

    fetchMock.get('https://joanie.test/api/courses/00000/', []);

    await act(async () => {
      render(
        <Wrapper client={queryClient}>
          <SaleTunnel product={product} />
        </Wrapper>,
      );
    });

    screen.getByRole('button', { name: `Login to purchase "${product.title}"` });
  });

  it('shows cta to open sale tunnel when user is authenticated', async () => {
    initializeUser();
    const product = ProductFactory.generate();
    const queryClient = createQueryClient({ persistor: true });

    fetchMock
      .get('https://joanie.test/api/courses/00000/', [])
      .get('https://joanie.test/api/addresses/', [])
      .get('https://joanie.test/api/credit-cards/', [])
      .get('https://joanie.test/api/orders/', []);

    await act(async () => {
      render(
        <Wrapper client={queryClient}>
          <SaleTunnel product={product} />
        </Wrapper>,
      );
    });

    fetchMock.resetHistory();

    // Only CTA is displayed
    const button = screen.getByRole('button', { name: product.call_to_action });

    // Then user can enter into the sale tunnel and follow its 3 steps
    fireEvent.click(button);

    // - Dialog should have been displayed
    screen.getByTestId('SaleTunnel__modal');

    // - Step 1 : Validation
    screen.getByRole('heading', { level: 1, name: 'SaleTunnelStepValidation Component' });
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(fetchMock.calls()).toHaveLength(0);

    // - Step 2 : Payment
    screen.getByRole('heading', { level: 1, name: 'SaleTunnelStepPayment Component' });
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(fetchMock.calls()).toHaveLength(0);

    // - Step 3 : Resume
    screen.getByRole('heading', { level: 1, name: 'SaleTunnelStepResume Component' });

    // - Terminated, resume.onExit callback is triggered to refresh course and orders and dialog has been closed
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    const calls = fetchMock.calls();
    expect(calls).toHaveLength(2);
    expect(calls[0][0]).toEqual('https://joanie.test/api/courses/00000/');
    expect(calls[1][0]).toEqual('https://joanie.test/api/orders/');

    expect(screen.queryByTestId('SaleTunnel__modal')).toBeNull();
  });

  it('renders a sale tunnel with a close button', async () => {
    initializeUser();
    const product = ProductFactory.generate();
    const queryClient = createQueryClient({ persistor: true });

    fetchMock
      .get('https://joanie.test/api/courses/00000/', [])
      .get('https://joanie.test/api/addresses/', [])
      .get('https://joanie.test/api/credit-cards/', [])
      .get('https://joanie.test/api/orders/', []);

    await act(async () => {
      render(
        <Wrapper client={queryClient}>
          <SaleTunnel product={product} />
        </Wrapper>,
      );
    });

    fetchMock.resetHistory();

    // Only CTA is displayed
    const $button = screen.getByRole('button', { name: product.call_to_action });

    // Then user can enter into the sale tunnel and follow its 3 steps
    fireEvent.click($button);

    // - Dialog should have been displayed
    screen.getByTestId('SaleTunnel__modal');

    // - A close button should be displayed
    const $closeButton = screen.getByRole('button', { name: 'Close dialog' });

    // - Go to step 2
    screen.getByRole('heading', { level: 1, name: 'SaleTunnelStepValidation Component' });
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    screen.getByRole('heading', { level: 1, name: 'SaleTunnelStepPayment Component' });

    // - Press the escape key should not close the dialog
    fireEvent.keyDown(screen.getByTestId('SaleTunnel__modal'), { keyCode: 27 });
    screen.getByTestId('SaleTunnel__modal');

    // - Click on the overlay area should not close the dialog
    fireEvent.click(document.querySelector('.modal__overlay')!);
    screen.getByTestId('SaleTunnel__modal');

    // - Click on the close button should close the dialog
    fireEvent.click($closeButton);
    expect(screen.queryByTestId('SaleTunnel__modal')).toBeNull();

    // - If user reopens the dialog, the step manager should have been reset so step 1 should be displayed
    fireEvent.click($button);
    screen.getByRole('heading', { level: 1, name: 'SaleTunnelStepValidation Component' });
  });
});
