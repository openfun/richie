import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import React from 'react';

const Button = (props) => (
  <Link className={`btn btn-${props.type || 'outline'}`} to={props.to}>
    {props.children}
  </Link>
);

const HomeSplash = () => (
  <section className="home-splash">
    <div className="container home-splash-container">
      <h2>Richie helps educators create rich online learning portals</h2>
      <div>
        <Button type="full" to="https://demo.richie.education">
          View demo
        </Button>
      </div>
    </div>
  </section>
);

const Jumbo = ({ baseUrl }) => (
  <section className="jumbo">
    <div className="container landing-two-block-container">
      <img src={`${baseUrl}img/undraw_professor.svg`} alt="" />
      <div className="landing-two-block-content">
        <h2>A CMS for Open Education</h2>
        <p>Richie helps educators create online learning portals.</p>
        <p>
          Build websites including online course catalogs in days with Richie's content management
          system.
        </p>
        <Button to="/docs/discover">Get started</Button>
      </div>
    </div>
  </section>
);

const Highlights = ({ baseUrl }) => (
  <section className="highlights">
    <div className="container highlights-container">
      <div className="highlights-item">
        <img src={`${baseUrl}img/undraw_around_the_world.svg`} alt="" />
        <h2>Multilingual by Design</h2>
        <p>From the ground up, Richie is localized and handles multilingual content.</p>
      </div>

      <div className="highlights-item">
        <img src={`${baseUrl}img/undraw_search.svg`} alt="" />
        <h2>Built for Search</h2>
        <p>
          Richie integrates a powerful course search engine with autosuggestion and advanced
          filtering options.
        </p>
      </div>

      <div className="highlights-item">
        <img src={`${baseUrl}img/undraw_experience_design.svg`} alt="" />
        <h2>Fully Customizable</h2>
        <p>
          Personalize course catalogs by swapping colors and styles, or dive deep to customize the
          built-in search engine.
        </p>
      </div>
    </div>
  </section>
);

const OpenSource = ({ baseUrl, repoUrl }) => (
  <section className="opensource">
    <div className="container landing-two-block-container">
      <div className="landing-two-block-content">
        <h2>Fully Open Source</h2>
        <p>
          Built with Django CMS, Django, and React - everything is in the open. Richie is available
          under the MIT license.
        </p>
        <p>Users can modify and distribute documentation freely. Start contributing today.</p>
        <Button to={repoUrl}>View code</Button>
      </div>
      <img src={`${baseUrl}img/undraw_open_source.svg`} alt="" />
    </div>
  </section>
);

const FeatureList = () => (
  <section className="featurelist">
    <div className="container featurelist-container">
      <h2 className="featurelist-title">What Richie brings you</h2>

      <div>
        <h3>An LMS-agnostic Education Portal</h3>
        <p>
          Course catalogs can synchronize with one or more LMS instances running different software,
          such as Open edX or Moodle. Richie aggregates it all for your users.
        </p>
        <h3>Author-first</h3>
        <p>
          Content authors do not have to rely on software engineers to create and update all
          materials in Richie. Instead, authors use a rich editor interface to maintain content.
        </p>
        <h3>Advanced Access Rights and Moderation</h3>
        <p>
          Everything is managed through comprehensive access rights from CMS content structured
          objects like organizations, courses, and categories. Rights scale from individual users to
          enterprise-wide.
        </p>
      </div>

      <div>
        <h3>A Multilingual Website</h3>
        <p>
          Richie is available in more than one language, and you can add yours by talking to us. All
          the content can be added and managed in as many languages as you need. Richie is available
          in English, French, Spanish, <Link to="https://crowdin.com/project/richie">and more</Link>
          . Want to add yours? Reach out! Richie supports content creation and management in as many
          languages as you need.
        </p>
        <h3>An Extensible Platform</h3>
        <p>
          Richie is a Django application with a NPM package. You can install it as a third-party app
          to build learning platforms.
        </p>
      </div>
    </div>
  </section>
);

const LearnHow = ({ baseUrl }) => (
  <section className="learnhow">
    <div className="container landing-two-block-container">
      <img src={`${baseUrl}img/undraw_video_call.svg`} alt="" />
      <div className="landing-two-block-content">
        <h2>Join the Community</h2>
        <p>
          Project stakeholders regularly check in through virtual meetups in English. Discussions
          take place in the #richie channel of the{' '}
          <Link to="http://www.django-cms.org/slack">DjangoCMS Slack instance</Link>
        </p>
        <p>We encourage potential and new contributors to introduce themselves and get help.</p>
      </div>
    </div>
  </section>
);

const Showcase = ({ users }) => {
  if ((users || []).length === 0) {
    return null;
  }

  const showcase = users
    .filter((user) => user.pinned)
    .map((user) => (
      <a
        href={user.infoLink}
        target="_blank"
        rel="noopener noreferrer"
        title={user.caption}
        key={user.infoLink}
      >
        <img src={user.image} alt={user.caption} key={user.caption} />
      </a>
    ));

  return (
    <section className="showcase">
      <div className="container showcase-container">
        <h2 className="showcase-title">Who is Using Richie?</h2>
        <div className="showcase-logos">{showcase}</div>
        <Button to="https://demo.richie.education">View demo</Button>
      </div>
    </section>
  );
};

const Index = () => {
  const { siteConfig } = useDocusaurusContext();
  const { baseUrl, repoUrl } = siteConfig;
  const { users } = siteConfig.customFields;

  return (
    <Layout>
      <div className="homepage">
        <HomeSplash />
        <Jumbo baseUrl={baseUrl} />
        <Highlights baseUrl={baseUrl} />
        <OpenSource baseUrl={baseUrl} repoUrl={repoUrl} />
        <FeatureList />
        <LearnHow baseUrl={baseUrl} />
        <Showcase users={users} />
      </div>
    </Layout>
  );
};

export default Index;
