import React from 'react';
import { localize } from '@deriv-com/translations';
import Wrapper from './wrapper.jsx';
import { Table } from '../../../_common/components/elements.jsx';

const RcRow = ({ string, id }) => (
    <div className='gr-row gr-padding-10'>
        <div className='gr-3 gr-6-m'><label>{string}</label></div>
        <div className='gr-9 gr-6-m'><label id={id} /></div>
    </div>
);

const Summary = () => (
    <React.Fragment>
        <Wrapper>
            <RcRow string={localize('Login time:')} id='login_time' />
            <RcRow string={localize('Current time:')} id='current_time' />
            <RcRow string={localize('Session duration:')} id='session_duration' />

            <p id='start_time' />

            <div className='table-container'>
                <Table
                    data={{
                        tbody: [
                            [
                                { header: localize('Login ID') },
                                { header: localize('Currency') },
                                { header: localize('Turnover') },
                                { header: localize('Profit / Loss') },
                                { header: localize('Contracts bought') },
                                { header: localize('Contracts sold') },
                                { header: localize('Open contracts') },
                                { header: localize('Potential profit') },
                            ],
                            [
                                { id: 'loginid' },
                                { id: 'rc_currency' },
                                { id: 'turnover' },
                                { id: 'profit_loss' },
                                { id: 'bought' },
                                { id: 'sold' },
                                { id: 'open' },
                                { id: 'potential' },
                            ],
                        ],
                    }}
                />
            </div>
        </Wrapper>
    </React.Fragment>
);

export default Summary;
