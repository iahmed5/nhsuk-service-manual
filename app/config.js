module.exports = {
  // Base URL
  baseURL: process.env.BASE_URL || 'https://beta.nhs.uk/service-manual',

  // Environment
  env: process.env.NODE_ENV || 'development',

  // Port to run local development server on
  port: process.env.PORT || 3000,

  // GitHub API key
  githubKey: process.env.GITHUB_KEY || '',
};
