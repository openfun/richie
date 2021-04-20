const React = require('react');

const CompLibrary = require('../../core/CompLibrary.js');

const Container = CompLibrary.Container;

module.exports = class Users extends React.Component {
  render() {
    const { config: siteConfig } = this.props;
    if ((siteConfig.users || []).length === 0) {
      return null;
    }

    const showcase = siteConfig.users.map((user) => (
      <a href={user.infoLink} target="_blank" rel="noopener noreferrer" title={user.caption}>
        <img src={user.image} alt={user.caption} key={user.caption} />
      </a>
    ));

    return (
      <div className="mainContainer">
        <Container padding={['bottom', 'top']}>
          <div className="showcaseSection">
            <div className="prose">
              <h1>Who is Using This?</h1>
              <p>This project is used by many folks</p>
            </div>
            <div className="logos">{showcase}</div>
            <p>Are you using this project?</p>
            <a href={siteConfig.repoUrl} className="button">
              Add your company
            </a>
          </div>
        </Container>
      </div>
    );
  }
};
