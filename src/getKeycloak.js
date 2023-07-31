
export var getUserInfo = function(callback, retries=2) {
    window.parent._keycloak.loadUserInfo().success(function(profile) {
      callback(profile);
    }).error(function() {
      console.log('Failed to load profile.');
      if (retries > 0) {
        console.log(`Retrying loading keycloak profile... Attempts left: ${retries}`);
        getUserInfo(callback, retries - 1);
      } else {
        console.log('All retries failed to load profile.');
        callback("error");
      }
      //return "error";
    });
  };
  
  export async function getUserInfoAsyncWrapper() {
    return new Promise((resolve) => {
      getUserInfo((callback) => {
            resolve(callback);
        });
    });
  }
  
  export var getToken = function() {
      return window.parent._keycloak.idToken;
  };
  
  export var updateKeycloakToken = function(seconds) {
      return window.parent._keycloak.updateToken(seconds);
  };