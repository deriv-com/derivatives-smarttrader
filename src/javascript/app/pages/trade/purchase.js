const moment                   = require('moment');
const { localize }             = require('@deriv-com/translations');
const Contract                 = require('./contract');
const countDecimalPlaces       = require('./common_independent').countDecimalPlaces;
const DigitTicker              = require('./digit_ticker');
const TickDisplay              = require('./tick_trade');
const updateValues             = require('./update_values');
const Client                   = require('../../base/client');
const Login                    = require('../../../_common/base/login');
const { getBrandSignupUrl }    = require('../../../../templates/_common/brand.config');
const BinarySocket             = require('../../base/socket');
const formatMoney              = require('../../common/currency').formatMoney;
const changePocNumbersToString = require('../../common/request_middleware').changePocNumbersToString;
const addComma                 = require('../../../_common/base/currency_base').addComma;
const CommonFunctions          = require('../../../_common/common_functions');
const Url                      = require('../../../_common/url');
const dataManager              = require('../../common/data_manager').default;
const createElement            = require('../../../_common/utility').createElement;
const getPropertyValue         = require('../../../_common/utility').getPropertyValue;
const { getAccountType }       = require('../../../config');

/*
 * Purchase object that handles all the functions related to
 * contract purchase response
 */
const Purchase = (() => {
    const adjustment = 5;

    let payout_value,
        cost_value,
        profit_value,
        status,
        digits_added,
        el_digit_epoch,
        el_digit_quote;

    const replaceElement = (container, child) => {
        container.querySelectorAll('.row').forEach(item => item.classList.add('invisible'));
        // Count up to the number instead of just replacing it.
        if (Array.from(container.querySelectorAll('.row.digit-trade')).length > 0) {
            const this_quote_el = child.querySelector('.quote');
            container.append(child);
            if (this_quote_el.parentElement.parentElement.previousSibling) {
                const prev_quote_el = this_quote_el.parentElement.parentElement.previousSibling.querySelector('.quote');
                const prev_quote = prev_quote_el.innerText;
                DigitTicker.countUp(prev_quote,
                    parseFloat(this_quote_el.innerText.replace(/,+/, '')),
                    700,
                    this_quote_el,
                    (content) => `<div class='quote'>${addComma(content, countDecimalPlaces(content)).replace(/\d$/, makeBold)}</div>`,
                );
            }
        } else {
            container.append(child);
        }
    };

    const display = async (details) => {
        status = '';

        const receipt             = details.buy;
        const passthrough         = details.echo_req.passthrough;
        const container           = CommonFunctions.getElementById('contract_confirmation_container');
        const message_container   = CommonFunctions.getElementById('confirmation_message');
        const heading             = CommonFunctions.getElementById('contract_purchase_heading');
        const barrier_element     = CommonFunctions.getElementById('contract_purchase_barrier');
        const reference           = CommonFunctions.getElementById('contract_purchase_reference');
        const chart               = CommonFunctions.getElementById('trade_tick_chart');
        const payout              = CommonFunctions.getElementById('contract_purchase_payout');
        const cost                = CommonFunctions.getElementById('contract_purchase_cost');
        const profit              = CommonFunctions.getElementById('contract_purchase_profit');
        const spots               = CommonFunctions.getElementById('contract_purchase_spots');
        const confirmation_error  = CommonFunctions.getElementById('confirmation_error');
        const authorization_error = CommonFunctions.getElementById('authorization_error_container');
        const contracts_list      = CommonFunctions.getElementById('contracts_list');
        const button              = CommonFunctions.getElementById('contract_purchase_button');

        const error      = details.error;
        const has_chart  = !/^digits$/.test(Contract.form());
        const show_chart = !error && passthrough.duration <= 10 && passthrough.duration_unit === 't';

        if (error) {
            confirmation_error.show();

            // Note: TopUpVirtualPopup removed - account management functionality disabled
            if (/InsufficientBalance/.test(error.code)) {
                // Show insufficient balance error without top-up popup
                contracts_list.style.display = 'none';
                container.style.display = 'block';
                dataManager.setPurchase({
                    show_purchase_results: true,
                });

                message_container.hide();
                confirmation_error.setVisibility(1);
                CommonFunctions.elementInnerHtml(confirmation_error, error.message);
                
                dataManager.setPurchase({
                    error: { ...error },
                });
            } else {
                contracts_list.style.display = 'none';
                container.style.display = 'block';
                dataManager.setPurchase({
                    show_purchase_results: true,
                });

                message_container.hide();
                if (/AuthorizationRequired/.test(error.code)) {
                    authorization_error.setVisibility(1);
                    const authorization_error_btn_login = CommonFunctions.getElementById('authorization_error_btn_login');
                    const authorization_error_btn_signup = CommonFunctions.getElementById('authorization_error_btn_signup');
                    authorization_error_btn_login.onclick = Login.redirectToLogin;
                    authorization_error_btn_signup.onclick = Login.redirectToSignup;

                    const signup_url = getBrandSignupUrl();

                    dataManager.setPurchase({
                        error: {
                            ...error,
                            signup_url,
                            title    : localize('Ready to trade?'),
                            is_custom: true,
                        },
                    });

                } else {
                    BinarySocket.wait('get_account_status').then(response => {
                        confirmation_error.setVisibility(1);
                        let message = error.message;
                      
                        if (/NoMFProfessionalClient/.test(error.code)) {
                            const account_status = getPropertyValue(response, ['get_account_status', 'status']) || [];
                            const has_professional_requested = account_status.includes('professional_requested');
                            const has_professional_rejected  = account_status.includes('professional_rejected');
                            if (has_professional_requested) {
                                message = localize('Your application to be treated as a professional client is being processed.');
                            } else if (has_professional_rejected) {
                                const message_text = `${localize('Your professional client request is <strong>not approved</strong>.')}<br />${localize('Please reapply once the required criteria has been fulfilled.')}<br /><br />${localize('More information can be found in an email sent to you.')}`;
                                const button_text  = localize('I want to reapply');

                                message = prepareConfirmationErrorCta(message_text, button_text, true);
                            } else {
                                const message_text = localize('In the EU, financial binary options are only available to professional investors.');
                                const button_text  = localize('Apply now as a professional investor');

                                message = prepareConfirmationErrorCta(message_text, button_text);
                            }
                        } else if (/RestrictedCountry/.test(error.code)) {
                            let additional_message = '';
                            if (/FinancialBinaries/.test(error.code)) {
                                additional_message = localize('Try our <a href="{{url}}">Synthetic Indices</a>.', { url: Url.urlFor('get-started/binary-options', 'anchor=synthetic-indices#range-of-markets') });
                            } else if (/Random/.test(error.code)) {
                                additional_message = localize('Try our other markets.');
                            }

                            message = `${error.message}. ${additional_message}`;
                        } else if (/ClientUnwelcome/.test(error.code) && /gb/.test(Client.get('residence'))) {
                            const account_type = getAccountType();
                            if (account_type === 'demo') {
                                message = localize('Please complete the <a href="{{url}}">Real Account form</a> to verify your age as required by the <strong>UK Gambling</strong> Commission (UKGC).', { url: Url.urlFor('new_account/realws') });
                            } else if (account_type === 'real' && /^virtual|iom$/i.test(Client.get('landing_company_shortcode'))) {
                                message = localize('Account access is temporarily limited. Please check your inbox for more details.');
                            } else {
                                message = error.message;
                            }
                        }

                        dataManager.setPurchase({
                            error: { ...error,message },
                        });

                        CommonFunctions.elementInnerHtml(confirmation_error, message);
                    });
                }
            }
        } else {
            contracts_list.style.display = 'none';
            container.style.display = 'table-row';
            message_container.show();
            authorization_error.setVisibility(0);
            confirmation_error.setVisibility(0);
            dataManager.setPurchase({
                error: null,
            });

            CommonFunctions.elementTextContent(heading, localize('Contract Confirmation'));
            CommonFunctions.elementTextContent(barrier_element, '');
            CommonFunctions.elementTextContent(reference, `${localize('Your transaction reference is')} ${receipt.transaction_id}`);

            dataManager.setPurchase({
                show_purchase_results: true,
                pr_heading           : localize('Contract Confirmation'),
                pr_barrier           : '',
                pr_reference         : `${localize('Your transaction reference is')} ${receipt.transaction_id}`,
            });

            const currency = Client.get('currency');
            payout_value = +receipt.payout;
            cost_value   = receipt.buy_price;

            const potential_profit_value = payout_value ? formatMoney(currency, payout_value - cost_value) : undefined;

            CommonFunctions.elementInnerHtml(cost,   `${localize('Total Cost')} <p>${formatMoney(currency, cost_value)}</p>`);
            dataManager.setPurchase({
                pr_table_cost      : localize('Total Cost'),
                pr_table_cost_value: formatMoney(currency, cost_value),
            });

            profit.setVisibility(1);
            CommonFunctions.elementInnerHtml(payout, `${localize('Potential Payout')} <p>${formatMoney(currency, payout_value)}</p>`);
            CommonFunctions.elementInnerHtml(profit, `${localize('Potential Profit')} <p>${potential_profit_value}</p>`);

            dataManager.setPurchase({
                pr_table_payout      : localize('Potential Payout'),
                pr_table_payout_value: formatMoney(currency, payout_value),
                pr_table_profit      : localize('Potential Profit'),
                pr_table_profit_value: potential_profit_value,
                pr_show_table_profit : true,
            });

            updateValues.updateContractBalance(receipt.balance_after);

            if (show_chart && has_chart) {
                chart.innerHTML = '';
                chart.show();
            } else {
                chart.hide();
            }

            if (has_chart) {
                spots.hide();
            } else {
                CommonFunctions.elementTextContent(spots, '');
                spots.className = '';
                spots.show();
            }

            if (has_chart && !show_chart) {
                CommonFunctions.elementTextContent(button, localize('View'));
                button.setAttribute('contract_id', receipt.contract_id);
                button.show();
                dataManager.setPurchase({
                    pr_show_button: true,
                });
                $('#confirmation_message_container .open_contract_details').attr('contract_id', receipt.contract_id).setVisibility(1);
            } else {
                button.hide();
                dataManager.setPurchase({
                    pr_show_button: false,
                });
                $('#confirmation_message_container .open_contract_details').setVisibility(0);
            }
        }

        if (/^digit/i.test(passthrough.contract_type) && show_chart) {
            digits_added = undefined;
            el_digit_epoch = undefined;
            el_digit_quote = undefined;
            DigitTicker.init('digit_ticker_table', passthrough.contract_type, receipt.shortcode, passthrough.duration, status);
        } else {
            DigitTicker.remove();
        }

        if (show_chart && has_chart) {
            TickDisplay.init('trade_tick_chart', true);
        }

        if (show_chart) {
            const request = {
                proposal_open_contract: 1,
                contract_id           : receipt.contract_id,
                subscribe             : 1,
            };
            BinarySocket.send(request, { callback: (response) => {
                const mw_response = response.proposal_open_contract ? changePocNumbersToString(response) : undefined;
                const contract = mw_response ? mw_response.proposal_open_contract : undefined;
                if (contract) {
                    status = contract.status;
                    profit_value = contract.profit;
                    if (has_chart) {
                        TickDisplay.updateChart(contract);
                    }
                    if (/^digit/i.test(contract.contract_type)) {
                        updateSpotList(contract);
                    }

                    // force to sell the expired contract, in order to get the final status
                    if (+contract.is_settleable === 1 && !contract.is_sold) {
                        sellExpired();
                    }
                }
            } });
        }
    };

    const sellExpired = () => BinarySocket.send({ sell_expired: 1 });

    const makeBold = d => `<strong>${d}</strong>`;

    const prepareConfirmationErrorCta = (message_text, button_text, has_html = false) => {
        const row_element = createElement('div', { class: 'gr-row font-style-normal' });
        const columnElement = (extra_attributes = {}) => createElement('div', { class: 'gr-12 gr-padding-20', ...extra_attributes });
        const button_element = createElement('a', { class: 'button', href: Url.urlFor('user/settings/professional') });
        const cta_element = columnElement();
        let message_element;

        if (has_html) {
            message_element = columnElement();
            message_element.innerHTML = message_text;
        } else {
            message_element = columnElement({ text: message_text });
        }

        button_element.appendChild(createElement('span', { text: button_text }));
        cta_element.appendChild(button_element);
        row_element.appendChild(message_element);
        row_element.appendChild(cta_element);

        return row_element.outerHTML;
    };

    const onclose = () => {
        DigitTicker.remove();
    };

    const updateSpotList = (contract) => {
        const el_spots = CommonFunctions.getElementById('contract_purchase_spots');
        if (!CommonFunctions.isVisible(el_spots) || !contract.tick_stream) {
            return;
        }

        contract.tick_stream.forEach((data, idx) => {
            // only add this digit if it hasn't previously been added
            if (typeof digits_added === 'undefined' || idx > digits_added) {
                DigitTicker.update(idx + 1, data);

                const display_tick = data.tick_display_value.replace(/\d$/, makeBold);
                const display_epoch = moment(new Date(data.epoch * 1000)).utc().format('HH:mm:ss');

                // if it's the first time, create the elements and append them to DOM
                if (!el_digit_epoch) {
                    const fragment = createElement('div', { class: 'row digit-trade' });

                    const el3 = createElement('div', { class: 'col' });
                    const el_tick = createElement('div', { class: 'quote' });
                    CommonFunctions.elementInnerHtml(el_tick, display_tick);
                    el3.appendChild(el_tick);

                    const el_epoch = document.createElement('div');
                    el_epoch.className = 'digit-tick-epoch is-visible';
                    el_epoch.textContent = display_epoch;

                    fragment.appendChild(el_epoch);
                    el3.insertBefore(el_epoch, el3.childNodes[0]);

                    replaceElement(fragment, el3);
                    replaceElement(el_spots, fragment);

                    el_spots.scrollTop = el_spots.scrollHeight;

                    el_digit_epoch = el_spots.getElementsByClassName('digit-tick-epoch')[0];
                    el_digit_quote = el_spots.getElementsByClassName('quote')[0];

                    el_digit_epoch.setAttribute('style', `position: absolute; right: ${((el3.offsetWidth - el_tick.offsetWidth) / 2) + adjustment}px`);
                } else {
                    // otherwise just update the latest values
                    el_digit_quote.innerHTML = display_tick;
                    el_digit_epoch.textContent = display_epoch;
                }

                // keep track of the number of added digits
                digits_added = idx;
            }
        });

        digitShowExitTime(contract);
    };

    const digitShowExitTime = (contract) => {
        if (contract.status === 'open' && !contract.is_sold && !contract.is_settleable) {
            return;
        }

        const last_digit_quote = contract.exit_spot ? contract.exit_spot.slice(-1) : '';
        if (status === 'won') {
            DigitTicker.markAsWon();
            DigitTicker.markDigitAsWon(last_digit_quote);
            updateValues.updatePurchaseStatus(payout_value, cost_value, profit_value, localize('This contract won'));
        } else if (status === 'lost') {
            DigitTicker.markAsLost();
            DigitTicker.markDigitAsLost(last_digit_quote);
            updateValues.updatePurchaseStatus(0, -cost_value, profit_value, localize('This contract lost'));
        }
    };

    return {
        display,
        onclose,
    };
})();

module.exports = Purchase;
