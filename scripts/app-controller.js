(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); /* eslint-env browser */

var _pushClient = require('./push-client.js');

var _pushClient2 = _interopRequireDefault(_pushClient);

var _encryptionHelper = require('./encryption/encryption-helper');

var _encryptionHelper2 = _interopRequireDefault(_encryptionHelper);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var AppController = function () {
  function AppController() {
    var _this = this;

    _classCallCheck(this, AppController);

    // Define a different server URL here if desire.
    this._PUSH_SERVER_URL = '';
    this._API_KEY = 'AIzaSyBBh4ddPa96rQQNxqiq_qQj7sq1JdsNQUQ';

    // This div contains the UI for CURL commands to trigger a push
    this._sendPushOptions = document.querySelector('.js-send-push-options');
    this._payloadTextField = document.querySelector('.js-payload-textfield');
    this._stateMsg = document.querySelector('.js-state-msg');
    this._payloadTextField.oninput = function () {
      Promise.all([_this.updateCurlCommand(), _this.updateXHRButton()]).then(function () {
        _this.updateOrMessage();
      });
    };

    // Below this comment is code to initialise a material design lite view.
    var toggleSwitch = document.querySelector('.js-push-toggle-switch');
    if (toggleSwitch.classList.contains('is-upgraded')) {
      this.ready = Promise.resolve();
      this._uiInitialised(toggleSwitch.MaterialSwitch);
    } else {
      this.ready = new Promise(function (resolve) {
        var mdlUpgradeCb = function mdlUpgradeCb() {
          if (!toggleSwitch.classList.contains('is-upgraded')) {
            return;
          }

          _this._uiInitialised(toggleSwitch.MaterialSwitch);
          document.removeEventListener(mdlUpgradeCb);

          resolve();
        };

        // This is to wait for MDL initialising
        document.addEventListener('mdl-componentupgraded', mdlUpgradeCb);
      });
    }
  }

  _createClass(AppController, [{
    key: '_uiInitialised',
    value: function _uiInitialised(toggleSwitch) {
      var _this2 = this;

      this._stateChangeListener = this._stateChangeListener.bind(this);
      this._subscriptionUpdate = this._subscriptionUpdate.bind(this);

      this._toggleSwitch = toggleSwitch;
      this._pushClient = new _pushClient2.default(this._stateChangeListener, this._subscriptionUpdate);

      document.querySelector('.js-push-toggle-switch > input').addEventListener('click', function (event) {
        // Inverted because clicking will change the checked state by
        // the time we get here
        if (event.target.checked) {
          _this2._pushClient.subscribeDevice();
        } else {
          _this2._pushClient.unsubscribeDevice();
        }
      });

      var sendPushViaXHRButton = document.querySelector('.js-send-push-button');
      sendPushViaXHRButton.addEventListener('click', function () {
        if (_this2._currentSubscription) {
          _this2.sendPushMessage(_this2._currentSubscription, _this2._payloadTextField.value);
        }
      });
    }
  }, {
    key: 'registerServiceWorker',
    value: function registerServiceWorker() {
      var _this3 = this;

      // Check that service workers are supported
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./service-worker.js').catch(function (err) {
          _this3.showErrorMessage('Unable to Register SW', 'Sorry this demo requires a service worker to work and it ' + 'was didn\'t seem to install - sorry :(');
          console.error(err);
        });
      } else {
        this.showErrorMessage('Service Worker Not Supported', 'Sorry this demo requires service worker support in your browser. ' + 'Please try this demo in Chrome or Firefox Nightly.');
      }
    }
  }, {
    key: '_stateChangeListener',
    value: function _stateChangeListener(state, data) {
      // console.log(state);
      if (typeof state.interactive !== 'undefined') {
        if (state.interactive) {
          this._toggleSwitch.enable();
        } else {
          this._toggleSwitch.disable();
        }
      }

      if (typeof state.pushEnabled !== 'undefined') {
        if (state.pushEnabled) {
          this._toggleSwitch.on();
        } else {
          this._toggleSwitch.off();
        }
      }

      switch (state.id) {
        case 'ERROR':
          this.showErrorMessage('Ooops a Problem Occurred', data);
          break;
        default:
          break;
      }
    }
  }, {
    key: '_subscriptionUpdate',
    value: function _subscriptionUpdate(subscription) {
      var _this4 = this;

      this._currentSubscription = subscription;

      if (!subscription) {
        // Remove any subscription from your servers if you have
        // set it up.
        this._sendPushOptions.style.opacity = 0;
        return;
      }

      // This is too handle old versions of Firefox where keys would exist
      // but auth wouldn't
      var payloadTextfieldContainer = document.querySelector('.js-payload-textfield-container');
      var subscriptionObject = JSON.parse(JSON.stringify(subscription));
      if (subscriptionObject && subscriptionObject.keys && subscriptionObject.keys.auth && subscriptionObject.keys.p256dh) {
        payloadTextfieldContainer.classList.remove('hidden');
      } else {
        payloadTextfieldContainer.classList.add('hidden');
      }

      Promise.all([this.updateCurlCommand(), this.updateXHRButton()]).then(function () {
        _this4.updateOrMessage();
      });

      // Display the UI
      this._sendPushOptions.style.opacity = 1;
    }
  }, {
    key: 'updateCurlCommand',
    value: function updateCurlCommand() {
      var _this5 = this;

      var payloadText = this._payloadTextField.value;
      var payloadPromise = Promise.resolve(null);
      if (payloadText && payloadText.trim().length > 0) {
        payloadPromise = _encryptionHelper2.default.generateHelper().then(function (encryptionHelper) {
          return encryptionHelper.encryptMessage(JSON.parse(JSON.stringify(_this5._currentSubscription)), payloadText);
        });
      }

      return payloadPromise.then(function (encryptedPayload) {
        var curlContainer = document.querySelector('.js-curl-container');
        var curlCommand = void 0;

        // GCM Command
        if (_this5._currentSubscription.endpoint.indexOf('https://android.googleapis.com/gcm/send') === 0) {
          curlCommand = _this5.produceGCMProprietaryCURLCommand(_this5._currentSubscription, encryptedPayload);

          // Web Push Protocol
        } else if (payloadText && payloadText.trim().length > 0) {
            // Turn off curl command
            curlContainer.style.display = 'none';
            _this5._stateMsg.textContent = 'Note: Push messages with a payload ' + 'can\'t be sent with a cURL command due to the body of the web ' + 'push protocol request being a stream.';
            return;
          } else {
            _this5._stateMsg.textContent = '';
            curlCommand = _this5.produceWebPushProtocolCURLCommand(_this5._currentSubscription, encryptedPayload);
          }

        curlContainer.style.display = 'block';
        var curlCodeElement = document.querySelector('.js-curl-code');
        curlCodeElement.innerHTML = curlCommand;
      });
    }
  }, {
    key: 'updateXHRButton',
    value: function updateXHRButton() {
      var buttonContainer = document.querySelector('.js-xhr-button-container');
      if (this._currentSubscription.endpoint.indexOf('https://android.googleapis.com/gcm/send') === 0 && this._payloadTextField.value.trim().length > 0) {
        buttonContainer.style.display = 'none';
        return;
      }

      buttonContainer.style.display = 'block';
    }
  }, {
    key: 'updateOrMessage',
    value: function updateOrMessage() {
      var orMessage = document.querySelector('.js-push-options-or');
      var buttonContainer = document.querySelector('.js-xhr-button-container');
      var curlContainer = document.querySelector('.js-curl-container');

      var orDisplay = buttonContainer.style.display === 'none' || curlContainer.style.display === 'none' ? 'none' : 'block';

      orMessage.style.display = orDisplay;
    }
  }, {
    key: 'sendPushMessage',
    value: function sendPushMessage(subscription, payloadText) {
      var _this6 = this;

      var payloadPromise = Promise.resolve(null);
      if (payloadText && payloadText.trim().length > 0) {
        payloadPromise = _encryptionHelper2.default.generateHelper().then(function (encryptionHelper) {
          console.log(JSON.stringify(subscription));
          return encryptionHelper.encryptMessage(JSON.parse(JSON.stringify(subscription)), payloadText);
        });
      }

      payloadPromise.then(function (encryptedPayload) {
        if (subscription.endpoint.indexOf('https://android.googleapis.com/gcm/send') === 0) {
          _this6.useGCMProtocol(subscription, encryptedPayload);
        } else {
          _this6.useWebPushProtocol(subscription, encryptedPayload);
        }
      });
    }
  }, {
    key: 'toBase64',
    value: function toBase64(arrayBuffer, start, end) {
      start = start || 0;
      end = end || arrayBuffer.byteLength;

      var partialBuffer = new Uint8Array(arrayBuffer.slice(start, end));
      return btoa(String.fromCharCode.apply(null, partialBuffer));
    }
  }, {
    key: 'useGCMProtocol',
    value: function useGCMProtocol(subscription, encryptedPayload) {
      var _this7 = this;

      console.log('Sending XHR to GCM Protocol endpoint');

      var headers = new Headers();
      headers.append('Content-Type', 'application/json');
      headers.append('Authorization', 'key=' + this._API_KEY);

      var endpointSections = subscription.endpoint.split('/');
      var subscriptionId = endpointSections[endpointSections.length - 1];
      var msgBody = {
        registration_ids: [subscriptionId] // eslint-disable-line camelcase
      };

      if (encryptedPayload) {
        msgBody.raw_data = this.toBase64(encryptedPayload.cipherText); // eslint-disable-line camelcase

        headers.append('Encryption', 'salt=' + encryptedPayload.salt);
        headers.append('Crypto-Key', 'dh=' + encryptedPayload.publicServerKey);
        headers.append('Content-Encoding', 'aesgcm');
      }

      fetch('https://android.googleapis.com/gcm/send', {
        method: 'post',
        headers: headers,
        body: JSON.stringify(msgBody)
      }).then(function (response) {
        if (response.type === 'opaque') {
          return;
        }

        return response.json().then(function (responseObj) {
          if (responseObj.failure !== 0) {
            console.log('Failed GCM response: ', responseObj);
            throw new Error('Failed to send push message via GCM');
          }
        });
      }).catch(function (err) {
        _this7.showErrorMessage('Ooops Unable to Send a Push', err);
      });
    }
  }, {
    key: 'useWebPushProtocol',
    value: function useWebPushProtocol(subscription, encryptedPayload) {
      var _this8 = this;

      console.log('Sending XHR to Web Push Protocol endpoint');
      var headers = new Headers();
      headers.append('TTL', 60);

      var fetchOptions = {
        method: 'post',
        headers: headers
      };

      if (encryptedPayload) {
        fetchOptions.body = encryptedPayload.cipherText;

        headers.append('Encryption', 'salt=' + encryptedPayload.salt);
        headers.append('Crypto-Key', 'dh=' + encryptedPayload.publicServerKey);
        headers.append('Content-Encoding', 'application/octet-stream');
        headers.append('Content-Encoding', 'aesgcm');
      }

      fetch(subscription.endpoint, fetchOptions).then(function (response) {
        if (response.status >= 400 && response.status < 500) {
          console.log('Failed web push response: ', response, response.status);
          throw new Error('Failed to send push message via web push protocol');
        }
      }).catch(function (err) {
        _this8.showErrorMessage('Ooops Unable to Send a Push', err);
      });
    }
  }, {
    key: 'produceGCMProprietaryCURLCommand',
    value: function produceGCMProprietaryCURLCommand(subscription, encryptedPayload) {
      var additionalHeaders = '';
      var additionalBody = '';
      if (encryptedPayload) {
        additionalBody = ', \\"raw_data\\": \\"' + this.toBase64(encryptedPayload.cipherText) + '\\"';

        additionalHeaders += ' --header "Encryption: salt=' + encryptedPayload.salt + '"';
        additionalHeaders += ' --header "Crypto-Key: dh=' + encryptedPayload.publicServerKey + '"';
        additionalHeaders += ' --header "Content-Encoding: aesgcm"';

        this._stateMsg.textContent = 'Note: Push messages with a payload ' + 'can\'t be sent to GCM due to a CORs issue. Trigger a push ' + 'message with the cURL command below.';
      } else {
        this._stateMsg.textContent = '';
      }

      var curlEndpoint = 'https://android.googleapis.com/gcm/send';
      var endpointSections = subscription.endpoint.split('/');
      var subscriptionId = endpointSections[endpointSections.length - 1];
      var curlCommand = 'curl --header "Authorization: key=' + this._API_KEY + '" --header "Content-Type: application/json"' + additionalHeaders + ' ' + curlEndpoint + ' -d "{\\"to\\":\\"' + subscriptionId + '\\"' + additionalBody + '}"';
      return curlCommand;
    }
  }, {
    key: 'produceWebPushProtocolCURLCommand',
    value: function produceWebPushProtocolCURLCommand(subscription) {
      // Payload body is a byte array so can't add to cURL command
      var curlEndpoint = subscription.endpoint;
      var curlCommand = 'curl --header "TTL: 60" --request POST ' + curlEndpoint;
      return curlCommand;
    }
  }, {
    key: 'showErrorMessage',
    value: function showErrorMessage(title, message) {
      var errorContainer = document.querySelector('.js-error-message-container');

      var titleElement = errorContainer.querySelector('.js-error-title');
      var messageElement = errorContainer.querySelector('.js-error-message');
      titleElement.textContent = title;
      messageElement.innerHTML = message;
      errorContainer.style.opacity = 1;

      var pushOptionsContainer = document.querySelector('.js-send-push-options');
      pushOptionsContainer.style.display = 'none';
    }
  }]);

  return AppController;
}();

exports.default = AppController;

},{"./encryption/encryption-helper":2,"./push-client.js":5}],2:[function(require,module,exports){
/**
 * PLEASE NOTE: This is in no way complete. This is just enabling
 * some testing in the browser / on github pages.
 *
 * Massive H/T to Peter Beverloo for this.
 */

/* eslint-env browser */

'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _hkdf = require('./hkdf.js');

var _hkdf2 = _interopRequireDefault(_hkdf);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

// Length, in bytes, of a P-256 field element. Expected format of the private key.
var PRIVATE_KEY_BYTES = 32;

// Length, in bytes, of a P-256 public key in uncompressed EC form per SEC 2.3.3. This sequence must
// start with 0x04. Expected format of the public key.
var PUBLIC_KEY_BYTES = 65;

// Length, in bytes, of the salt that should be used for the message.
var SALT_BYTES = 16;

var joinUnit8Arrays = function joinUnit8Arrays(allUint8Arrays) {
  // Super inefficient. But easier to follow than allocating the
  // array with the correct size and position values in that array
  // as required.
  return allUint8Arrays.reduce(function (cumulativeValue, nextValue) {
    var joinedArray = new Uint8Array(cumulativeValue.byteLength + nextValue.byteLength);
    joinedArray.set(cumulativeValue, 0);
    joinedArray.set(nextValue, cumulativeValue.byteLength);
    return joinedArray;
  }, new Uint8Array());
};

var EncryptionHelper = function () {
  function EncryptionHelper(serverKeys, salt) {
    _classCallCheck(this, EncryptionHelper);

    if (!serverKeys || !serverKeys.publicKey || !serverKeys.privateKey) {
      throw new Error('Bad server keys. Use ' + 'EncryptionHelperFactory.generateKeys()');
    }

    if (!salt) {
      throw new Error('Bad salt value. Use ' + 'EncryptionHelperFactory.generateSalt()');
    }

    this._serverKeys = serverKeys;
    this._salt = salt;
  }

  _createClass(EncryptionHelper, [{
    key: 'getPublicServerKey',
    value: function getPublicServerKey() {
      return this._serverKeys.publicKey;
    }
  }, {
    key: 'getPrivateServerKey',
    value: function getPrivateServerKey() {
      return this._serverKeys.privateKey;
    }
  }, {
    key: 'getSharedSecret',
    value: function getSharedSecret(publicKeyString) {
      var _this = this;

      return Promise.resolve().then(function () {
        return EncryptionHelper.stringKeysToCryptoKeys(publicKeyString);
      }).then(function (keys) {
        return keys.publicKey;
      }).then(function (publicKey) {
        if (!(publicKey instanceof CryptoKey)) {
          throw new Error('The publicKey must be a CryptoKey.');
        }

        var algorithm = {
          name: 'ECDH',
          namedCurve: 'P-256',
          public: publicKey
        };

        return crypto.subtle.deriveBits(algorithm, _this.getPrivateServerKey(), 256);
      });
    }
  }, {
    key: 'getSalt',
    value: function getSalt() {
      return this._salt;
    }
  }, {
    key: 'generateContext',
    value: function generateContext(publicKeyString) {
      var _this2 = this;

      return Promise.resolve().then(function () {
        return EncryptionHelper.stringKeysToCryptoKeys(publicKeyString);
      }).then(function (keys) {
        return EncryptionHelper.exportCryptoKeys(keys.publicKey).then(function (keys) {
          return keys.publicKey;
        });
      }).then(function (clientPublicKey) {
        return EncryptionHelper.exportCryptoKeys(_this2.getPublicServerKey()).then(function (keys) {
          return {
            clientPublicKey: clientPublicKey,
            serverPublicKey: keys.publicKey
          };
        });
      }).then(function (keys) {
        var utf8Encoder = new TextEncoder('utf-8');
        var labelUnit8Array = utf8Encoder.encode('P-256');
        var paddingUnit8Array = new Uint8Array(1).fill(0);

        var clientPublicKeyLengthUnit8Array = new Uint8Array(2);
        clientPublicKeyLengthUnit8Array[0] = 0x00;
        clientPublicKeyLengthUnit8Array[1] = keys.clientPublicKey.byteLength;

        var serverPublicKeyLengthBuffer = new Uint8Array(2);
        serverPublicKeyLengthBuffer[0] = 0x00;
        serverPublicKeyLengthBuffer[1] = keys.serverPublicKey.byteLength;

        return joinUnit8Arrays([labelUnit8Array, paddingUnit8Array, clientPublicKeyLengthUnit8Array, keys.clientPublicKey, serverPublicKeyLengthBuffer, keys.serverPublicKey]);
      });
    }
  }, {
    key: 'generateCEKInfo',
    value: function generateCEKInfo(publicKeyString) {
      var _this3 = this;

      return Promise.resolve().then(function () {
        var utf8Encoder = new TextEncoder('utf-8');
        var contentEncoding8Array = utf8Encoder.encode('Content-Encoding: aesgcm');
        var paddingUnit8Array = new Uint8Array(1).fill(0);
        return _this3.generateContext(publicKeyString).then(function (contextBuffer) {
          return joinUnit8Arrays([contentEncoding8Array, paddingUnit8Array, contextBuffer]);
        });
      });
    }
  }, {
    key: 'generateNonceInfo',
    value: function generateNonceInfo(publicKeyString) {
      var _this4 = this;

      return Promise.resolve().then(function () {
        var utf8Encoder = new TextEncoder('utf-8');
        var contentEncoding8Array = utf8Encoder.encode('Content-Encoding: nonce');
        var paddingUnit8Array = new Uint8Array(1).fill(0);
        return _this4.generateContext(publicKeyString).then(function (contextBuffer) {
          return joinUnit8Arrays([contentEncoding8Array, paddingUnit8Array, contextBuffer]);
        });
      });
    }
  }, {
    key: 'generatePRK',
    value: function generatePRK(subscription) {
      return this.getSharedSecret(subscription.keys.p256dh).then(function (sharedSecret) {
        var utf8Encoder = new TextEncoder('utf-8');
        var authInfoUint8Array = utf8Encoder.encode('Content-Encoding: auth\0');

        var hkdf = new _hkdf2.default(sharedSecret, EncryptionHelper.base64UrlToUint8Array(subscription.keys.auth));
        return hkdf.generate(authInfoUint8Array, 32);
      });
    }
  }, {
    key: 'generateEncryptionKeys',
    value: function generateEncryptionKeys(subscription) {
      var _this5 = this;

      return Promise.all([this.generatePRK(subscription), this.generateCEKInfo(subscription.keys.p256dh), this.generateNonceInfo(subscription.keys.p256dh)]).then(function (results) {
        var prk = results[0];
        var cekInfo = results[1];
        var nonceInfo = results[2];

        var cekHKDF = new _hkdf2.default(prk, _this5._salt);
        var nonceHKDF = new _hkdf2.default(prk, _this5._salt);
        return Promise.all([cekHKDF.generate(cekInfo, 16), nonceHKDF.generate(nonceInfo, 12)]);
      }).then(function (results) {
        return {
          contentEncryptionKey: results[0],
          nonce: results[1]
        };
      });
    }
  }, {
    key: 'encryptMessage',
    value: function encryptMessage(subscription, payload) {
      var _this6 = this;

      return this.generateEncryptionKeys(subscription).then(function (encryptionKeys) {
        return crypto.subtle.importKey('raw', encryptionKeys.contentEncryptionKey, 'AES-GCM', true, ['decrypt', 'encrypt']).then(function (contentEncryptionCryptoKey) {
          encryptionKeys.contentEncryptionCryptoKey = contentEncryptionCryptoKey;
          return encryptionKeys;
        });
      }).then(function (encryptionKeys) {
        var paddingBytes = 0;
        var paddingUnit8Array = new Uint8Array(2 + paddingBytes);
        var utf8Encoder = new TextEncoder('utf-8');
        var payloadUint8Array = utf8Encoder.encode(payload);
        var recordUint8Array = new Uint8Array(paddingUnit8Array.byteLength + payloadUint8Array.byteLength);
        recordUint8Array.set(paddingUnit8Array, 0);
        recordUint8Array.set(payloadUint8Array, paddingUnit8Array.byteLength);

        var algorithm = {
          name: 'AES-GCM',
          tagLength: 128,
          iv: encryptionKeys.nonce
        };

        return crypto.subtle.encrypt(algorithm, encryptionKeys.contentEncryptionCryptoKey, recordUint8Array);
      }).then(function (encryptedPayloadArrayBuffer) {
        return EncryptionHelper.exportCryptoKeys(_this6.getPublicServerKey()).then(function (keys) {
          return {
            cipherText: encryptedPayloadArrayBuffer,
            salt: EncryptionHelper.uint8ArrayToBase64Url(_this6.getSalt()),
            publicServerKey: EncryptionHelper.uint8ArrayToBase64Url(keys.publicKey)
          };
        });
      });
    }
  }], [{
    key: 'exportCryptoKeys',
    value: function exportCryptoKeys(publicKey, privateKey) {
      return Promise.resolve().then(function () {
        var promises = [];
        promises.push(crypto.subtle.exportKey('jwk', publicKey).then(function (jwk) {
          var x = EncryptionHelper.base64UrlToUint8Array(jwk.x);
          var y = EncryptionHelper.base64UrlToUint8Array(jwk.y);

          var publicKey = new Uint8Array(65);
          publicKey.set([0x04], 0);
          publicKey.set(x, 1);
          publicKey.set(y, 33);

          return publicKey;
        }));

        if (privateKey) {
          promises.push(crypto.subtle.exportKey('jwk', privateKey).then(function (jwk) {
            return EncryptionHelper.base64UrlToUint8Array(jwk.d);
          }));
        }

        return Promise.all(promises);
      }).then(function (exportedKeys) {
        var result = {
          publicKey: exportedKeys[0]
        };

        if (exportedKeys.length > 1) {
          result.privateKey = exportedKeys[1];
        }

        return result;
      });
    }
  }, {
    key: 'stringKeysToCryptoKeys',
    value: function stringKeysToCryptoKeys(publicKey, privateKey) {
      if (!(typeof publicKey === 'string')) {
        throw new Error('The publicKey is expected to be an String.');
      }

      var publicKeyUnitArray = EncryptionHelper.base64UrlToUint8Array(publicKey);
      if (publicKeyUnitArray.byteLength !== PUBLIC_KEY_BYTES) {
        throw new Error('The publicKey is expected to be ' + PUBLIC_KEY_BYTES + ' bytes.');
      }

      var publicBuffer = new Uint8Array(publicKeyUnitArray);
      if (publicBuffer[0] !== 0x04) {
        throw new Error('The publicKey is expected to start with an ' + '0x04 byte.');
      }

      var jwk = {
        kty: 'EC',
        crv: 'P-256',
        x: EncryptionHelper.uint8ArrayToBase64Url(publicBuffer, 1, 33),
        y: EncryptionHelper.uint8ArrayToBase64Url(publicBuffer, 33, 65),
        ext: true
      };

      var keyPromises = [];
      keyPromises.push(crypto.subtle.importKey('jwk', jwk, { name: 'ECDH', namedCurve: 'P-256' }, true, []));

      if (privateKey) {
        if (!(typeof privateKey === 'string')) {
          throw new Error('The privateKey is expected to be an String.');
        }

        var privateKeyArray = EncryptionHelper.base64UrlToUint8Array(privateKey);

        if (privateKeyArray.byteLength !== PRIVATE_KEY_BYTES) {
          throw new Error('The privateKey is expected to be ' + PRIVATE_KEY_BYTES + ' bytes.');
        }

        // d must be defined after the importKey call for public
        jwk.d = EncryptionHelper.uint8ArrayToBase64Url(new Uint8Array(privateKeyArray));
        keyPromises.push(crypto.subtle.importKey('jwk', jwk, { name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']));
      }

      return Promise.all(keyPromises).then(function (keys) {
        var keyPair = {
          publicKey: keys[0]
        };
        if (keys.length > 1) {
          keyPair.privateKey = keys[1];
        }
        return keyPair;
      });
    }
  }, {
    key: 'uint8ArrayToBase64Url',
    value: function uint8ArrayToBase64Url(uint8Array, start, end) {
      start = start || 0;
      end = end || uint8Array.byteLength;

      var base64 = btoa(String.fromCharCode.apply(null, uint8Array.slice(start, end)));
      return base64.replace(/\=/g, '') // eslint-disable-line no-useless-escape
      .replace(/\+/g, '-').replace(/\//g, '_');
    }

    // Converts the URL-safe base64 encoded |base64UrlData| to an Uint8Array buffer.

  }, {
    key: 'base64UrlToUint8Array',
    value: function base64UrlToUint8Array(base64UrlData) {
      var padding = '='.repeat((4 - base64UrlData.length % 4) % 4);
      var base64 = (base64UrlData + padding).replace(/\-/g, '+').replace(/_/g, '/');

      var rawData = atob(base64);
      var buffer = new Uint8Array(rawData.length);

      for (var i = 0; i < rawData.length; ++i) {
        buffer[i] = rawData.charCodeAt(i);
      }
      return buffer;
    }
  }]);

  return EncryptionHelper;
}();

exports.default = EncryptionHelper;

var EncryptionHelperFactory = function () {
  function EncryptionHelperFactory() {
    _classCallCheck(this, EncryptionHelperFactory);
  }

  _createClass(EncryptionHelperFactory, null, [{
    key: 'generateHelper',
    value: function generateHelper(options) {
      return Promise.resolve().then(function () {
        if (options && options.serverKeys) {
          return EncryptionHelperFactory.importKeys(options);
        }

        return EncryptionHelperFactory.generateKeys(options);
      }).then(function (keys) {
        var salt = null;
        if (options && options.salt) {
          salt = EncryptionHelper.base64UrlToUint8Array(options.salt);
        } else {
          salt = crypto.getRandomValues(new Uint8Array(16));
        }
        return new EncryptionHelper(keys, salt);
      });
    }
  }, {
    key: 'importKeys',
    value: function importKeys(options) {
      if (!options || !options.serverKeys || !options.serverKeys.publicKey || !options.serverKeys.privateKey) {
        return Promise.reject(new Error('Bad options for key import'));
      }

      return Promise.resolve().then(function () {
        return EncryptionHelper.stringKeysToCryptoKeys(options.serverKeys.publicKey, options.serverKeys.privateKey);
      });
    }
  }, {
    key: 'generateKeys',
    value: function generateKeys() {
      // True is to make the keys extractable
      return crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']);
    }
  }, {
    key: 'generateSalt',
    value: function generateSalt() {
      return crypto.getRandomValues(new Uint8Array(SALT_BYTES));
    }
  }]);

  return EncryptionHelperFactory;
}();

exports.default = EncryptionHelperFactory;


if (typeof window !== 'undefined') {
  window.gauntface = window.gauntface || {};
  window.gauntface.EncryptionHelperFactory = EncryptionHelperFactory;
  window.gauntface.EncryptionHelper = EncryptionHelper;
}

},{"./hkdf.js":3}],3:[function(require,module,exports){
/* eslint-env browser */

'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _hmac = require('./hmac.js');

var _hmac2 = _interopRequireDefault(_hmac);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var HKDF = function () {
  function HKDF(ikm, salt) {
    _classCallCheck(this, HKDF);

    this._ikm = ikm;
    this._salt = salt;

    this._hmac = new _hmac2.default(salt);
  }

  _createClass(HKDF, [{
    key: 'generate',
    value: function generate(info, byteLength) {
      var fullInfoBuffer = new Uint8Array(info.byteLength + 1);
      fullInfoBuffer.set(info, 0);
      fullInfoBuffer.set(new Uint8Array(1).fill(1), info.byteLength);

      return this._hmac.sign(this._ikm).then(function (prk) {
        var nextHmac = new _hmac2.default(prk);
        return nextHmac.sign(fullInfoBuffer);
      }).then(function (nextPrk) {
        return nextPrk.slice(0, byteLength);
      });
    }
  }]);

  return HKDF;
}();

exports.default = HKDF;


if (typeof window !== 'undefined') {
  window.gauntface = window.gauntface || {};
  window.gauntface.HKDF = HKDF;
}

},{"./hmac.js":4}],4:[function(require,module,exports){
/* eslint-env browser */

'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var HMAC = function () {
  function HMAC(ikm) {
    _classCallCheck(this, HMAC);

    this._ikm = ikm;
  }

  _createClass(HMAC, [{
    key: 'sign',
    value: function sign(input) {
      return crypto.subtle.importKey('raw', this._ikm, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']).then(function (key) {
        return crypto.subtle.sign('HMAC', key, input);
      });
    }
  }]);

  return HMAC;
}();

exports.default = HMAC;


if (typeof window !== 'undefined') {
  window.gauntface = window.gauntface || {};
  window.gauntface.HMAC = HMAC;
}

},{}],5:[function(require,module,exports){
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

//# sourceMappingURL=app-controller.js.map
