
export var getUserInfo = function(callback, firstTry=true) {
    window.parent._keycloak.loadUserInfo().success(function(profile) {
      console.log("graceal1 successfully got user info, calling back with profile");
      callback(profile);
    }).error( async function(err) {
      console.log('Failed to load profile.', err);
      if (firstTry) {
        console.log("graceal1 about to call update keycloak token, in first try");
        await updateKeycloakToken(300); // might not need await??
        console.log("graceal1 after call to update keycloak token, in first try so calling getUserInfo now");
        getUserInfo(callback, false);
      } else {
        callback("error");
      }
      
      //return "error";
      //RETURN PROFILE FOR RETRYING IT!!
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
        var refreshed = await window.parent._keycloak.updateToken(seconds);
        console.log("graceal1 and refreshed successful and is");
        console.log(refreshed);
        return refreshed;
      } catch (error) {
        console.log(`graceal1 and update token failed  after attempts ${retries} with`);
        console.log(error);
        
        if (retries > 0) {
          await waitTwoSeconds();
          console.log("graceal1 and after the 2 seconds wait, trying function again");
          await updateKeycloakToken(300, retries-1);
        } else {
          console.log("graceal1 max number of retries, done with function");
        }
        
      }
  };
