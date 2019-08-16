/* eslint-disable no-new */
import './polyfills';

// NHS.UK frontend
import nhsuk_skipLink from '../../node_modules/nhsuk-frontend/packages/components/skip-link/skip-link'; /* eslint-disable-line camelcase */
import './search';
import digitalData from './digitalData';
import DesignExample from './design-example';
import cookieConsent from './cookieConsent';

// Initialise components
nhsuk_skipLink();
digitalData();
cookieConsent();

document.querySelectorAll(DesignExample.selector()).forEach((el) => {
  new DesignExample(el);
});

// GitHub API

function createNode(element) {
  return document.createElement(element);
}

function append(parent, el) {
  return parent.appendChild(el);
}

const contributorsList = document.getElementById('contributors');
const contributorsURL = 'https://api.github.com/repos/nhsuk/nhsuk-frontend/commits?path=packages/components/header';
fetch(contributorsURL)
  .then(resp => resp.json())
  .then((data) => {
    const contributors = data;
    console.log(contributors);

    const filterContributors = _.uniqBy(contributors, 'author.login');
    console.log(filterContributors);

    return filterContributors.map((contributor) => {
      const li = createNode('li');
      const link = createNode('a');
      const img = createNode('img');
      link.href = contributor.author.html_url;
      link.title = contributor.author.login;
      img.src = contributor.author.avatar_url;
      img.alt = `${contributor.author.login} GitHub avatar`;
      append(li, link);
      append(link, img);
      append(contributorsList, li);
    });
  })
  .catch((error) => {
    console.log(error);
  });

const issuesList = document.getElementById('issues');
const issuesURL = 'https://api.github.com/repos/nhsuk/nhsuk-frontend/issues';
const issueFilter = 'Header';

fetch(issuesURL)
  .then(resp => resp.json())
  .then((data) => {
    const issues = data;
    const filterIssues = issues.filter(issue => issue.title.includes(issueFilter));
    return filterIssues.map((issue) => {
      const li = createNode('li');
      const link = createNode('a');
      link.innerHTML = `${issue.title}`;
      link.href = `${issue.html_url}`;
      append(li, link);
      append(issuesList, li);
    });
  })
  .catch((error) => {
    console.log(error);
  });
