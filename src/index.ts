import { ICommandPalette } from '@jupyterlab/apputils';
import { JupyterFrontEnd, JupyterFrontEndPlugin } from '@jupyterlab/application';
import { IFileBrowserFactory } from '@jupyterlab/filebrowser';
import { ILauncher } from '@jupyterlab/launcher';
import { IStateDB } from '@jupyterlab/statedb';
import { ISettingRegistry } from '@jupyterlab/settingregistry';
import { checkUserInfo, checkSSH, activateGetPresignedUrl } from './funcs'
import { InjectSSH } from './widgets'
import '../style/index.css';


const sharedSettingsPluginId = 'maap-jupyter-server-extension:plugin';
const userWorkspaceManagementSettingsPluginId = 'maap_user_workspace_management_jupyter_extension:plugin';

///////////////////////////////////////////////////////////////
//
// Display/inject ssh info extension
//
///////////////////////////////////////////////////////////////
const extensionSsh: JupyterFrontEndPlugin<void> = {
  id: 'display_ssh_info',
  autoStart: true,
  requires: [ICommandPalette],
  optional: [ILauncher],
  activate: activateSSH
};

function activateSSH(app: JupyterFrontEnd,
  palette: ICommandPalette) {
    console.log("graceal1 in activateSSH");

      new InjectSSH(app);

      // Add an application command
      const open_command = 'sshinfo:open';

      app.commands.addCommand(open_command, {
        label: 'Display SSH Info',
        isEnabled: () => true,
        execute: args => {
          checkSSH();
        }
      });
      palette.addItem({command: open_command, category: 'SSH'});

      console.log('JupyterLab user-workspace-management extension is activated!');
};



///////////////////////////////////////////////////////////////
//
// Display user info extension
//
///////////////////////////////////////////////////////////////
const extensionUser: JupyterFrontEndPlugin<void> = {
  id: 'display_user_info',
  autoStart: true,
  requires: [ICommandPalette],
  activate: (app: JupyterFrontEnd, palette: ICommandPalette) => {
    const open_command = 'sshinfo:user';

    app.commands.addCommand(open_command, {
      label: 'Display User Info',
      isEnabled: () => true,
      execute: args => {
        checkUserInfo();
      }
    });

    palette.addItem({command:open_command,category:'User'});
    console.log('JupyterLab MAAP User Workspace Management extension is activated!');
  }
};


///////////////////////////////////////////////////////////////
//
// Presigned URL extension
//
///////////////////////////////////////////////////////////////
const extensionPreSigneds3Url: JupyterFrontEndPlugin<void> = {
  id: 'share-s3-url',
  requires: [ICommandPalette, IFileBrowserFactory, IStateDB, ISettingRegistry],
  autoStart: true,
  activate: async (
    app: JupyterFrontEnd,
    palette: ICommandPalette,
    factory: IFileBrowserFactory,
    state: IStateDB,
    registry: ISettingRegistry
  ) => {
    // Load the settings for this plugin
    let loadedId = sharedSettingsPluginId;
    let settings: ISettingRegistry.ISettings;

    try {
      settings = await registry.load(loadedId);
    } catch (err) {
      console.warn(`Did not load settings for "${loadedId}: ", ${err}`);

      loadedId = userWorkspaceManagementSettingsPluginId;

      try {
        settings = await registry.load(loadedId);
      } catch (err2) {
        console.error(`Failed to load fallback settings "${loadedId}"`, err2);
        throw err2;
      }
    }

    console.log(`Settings loaded from: ${loadedId}`);
    activateGetPresignedUrl(app, palette, factory, state, settings);
  }
};

export default [extensionSsh, extensionUser, extensionPreSigneds3Url];