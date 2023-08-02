
export var getUserInfo = function(callback) {
    window.parent._keycloak.loadUserInfo().success(function(profile) {
      callback(profile);
    }).error(async function(err) {
      console.log('Failed to load profile.', err);
      console.log("graceal1 about to call update keycloak token");
      updateKeycloakToken(300);
      console.log("graceal1 after call to update keycloak token");
      callback("error");
      //return "error";
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
        console.log("graceal1 right before the call to updateToken");
        var refreshed = window.parent._keycloak.updateToken(seconds);
        console.log("graceal1 and refreshed successful and is");
        console.log(refreshed);
        return refreshed;
      } catch (error) {
        console.log(`graceal1 and update token failed  after attempts ${retries} with`);
        console.log(error);
        
        if (retries > 0) {
          await waitTwoSeconds();
          console.log("graceal1 and after the 2 seconds wait, trying function again");
          updateKeycloakToken(300, retries-1);
        } else {
          console.log("graceal1 max number of retries, done with function");
        }
        
      }
  };
