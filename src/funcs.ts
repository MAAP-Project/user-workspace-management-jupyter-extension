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
    if (profile['cas:username'] === undefined) {
        Notification.error("Get user profile failed.");
        return;
    }
    let username = profile['cas:username']
    let email = profile['cas:email']
    let org = profile['organization']

    // popup info
    showDialog({
      title: 'User Information:',
      body: new UserInfoWidget(username,email,org),
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
    relUrl += "&username=" + profile.uname;
    relUrl += "&proxy-ticket=" + profile.ticket;
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

let ade_server = '';
var valuesUrl = new URL(PageConfig.getBaseUrl() + 'jupyter-server-extension/getConfig');

request('get', valuesUrl.href).then((res: RequestResult) => {
  if (res.ok) {
    let environment = JSON.parse(res.data);
    ade_server = environment['ade_server'];
  }
});

export async function getUsernameToken(state: IStateDB) {
  let defResult = {uname: 'anonymous', ticket: ''}

  if ("https://" + ade_server === document.location.origin) {
    let kcProfile = await getUserInfoAsyncWrapper();

    if (kcProfile['cas:username'] === undefined) {
      Notification.error("Get profile failed.");
      return defResult
    } else {
      return {uname: kcProfile['cas:username'], ticket: kcProfile['proxyGrantingTicket']}
    }

  } else {
    return state.fetch(profileId).then((profile) => {
      let profileObj = JSON.parse(JSON.stringify(profile));
      return {uname: profileObj.preferred_username, ticket: profileObj.proxyGrantingTicket}
    }).catch((error) => {
      return defResult
    });
  }
}