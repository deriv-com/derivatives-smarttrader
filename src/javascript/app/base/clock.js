const moment             = require('moment');
const ServerTime         = require('../../_common/base/server_time');
const elementInnerHtml   = require('../../_common/common_functions').elementInnerHtml;
const applyToAllElements = require('../../_common/utility').applyToAllElements;

const Clock = (() => {
    let fncExternalTimer;
    const el_clock_selector = '.gmt-clock';
    const startClock = () => {
        ServerTime.init(onTimeUpdated);
    };

    const onTimeUpdated = () => {
        const server_time = ServerTime.get();
        window.time = server_time;

        const time_str = `${server_time.format('YYYY-MM-DD HH:mm:ss')} GMT`;
        applyToAllElements(el_clock_selector, (el) => {
            elementInnerHtml(el, time_str);
        });
        showLocalTimeOnHover(el_clock_selector);

        if (typeof fncExternalTimer === 'function') {
            fncExternalTimer();
        }
    };

    const showLocalTimeOnHover = (selector) => {
        document.querySelectorAll(selector || '.date').forEach((el) => {
            const gmt_time_str = el.textContent.replace(/\n/g, ' '); // Use replace with global flag instead of replaceAll for broader compatibility
            const local_time   = moment.utc(gmt_time_str, 'YYYY-MM-DD HH:mm:ss').local();
            if (local_time.isValid()) {
                // Properly escape the time string for safe attribute setting
                const escaped_time = local_time.format('YYYY-MM-DD HH:mm:ss Z').replace(/[<>"'&]/g, function(match) {
                    switch(match) {
                        case '<': return '&lt;';
                        case '>': return '&gt;';
                        case '"': return '&quot;';
                        case "'": return '&#39;';
                        case '&': return '&amp;';
                        default: return match;
                    }
                });
                el.setAttribute('data-balloon', escaped_time);
            }
        });
    };

    const getLocalTime = (time) => {
        const gmt_time_str = time.replace(/\n/g, ' '); // Use replace with global flag instead of replaceAll for broader compatibility
        const local_time   = moment.utc(gmt_time_str, 'YYYY-MM-DD HH:mm:ss').local();
       
        return local_time.format('YYYY-MM-DD HH:mm:ss Z');
    };

    return {
        startClock,
        showLocalTimeOnHover,
        getLocalTime,
        setExternalTimer: (func) => { fncExternalTimer = func; },
    };
})();

module.exports = Clock;