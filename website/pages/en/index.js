const React = require('react');

const CompLibrary = require('../../core/CompLibrary.js');

const Container = CompLibrary.Container;
const GridBlock = CompLibrary.GridBlock;

class HomeSplash extends React.Component {
  render() {
    const { siteConfig } = this.props;

    const SplashContainer = props => (
      <div className="homeContainer">
        <div className="homeSplashFade">
          <div className="wrapper homeWrapper">{props.children}</div>
        </div>
      </div>
    );

    const ProjectTitle = () => (
      <h2 className="projectTitle">
        Richie enables you to build rich education portals quickly and with less
        code.
      </h2>
    );

    const PromoSection = props => (
      <div className="section promoSection">
        <div className="promoRow">
          <div className="pluginRowBlock">{props.children}</div>
        </div>
      </div>
    );

    const Button = props => (
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
            <Button href="https://demo.richie.education">Check out the demo</Button>
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
    const docUrl = doc => `${baseUrl}${docsPart}${langPart}${doc}`;

    const Block = props => (
      <Container
        padding={['bottom', 'top']}
        id={props.id}
        background={props.background}
      >
        <GridBlock
          align={props.textAlign}
          contents={props.children}
          layout={props.layout}
        />
      </Container>
    );

    const Jumbo = () => (
      <Block background="light" id="homepage__jumbo">
        {[
          {
            content:
              '<p>Richie is a specialized Content Management System designed to make learning portals. It is full-featured and ready-to-go.</p>' +
              '<p>It is a toolbox to easily create full fledged websites with a catalog of online courses in days, not months.</p>' +
              `<a class="button" href="${docUrl(
                'quick-start.html',
              )}">Get started</a>`,
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
              content:
                'Richie is built from the ground up to be localized and handle multilingual content.',
              image: `${baseUrl}img/undraw_around_the_world.svg`,
              imageAlign: 'top',
              title: 'Multilingual by design',
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
                'Anything can be swapped or changed, from colors and styles to the inner workings of the search engine.',
              image: `${baseUrl}img/undraw_experience_design.svg`,
              imageAlign: 'top',
              title: 'Fully customizable',
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
              '<p>Richie is released under the MIT licence and all its documentation is copyleft. You can use and modify it as you please.</p>' +
              '<p>It was built with open source tools such as Django CMS (& Django), and React. Everything is done in the open. Reach out and start contributing!</p>' +
              `<a class="button" href="${siteConfig.repoUrl}">See the code</a>`,
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
            <h2 className="homepage__feature-list__title">
              What Richie brings you
            </h2>
            <div className="blockElement blockElement--left twoByGridBlock">
              <div className="blockContent">
                <h3>An LMS-agnostic education portal</h3>
                <p>
                  Your course catalog can be synchronized with one or more LMS
                  instances running different kinds of software, such as Open
                  edX or Moodle. Richie is built to aggregate it all for your
                  users.
                </p>
                <h3>An editor back-office</h3>
                <p>
                  All the content in Richie is meant to be created and updated
                  by regular editors, not software engineers. As it is based on
                  Django CMS, you get a rich editor interface along with Richie.
                </p>
                <h3>Advanced access rights and moderation</h3>
                <p>
                  From CMS content structured objects like organizations,
                  courses, and categories, everything is managed through
                  comprehensive access rights. Those can be based on individual
                  user or tied to organizations.
                </p>
              </div>
            </div>
            <div className="blockElement twoByGridBlock">
              <div className="blockContent">
                <h3>A multilingual website</h3>
                <p>
                  Richie itself is already available in more than one language,
                  and you can add yours by talking to us. All the content can be
                  added and managed in as many languages as you need.
                </p>
                <h3>An extensible platform</h3>
                <p>
                  Richie is offered as a Django application (and adjoining NPM
                  packaged). You can install it as a third-party app to build
                  your own learning platform with Django.
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
              '<p>Stakeholders of the project have a regular video-chat meetup, in English. It takes place on (some) Thursdays in the afternoon, UTC time.</p>' +
              "<p>If you're considering using or contributing to Richie, come introduce yourself and get some help!</p>",
            image: `${baseUrl}img/undraw_video_call.svg`,
            imageAlign: 'left',
            title: 'Join the community',
          },
        ]}
      </Block>
    );

    const Showcase = () => {
      if ((siteConfig.users || []).length === 0) {
        return null;
      }

      const showcase = siteConfig.users
        .filter(user => user.pinned)
        .map(user => (
          <img src={user.image} alt={user.caption} title={user.caption} key={user.caption} />
        ));

      return (
        <div className="productShowcaseSection paddingBottom">
          <h2>Who is Using Richie?</h2>
          <div className="logos">{showcase}</div>
          <a className="button" href="https://demo.richie.education">
            Check out the demo
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
