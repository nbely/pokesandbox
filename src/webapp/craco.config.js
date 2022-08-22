/* craco.config.js */
const CracoLessPlugin = require('craco-less');

module.exports = {
    plugins: [
        {
          plugin: CracoLessPlugin,
          options: {
            lessLoaderOptions: {
              lessOptions: {
                modifyVars: { 
                  '@link-color': 'darkcyan' },
                javascriptEnabled: true,
              },
            },
          },
        },
    ],
};