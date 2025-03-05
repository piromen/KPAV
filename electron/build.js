const { build } = require('electron-builder');

build({
  config: {
    appId: 'com.kazimpasa.antivirus',
    productName: 'Kazımpaşa Anti-Virüs',
    directories: {
      output: 'release'
    },
    win: {
      icon: 'electron/icon.ico',
      target: [
        {
          target: 'nsis',
          arch: ['x64']
        }
      ]
    },
    nsis: {
      oneClick: false,
      allowToChangeInstallationDirectory: true,
      createDesktopShortcut: true,
      createStartMenuShortcut: true
    }
  }
}).catch(err => {
  console.error('Error during build:', err);
  process.exit(1);
});
