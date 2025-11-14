import { JupyterFrontEnd } from "@jupyterlab/application";
import { PageConfig } from "@jupyterlab/coreutils";
import { Dialog, ICommandPalette, showDialog, Notification } from "@jupyterlab/apputils";
import { IFileBrowserFactory } from "@jupyterlab/filebrowser";
import { IStateDB } from '@jupyterlab/statedb';
import { getUserInfo, getUserInfoAsyncWrapper } from "./getKeycloak";
import { SshWidget, UserInfoWidget } from './widgets';
import { DropdownSelector } from './selector';
import { popupResult } from './dialogs';
import { request, RequestResult } from './request';

const profileId = 'maapsec-extension:IMaapProfile';

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
    console.log("graceal1 in checkUserInfo top");
    
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
    console.log("graceal1 got list to pass to user info widget");

    // popup info
    showDialog({
      title: 'User Information:',
      body: new UserInfoWidget(username,email,orgs),
      focusNodeSelector: 'input',
      buttons: [Dialog.okButton({label: 'Ok'})]
    });
  });
}

export async function getPresignedUrl(state: IStateDB, key:string, duration:string): Promise<string> {
  const profile = await getUsernameToken(state);  

  return new Promise<string>(async (resolve, reject) => {
    let presignedUrl = '';

    console.log("The key is: ", key)

    var relUrl = "/" + window.location.pathname.split("/")[1] + "/" + window.location.pathname.split("/")[2] + "/jupyter-server-extension/uwm/getSignedS3Url";
       
    relUrl += "?home_path=" + PageConfig.getOption("serverRoot");
    relUrl += "&key=" + key["path"];
    relUrl += "&username=" + profile.username;
    relUrl += "&proxy-ticket=" + profile.session_key;
    relUrl += "&duration=" + duration;
    
    request('get', relUrl).then((res: RequestResult) => {
      if (res.ok) {
        let data:any = JSON.parse(res.data);
        console.log(data)
        if (data.status_code == 200) {
          presignedUrl = data.url;
          resolve(presignedUrl);
        } else if (data.status_code == 404) {
          resolve(data.message);
        } else {
          Notification.error('Failed to get presigned s3 url', {autoClose: 3000});
          resolve(data.url);
        }
      } else {
        Notification.error('Failed to get presigned s3 url', {autoClose: 3000});
        resolve(presignedUrl);
      }
    });
  });
}

export function activateGetPresignedUrl(
  app: JupyterFrontEnd,
  palette: ICommandPalette,
  factory: IFileBrowserFactory,
  state: IStateDB
): void {
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

// let ade_server = '';
// var valuesUrl = new URL(PageConfig.getBaseUrl() + 'jupyter-server-extension/getConfig');

// request('get', valuesUrl.href).then((res: RequestResult) => {
//   if (res.ok) {
//     let environment = JSON.parse(res.data);
//     ade_server = environment['ade_server'];
//   }
// });

export async function getUsernameToken(state: IStateDB) {
  let defResult = {username: 'anonymous', session_key: ''}

  //if ("https://" + ade_server === document.location.origin) {
  let profile = await getUserInfoAsyncWrapper();
  console.log('graceal1 in getUsernameToken');
  console.log(profile);

  if (profile['username'] === undefined) {
    Notification.error("Get profile failed.");
    return defResult
  } else {
    return {username: profile['username'], session_key: profile['session_key']}
  }

    // Marjorie was this else for local development? I am commenting out for now to avoid 
    // keeping track of the current ADE url 
  // } else {
  //   return state.fetch(profileId).then((profile) => {
  //     let profileObj = JSON.parse(JSON.stringify(profile));
  //     return {username: profileObj.username, session_key: profileObj.session_key}
  //   }).catch((error) => {
  //     return defResult
  //   });
  // }
}