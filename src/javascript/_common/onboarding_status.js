const { fetchREST } = require('./derivatives_account_api');

const fetchOnboardingStatus = () => fetchREST('/v1/client/onboarding-status');

const getIsMigratedUser = () => localStorage.getItem('is_migrated_user') === 'true';

module.exports = {
    fetchOnboardingStatus,
    getIsMigratedUser,
};
