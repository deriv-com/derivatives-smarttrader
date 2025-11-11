const  DerivAPIBasic  = require('@deriv/deriv-api/dist/DerivAPIBasic');
const expect      = require('chai').expect;
const { JSDOM }   = require('jsdom');
const websocket   = require('ws');
const Language    = require('../language');
const Url         = require('../url');
// ignore svgs in tests. @TODO once svg inliner or jsdom upgrades, check again to see if we can remove this
require.extensions['.svg'] = () => '<svg></svg>';

const setURL = (url) => {
    // Ensure proper URL format to avoid localStorage security errors with opaque origins
    const validUrl = url && url.startsWith('http') ? url : `https://example.com${url || ''}`;
    const dom = new JSDOM('<!DOCTYPE html>', { url: validUrl });
    global.window = dom.window;
    global.document = dom.window.document;
    global.location = dom.window.location;
    global.localStorage = dom.window.localStorage;
    global.sessionStorage = dom.window.sessionStorage;
    Url.reset();
    Language.reset();
};

module.exports = {
    expect,
    setURL,
    getApiToken: () => 'hhh9bfrbq0G3dRf',
    api: new DerivAPIBasic({
        connection: new websocket('wss://ws.derivws.com/websockets/v3?app_id=1'),
    }),
};