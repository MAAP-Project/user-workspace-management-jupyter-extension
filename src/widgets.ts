import {Widget} from "@lumino/widgets";
import {request, RequestResult} from "./request";
import {PageConfig} from "@jupyterlab/coreutils";
import {getUserInfo} from "./getKeycloak";
import { Notification } from "@jupyterlab/apputils";

export
class SshWidget extends Widget {
  constructor() {
    let body = document.createElement('div');
    body.style.display = 'flex';
    body.style.flexDirection = 'column';

    request('get', PageConfig.getBaseUrl() + "jupyter-server-extension/uwm/getSSHInfo").then((res: RequestResult) => {
      if(res.ok){
        let json_results:any = res.json();
        let ip = json_results['ip'];
        let port = json_results['port'];
        let message = "ssh root@" + ip + " -p " + port;
        // let message = "ssh -i <path_to_your_key> root@" + ip + " -p " + port;
        let contents = document.createTextNode(message);
        body.appendChild(contents);
      }
    });
    super({ node: body });
  }
}

export
class UserInfoWidget extends Widget {
  constructor(username:string,email:string,orgs:string) {
    console.log("gracea1 in UserInfoWidget");
    console.log(orgs);
    let body = document.createElement('div');
    body.style.display = 'flex';
    body.style.flexDirection = 'column';

    let user_node = document.createTextNode('Username: '+username);
    body.appendChild(user_node);
    body.appendChild(document.createElement('br'));
    let email_node = document.createTextNode('Email: '+email);
    body.appendChild(email_node);
    body.appendChild(document.createElement('br'));
    let org_node = document.createTextNode('Organization: '+orgs);
    body.appendChild(org_node);
    super({node: body});
  }
}

export class InjectSSH {
  constructor() {

    getUserInfo(function(profile: any) {
      console.log("graceal1 in get user info function callback in injectSSH")
      console.log(profile);
      console.log(profile["public_ssh_key"]);
      console.log(profile['session_key']);
      if (profile == undefined) {
        Notification.warning("Profile not defined so PGT token not set. Some services may be unavailable.");
        return;
      }
      if (profile["public_ssh_key"] == undefined || profile['session_key'] == undefined) {
        Notification.warning("User's SSH Key undefined. SSH service unavailable.");
        return;
      }
      let key = profile["public_ssh_key"];

      let getUrlInjectPublicKey = new URL(PageConfig.getBaseUrl() + "jupyter-server-extension/uwm/injectPublicKey");
      getUrlInjectPublicKey.searchParams.append("key", key);
              
      let xhrInjectPublicKey = new XMLHttpRequest();
      xhrInjectPublicKey.onload = function() {
          console.log("Checked for/injected user's public key");
      };
      xhrInjectPublicKey.open("GET", getUrlInjectPublicKey.href, true);
      xhrInjectPublicKey.send(null);

      let getUrlInjectPGT = new URL(PageConfig.getBaseUrl() + "jupyter-server-extension/uwm/injectPGT");
      getUrlInjectPGT.searchParams.append("proxyGrantingTicket", profile['session_key']);

      let xhrInjectPGT = new XMLHttpRequest();
      xhrInjectPGT.onload = function() {
          console.log("Checked for/injected user's PGT");
      };
      xhrInjectPGT.open("GET", getUrlInjectPGT.href, true);
      xhrInjectPGT.send(null);
    });
  }
}