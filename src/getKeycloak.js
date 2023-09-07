/*
* Race condition was causing error, so if loadUserInfo fails, make sure that keycloak token is updated 
*/
export var getUserInfo = function(callback, firstTry=true) {
    window.parent._keycloak.loadUserInfo().success(function(profile) {
      callback(profile);
    }).error( async function(err) {
      if (firstTry) {
        console.log('Failed to load profile, trying to update token before retrying', err);
        await updateKeycloakToken(300); // try to update token
        // tested that callback function propagates back to initiator with profile
        getUserInfo(callback, false);
      } else {
        console.log('Failed to load profile.', err);
        callback("error");
      }
    });
  };

  function waitTwoSeconds() { 
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve();
      }, 2000); // 2000 milliseconds = 2 seconds
    });
  }
  
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
  
  export var updateKeycloakToken = async function(seconds, retries=20) {
      try {
        return await window.parent._keycloak.updateToken(seconds);
      } catch (error) {
        if (retries > 0) {
          await waitTwoSeconds();
          await updateKeycloakToken(seconds, retries-1);
        } 
      }
  };
