import { JupyterFrontEnd } from "@jupyterlab/application";
import { PageConfig } from "@jupyterlab/coreutils";
import { Dialog, ICommandPalette, showDialog } from "@jupyterlab/apputils";
import { IFileBrowserFactory } from "@jupyterlab/filebrowser";
import { IStateDB } from '@jupyterlab/statedb';
// import { Widget } from "@lumino/widgets";
import { INotification } from "jupyterlab_toastify";
import { getToken, getUserInfo, getUserInfoAsyncWrapper } from "./getKeycloak";
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
        INotification.error("Get user profile failed.");
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
  console.log("graceal1 in get presigned url function in funcs file");
  const profile = await getUsernameToken(state);  

  return new Promise<string>(async (resolve, reject) => {
    let presignedUrl = '';
    let token = getToken();

    //var getUrl = new URL(PageConfig.getBaseUrl() + 'show_ssh_info/getSigneds3Url');
    var getUrl = new URL(PageConfig.getBaseUrl() + 'jupyter-server-extension/uwm/getSignedS3Url');
    console.log("graceal1 in getpresignedurl in funcs and getUrl is");
    console.log(getUrl);
    getUrl.searchParams.append('home_path', PageConfig.getOption('serverRoot'));
    getUrl.searchParams.append('key', key);
    getUrl.searchParams.append('username', profile.uname);
    getUrl.searchParams.append('token', token);
    getUrl.searchParams.append('proxy-ticket', profile.ticket);
    getUrl.searchParams.append('duration', duration);
    console.log("graceal1 getUrl after appending everything is ");
    console.log(getUrl);
    console.log(getUrl.href);
    console.log(profile);
    console.log(profile.ticket);
    console.log(profile.uname);
    console.log(duration);
    console.log("graceal1 key is");
    console.log(key);
    console.log("graceal1 token is");
    console.log(token);
    request('get', getUrl.href).then((res: RequestResult) => {
      console.log("graceal1 in the request function content in getpresignedurl");
      console.log(res.data);
      if (res.ok) {
        console.log("graceal in the res ok if statement and printing res content");
        console.log(res.data);
        let data:any = JSON.parse(res.data);
        console.log(data)
        if (data.status_code == 200) {
          presignedUrl = data.url;
          resolve(presignedUrl);
        } else if (data.status_code == 404) {
          resolve(data.message);
        } else {
          INotification.error('Failed to get presigned s3 url');
          resolve(data.url);
        }
      } else {
        INotification.error('Failed to get presigned s3 url');
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

      let path = item.path;
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

console.log("graceal1 outside the functions and trying to assign ade_server");
let ade_server = '';
var valuesUrl = new URL(PageConfig.getBaseUrl() + 'jupyter-server-extension/getConfig');
console.log("graceal1 printing valuesUrl");
console.log(valuesUrl);
console.log(valuesUrl.href);
console.log(ade_server);

request('get', valuesUrl.href).then((res: RequestResult) => {
  console.log("graceal1 inside the request function and is res okay: ");
  console.log(res.ok);
  console.log(res);
  console.log(res.data);
  if (res.ok) {
    console.log("graceal1 inside res okay if statement");
    let environment = JSON.parse(res.data);
    console.log(environment);
    console.log(environment['ade_server']);
    ade_server = environment['ade_server'];
  }
});

export async function getUsernameToken(state: IStateDB) {
  console.log("graceal1 in the getUsernameToken function");
  let defResult = {uname: 'anonymous', ticket: ''}
  console.log("graceal1 ade_server is ");
  console.log(ade_server);
  console.log(document.location.origin);
  console.log("https://" + ade_server === document.location.origin);
  if ("https://" + ade_server === document.location.origin) {
    console.log("graceal1 in the first if statement");
    let kcProfile = await getUserInfoAsyncWrapper();
    console.log("kcProfile is");
    console.log(kcProfile);

    if (kcProfile['cas:username'] === undefined) {
      console.log("graceal1 and kcProfile at cas username is undefined so getting profile failed");
      INotification.error("Get profile failed.");
      return defResult
    } else {
      console.log("graceal1 in else of the first if statement and cas username progile not undefined");
      return {uname: kcProfile['cas:username'], ticket: kcProfile['proxyGrantingTicket']}
    }

  } else {
    console.log("graceal1 in the else of the first if statement");
    return state.fetch(profileId).then((profile) => {
      console.log("graceal1 in the THEN of the else of the first if statement");
      let profileObj = JSON.parse(JSON.stringify(profile));
      console.log("graceal1 after profile parse");
      console.log(profile);
      console.log(profileObj);
      console.log("returning");
      console.log({uname: profileObj.preferred_username, ticket: profileObj.proxyGrantingTicket});
      return {uname: profileObj.preferred_username, ticket: profileObj.proxyGrantingTicket}
    }).catch((error) => {
      console.log("graceal1 in the catch of the else of the first if statement");
      console.log(error);
      return defResult
    });
  }
}