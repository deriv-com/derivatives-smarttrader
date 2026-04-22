import { localize } from '@deriv-com/translations';
import Url from '../../../_common/url';

const img = name => Url.urlForStatic(`images/migration-onboarding/migration-onboarding-${name}.png`);

export const getMobileSteps = () => [
    {
        title      : localize('Welcome to new SmartTrader'),
        description: localize('A refined look, simpler trading and easier navigation, all in one place.'),
        image      : img('step-1-mobile'),
    },
    {
        title      : localize('Options account now in USD'),
        description: localize('If you have funds, they are in your Wallet. Transfer them to your Options account to trade.'),
        image      : img('step-2-mobile'),
    },
    {
        title      : localize('Find everything faster'),
        description: localize('The new navigation gives you instant access to the features you use most.'),
        image      : img('step-3-mobile'),
    },
];

export const getDesktopSteps = () => [
    {
        title      : localize('Welcome to new SmartTrader'),
        description: localize('A refined look, simpler trading and easier navigation, all in one place.'),
        image      : img('step-1-light'),
    },
    {
        title      : localize('Options account now in USD'),
        description: localize('If you have funds, they are in your Wallet. Transfer them to your Options account to trade.'),
        image      : img('step-2-light'),
    },
    {
        title      : localize('Find everything faster'),
        description: localize('The new navigation gives you instant access to the features you use most.'),
        image      : img('step-3-light'),
    },
];
