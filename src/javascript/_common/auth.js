import dataManager from '../app/common/data_manager';

const {
    AppIDConstants,
    LocalStorageConstants,
    LocalStorageUtils,
    URLConstants,
    WebSocketUtils,
} = require('@deriv-com/utils');

const SocketURL = {
    [URLConstants.derivP2pProduction]: 'blue.derivws.com',
    [URLConstants.derivP2pStaging]   : 'red.derivws.com',
};

export const getServerInfo = () => {
    const origin = window.location.origin;
    const hostname = window.location.hostname;

    const existingAppId = LocalStorageUtils.getValue(LocalStorageConstants.configAppId);
    const existingServerUrl = LocalStorageUtils.getValue(LocalStorageConstants.configServerURL);
    // since we don't have official app_id for staging,
    // we will use the red server with app_id=62019 for the staging-p2p.deriv.com for now
    // to fix the login issue
    if (origin === URLConstants.derivP2pStaging && (!existingAppId || !existingServerUrl)) {
        LocalStorageUtils.setValue(LocalStorageConstants.configServerURL, SocketURL[origin]);
        LocalStorageUtils.setValue(LocalStorageConstants.configAppId, `${AppIDConstants.domainAppId[hostname]}`);
    }

    const serverUrl = LocalStorageUtils.getValue(LocalStorageConstants.configServerURL) || localStorage.getItem('config.server_url') || 'oauth.deriv.com';

    const defaultAppId = WebSocketUtils.getAppId();
    const appId = LocalStorageUtils.getValue(LocalStorageConstants.configAppId) || defaultAppId;
    const lang = LocalStorageUtils.getValue(LocalStorageConstants.i18nLanguage) || 'en';

    return {
        appId,
        lang,
        serverUrl,
    };
};

export const getOAuthLogoutUrl = () => {
    const { serverUrl } = getServerInfo();
    return `https://${serverUrl}/oauth2/sessions/logout`;
};

export const getOAuthOrigin = () => {
    const { serverUrl } = getServerInfo();
    return `https://${serverUrl}`;
};

export const requestOauth2Logout = (onWSLogoutAndRedirect) => {
    // Simplified logout - just call the WebSocket logout without OIDC
    // eslint-disable-next-line no-console
    console.log('requestOauth2Logout: Simplified logout without OIDC', !!onWSLogoutAndRedirect);
    if (typeof onWSLogoutAndRedirect === 'function') {
        onWSLogoutAndRedirect();
    }
};

export const requestSingleLogout = async () =>
    // Simplified single logout - no TMB or OIDC checks
    Promise.resolve();

export const requestSingleSignOn = async () => {
    // Simplified single sign-on - no TMB or OIDC authentication
    // Just mark SSO as finished to prevent blocking the application
    
    dataManager.setContract({ sso_finished: true });
    return Promise.resolve();
};
