import { JupyterFrontEnd } from "@jupyterlab/application";
import { PageConfig } from "@jupyterlab/coreutils";
import { Dialog, ICommandPalette, showDialog, Notification } from "@jupyterlab/apputils";
import { IFileBrowserFactory } from "@jupyterlab/filebrowser";
import { IStateDB } from '@jupyterlab/statedb';
import { ISettingRegistry } from '@jupyterlab/settingregistry';
import { SshWidget, UserInfoWidget } from './widgets';
import { DropdownSelector } from './selector';
import { popupResult } from './dialogs';
import { request, RequestResult } from './request';
import { createMaapApi, type MaapApi } from './utils/api';

const profileId = 'maapsec-extension:IMaapProfile';

// Module-level API instance
let maapApi: MaapApi | null = null;

/**
 * Initialize the MAAP API instance with settings
 */
export function initializeMaapApi(settings: ISettingRegistry.ISettings): void {
  const getLatestSettings = async () => {
    const apiUrlRes = await settings.get('maapApiUrl');
    const tokenRes = await settings.get('maapToken');
    const workspaceBucketRes = await settings.get('workspaceBucket');

    return {
      maapApiUrl: (apiUrlRes.composite as string) ?? '',
      maapToken: (tokenRes.composite as string) ?? '',
      workspaceBucket: (workspaceBucketRes.composite as string) ?? ''
    };
  };

  maapApi = createMaapApi(getLatestSettings);
}

export async function checkSSH() {
  showDialog({
    title: 'SSH Info:',
    body: new SshWidget(),
    focusNodeSelector: 'input',
    buttons: [Dialog.okButton({label: 'Ok'})]
  });
}

export function checkUserInfo(): void {
  getUserInfo(function(profile: any) {
    
    if (profile == undefined) {
      Notification.error("Get user profile failed.");
      return;
    }

    if (profile['username'] === undefined) {
        Notification.error("Get user profile failed.");
        return;
    }
    let username = profile['username']
    let email = profile['email']
    let orgs = profile['organizations']
    orgs = orgs.map(org => org.name).join(", ");

    // popup info
    showDialog({
      title: 'User Information:',
      body: new UserInfoWidget(username,email,orgs),
      focusNodeSelector: 'input',
      buttons: [Dialog.okButton({label: 'Ok'})]
    });
  });
}

export async function getPresignedUrl(state: IStateDB, key: any, duration:string): Promise<string> {
  if (!maapApi) {
    Notification.error('MAAP API not initialized', {autoClose: 3000});
    return '';
  }

  const profile = await getUsernameToken(state);

  return new Promise<string>(async (resolve, reject) => {
    let presignedUrl = '';

    console.log("The key is: ", key)

    if (key.type === 'directory') {                                                                             
      Notification.error('Presigned S3 links do not support folders', {autoClose: 5000});                       
      resolve('');                                                                                              
      return;                                                                                                   
    }  

    const presignedS3Url = await maapApi!.getPresigneds3Url(key.path, duration, profile.username);

    if (presignedS3Url) {
      resolve(presignedS3Url["url"]);
    } else {
      Notification.error('Failed to get presigned s3 url, make sure the current directory is mounted', {autoClose: 3000});
      resolve(presignedUrl);
    }
  });
}

export function activateGetPresignedUrl(
  app: JupyterFrontEnd,
  palette: ICommandPalette,
  factory: IFileBrowserFactory,
  state: IStateDB,
  settings: ISettingRegistry.ISettings
): void {
  // Initialize the MAAP API instance
  initializeMaapApi(settings);

  const { commands } = app;
  const { tracker } = factory;

  // matches all filebrowser items
  const selectorItem = '.jp-DirListing-item[data-isdir]';
  const open_command = 'sshinfo:s3url';

  commands.addCommand(open_command, {
    execute: () => {
      const widget = tracker.currentWidget;
      if (!widget) {
        return;
      }
      const item = widget.selectedItems().next();
      if (!item) {
        return;
      }

      let path = item.value;
      let expirationOptions = ['86400 (24 hours)','604800 (1 week)','2592000 (30 days)'];
      let dropdownSelector = new DropdownSelector(expirationOptions, '86400 (24 hours)', state, path);
      popupResult(dropdownSelector, 'Select an Expiration Duration');
    },
    isVisible: () => !!(tracker.currentWidget && tracker.currentWidget.selectedItems().next !== undefined),
    iconClass: 'jp-MaterialIcon jp-LinkIcon',
    label: 'Get Presigned S3 Url'
  });

  app.contextMenu.addItem({
    command: open_command,
    selector: selectorItem,
    rank: 11
  });

  // not adding to palette, since nothing to provide path
  // if (palette) {
  //   palette.addItem({command:open_command, category: 'User'});
  // }
}

export async function getUsernameToken(state: IStateDB) {
  const defResult = {username: 'anonymous', session_key: ''};

  if (!maapApi) {
    Notification.error('MAAP API not initialized', {autoClose: 3000});
    return defResult;
  }

  const environmentsEndpoint = await maapApi!.getEnvironmentsEndpoint();

  let ade_server = '';
  const res = await request('get', environmentsEndpoint.href);
  if (res.ok) {
    let environment = JSON.parse(res.data);
    ade_server = environment['ade_server'];
  }

  if ("https://" + ade_server === document.location.origin) {
    let profile = await getUserInfo(null);

    if (profile['username'] === undefined) {
      Notification.error("Get profile failed.");
      return defResult
    } else {
      return {username: profile['username'], session_key: profile['session_key']}
    }
  } else {
    return state.fetch(profileId).then((profile) => {
      let profileObj = JSON.parse(JSON.stringify(profile));
      return {username: profileObj.username, session_key: profileObj.session_key}
    }).catch((error) => {
      return defResult
    });
  }
}


export async function getUserInfo(callback, firstTry=true) {
    const defResult = {username: 'anonymous', session_key: ''};
    if (!maapApi) {
      Notification.error('MAAP API not initialized', {autoClose: 3000});
      return defResult;
    }

    const profileInformation = await maapApi!.getProfileInformation();
    if (!profileInformation && firstTry) {
      getUserInfo(callback, false)
    } else if (profileInformation && callback) {
      callback(profileInformation);
    }
    return defResult;
}
