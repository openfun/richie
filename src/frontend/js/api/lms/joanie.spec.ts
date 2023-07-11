import {
  CourseRunFactory,
  RichieContextFactory as mockRichieContextFactory,
} from 'utils/test/factories/richie';
import { extractResourceId, isJoanieProduct } from 'api/lms/joanie';

jest.mock('utils/context', () => {
  const mock = mockRichieContextFactory().one();
  mock.lms_backends = [
    {
      backend: 'joanie',
      course_regexp: '^.*/api/v1.0/(course-runs|products)/([^/]*)/?$',
      endpoint: 'https://joanie.test',
    },
    {
      backend: 'openedx-hawthorn',
      course_regexp: '(https://openedx.endpoint.*)',
      endpoint: 'https://demo.endpoint',
    },
  ];
  mock.authentication = { backend: 'fonzie', endpoint: 'https://auth.test' };
  mock.joanie_backend = { endpoint: 'https://joanie.test' };
  return {
    __esModule: true,
    default: mock,
  };
});

describe('isJoanieProduct', () => {
  it('is not a joanie product because it is handled by a another LMSBackend than Joanie', () => {
    expect(isJoanieProduct(CourseRunFactory().one())).toBe(false);
  });

  it('is not a joanie product because it is a course run', () => {
    expect(
      isJoanieProduct({
        ...CourseRunFactory().one(),
        resource_link: 'https://joanie.test/api/v1.0/course-runs/id/',
      }),
    ).toBe(false);
  });

  it('is a joanie product', () => {
    expect(
      isJoanieProduct({
        ...CourseRunFactory().one(),
        resource_link: 'https://joanie.test/api/v1.0/products/id/',
      }),
    ).toBe(true);
  });
});

describe('extractResourceId', () => {
  it('cannot extract resource id because it is handled by another LMSBackend than Joanie', () => {
    expect(extractResourceId(CourseRunFactory().one())).toBe(null);
  });
  it('cannot extract resource id because the regex does not match', () => {
    expect(
      extractResourceId({
        ...CourseRunFactory().one(),
        resource_link: 'https://joanie.test/api/v1.0/not-a-real-entity/id/',
      }),
    ).toBe(null);
  });
  it('extracts resource id', () => {
    expect(
      extractResourceId({
        ...CourseRunFactory().one(),
        resource_link: 'https://joanie.test/api/v1.0/course-runs/id/',
      }),
    ).toBe('id');
    expect(
      extractResourceId({
        ...CourseRunFactory().one(),
        resource_link: 'https://joanie.test/api/v1.0/products/id/',
      }),
    ).toBe('id');
  });
});
