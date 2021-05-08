// vue.config.js file to be place in the root of your repository
// https://cli.vuejs.org/guide/deployment.html#github-pages

module.exports = {
  publicPath: process.env.NODE_ENV === 'production'
    ? '/HKUST-VisLab-Coding-Challenge/'
    : '/'
}
