(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

/* eslint-env browser, serviceworker */

importScripts('./scripts/analytics.js');

self.analytics.trackingId = 'UA-77119321-2';

self.addEventListener('push', function (event) {
  console.log('Received push');
  var notificationTitle = 'Claro Now Timeline';
  var notificationOptions = {
    body: 'Where will you be when Usain runs for Gold?',
    icon: './images/claro_192x192.png',
    tag: 'simple-push-demo-notification',
    data: {
      url: 'http://www.google.com'
    }
  };

  if (event.data) {
    var dataText = event.data.text();
    notificationTitle = 'Received Payload';
    notificationOptions.body = 'Push data: \'' + dataText + '\'';
  }

  event.waitUntil(Promise.all([self.registration.showNotification(notificationTitle, notificationOptions), self.analytics.trackEvent('push-received')]));
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();

  var clickResponsePromise = Promise.resolve();
  if (event.notification.data && event.notification.data.url) {
    clickResponsePromise = clients.openWindow(event.notification.data.url);
  }

  event.waitUntil(Promise.all([clickResponsePromise, self.analytics.trackEvent('notification-click')]));
});

},{}]},{},[1]);

//# sourceMappingURL=service-worker.js.map
