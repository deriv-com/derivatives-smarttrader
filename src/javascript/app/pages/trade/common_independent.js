const moment           = require('moment');
const Defaults = require('./defaults');
const dataManager      = require('../../common/data_manager').default;
const getElementById   = require('../../../_common/common_functions').getElementById;
const getPropertyValue = require('../../../_common/utility').getPropertyValue;

/*
 * Display price/spot movement variation to depict price moved up or down
 */
const displayPriceMovement = (element, old_value, current_value, data_key) => {
    element.classList.remove('price_moved_down');
    element.classList.remove('price_moved_up');

    dataManager.setPurchase({
        [data_key]: '',
    });

    if (parseFloat(current_value) > parseFloat(old_value)) {
        element.classList.remove('price_moved_down');
        element.classList.add('price_moved_up');
        dataManager.setPurchase({
            [data_key]: 'price_moved_up',
        });
    } else if (parseFloat(current_value) < parseFloat(old_value)) {
        element.classList.remove('price_moved_up');
        element.classList.add('price_moved_down');
        dataManager.setPurchase({
            [data_key]: 'price_moved_down',
        });
    }
};

/*
 * count number of decimal places in spot so that we can make barrier to same decimal places
 */
const countDecimalPlaces = (num) => {
    if (!isNaN(num)) {
        const str = num.toString();
        if (str.indexOf('.') !== -1) {
            return str.split('.')[1].length;
        }
    }
    return 0;
};

const trading_times = {};

const processTradingTimesAnswer = (response) => {
    if (!getPropertyValue(trading_times, response.echo_req.trading_times) && getPropertyValue(response, ['trading_times', 'markets'])) {
        for (let i = 0; i < response.trading_times.markets.length; i++) {
            const submarkets = response.trading_times.markets[i].submarkets;
            if (submarkets) {
                for (let j = 0; j < submarkets.length; j++) {
                    const symbols = submarkets[j].symbols;
                    if (symbols) {
                        for (let k = 0; k < symbols.length; k++) {
                            const symbol = symbols[k];
                            if (!trading_times[response.echo_req.trading_times]) {
                                trading_times[response.echo_req.trading_times] = {};
                            }
                            const symbol_id = symbol.underlying_symbol;
                            trading_times[response.echo_req.trading_times][symbol_id] = symbol.times.close;
                        }
                    }
                }
            }
        }
    }
};

const getElement = () => getElementById('date_start');

const checkValidTime = (time_start_element = getElementById('time_start'), $date_start = $('#date_start'), time = time_start_element.value) => {
    let time_array = '';
    if (time) {
        time_array = time.split(':');
    }
    const now_time           = moment.utc();
    const hour               = time_array.length ? +time_array[0] : now_time.hour();
    const minute             = time_array.length ? +time_array[1] : now_time.minute();
    const date_time          = moment.utc(getElement().value * 1000).hour(hour).minute(minute);
    const min_max_time       = getMinMaxTimeStart($date_start);
    let min_time             = min_max_time.minTime.clone();
    if (!(min_max_time.minTime.format('HH:mm') === '23:55')) {
        min_time = min_time.add(5, 'minutes');
    }
    time_start_element.value = date_time.isBefore(min_time) || date_time.isAfter(min_max_time.maxTime) || !time ? min_time.format('HH:mm') : time_array.join(':');
    Defaults.set(Defaults.PARAM_NAMES.TIME_START, time_start_element.value);
    time_start_element.setAttribute('data-value', time_start_element.value);
};

const getMinMaxTimeStart = ($min_max_selector = $('#date_start'), moment_now = (window.time || moment.utc()).clone()) => {
    const $selected_option = getSelectedOption($min_max_selector);
    const start_date       = moment.unix($min_max_selector.val()).utc();
    const end_date         = moment.unix($selected_option.attr('data-end')).utc();
    return {
        minTime: start_date.isAfter(moment_now) ? start_date : moment_now.clone(),
        maxTime: end_date.isSame(start_date, 'day') ? end_date : start_date.clone().hour(23).minute(55).second(0),
    };
};

const getMinMaxTimeEnd = (moment_now = (window.time || moment.utc()).clone(), $expiry_date = $('#expiry_date')) => {
    let min_time,
        max_time;
    // Since start time functionality has been removed from API, we now use current time
    // to determine the minimum end time instead of relying on start time
    const expiry_date_val = $expiry_date.attr('data-value');
    const selected_expiry_date = moment.utc(expiry_date_val);
    
    // Check if the selected expiry date is today
    const is_today = selected_expiry_date.isSame(moment_now, 'day');
    
    if (is_today) {
        // For today's date, minimum time should be current time + 5 minutes buffer
        min_time = moment_now.clone().add(5, 'minutes');
        // Round up to next 5-minute interval to match TimePicker options
        const minutes = min_time.minute();
        const rounded_minutes = Math.ceil(minutes / 5) * 5;
        min_time.minute(rounded_minutes).second(0);
        
        // Maximum time is end of trading day (23:55)
        max_time = selected_expiry_date.clone().hour(23).minute(55).second(0);
    } else {
        // For future dates, allow any time from start of day
        min_time = selected_expiry_date.clone().startOf('day');
        max_time = selected_expiry_date.clone().hour(23).minute(55).second(0);
    }
    return {
        minTime: min_time,
        maxTime: max_time,
    };
};

const getSelectedOption = ($selector) => {
    let $selected_option = $selector.find('option:selected');
    // if 'now' is selected, take first option's value
    if (isNaN(+$selector.val())) {
        $selected_option = $($selector.find('option')[1]);
    }
    return $selected_option;
};

module.exports = {
    displayPriceMovement,
    countDecimalPlaces,
    processTradingTimesAnswer,
    checkValidTime,
    getSelectedOption,
    getMinMaxTimeStart,
    getMinMaxTimeEnd,
    getStartDateNode: getElement,
    getTradingTimes : () => trading_times,
};
