const DerivAnalytics = require('@deriv-com/analytics');
const CountryUtils = require('@deriv-com/utils').CountryUtils;
const Cookies = require('js-cookie');
const { LocalStore } = require('./storage');
const Language = require('./language');
const { tryParseJSON } = require('./utility');
const { getAppId } = require('../config');
const RemoteConfig = require('../app/hooks/useRemoteConfig');

const Analytics = (() => {
    const init = async () => {
        const active_account = LocalStore?.getObject('current_account') || {};
        const utmData = Cookies.get('utm_data');
        const parsedUtmData = utmData ? tryParseJSON(utmData) : { success: false };
        const ppcCampaignCookies = parsedUtmData.success
            ? parsedUtmData.data
            : {
                utm_campaign: 'no campaign',
                utm_content : 'no content',
                utm_medium  : 'no medium',
                utm_source  : 'no source',
            };

        // Get remote configuration with feature flags
        const { data: flags } = await RemoteConfig.getRemoteConfig(true);

        // Initialize RudderStack and/or PostHog based on feature flags
        // Note: posthogKey and posthogHost are supported in @deriv-com/analytics v1.33.0+
        const hasRudderStack = !!(process.env.RUDDERSTACK_KEY && flags.tracking_rudderstack);
        const hasPostHog = !!(process.env.POSTHOG_KEY && process.env.POSTHOG_HOST && flags.tracking_posthog);

        // RudderStack key is required by the Analytics package
        if (hasRudderStack || hasPostHog) {
            const config = {
                growthbookOptions: {
                    attributes: {
                        loggedIn       : !!Cookies.get('clients_information'),
                        account_type   : active_account?.account_type || 'unlogged',
                        app_id         : String(getAppId()),
                        country        : await CountryUtils.getCountry(),
                        device_language: navigator?.language || 'en-EN',
                        device_type    : window.innerWidth <= 600 ? 'mobile' : 'desktop',
                        domain         : window.location.hostname,
                        url            : window.location.href,
                        user_language  : Language.get().toLowerCase(),
                        utm_campaign   : ppcCampaignCookies?.utm_campaign,
                        utm_content    : ppcCampaignCookies?.utm_content,
                        utm_medium     : ppcCampaignCookies?.utm_medium,
                        utm_source     : ppcCampaignCookies?.utm_source,
                    },
                },
            };
      
            if (process.env.GROWTHBOOK_CLIENT_KEY) {
                config.growthbookKey = process.env.GROWTHBOOK_CLIENT_KEY;
            }
      
            // Add RudderStack if enabled
            if (hasRudderStack) {
                config.rudderstackKey = process.env.RUDDERSTACK_KEY;
            }
      
            // Add PostHog if enabled
            if (hasPostHog) {
                config.posthogKey = process.env.POSTHOG_KEY;
                config.posthogHost = process.env.POSTHOG_HOST;
            }
      
            await DerivAnalytics.Analytics.initialise(config);
        }
    };

    const isGrowthbookLoaded = () =>
        Boolean(DerivAnalytics.Analytics?.getInstances()?.ab);

    const getGrowthbookFeatureValue = ({ defaultValue, featureFlag }) => {
        const resolvedDefaultValue =
      defaultValue !== undefined ? defaultValue : false;
        const isGBLoaded = isGrowthbookLoaded();

        if (!isGBLoaded) return [null, false];

        return [
            DerivAnalytics.Analytics?.getFeatureValue(
                featureFlag,
                resolvedDefaultValue,
            ),
            true,
        ];
    };

    const setGrowthbookOnChange = (onChange) => {
        const isGBLoaded = isGrowthbookLoaded();
        if (!isGBLoaded) return null;

        const onChangeRenderer =
      DerivAnalytics.Analytics?.getInstances().ab.GrowthBook?.setRenderer(
          () => {
              onChange();
          },
      );
        return onChangeRenderer;
    };

    return {
        init,
        isGrowthbookLoaded,
        getGrowthbookFeatureValue,
        setGrowthbookOnChange,
    };
})();

module.exports = Analytics;
