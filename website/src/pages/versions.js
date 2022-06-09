import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import React from 'react';

import versions from '../../versions.json';

const Versions = () => {
  const { siteConfig } = useDocusaurusContext();
  const latestVersion = versions[0];

  return (
    <Layout>
      <section>
        <div className="container">
          <div className="post">
            <header className="postHeader">
              <h1>{siteConfig.title} versions and documentation</h1>
            </header>
            <p>
              New versions of this project are shipped regularly. Every new version includes its own
              version of the documentation.
            </p>
            <p>
              Versions below <code>1.12.0</code> did not have a dedicated documentation website.
            </p>
            <h3 id="latest">Current version (Stable)</h3>
            <table className="versions">
              <tbody>
                <tr>
                  <th>{latestVersion}</th>
                  <td>
                    <Link to="docs/discover">Documentation</Link>
                  </td>
                  <td>
                    <Link to={`${siteConfig.customFields.repoUrl}/releases/tag/v${latestVersion}`}>
                      Release Notes
                    </Link>
                  </td>
                </tr>
              </tbody>
            </table>
            <h3 id="rc">Pre-release versions</h3>
            <table className="versions">
              <tbody>
                <tr>
                  <th>master</th>
                  <td>
                    <Link to="docs/next/discover">Documentation</Link>
                  </td>
                  <td>
                    <Link to={siteConfig.customFields.repoUrl}>Source Code</Link>
                  </td>
                </tr>
              </tbody>
            </table>
            <h3 id="archive">Past Versions</h3>
            <p>Here you can find previous versions of the documentation.</p>
            <table className="versions">
              <tbody>
                {versions.map(
                  (version) =>
                    version !== latestVersion && (
                      <tr key={version}>
                        <th>{version}</th>
                        <td>
                          <Link to={`docs/${version}/discover`}>Documentation</Link>
                        </td>
                        <td>
                          <Link
                            to={`${siteConfig.customFields.repoUrl}/releases/tag/v${
                              version.split('.').length === 3 ? version : version + '.0'
                            }`}
                          >
                            Release Notes
                          </Link>
                        </td>
                      </tr>
                    ),
                )}
              </tbody>
            </table>
            <p>
              You can find past versions of this project on{' '}
              <Link to={siteConfig.customFields.repoUrl}>GitHub</Link>.
            </p>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Versions;
