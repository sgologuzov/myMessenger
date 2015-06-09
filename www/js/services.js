angular.module('starter.services', [])

// Race condition found when trying to use $ionicPlatform.ready in app.js and calling register to display id in AppCtrl.
// Implementing it here as a factory with promises to ensure register function is called before trying to display the id.
.factory(("ionPlatform"), function( $q ){
    var ready = $q.defer();

    ionic.Platform.ready(function( device ){
        ready.resolve( device );
    });

    return {
        ready: ready.promise
    }
})

.factory('DeviceTokens', function($cordovaPush, $cordovaToast) {
    // Register
    function register (onSuccess) {
        var config = null;

        if (ionic.Platform.isAndroid()) {
            config = {
                "senderID": "396633983582" // REPLACE THIS WITH YOURS FROM GCM CONSOLE - also in the project URL like: https://console.developers.google.com/project/434205989073
            };
        }
        else if (ionic.Platform.isIOS()) {
            config = {
                "badge": "true",
                "sound": "true",
                "alert": "true"
            }
        }

        $cordovaPush.register(config).then(function (result) {
            console.log("Register success " + result);

            $cordovaToast.showShortCenter('Registered for push notifications');
            onSuccess();
            // ** NOTE: Android regid result comes back in the pushNotificationReceived, only iOS returned here
            if (ionic.Platform.isIOS()) {
                this.store(result, "ios");
            }
        }, function (err) {
            console.log("Register error " + err)
        });
    };

    // Unregister - Unregister your device token from APNS or GCM
    // Not recommended:  See http://developer.android.com/google/gcm/adv.html#unreg-why
    //                   and https://developer.apple.com/library/ios/documentation/UIKit/Reference/UIApplication_Class/index.html#//apple_ref/occ/instm/UIApplication/unregisterForRemoteNotifications
    //
    // ** Instead, just remove the device token from your db and stop sending notifications **
    function unregister (onSuccess) {
        console.log("Unregister called");
        window.localStorage['token'] = null;
        removeCurrent();
        onSuccess();
        //need to define options here, not sure what that needs to be but this is not recommended anyway
        //        $cordovaPush.unregister(options).then(function(result) {
        //            console.log("Unregister success " + result);//
        //        }, function(err) {
        //            console.log("Unregister error " + err)
        //        });
    };

    // Stores the device token in a db using node-pushserver (running locally in this case)
    //
    // type:  Platform type (ios, android etc)
    function store (token, type) {
        window.localStorage['token'] = token;
        // Create a random userid to store with it
        var data = { user: 'user' + Math.floor((Math.random() * 10000000) + 1), type: type, token: token };
        console.log("Post token for registered device with data " + JSON.stringify(data));

/*
        $http.post('http://192.168.1.16:8000/subscribe', JSON.stringify(data))
            .success(function (data, status) {
                console.log("Token stored, device is successfully subscribed to receive push notifications.");
            })
            .error(function (data, status) {
                console.log("Error storing device token." + data + " " + status)
            }
        );*/
    };

    return {
        getCurrentToken : function () { return window.localStorage['token']},
        // Register
        register : register,
        unregister : unregister,
        store: store,
        // Removes the device token from the db via node-pushserver API unsubscribe (running locally in this case).
        // If you registered the same device with different userids, *ALL* will be removed. (It's recommended to register each
        // time the app opens which this currently does. However in many cases you will always receive the same device token as
        // previously so multiple userids will be created with the same token unless you add code to check).
        removeCurrent: function () {
            var data = {"token": currentToken};
            console.log("Post token for unregistered device with data " + JSON.stringify(data));
            /*
            $http.post('http://192.168.1.16:8000/unsubscribe', JSON.stringify(tkn))
                .success(function (data, status) {
                    console.log("Token removed, device is successfully unsubscribed and will not receive push notifications.");
                })
                .error(function (data, status) {
                    console.log("Error removing device token." + data + " " + status)
                }
            );*/
        }
    }
})

.factory('Chats', function() {
  // Might use a resource here that returns a JSON array

  // Some fake testing data
  var chats = [{
    id: 0,
    name: 'Ben Sparrow',
    lastText: 'You on your way?',
    face: 'https://pbs.twimg.com/profile_images/514549811765211136/9SgAuHeY.png'
  }, {
    id: 1,
    name: 'Max Lynx',
    lastText: 'Hey, it\'s me',
    face: 'https://avatars3.githubusercontent.com/u/11214?v=3&s=460'
  },{
    id: 2,
    name: 'Adam Bradleyson',
    lastText: 'I should buy a boat',
    face: 'https://pbs.twimg.com/profile_images/479090794058379264/84TKj_qa.jpeg'
  }, {
    id: 3,
    name: 'Perry Governor',
    lastText: 'Look at my mukluks!',
    face: 'https://pbs.twimg.com/profile_images/598205061232103424/3j5HUXMY.png'
  }, {
    id: 4,
    name: 'Mike Harrington',
    lastText: 'This is wicked good ice cream.',
    face: 'https://pbs.twimg.com/profile_images/578237281384841216/R3ae1n61.png'
  }];

  return {
    all: function() {
      return chats;
    },
    remove: function(chat) {
      chats.splice(chats.indexOf(chat), 1);
    },
    get: function(chatId) {
      for (var i = 0; i < chats.length; i++) {
        if (chats[i].id === parseInt(chatId)) {
          return chats[i];
        }
      }
      return null;
    }
  };
});
