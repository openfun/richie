import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import React from 'react';

const Users = () => {
  const { siteConfig } = useDocusaurusContext();
  const { users } = siteConfig.customFields;

  if (!users?.length) {
    return null;
  }

  const showcase = users.map((user) => (
    <a href={user.infoLink} target="_blank" rel="noopener noreferrer">
      <img src={user.image} alt={user.caption} key={user.caption} />
    </a>
  ));

  return (
    <Layout>
      <section className="users-showcase">
        <div className="container users-showcase-container">
          <h1>Who is Using This?</h1>
          <p>This project is used by many folks</p>
          <div className="users-showcase-logos">{showcase}</div>
          <p>Are you using this project?</p>
          <Link className="btn btn-outline" to={siteConfig.customFields.repoUrl}>
            Add your company
          </Link>
        </div>
      </section>
    </Layout>
  );
};

export default Users;
