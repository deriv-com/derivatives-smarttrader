const Client = require('../base/client');
const State  = require('../../_common/storage').State;

// will return true for all clients with maltainvest/malta/iom financial/gaming landing company shortcode
// needs to wait for authorize and landing_company before being called
// 'mt' is part of EU but account opening is not offered so the landing company response won't include the expected shortcode.
// we will use the fallback eu_excluded_regex for them.
const isEuCountry = () => {
    const eu_shortcode_regex  = /^(maltainvest|malta|iom)$/;
    const eu_excluded_regex   = /^mt$/;
    const financial_shortcode = State.getResponse('landing_company.financial_company.shortcode');
    const gaming_shortcode    = State.getResponse('landing_company.gaming_company.shortcode');
    const svg_shortcode       = gaming_shortcode === 'svg';
    const clients_country     = Client.get('residence');
    
    return (
        (financial_shortcode || gaming_shortcode) ?
            ((eu_shortcode_regex.test(financial_shortcode) && !svg_shortcode)
            || eu_shortcode_regex.test(gaming_shortcode)) :
            eu_excluded_regex.test(clients_country)
    );
};

const isIndonesia = () => Client.get('residence') === 'id';

const isExcludedFromCfd = () => {
    const cfd_excluded_regex = /^fr$/;
    const clients_country = Client.get('residence');
    return cfd_excluded_regex.test(clients_country);
};

module.exports = {
    isEuCountry,
    isIndonesia,
    isExcludedFromCfd,
};
