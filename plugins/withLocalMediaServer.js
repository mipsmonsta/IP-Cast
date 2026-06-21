const { withDangerousMod } = require('@expo/config-plugins');
const path = require('path');
const fs = require('fs');

function withLocalMediaServer(config) {
  return withDangerousMod(config, [
    'ios',
    (config) => {
      const platformRoot = config.modRequest.platformProjectRoot;

      // Add GCDWebServer + LocalMediaServer pods to Podfile
      const podfilePath = path.join(platformRoot, 'Podfile');
      if (fs.existsSync(podfilePath)) {
        let podfile = fs.readFileSync(podfilePath, 'utf8');
        let modified = false;

        if (!podfile.includes('GCDWebServer')) {
          const regex = /^(\s*post_install do \|installer\|)/m;
          if (regex.test(podfile)) {
            podfile = podfile.replace(regex, `  pod 'GCDWebServer', '~> 3.0'\n\n$1`);
            modified = true;
          }
        }

        if (!podfile.includes("pod 'LocalMediaServer'")) {
          const localPodRef = `  pod 'LocalMediaServer', :path => '../modules/local-media-server/ios'\n`;
          const targetRegex = /^(  pod 'GCDWebServer'.*\n)/m;
          if (targetRegex.test(podfile)) {
            podfile = podfile.replace(targetRegex, `$1${localPodRef}`);
            modified = true;
          }
        }

        if (modified) {
          fs.writeFileSync(podfilePath, podfile);
        }
      }

      return config;
    },
  ]);
}

module.exports = withLocalMediaServer;
