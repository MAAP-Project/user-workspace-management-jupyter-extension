import {Widget} from "@lumino/widgets";
import {request, RequestResult} from "./request";
import {PageConfig} from "@jupyterlab/coreutils";
import {getUserInfo, createDirectory, createFile, readFile, directoryExists} from "./funcs";
import { Notification } from "@jupyterlab/apputils";
import { JupyterFrontEnd } from '@jupyterlab/application';

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

/**
 * Inject SSH public key into authorized_keys file
 */
const injectPublicKey = async (
  publicKey: string,
  jupyterApp: JupyterFrontEnd
): Promise<void> => {
  console.log("=== Injecting SSH KEY ===");
  console.log("graceal1 found key");
  console.log(publicKey);

  const sshDir = '.ssh';
  const authorizedKeysPath = '.ssh/authorized_keys';

  try {
    // Check if .ssh directory exists, if not create it
    const sshDirExists = await directoryExists(sshDir, jupyterApp);
    if (!sshDirExists) {
      await createDirectory(sshDir, jupyterApp);
      console.log("Created .ssh directory");
    }

    // Check if authorized_keys file exists
    let authorizedKeysContent = await readFile(authorizedKeysPath, jupyterApp);

    // If file doesn't exist, create it
    if (authorizedKeysContent === null) {
      authorizedKeysContent = '';
    }

    // Check if key already in file
    if (authorizedKeysContent.includes(publicKey)) {
      console.log("Key already in authorized_keys");
      console.log("=== KEY ALREADY PRESENT ===");
      return;
    }

    // Append key to authorized_keys
    const newContent = authorizedKeysContent
      ? `${authorizedKeysContent}\n${publicKey}\n`
      : `${publicKey}\n`;

    await createFile(newContent, authorizedKeysPath, jupyterApp);
    console.log("=== INJECTED KEY ===");
  } catch (error) {
    console.error("Error injecting SSH key:", error);
    Notification.error("Failed to inject SSH key. Please check console for details.", {
      autoClose: 5000
    });
  }
};

export class InjectSSH {
  constructor(jupyterApp: JupyterFrontEnd) {
    getUserInfo(function(profile: any) {
      if (profile == undefined) {
        Notification.warning("Profile not defined so PGT token not set. Some services may be unavailable.");
        return;
      }
      if (profile['session_key'] == undefined) {
        Notification.warning("User's PGT token undefined. SSH service unavailable.");
        return;
      }
      if (profile["public_ssh_key"] == undefined) {
        Notification.warning("User's SSH Key undefined. SSH service unavailable.");
        return;
      }

      const key = profile["public_ssh_key"];

      // Inject the public key using TypeScript file operations
      injectPublicKey(key, jupyterApp).then(() => {
        console.log("Checked for/injected user's public key");
      }).catch((error) => {
        console.error("Failed to inject public key:", error);
      });
    });
  }
}