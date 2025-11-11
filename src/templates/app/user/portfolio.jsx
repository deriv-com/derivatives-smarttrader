import React from 'react';
import { localize } from '@deriv-com/translations';
import { Table } from '../../_common/components/elements.jsx';

const Portfolio = () => (
    <div id='portfolio'>
        <h1 className='portfolio-header-margin'>{localize('Portfolio')}</h1>

        <p className='notice-msg center-text invisible' id='error-msg' />

        <div id='portfolio-loading' />

        <div id='portfolio-content' className='invisible'>
            <div className='gr-parent gr-padding-10'>
                {localize('Account balance: ')}
                <span className='loading' id='portfolio-balance' />

                {/* If the account balance is zero we show the following button, otherwise we remove it */}
                <span id='if-balance-zero' className='invisible'>
                    &nbsp;
                    <a href={it.url_for('cashier/forwardws?action=deposit')} className='button nowrap'>
                        <span>{localize('Make a Deposit')}</span>
                    </a>
                </span>
            </div>

            <div id='portfolio-no-contract'>
                <p>{localize('No open positions.')}</p>
            </div>

            <Table
                id='portfolio-table'
                tbody_id='portfolio-body'
                scroll
                data={{
                    thead: [
                        [
                            { className: 'ref',                              text: localize('Ref.') },
                            { className: 'payout nowrap',                    text: localize('Potential Payout') },
                            { className: 'details',                          text: localize('Contract Details') },
                            { className: 'purchase',                         text: localize('Purchase') },
                            { className: 'indicative nowrap',                text: localize('Indicative') },
                            { className: 'button',                           text: '' },
                        ],
                    ],
                    tfoot: [
                        [
                            { text: localize('Total') },
                            { className: 'ref',                   attributes: { colSpan: 2 } },
                            { className: 'cost',                  id: 'cost-of-open-positions' },
                            { className: 'value',                 id: 'value-of-open-positions', attributes: { colSpan: 2 } },
                        ],
                    ],
                }}
            />
        </div>
    </div>
);

export default Portfolio;
