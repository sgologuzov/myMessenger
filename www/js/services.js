angular.module('starter.services', [])

.factory('User', function($http) {
  var currentUser;

  // Create an internal promise that resolves to the data inside user.json;
  // we'll use this promise in our own API to get the data we need.
  var json = $http.get('/data/user.json').then(function(response) {
    return response.data;
  });

  // A basic JavaScript constructor to create new users;
  // passed in data gets copied directly to the object.
  // (This is not the best design, but works for this demo.)
  var User = function(data) {
    if (data) angular.copy(data, this);
  };

  // The query function returns an promise that resolves to
  // an array of User, one for each in the JSON.
  User.query = function() {
    return json.then(function(data) {
      return data.map(function(user) {
        return new User(user);
      });
    })
  };

  // The get function returns a promise that resolves to a
  // specific user, found by ID. We find it by looping
  // over all of them and checking to see if the IDs match.
  User.get = function(id) {
    return json.then(function(data) {
      var result = null;
      angular.forEach(data, function(user) {
        if (user.id == id) result = new User(user);
      });
      return result;
    })
  };

  User.getCurrent = function() {
      return currentUser;
  };

  User.setCurrent = function(user) {
      currentUser = user;
  };
  // Finally, the factory itself returns the entire
  // User constructor (which has `query` and `get` attached).
  return User;
})

.factory('Message', function($http) {
  // Create an internal promise that resolves to the data inside message.json;
  // we'll use this promise in our own API to get the data we need.
  var json = $http.get('/data/message.json').then(function(response) {
    return response.data;
  });

  // A basic JavaScript constructor to create new users;
  // passed in data gets copied directly to the object.
  // (This is not the best design, but works for this demo.)
  var Message = function(data) {
    if (data) angular.copy(data, this);
  };

  // The query function returns an promise that resolves to
  // an array of Message, one for each in the JSON.
  Message.query = function(userIds) {
    return json.then(function(data) {
      var result = [];
      angular.forEach(data, function(message) {
        if(userIds.indexOf(message.from) > -1 && userIds.indexOf(message.to) > -1) {
          result.push(new Message(message));
        }
      });
      return result;
    })
  };

  // Finally, the factory itself returns the entire
  // User constructor (which has `query` and `get` attached).
  return Message;
})

.factory('Chat', function($rootScope, $ionicScrollDelegate, Notification) {

  var userId;

  var functions = {
    all: function() {
      return friends;
    },
    get: function(friendId) {
      return friends[friendId];
    },
    getMessages: function(contactId){
      return messages;
    },
    sendMessage: function(msg){
      /*
      messages.push({
        username: username,
        content: msg
      });
      * */
      //socket.emit('new message', msg, username);
    },
    getUserId: function(){
      return userId;
    },
    setUserId: function(newUserId){
      userId = newUserId;
      //socket.emit('add user', username);
    },
    typing: function(){
      //socket.emit('typing');
    },
    stopTyping: function(){
      //socket.emit('stop typing');
    }
  };

  /*socket.on('user joined', function(data){
    Notification.show(data.username + ' connected');
  });

  socket.on('new message', function(msg){
    $rootScope.$apply(function () {
      messages.push(msg);
      $ionicScrollDelegate.scrollBottom(true);
    });
  });

  socket.on('user left', function(data){
    Notification.show(data.username + ' disconnected');
  });

  socket.on('typing', function(data){
    console.log('typing');
    Notification.show(data.username + ' is typing');
  });

  socket.on('stop typing', function(data){
    console.log('stop typing');
    Notification.hide();
  });*/

  return functions;

})

.factory('Notification', function($timeout) {

 return {
  show: function(msg){
    var $notificationDiv = angular.element( document.querySelector( '.notification' ) );
    $notificationDiv.css('display','inherit');
    $notificationDiv.html(msg);
    if(msg.indexOf('typing') == -1){
      $timeout(function(){
        $notificationDiv.css('display','none');
      }, 5000);
    }
  },
  hide: function(){
    var $notificationDiv = angular.element( document.querySelector( '.notification' ) );
    $notificationDiv.css('display','none');
  }
 }
})

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
                "senderID": "118868033717" // REPLACE THIS WITH YOURS FROM GCM CONSOLE - also in the project URL like: https://console.developers.google.com/project/434205989073
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
        $cordovaPush.subscribe(token, "/topics/global");

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
