import {Widget} from "@lumino/widgets";
import {request, RequestResult} from "./request";
import {PageConfig} from "@jupyterlab/coreutils";

export
class SshWidget extends Widget {
  constructor() {
    let body = document.createElement('div');
    body.style.display = 'flex';
    body.style.flexDirection = 'column';
    
    // for now we are just linking to the documentation as Alex suggested 
    let link = document.createElement('a');
    link.href = 'https://docs.openveda.cloud/user-guide/scientific-computing/ssh.html';
    link.target = '_blank';
    link.textContent = 'Docs for connecting to ssh';
    body.appendChild(link);

    // request('get', PageConfig.getBaseUrl() + "jupyter-server-extension/uwm/getSSHInfo").then((res: RequestResult) => {
    //   if(res.ok){
    //     let json_results:any = res.json();
    //     let ip = json_results['ip'];
    //     let port = json_results['port'];
    //     let message = "ssh root@" + ip + " -p " + port;
    //     // let message = "ssh -i <path_to_your_key> root@" + ip + " -p " + port;
    //     let contents = document.createTextNode(message);
    //     body.appendChild(contents);
    //   }
    // });
    super({ node: body });
  }
}

export
class UserInfoWidget extends Widget {
  constructor(username:string,email:string,orgs:string) {
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
    let getUrlInjectPublicKey = new URL(PageConfig.getBaseUrl() + "maap-jupyter-server-extension/inject-public-key");   
    let xhrInjectPublicKey = new XMLHttpRequest();
    xhrInjectPublicKey.onload = function() {
        console.log("Checked for/injected user's public key");
    };
    xhrInjectPublicKey.open("GET", getUrlInjectPublicKey.href, true);
    xhrInjectPublicKey.send(null);
    }
}