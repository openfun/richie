const React = require('react');

const CompLibrary = require('../../core/CompLibrary');

const Container = CompLibrary.Container;

const CWD = process.cwd();

const versions = require(`${CWD}/versions.json`);

module.exports = function Versions(props) {
  const { config: siteConfig } = props;
  const latestVersion = versions[0];
  const repoUrl = `https://github.com/${siteConfig.organizationName}/${siteConfig.projectName}`;

  return (
    <div className="docMainWrapper wrapper">
      <Container className="mainContainer versionsContainer">
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
                  <a
                    href={`${siteConfig.baseUrl}${siteConfig.docsUrl}/${
                      props.language ? props.language + '/' : ''
                    }quick-start`}
                  >
                    Documentation
                  </a>
                </td>
                <td>
                  <a href={`${repoUrl}/releases/tag/v${latestVersion}.0`}>Release Notes</a>
                </td>
              </tr>
            </tbody>
          </table>
          <p>
            This is the version that is configured automatically when you first install this
            project.
          </p>
          <h3 id="rc">Pre-release versions</h3>
          <table className="versions">
            <tbody>
              <tr>
                <th>master</th>
                <td>
                  <a
                    href={`${siteConfig.baseUrl}${siteConfig.docsUrl}/${
                      props.language ? props.language + '/' : ''
                    }next/quick-start`}
                  >
                    Documentation
                  </a>
                </td>
                <td>
                  <a href={repoUrl}>Source Code</a>
                </td>
              </tr>
            </tbody>
          </table>
          <p>Other text describing this section.</p>
          <h3 id="archive">Past Versions</h3>
          <p>Here you can find previous versions of the documentation.</p>
          <table className="versions">
            <tbody>
              {versions.map(
                (version) =>
                  version !== latestVersion && (
                    <tr>
                      <th>{version}</th>
                      <td>
                        <a
                          href={`${siteConfig.baseUrl}${siteConfig.docsUrl}/${
                            props.language ? props.language + '/' : ''
                          }${version}/quick-start`}
                        >
                          Documentation
                        </a>
                      </td>
                      <td>
                        <a href={`${repoUrl}/releases/tag/v${version}`}>Release Notes</a>
                      </td>
                    </tr>
                  ),
              )}
            </tbody>
          </table>
          <p>
            You can find past versions of this project on <a href={repoUrl}>GitHub</a>.
          </p>
        </div>
      </Container>
    </div>
  );
};
