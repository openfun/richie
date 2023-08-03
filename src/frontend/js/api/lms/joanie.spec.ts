import {
  CourseRunFactory,
  RichieContextFactory as mockRichieContextFactory,
} from 'utils/test/factories/richie';
import {
  extractResourceId,
  extractResourceMetadata,
  isJoanieResourceLinkProduct,
} from 'api/lms/joanie';

jest.mock('utils/context', () => {
  const mock = mockRichieContextFactory().one();
  mock.lms_backends = [
    {
      backend: 'joanie',
      course_regexp: '^.*/api/v1.0((?:/(?:courses|products|course-runs)/[^/]+)+)/?$',
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

describe('isJoanieResourceLinkProduct', () => {
  it('is not a joanie product because it is handled by a another LMSBackend than Joanie', () => {
    const courseRun = CourseRunFactory().one();
    expect(isJoanieResourceLinkProduct(courseRun.resource_link)).toBe(false);
  });

  it('is not a joanie product because it is a course run', () => {
    expect(isJoanieResourceLinkProduct('https://joanie.test/api/v1.0/course-runs/id/')).toBe(false);
  });

  it('is a joanie product', () => {
    expect(
      isJoanieResourceLinkProduct(
        'https://joanie.test/api/v1.0/courses/course-code/products/product-id/',
      ),
    ).toBe(true);
  });
});

describe('extractResourceId', () => {
  it('cannot extract resource id because it is handled by another LMSBackend than Joanie', () => {
    const courseRun = CourseRunFactory().one();
    expect(extractResourceId(courseRun.resource_link)).toBe(null);
  });

  it('cannot extract resource id because the regex does not match', () => {
    expect(extractResourceId('https://joanie.test/api/v1.0/not-a-real-entity/id/')).toBe(null);
  });

  it('extracts resource id', () => {
    expect(extractResourceId('https://joanie.test/api/v1.0/course-runs/id/')).toBe('id');
    expect(
      extractResourceId('https://joanie.test/api/v1.0/courses/course_id/products/product_id/'),
    ).toBe('course_id');
    expect(
      extractResourceId(
        'https://joanie.test/api/v1.0/courses/course_id/products/product_id/',
        'product',
      ),
    ).toBe('product_id');
  });
});

describe('extractResourceMetadata', () => {
  it('cannot extract metadata because the regex does not match', () => {
    expect(extractResourceMetadata('https://joanie.test/api/v1.0/products/id/')).toBe(null);
  });

  it('extracts resource metadata from a course run', () => {
    expect(extractResourceMetadata('https://joanie.test/api/v1.0/course-runs/id')).toEqual({
      course_run: 'id',
    });
  });

  it('extracts resource metadata from a course product', () => {
    expect(
      extractResourceMetadata(
        'https://joanie.test/api/v1.0/courses/course_id/products/product_id/',
      ),
    ).toEqual({
      course: 'course_id',
      product: 'product_id',
    });
  });
});
