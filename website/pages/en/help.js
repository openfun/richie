const React = require('react');

const CompLibrary = require('../../core/CompLibrary.js');

const Container = CompLibrary.Container;
const GridBlock = CompLibrary.GridBlock;

module.exports = function Help(props) {
  const { config: siteConfig, language = '' } = props;
  const { baseUrl, docsUrl } = siteConfig;
  const docsPart = `${docsUrl ? `${docsUrl}/` : ''}`;
  const langPart = `${language ? `${language}/` : ''}`;
  const docUrl = doc => `${baseUrl}${docsPart}${langPart}${doc}`;

  const postContents = [
    {
      content: `If your questions are not answered in the docs & various readmes,
      reach out to us through <a href="https://github.com/openfun/richie/issues">Github Issues</a>
      or by email at fun.dev@fun-mooc.fr.`,
    },
    {
      content: `We also have a regular video-chat meetup with the stakeholders of Richie, (some)
      Thursdays in the afternoon, UTC time. Reach out to us to know when the next one takes place
      and come introduce yourself!`,
    },
  ];

  const supportLinks = [
    {
      content: `Learn more in the [documentation](${docUrl(
        'quick-start.html',
      )}). Please tell us if anything is missing or out-of-date.`,
      title: 'Browse Docs',
    },
    {
      content: `Keep up with the latest updates on Richie by reading the
        [changelog](https://github.com/openfun/richie/blob/master/CHANGELOG.md).`,
      title: 'Stay up to date',
    },
    {
      content: `This project is maintained by a dedicated group of
        people led by the team at [FUN-MOOC](https://github.com/openfun).`,
      title: 'Join the community',
    },
  ];

  return (
    <div className="docMainWrapper wrapper">
      <Container className="mainContainer documentContainer postContainer">
        <div className="post">
          <header className="postHeader">
            <h1>Need help?</h1>
          </header>
          <GridBlock contents={postContents} layout="twoColumn" />
          <GridBlock contents={supportLinks} layout="threeColumn" />
        </div>
      </Container>
    </div>
  );
};
