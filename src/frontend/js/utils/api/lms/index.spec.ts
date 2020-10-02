describe('API LMS', () => {
  (window as any).__richie_frontend_context__ = {
    context: {
      lms_backends: [
        {
          backend: 'richie.apps.courses.lms.base.BaseLMSBackend',
          endpoint: 'https://demo.endpoint/api',
          selector_regexp: /.*base.org\/.*/,
        },
        {
          backend: 'richie.apps.courses.lms.edx.TokenEdXLMSBackend',
          endpoint: 'https://edx.endpoint/api',
          selector_regexp: /.*edx.org\/.*/,
        },
      ],
      environment: 'test',
    },
  };

  const { default: LMSHandler } = require('./index');

  it('returns EDX API if url that match edx selector is provided', () => {
    const api = LMSHandler('https://edx.org/courses/a-test-course');
    expect(api).toBeDefined();
  });

  it('returns Base API if url that match base selector is provided', () => {
    const api = LMSHandler('https://base.org/course/a-test-course');
    expect(api).toBeDefined();
  });

  it('throw an error if an unknown url is provided', () => {
    expect(() => LMSHandler('https://unknown.org/course/a-test-course')).toThrow(
      `No LMS Backend found for https://unknown.org/course/a-test-course.`,
    );
  });
});
