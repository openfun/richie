const React = require('react');

const CompLibrary = require('../../core/CompLibrary.js');

const Container = CompLibrary.Container;
const GridBlock = CompLibrary.GridBlock;

class HomeSplash extends React.Component {
  render() {
    const { siteConfig } = this.props;

    const SplashContainer = (props) => (
      <div className="homeContainer">
        <div className="homeSplashFade">
          <div className="wrapper homeWrapper">{props.children}</div>
        </div>
      </div>
    );

    const ProjectTitle = () => (
      <h2 className="projectTitle">Richie helps educators create rich online learning portals..</h2>
    );

    const PromoSection = (props) => (
      <div className="section promoSection">
        <div className="promoRow">
          <div className="pluginRowBlock">{props.children}</div>
        </div>
      </div>
    );

    const Button = (props) => (
      <div className="pluginWrapper buttonWrapper">
        <a className="button" href={props.href} target={props.target}>
          {props.children}
        </a>
      </div>
    );

    return (
      <SplashContainer>
        <div className="inner">
          <ProjectTitle siteConfig={siteConfig} />
          <PromoSection>
            <Button href="https://demo.richie.education">View demo</Button>
          </PromoSection>
        </div>
      </SplashContainer>
    );
  }
}

module.exports = class Index extends React.Component {
  render() {
    const { config: siteConfig, language = '' } = this.props;
    const { baseUrl, docsUrl } = siteConfig;
    const docsPart = `${docsUrl ? `${docsUrl}/` : ''}`;
    const langPart = `${language ? `${language}/` : ''}`;
    const docUrl = (doc) => `${baseUrl}${docsPart}${langPart}${doc}`;

    const Block = (props) => (
      <Container padding={['bottom', 'top']} id={props.id} background={props.background}>
        <GridBlock align={props.textAlign} contents={props.children} layout={props.layout} />
      </Container>
    );

    const Jumbo = () => (
      <Block background="light" id="homepage__jumbo">
        {[
          {
            content:
              '<p>Richie helps educators create online learning portals.</p>' +
              "<p>Build websites including online course catalogs in days with Richie's content management system.</p>" +
              `<a class="button" href="${docUrl('quick-start.html')}">Get started</a>`,
            image: `${baseUrl}img/undraw_professor.svg`,
            imageAlign: 'left',
            title: siteConfig.tagline,
          },
        ]}
      </Block>
    );

    const Highlights = () => (
      <div className="homepage__features">
        <Block layout="twoColumn" textAlign="center">
          {[
            {
              content: 'From the ground up, Richie is localized and handles multilingual content.',
              image: `${baseUrl}img/undraw_around_the_world.svg`,
              imageAlign: 'top',
              title: 'Multilingual by Design',
            },
            {
              content:
                'Richie integrates a powerful course search engine with autosuggestion and advanced filtering options.',
              image: `${baseUrl}img/undraw_search.svg`,
              imageAlign: 'top',
              title: 'Built for Search',
            },
            {
              content:
                'Personalize course catalogs by swapping colors and styles, or dive deep to customize the built-in search engine.',
              image: `${baseUrl}img/undraw_experience_design.svg`,
              imageAlign: 'top',
              title: 'Fully Customizable',
            },
          ]}
        </Block>
      </div>
    );

    const OpenSource = () => (
      <Block background="dark">
        {[
          {
            content:
              '<p>Built with Django CMS, Django, and React - everything is in the open. Richie is available under the MIT license.</p>' +
              '<p>Users can modify and distribute documentation freely. Start contributing today.</p>' +
              `<a class="button" href="${siteConfig.repoUrl}">View code</a>`,
            image: `${baseUrl}img/undraw_open_source.svg`,
            imageAlign: 'right',
            title: 'Fully Open Source',
          },
        ]}
      </Block>
    );

    const FeatureList = () => (
      <div className="container homepage__feature-list">
        <div className="wrapper">
          <div className="gridBlock">
            <h2 className="homepage__feature-list__title">What Richie brings you</h2>
            <div className="blockElement blockElement--left twoByGridBlock">
              <div className="blockContent">
                <h3>An LMS-agnostic Education Portal</h3>
                <p>
                  Course catalogs can synchronize with one or more LMS instances running different
                  software, such as Open edX or Moodle. Richie aggregates it all for your users.
                </p>
                <h3>Author-first</h3>
                <p>
                  Content authors do not have to rely on software engineers to create and update all
                  materials in Richie. Instead, authors use a rich editor interface to maintain
                  content.
                </p>
                <h3>Advanced Access Rights and Moderation</h3>
                <p>
                  Everything is managed through comprehensive access rights from CMS content
                  structured objects like organizations, courses, and categories. Rights scale from
                  individual users to enterprise-wide.
                </p>
              </div>
            </div>
            <div className="blockElement twoByGridBlock">
              <div className="blockContent">
                <h3>A Multilingual Website</h3>
                <p>
                  Richie is available in more than one language, and you can add yours by talking to
                  us. All the content can be added and managed in as many languages as you need.
                  Richie is available in English, French, Spanish,{' '}
                  <a href="https://crowdin.com/project/richie">and more</a>. Want to add yours?
                  Reach out! Richie supports content creation and management in as many languages as
                  you need.
                </p>
                <h3>An Extensible Platform</h3>
                <p>
                  Richie is a Django application with a NPM package. You can install it as a
                  third-party app to build learning platforms.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );

    const LearnHow = () => (
      <Block background="light">
        {[
          {
            content:
              '<p>Project stakeholders regularly check in through virtual meetups in English. Meetings typically take place on Tuesday afternoons, UTC.</p>' +
              '<p>We encourage potential and new contributors to introduce themselves and get help.</p>',
            image: `${baseUrl}img/undraw_video_call.svg`,
            imageAlign: 'left',
            title: 'Join the Community',
          },
        ]}
      </Block>
    );

    const Showcase = () => {
      if ((siteConfig.users || []).length === 0) {
        return null;
      }

      const showcase = siteConfig.users
        .filter((user) => user.pinned)
        .map((user) => (
          <a href={user.infoLink} target="_blank" rel="noopener noreferrer" title={user.caption}>
            <img src={user.image} alt={user.caption} key={user.caption} />
          </a>
        ));

      return (
        <div className="productShowcaseSection paddingBottom">
          <h2>Who is Using Richie?</h2>
          <div className="logos">{showcase}</div>
          <a className="button" href="https://demo.richie.education">
            View demo
          </a>
        </div>
      );
    };

    return (
      <div className="homepage">
        <HomeSplash siteConfig={siteConfig} language={language} />
        <div className="mainContainer">
          <Jumbo />
          <Highlights />
          <OpenSource />
          <FeatureList />
          <LearnHow />
          <Showcase />
        </div>
      </div>
    );
  }
};
