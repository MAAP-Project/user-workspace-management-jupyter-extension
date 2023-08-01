
export var getUserInfo = function(callback, retries=10) {
    window.parent._keycloak.loadUserInfo().success(function(profile) {
      callback(profile);
    }).error(async function(err) {
      console.log('Failed to load profile.', err);
      if (retries > 0) {
        console.log(`Retrying loading keycloak profile... Attempts left: ${retries}`);
        console.log("graceal1 before the wait 5 seconds function");
        await waitThreeSeconds();
        console.log("graceal1 after the wait 5 seconds function");
        updateKeycloakToken(300);
        getUserInfo(callback, retries - 1);
      } else {
        console.log('All retries failed to load profile.');
        callback("error");
      }
      //return "error";
    });
  };

  function waitThreeSeconds() {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve();
      }, 5000); // 3000 milliseconds = 3 seconds
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
  
  export var updateKeycloakToken = function(seconds) {
      return window.parent._keycloak.updateToken(seconds);
  };
