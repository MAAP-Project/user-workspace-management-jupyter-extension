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

    if (presignedS3Url && presignedS3Url["url"]) {
      resolve(presignedS3Url["url"]);
    } else {
      let err_message = "Error getting the presigned s3 url, make sure your current folder is mounted to S3";
      console.log("graceal1 error getting presigned url")
      console.log(presignedS3Url["message"]);

      try {
        const presignedS3UrlParsed = JSON.parse(presignedS3Url); 
        if (presignedS3UrlParsed["message"]) {
          err_message = presignedS3UrlParsed["message"]
        } 
      } catch (err) {
        console.error(`JSON Parsing failed: ${err}`);
      }
      
      console.log("graceal1 trying to display THIS error message")
      console.log(err_message)

      Notification.error(err_message, {
        autoClose: 5000,
        actions: [
          {
            label: 'More info which directories are mounted to s3',
            callback: () => window.open('https://docs.maap-project.org/en/latest/system_reference_guide/share_data.html#Share-Data', '_blank')
          }
        ]
      });
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

  let profile = await getUserInfo(null);
  if (profile['username'] === undefined) {
    Notification.error("Get profile failed.");
    return defResult
  } else {
    return {username: profile['username'], session_key: profile['session_key']}
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

    if (profileInformation) {
      return profileInformation;
    }
    return defResult;
}
