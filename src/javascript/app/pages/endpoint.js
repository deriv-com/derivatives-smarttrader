const getSocketURL = require('../../config').getSocketURL;
const LocalStore   = require('../../_common/storage').LocalStore;

const Endpoint = (() => {
    const onLoad = () => {
        const $server_url = $('#server_url');
        $server_url.val(getSocketURL().split('/')[2]);

        $('#frm_endpoint').on('submit', (e) => {
            e.preventDefault();
            const server_url = $server_url.val().trim().toLowerCase().replace(/[><()/"']/g, '');
            if (server_url) localStorage.setItem('config.server_url', server_url);
            LocalStore.remove('ws_cache'); // Clear WebSocket cache when server URL changes
            window.location.reload();
        });

        $('#reset_endpoint').on('click', () => {
            localStorage.removeItem('config.server_url');
            LocalStore.remove('ws_cache'); // Clear WebSocket cache when endpoint is reset
            window.location.reload();
        });
    };

    return {
        onLoad,
    };
})();

module.exports = Endpoint;
