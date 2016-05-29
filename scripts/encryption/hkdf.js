(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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

},{"./hmac.js":2}],2:[function(require,module,exports){
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

},{}]},{},[1]);

//# sourceMappingURL=hkdf.js.map
