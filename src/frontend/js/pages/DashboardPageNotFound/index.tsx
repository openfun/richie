import { FormattedMessage, defineMessages } from 'react-intl';
import { DashboardLayout } from 'widgets/Dashboard/components/DashboardLayout';

const messages = defineMessages({
  pageNotFoundTitle: {
    id: 'page.PageNotFound.pageNotFoundTitle',
    description: 'Title of the page not found page',
    defaultMessage: 'Page not found',
  },
  pageNotFoundSubTitle: {
    id: 'page.PageNotFound.pageNotFoundSubTitle',
    description: 'Subtitle of the page not found page',
    defaultMessage: 'The requested content does not exist.',
  },
  pageNotFoundHomeLink: {
    id: 'page.PageNotFound.pageNotFoundHomeLink',
    description: 'Home link of the page not found page',
    defaultMessage: 'Back to the home page',
  },
});

const DashboardPageNotFound = () => {
  return (
    <DashboardLayout sidebar={null}>
      <div className="error">
        <svg className="error-icon">
          <use href="#icon-search-fail" />
        </svg>
        <section>
          <h2>
            <FormattedMessage {...messages.pageNotFoundTitle} />
          </h2>
          <p>
            <FormattedMessage {...messages.pageNotFoundSubTitle} />
          </p>
          <a href="/">
            <FormattedMessage {...messages.pageNotFoundHomeLink} />
          </a>
        </section>
      </div>
    </DashboardLayout>
  );
};

export default DashboardPageNotFound;
