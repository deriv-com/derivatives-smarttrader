const Client = require('../base/client');
const State  = require('../../_common/storage').State;

const isIndonesia = () => {
    const country = Client.get('residence') ||
                   State.getResponse('authorize.country') ||
                   State.getResponse('landing_company.id');
    return country === 'id';
};

const isExcludedFromCfd = () => {
    const cfd_excluded_regex = /^fr$/;
    const clients_country = Client.get('residence') ||
                           State.getResponse('authorize.country') ||
                           State.getResponse('landing_company.id') ||
                           'gb'; // Default fallback
    return cfd_excluded_regex.test(clients_country);
};

module.exports = {
    isIndonesia,
    isExcludedFromCfd,
};
