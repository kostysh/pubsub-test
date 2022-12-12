import { Configuration } from 'webpack';
import { CracoConfig } from '@craco/types';
import { getLoaders, loaderByName } from '@craco/craco';

const cracoConfig: CracoConfig = {
  webpack: {
    configure: (webpackConfig: Configuration) => {
      const {
        hasFoundAny,
        matches
      } = getLoaders(webpackConfig, loaderByName('babel-loader'));

      if (hasFoundAny) {
        matches.forEach(c => {
          if (c?.loader?.test?.toString().includes('mjs')) {
            if (c.loader.test.toString().includes('jsx')) {
              c.loader.test = /\.(js|cjs|mjs|jsx|ts|tsx)$/
            } else {
              c.loader.test = /\.(js|cjs|mjs)$/
            }
          }
        });
      }

      // webpackConfig.resolve = {
      //   ...webpackConfig.resolve,
      //   fallback: {
      //     ...webpackConfig.resolve?.fallback,
      //   }
      // };

      return webpackConfig;
    }
  },
};

export default cracoConfig;
