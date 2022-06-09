import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';
import React from 'react';

const Help = () => {
  return (
    <Layout>
      <section>
        <div className="container help-container">
          <h1>Need help?</h1>
          <div className="help-two-col">
            <p>
              If your questions are not answered in the docs and various readmes, reach out to us
              through <Link to="https://github.com/openfun/richie/issues">Github Issues</Link> or by
              email at fun.dev@fun-mooc.fr.
            </p>
            <p>
              We also have a regular video-chat meetup with the stakeholders of Richie, (some)
              Thursdays in the afternoon, UTC time. Reach out to us to know when the next one takes
              place and come introduce yourself!
            </p>
          </div>
          <div className="help-three-col">
            <div>
              <h2>Browse Docs</h2>
              <p>
                Learn more in the <Link to="docs/discover">documentation</Link>. Please tell us if
                anything is missing or out-of-date.
              </p>
            </div>
            <div>
              <h2>Stay up to date</h2>
              <p>
                Keep up with the latest updates on Richie by reading the{' '}
                <Link to="https://github.com/openfun/richie/blob/master/CHANGELOG.md">
                  changelog
                </Link>
                .
              </p>
            </div>
            <div>
              <h2>Join the community</h2>
              <p>
                This project is maintained by a dedicated group of people led by the team at{' '}
                <Link to="https://github.com/openfun">France Université Numérique</Link>.
              </p>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Help;
