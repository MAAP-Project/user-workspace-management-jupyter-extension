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
  constructor(username:string,email:string,org:string) {
    let body = document.createElement('div');
    body.style.display = 'flex';
    body.style.flexDirection = 'column';

    let user_node = document.createTextNode('Username: '+username);
    body.appendChild(user_node);
    body.appendChild(document.createElement('br'));
    let email_node = document.createTextNode('Email: '+email);
    body.appendChild(email_node);
    body.appendChild(document.createElement('br'));
    let org_node = document.createTextNode('Organization: '+org);
    body.appendChild(org_node);
    super({node: body});
  }
}

export class InjectSSH {
  constructor() {
    console.log("graceal1 in constructor of Inject SSH");
    getUserInfo(function(profile: any) {
      console.log("graceal1 in getuserinfo callback");
      var getUrl = new URL(PageConfig.getBaseUrl() + 'jupyter-server-extension/uwm/getAccountInfo');
      var xhr = new XMLHttpRequest();
      xhr.onload = function() {
        if (xhr.status == 200) {
            let key;

            try {
              console.log("graceal1 in try with response being");
              console.log(xhr.response);
              let response = JSON.parse(xhr.response);
              console.log(response);
              console.log(response["profile"]);
              console.log(response["public_ssh_key"]);
              key = response["profile"]["public_ssh_key"];
            } catch (error) {
              console.log("Bad response from jupyter-server-extension/uwm/getAccountInfo");
            }

            if (key == undefined || profile == undefined || profile['proxyGrantingTicket'] == undefined) {
              Notification.warning("User's SSH Key undefined. SSH service unavailable.");
            } else {
              let getUrlInjectPublicKey = new URL(PageConfig.getBaseUrl() + "jupyter-server-extension/uwm/injectPublicKey");
              getUrlInjectPublicKey.searchParams.append("key", key);
              getUrlInjectPublicKey.searchParams.append("proxyGrantingTicket", profile['proxyGrantingTicket']);

              console.log("graceal1 PGT token from profile is ");
              console.log(profile['proxyGrantingTicket']);

              let xhrInject = new XMLHttpRequest();
              xhrInject.onload = function() {
                  console.log("Checked for/injected user's public key and PGT");
              };
              xhrInject.open("GET", getUrlInjectPublicKey.href, true);
              xhrInject.send(null);
            }
        }
        else {
            console.log("Error making call to account profile. Status is " + xhr.status + ". Was your MAAP PGT token properly set?");
        }
      };

      xhr.onerror = function() {
        console.log("Error making call to account profile. Status is " + xhr.status + ". Was your MAAP PGT token properly set?");
      };

      xhr.open("GET", getUrl.href, true);
      xhr.send(null);
    });
  }
}