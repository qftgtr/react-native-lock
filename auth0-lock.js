const { NativeModules, Platform } = require('react-native');

const LockModule = NativeModules.Auth0LockModule;

const VERSION = require('./version');

import Auth0 from 'react-native-auth0';

class Auth0Lock {
  constructor(options) {
    const { clientId, domain, style } = options;
    if (options != null && clientId != null && domain != null) {
      this.lockOptions = {
        clientId,
        domain,
        style,
        configurationDomain: options.configurationDomain,
        libraryVersion: VERSION,
        useBrowser: options.useBrowser,
      };
      this.nativeIntegrations = options.integrations;
      this.auth0 = new Auth0({ domain, clientId });
    } else {
      throw 'Must supply clientId & domain';
    }
  }

  hide(callback) {
    if (Platform.OS === 'android') {
      setTimeout(() => callback(), 0);
      return;
    }
    LockModule.hide(callback);
  }

  show(options, callback) {
    LockModule.init(this.lockOptions);
    if (Platform.OS === 'ios' && this.nativeIntegrations) {
      LockModule.nativeIntegrations(this.nativeIntegrations);
    }
    LockModule.show(options, callback);
  }

  authenticate(connectionName, options, callback) {
    if (Platform.OS === 'android') {
      callback('Not available in Android', null, null);
      return;
    }
    LockModule.init(this.lockOptions);
    if (this.nativeIntegrations) {
      LockModule.nativeIntegrations(this.nativeIntegrations);
    }
    LockModule.authenticate(connectionName, options, callback);
  }

  authenticationAPI() {
    return this.auth0.auth;
  }

  refreshToken(token) {
    return fetch(`${this.auth0.auth.client.baseUrl}/delegation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        client_id: this.auth0.auth.clientId,
        refresh_token: token,
        api_type: 'app',
        scope: 'openid email',
      }),
    }).then(response => response.json());
  }

  usersAPI(token) {
    return this.auth0.users(token);
  }
}

module.exports = Auth0Lock;
