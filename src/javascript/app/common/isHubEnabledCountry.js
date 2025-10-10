import { LocalStore } from '../../_common/storage';
import { getTopLevelDomain } from '../../_common/utility';
import RemoteConfig from '../hooks/useRemoteConfig';

let remoteConfigData = null;

const initRemoteConfig = async () => {
    try {
        const { data } = await RemoteConfig.getRemoteConfig(true);
        remoteConfigData = data;
    } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Failed to initialize remote config:', error);
    }
};

initRemoteConfig();

/**
 * Checks if the current domain is .com AND the user's country is in the hub enabled countries list
 * @returns {Boolean} true if all conditions are met, false otherwise
 */
const isHubEnabledCountry = () => {
    const is_com_domain = getTopLevelDomain().includes('com');

    if (!is_com_domain) {
        return false;
    }

    if (!remoteConfigData) {
        initRemoteConfig();
        return false;
    }
    const current_account = LocalStore.getObject('current_account');

    if (current_account && current_account.country) {
        const country = current_account.country.toLowerCase();
        
        if (remoteConfigData && remoteConfigData.hub_enabled_country_list) {
            return remoteConfigData.hub_enabled_country_list.includes(country);
        }
    }

    return false;
};

export default isHubEnabledCountry;
