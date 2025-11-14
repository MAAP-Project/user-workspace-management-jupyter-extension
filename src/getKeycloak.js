import {PageConfig} from "@jupyterlab/coreutils";

export var getUserInfo = function(callback, firstTry=true) {
    var requestUrl = new URL(PageConfig.getBaseUrl() + 'jupyter-server-extension/uwm/getAccountInfoFromPGTENV');
    var xhr = new XMLHttpRequest();
    xhr.onload = function() {
      if (xhr.status == 200) {
        try {
          let response = JSON.parse(xhr.response);
          console.log("graceal1 in getUserInfo with response for callback being");
          console.log(response)
          if (response) {
            response = response["profile"]
          }
          callback(response)
        } catch (error) {
          console.log("Incorrectly formatted response from jupyter-server-extension/uwm/getAccountInfoFromPGTENV");
        }
      } else {
        console.log("Bad response from jupyter-server-extension/uwm/getAccountInfoFromPGTENV");
      }
    };
    xhr.onerror = function() {
      console.log("Error making call to account profile. Status is " + xhr.status + ". Was your MAAP PGT token properly set?");
    };

    xhr.open("GET", requestUrl.href, true);
    xhr.send(null);
}
  
  export async function getUserInfoAsyncWrapper() {
    return new Promise((resolve) => {
      getUserInfo((callback) => {
            resolve(callback);
        });
    });
  }