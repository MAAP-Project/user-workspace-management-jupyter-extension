import { ICommandPalette } from '@jupyterlab/apputils';
import { JupyterFrontEnd, JupyterFrontEndPlugin } from '@jupyterlab/application';
import { IFileBrowserFactory } from '@jupyterlab/filebrowser';
import { ILauncher } from '@jupyterlab/launcher';
import { IStateDB } from '@jupyterlab/statedb';

import { checkUserInfo, checkSSH, activateGetPresignedUrl } from './funcs'
import { InjectSSH } from './widgets'
import { updateKeycloakToken } from "./getKeycloak";
import '../style/index.css';

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

      new InjectSSH();

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
  activate: async (app: JupyterFrontEnd, palette: ICommandPalette)  => {
    const open_command = 'sshinfo:user';
    console.log("graceal1 in function to call other function");
    let test = await testFunctionWrapper();
    console.log("graceal1 printing test after coming back from test function wrapper");
    console.log(test);
    console.log("graceal1 after call to test function wrapper");

    app.commands.addCommand(open_command, {
      label: 'Display User Info',
      isEnabled: () => true,
      execute: args => {
        checkUserInfo();
      }
    });

    palette.addItem({command:open_command,category:'User'});
    console.log('User Workspace Management extension activated!');
  }
};


///////////////////////////////////////////////////////////////
//
// Presigned URL extension
//
///////////////////////////////////////////////////////////////
const extensionPreSigneds3Url: JupyterFrontEndPlugin<void> = {
  id: 'share-s3-url',
  requires: [ICommandPalette, IFileBrowserFactory, IStateDB],
  autoStart: true,
  activate: activateGetPresignedUrl
};



///////////////////////////////////////////////////////////////
//
// Refresh token extension
//
// This plugin refreshes the users keycloak token on set time interval
// to extend the time a user can functionally use a workspace before
// having to manually refresh the page
//
///////////////////////////////////////////////////////////////
const extensionRefreshToken: JupyterFrontEndPlugin<void> = {
  id: 'refresh_token',
  autoStart: true,
  requires: [],
  optional: [],
  activate: () => {

    // just called once at the beginning 
    setTimeout(() => updateKeycloakToken(300), 2000);
    // Refresh just under every 5 min, make token last for 5 min
    setInterval(() => updateKeycloakToken(300), 299000);
  }
};

export async function testFunctionWrapper() {
  return new Promise((resolve) => {
    testFunction((callback: any) => {
          resolve(callback);
      });
  });
}

export var testFunction = function(callback: any, firstTry=true) {
  customFunction(firstTry).then(function(profile:any) {
    console.log("graceal1 in the success of custom function");
    callback(profile);
  }).catch( async function(err: any ) {
    console.log('graceal1 in the error of the custom function');
    if (firstTry) {
      console.log("graceal1 in the first try if statement");
      console.log('graceal1 before wait 10 seconds');
      await waitTenSeconds();
      console.log("graceal1 after wait 10 seconds");
      testFunction(callback, false);
    } else{
      console.log("graceal1 in the else of the error for test function");
      callback("error")
    }

    /*if (firstTry) {
      await updateKeycloakToken(300); // might not need await??
      getUserInfo(callback, false);
    } else {
      callback("error");
    }*/
  });
};


function waitTenSeconds() {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(1);
    }, 10000); // 2000 milliseconds = 2 seconds
  });
}

/*function customFunction(promise: Promise<any>) {
  return {
    then(callback: any) {
      return customFunction(promise.then(callback));
    },
    catch(callback: any) {
      return customFunction(promise.catch(callback));
    }
  };
}*/

function customFunction(firstTry: any) {
        
        var promise = createPromise();
        if (firstTry) {
          console.log("graceal1 setting the error in the custom function");
          promise.setError("NOT SUCCESSFUL TEST");
        } else {
          console.log("graceal1 setting the success in teh custom function");
          promise.setSuccess("SUCCESSFUL TEST");
        }
        

        return promise.promise;
    }


    function createPromise() {
      let p: any = {}; // Use 'any' for more flexible assignment
      p.promise = new Promise(function(resolve: any, reject: any) {
        p.setSuccess = function(result: any) {
          resolve(result);
        };
    
        p.setError = function(result: any) {
          reject(result);
        };
      });
    
      return p;
    }
    

    /*function createPromise() {
      // Need to create a native Promise which also preserves the
      // interface of the custom promise type previously used by the API
      var p = {
          setSuccess: function(result: any) {
              p.resolve(result);
          },

          setError: function(result: any) {
              p.reject(result);
          }
      };
      p.promise = new Promise(function(resolve: any, reject: any) {
          p.resolve = resolve;
          p.reject = reject;
      });

      return p;
  }*/

export default [extensionSsh, extensionUser, extensionPreSigneds3Url, extensionRefreshToken];
