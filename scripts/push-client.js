(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

/* eslint-env browser */

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var PushClient = function () {
  function PushClient(stateChangeCb, subscriptionUpdate) {
    var _this = this;

    _classCallCheck(this, PushClient);

    this._stateChangeCb = stateChangeCb;
    this._subscriptionUpdate = subscriptionUpdate;

    this._state = {
      UNSUPPORTED: {
        id: 'UNSUPPORTED',
        interactive: false,
        pushEnabled: false
      },
      INITIALISING: {
        id: 'INITIALISING',
        interactive: false,
        pushEnabled: false
      },
      PERMISSION_DENIED: {
        id: 'PERMISSION_DENIED',
        interactive: false,
        pushEnabled: false
      },
      PERMISSION_GRANTED: {
        id: 'PERMISSION_GRANTED',
        interactive: true
      },
      PERMISSION_PROMPT: {
        id: 'PERMISSION_PROMPT',
        interactive: true,
        pushEnabled: false
      },
      ERROR: {
        id: 'ERROR',
        interactive: false,
        pushEnabled: false
      },
      STARTING_SUBSCRIBE: {
        id: 'STARTING_SUBSCRIBE',
        interactive: false,
        pushEnabled: true
      },
      SUBSCRIBED: {
        id: 'SUBSCRIBED',
        interactive: true,
        pushEnabled: true
      },
      STARTING_UNSUBSCRIBE: {
        id: 'STARTING_UNSUBSCRIBE',
        interactive: false,
        pushEnabled: false
      },
      UNSUBSCRIBED: {
        id: 'UNSUBSCRIBED',
        interactive: true,
        pushEnabled: false
      }
    };

    if (!('serviceWorker' in navigator)) {
      this._stateChangeCb(this._state.UNSUPPORTED);
      return;
    }

    if (!('PushManager' in window)) {
      this._stateChangeCb(this._state.UNSUPPORTED);
      return;
    }

    if (!('showNotification' in ServiceWorkerRegistration.prototype)) {
      this._stateChangeCb(this._state.UNSUPPORTED);
      return;
    }

    navigator.serviceWorker.ready.then(function () {
      _this._stateChangeCb(_this._state.INITIALISING);
      _this.setUpPushPermission();
    });
  }

  _createClass(PushClient, [{
    key: '_permissionStateChange',
    value: function _permissionStateChange(permissionState) {
      // If the notification permission is denied, it's a permanent block
      switch (permissionState) {
        case 'denied':
          this._stateChangeCb(this._state.PERMISSION_DENIED);
          break;
        case 'granted':
          this._stateChangeCb(this._state.PERMISSION_GRANTED);
          break;
        case 'default':
          this._stateChangeCb(this._state.PERMISSION_PROMPT);
          break;
        default:
          console.error('Unexpected permission state: ', permissionState);
          break;
      }
    }
  }, {
    key: 'setUpPushPermission',
    value: function setUpPushPermission() {
      var _this2 = this;

      this._permissionStateChange(Notification.permission);

      return navigator.serviceWorker.ready.then(function (serviceWorkerRegistration) {
        // Let's see if we have a subscription already
        return serviceWorkerRegistration.pushManager.getSubscription();
      }).then(function (subscription) {
        if (!subscription) {
          // NOOP since we have no subscription and the permission state
          // will inform whether to enable or disable the push UI
          return;
        }

        _this2._stateChangeCb(_this2._state.SUBSCRIBED);

        // Update the current state with the
        // subscriptionid and endpoint
        _this2._subscriptionUpdate(subscription);
      }).catch(function (err) {
        console.log(err);
        _this2._stateChangeCb(_this2._state.ERROR, err);
      });
    }
  }, {
    key: 'subscribeDevice',
    value: function subscribeDevice() {
      var _this3 = this;

      this._stateChangeCb(this._state.STARTING_SUBSCRIBE);

      // We need the service worker registration to access the push manager
      navigator.serviceWorker.ready.then(function (serviceWorkerRegistration) {
        return serviceWorkerRegistration.pushManager.subscribe({ userVisibleOnly: true });
      }).then(function (subscription) {
        _this3._stateChangeCb(_this3._state.SUBSCRIBED);
        _this3._subscriptionUpdate(subscription);
      }).catch(function (subscriptionErr) {
        // Check for a permission prompt issue
        _this3._permissionStateChange(Notification.permission);

        if (Notification.permission !== 'denied' && Notification.permission !== 'default') {
          // If the permission wasnt denied or prompt, that means the
          // permission was accepted, so this must be an error
          _this3._stateChangeCb(_this3._state.ERROR, subscriptionErr);
        }
      });
    }
  }, {
    key: 'unsubscribeDevice',
    value: function unsubscribeDevice() {
      var _this4 = this;

      // Disable the switch so it can't be changed while
      // we process permissions
      // window.PushDemo.ui.setPushSwitchDisabled(true);

      this._stateChangeCb(this._state.STARTING_UNSUBSCRIBE);

      navigator.serviceWorker.ready.then(function (serviceWorkerRegistration) {
        return serviceWorkerRegistration.pushManager.getSubscription();
      }).then(function (pushSubscription) {
        // Check we have everything we need to unsubscribe
        if (!pushSubscription) {
          _this4._stateChangeCb(_this4._state.UNSUBSCRIBED);
          _this4._subscriptionUpdate(null);
          return;
        }

        // TODO: Remove the device details from the server
        // i.e. the pushSubscription.subscriptionId and
        // pushSubscription.endpoint
        return pushSubscription.unsubscribe().then(function (successful) {
          if (!successful) {
            // The unsubscribe was unsuccessful, but we can
            // remove the subscriptionId from our server
            // and notifications will stop
            // This just may be in a bad state when the user returns
            console.error('We were unable to unregister from push');
          }
        });
      }).then(function () {
        _this4._stateChangeCb(_this4._state.UNSUBSCRIBED);
        _this4._subscriptionUpdate(null);
      }).catch(function (err) {
        console.error('Error thrown while revoking push notifications. ' + 'Most likely because push was never registered', err);
      });
    }
  }]);

  return PushClient;
}();

exports.default = PushClient;

},{}]},{},[1]);

//# sourceMappingURL=push-client.js.map
