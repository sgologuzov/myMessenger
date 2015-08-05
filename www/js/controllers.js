angular.module('starter.controllers', [])

.controller('ParentCtrl', function($scope, $ionicLoading, $ionicPopup, User) {

  $scope.user = User.getCurrent();

  $scope.showLoading = function(){
    $ionicLoading.show({
      noBackdrop: true,
      template: '<i class="favoriteModal ion-loading-c"></i>'
    });
  };

  $scope.hideLoading = function(){
    $ionicLoading.hide();
  };


  $scope.showUsernamePopup = function() {
    $scope.data = {}

    var myPopup = $ionicPopup.show({
      template: '<input type="text" ng-model="data.userId" autofocus>',
      title: 'Choose a user',
      scope: $scope,
      buttons: [
          {
            text: '<b>Log In</b>',
            type: 'button-positive',
            onTap: function(e) {
              if (!$scope.data.userId) {
                //don't allow the user to close unless he enters the username
                e.preventDefault();
              } else {
                return $scope.data.userId;
              }
            }
          },
      ]
    });
    myPopup.then(function(userId) {
      User.get(userId).then(function(user) {
        User.setCurrent(user);
        $scope.user = user;
      });
    });
  };

  //if(!$scope.user){
  //  $scope.showUsernamePopup();
  //}
})

.controller('ContactsCtrl', function($scope, User) {
    $scope.showLoading();
    User.query().then(function(data) {
        $scope.contacts = data;
        $scope.numUsers = data.length;
        $scope.hideLoading();
    });
})

.controller('ChatCtrl', function($scope, $ionicScrollDelegate, $stateParams, User, Message, Chat, Notification) {
    $scope.showLoading();
    User.get($stateParams.contactId).then(function(contact) {
        $scope.contact = contact;
        Message.query([User.getCurrent().id, contact.id]).then(function(data) {
            $scope.messages = data;
            $scope.hideLoading();
            $ionicScrollDelegate.scrollBottom(true);
        });
    });

    //Notification.hide();


    $scope.$watch('newMessage', function(newValue, oldValue) {
    if(typeof newValue != 'undefined'){
      if(newValue != ''){
        Chat.typing();
      }
      else{
        Chat.stopTyping();
      }
    }
    });

    $scope.sendMessage = function() {
    if($scope.newMessage){
      Chat.sendMessage($scope.newMessage);
      $scope.newMessage = '';
      $ionicScrollDelegate.scrollBottom(true);
    }
    else{
      alert('Can\'t be empty');
    }
    };

})

.controller('PushCtrl', function($scope, DeviceTokens, ionPlatform, $cordovaDialogs, $cordovaEmailComposer, $cordovaDevice) {
    $scope.token = "";
    $scope.notifications = [];

    $scope.settings = {
        enablePush: false
    };

    // call to register automatically upon device ready
    ionPlatform.ready.then(function (device) {
        DeviceTokens.register(function(){$scope.settings.enablePush=true;});
    });
        // Notification Received
    $scope.$on('$cordovaPush:notificationReceived', function (event, notification) {
        console.log(JSON.stringify([notification]));
        if (ionic.Platform.isAndroid()) {
            handleAndroid(notification);
        }
        else if (ionic.Platform.isIOS()) {
            handleIOS(notification);
            $scope.$apply(function () {
                $scope.notifications.push(JSON.stringify(notification.alert));
            })
        }
    });

    // Android Notification Received Handler
    function handleAndroid(notification) {
        // ** NOTE: ** You could add code for when app is in foreground or not, or coming from coldstart here too
        //             via the console fields as shown.
        console.log("In foreground " + notification.foreground  + " Coldstart " + notification.coldstart);
        if (notification.event == "registered") {
            $scope.token = notification.regid;
            DeviceTokens.store(notification.regid, "android");
        }
        else if (notification.event == "message") {
            $cordovaDialogs.alert(notification.message, "Push Notification Received");
            $scope.$apply(function () {
                $scope.notifications.push(JSON.stringify(notification.message));
            })
        }
        else if (notification.event == "error")
            $cordovaDialogs.alert(notification.msg, "Push notification error event");
        else $cordovaDialogs.alert(notification.event, "Push notification handler - Unprocessed Event");
    }

    // IOS Notification Received Handler
    function handleIOS(notification) {
        // The app was already open but we'll still show the alert and sound the tone received this way. If you didn't check
        // for foreground here it would make a sound twice, once when received in background and upon opening it from clicking
        // the notification when this code runs (weird).
        if (notification.foreground == "1") {
            // Play custom audio if a sound specified.
            if (notification.sound) {
                var mediaSrc = $cordovaMedia.newMedia(notification.sound);
                mediaSrc.promise.then($cordovaMedia.play(mediaSrc.media));
            }

            if (notification.body && notification.messageFrom) {
                $cordovaDialogs.alert(notification.body, notification.messageFrom);
            }
            else $cordovaDialogs.alert(notification.alert, "Push Notification Received");

            if (notification.badge) {
                $cordovaPush.setBadgeNumber(notification.badge).then(function (result) {
                    console.log("Set badge success " + result)
                }, function (err) {
                    console.log("Set badge error " + err)
                });
            }
        }
        // Otherwise it was received in the background and reopened from the push notification. Badge is automatically cleared
        // in this case. You probably wouldn't be displaying anything at this point, this is here to show that you can process
        // the data in this situation.
        else {
            if (notification.body && notification.messageFrom) {
                $cordovaDialogs.alert(notification.body, "(RECEIVED WHEN APP IN BACKGROUND) " + notification.messageFrom);
            }
            else $cordovaDialogs.alert(notification.alert, "(RECEIVED WHEN APP IN BACKGROUND) Push Notification Received");
        }
    }

    // Register
    $scope.changePush = function () {
        if ($scope.settings.enablePush) {
            DeviceTokens.register(function(){$scope.settings.enablePush=true;});
        } else {
            DeviceTokens.unregister(function(){$scope.settings.enablePush=false;});
        }
    }

    $scope.sendToken = function () {
            var email = {
                to: 'sgologuzov@spotware.com',
                subject: 'myMessenger Registration Token',
                body: 'Device: ' + JSON.stringify($cordovaDevice.getDevice()) + '\nToken: ' + $scope.token,
                isHtml: false
            };

            $cordovaEmailComposer.open(email).then(null, function () {
              // user cancelled email
            });
    }
});
