// Core dependencies
const path = require('path');

// External dependencies
const browserSync = require('browser-sync');
const compression = require('compression');
const express = require('express');
const highlightjs = require('highlight.js');
const nunjucks = require('nunjucks');
const Octokit = require('@octokit/rest');
const _ = require('lodash');

// Local dependencies
const authentication = require('./middleware/authentication');
const config = require('./app/config');
const fileHelper = require('./middleware/file-helper.js');
const locals = require('./app/locals');
const routing = require('./middleware/routing.js');
const PageIndex = require('./middleware/page-index.js');

var pageIndex = new PageIndex(config);

// Initialise applications
const app = express();

// Authentication middleware
app.use(authentication);

// Use local variables
app.use(locals(config));

// Use gzip compression to decrease the size of
// the response body and increase the speed of web app
app.use(compression());

// Middleware to serve static assets
app.use('/service-manual', express.static(path.join(__dirname, 'public')));
app.use('/service-manual/nhsuk-frontend', express.static(path.join(__dirname, '/node_modules/nhsuk-frontend/dist')));
app.use('/service-manual/nhsuk-frontend', express.static(path.join(__dirname, '/node_modules/nhsuk-frontend/packages')));
app.use('/service-manual/iframe-resizer', express.static(path.join(__dirname, 'node_modules/iframe-resizer/')));

// View engine (nunjucks)
app.set('view engine', 'njk');

// Nunjucks configuration
const appViews = [
  path.join(__dirname, '/app/views/'),
  path.join(__dirname, '/node_modules/nhsuk-frontend/packages/components'),
];

const env = nunjucks.configure(appViews, {
  autoescape: true,
  express: app,
  noCache: true,
  watch: true,
});

/*
 * Add some global nunjucks helpers
 */
env.addGlobal('getHTMLCode', fileHelper.getHTMLCode);
env.addGlobal('getNunjucksCode', fileHelper.getNunjucksCode);
env.addFilter('highlight', (code, language) => {
  const languages = language ? [language] : false;
  return highlightjs.highlightAuto(code.trim(), languages).value;
});

// Render standalone design examples
app.get('/service-manual/design-example/:example', (req, res) => {
  const example = req.params.example;
  const examplePath = path.join(__dirname, `/app/components/${example}.njk`);

  // Get the given example as HTML.
  const exampleHtml = fileHelper.getHTMLCode(examplePath);

  // Wrap the example HTML in a basic html base template.
  res.render('includes/design-example-wrapper.njk', { body: exampleHtml });
});

app.get('/', (req, res) => {
  res.redirect('/service-manual');
});

const octokit = Octokit({
  auth: config.githubKey,
  baseUrl: 'https://api.github.com',
  userAgent: 'NHS digital service manual',
});

app.get('/service-manual/components/:component', async (req, res) => {
  const component = req.params.component;

  // Get contributors to this component
  octokit.repos.listCommits({
    owner: 'nhsuk',
    path: `packages/components/${component}`,
    repo: 'nhsuk-frontend',
  }).then(({ data }) => {
    const commits = data;
    const filterUniqueCommits = _.uniqBy(commits, 'author.login');
    return filterUniqueCommits.map((commit) => {
      return console.log(commit.author.login);
    });
  });

  // Get issues related to this component
  octokit.issues.listForRepo({
    owner: 'nhsuk',
    repo: 'nhsuk-frontend',
  }).then(({ data }) => {
    const issues = data;
    // Filter issues by the component name in issue title
    const filteredIssues = issues.filter(issue => issue.title.toLowerCase().includes(component.toLowerCase()));
    return filteredIssues.map((issue) => {
      return console.log(`${issue.title} - ${issue.html_url}`);
    });
  });

  // Render component page
  res.render(`components/${component}`);
});

app.get('/service-manual/community/backlog', async (req, res) => {
  // Get issues in the service manual backlog
  octokit.issues.listForRepo({
    labels: 'proposed,todo',
    owner: 'nhsuk',
    repo: 'nhsuk-service-manual-backlog',
  }).then(({ data }) => {
    const issues = data;
    return issues.map((issue) => {
      console.log(issue);
      return console.log(`${issue.title} - ${issue.html_url}`);
    });
  });

  // Render component page
  res.render('community/backlog');
});

// Automatically route pages
app.get(/^([^.]+)$/, (req, res, next) => {
  routing.matchRoutes(req, res, next);
});

// Render sitemap.xml in XML format
app.get('/service-manual/sitemap.xml', (req, res) => {
  res.set({ 'Content-Type': 'application/xml' });
  res.render('sitemap.xml');
});

// Render robots.txt in text format
app.get('/service-manual/robots.txt', (req, res) => {
  res.set('text/plain');
  res.render('robots.txt');
});

// Render 404 page
app.get('*', (req, res) => {
  res.statusCode = 404;
  res.render('page-not-found');
});

// Run application on configured port
if (config.env === 'development') {
  app.listen(config.port - 50, () => {
    browserSync({
      files: ['app/views/**/*.*', 'public/**/*.*'],
      notify: true,
      open: false,
      port: config.port,
      proxy: `localhost:${config.port - 50}`,
      ui: false,
    });
  });
} else {
  app.listen(config.port);
}

setTimeout(function(){
  pageIndex.init();
}, 2000);

module.exports = app;
