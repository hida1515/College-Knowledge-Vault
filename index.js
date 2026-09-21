/**
 * @format
 */

import 'react-native-url-polyfill/auto';
import { AppRegistry } from 'react-native';
import App from './src/app/App';
import { name as appName } from './app.json';

// Polyfill missing FormData methods (has, get) for React Native compatibility with @supabase/storage-js
if (typeof FormData !== 'undefined') {
  if (!FormData.prototype.has) {
    FormData.prototype.has = function (name) {
      return (
        Array.isArray(this._parts) &&
        this._parts.some(function (part) {
          return Array.isArray(part) && part[0] === name;
        })
      );
    };
  }
  if (!FormData.prototype.get) {
    FormData.prototype.get = function (name) {
      if (!Array.isArray(this._parts)) return null;
      var part = this._parts.find(function (p) {
        return Array.isArray(p) && p[0] === name;
      });
      return part ? part[1] : null;
    };
  }
}

AppRegistry.registerComponent(appName, () => App);
