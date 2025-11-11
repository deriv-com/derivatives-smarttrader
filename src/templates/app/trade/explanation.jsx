import React from 'react';
import { localize } from '@deriv-com/translations';

const Note = ({ children, text }) => (
    <p className='hint'><strong>{localize('Note')}: </strong>{text || children}</p>
);

// const Duration = ({ link }) => (
//     <React.Fragment>
//         <h3>{it.L('Contract duration')}</h3>
//         <p>{it.L('Please refer to the [_1]asset index[_2] for each asset\'s minimum and maximum contract durations based on trade type.', `<a href='${it.url_for('resources/asset_indexws')}#${link}' target='_blank'>`, '</a>')}</p>
//     </React.Fragment>
// );

const Explanation = () => (
    <div className='gr-parent'>
        {/* ========== Winning ========== */}
        <div id='explanation_winning' className='invisible'>
            <div id='winning_asian' className='invisible'>
                <h3>{localize('Winning the contract')}</h3>
                <p>{localize('Asian options settle by comparing the <strong>last tick</strong> with the average spot over the period.')}</p>
                <p>{localize('If you select "Asian Rise", you will win the payout if the <strong>last tick</strong> is <strong>higher</strong> than the <strong>average</strong> of the ticks.')}</p>
                <p>{localize('If you select "Asian Fall", you will win the payout if the <strong>last tick</strong> is <strong>lower</strong> than the <strong>average</strong> of the ticks.')}</p>
                <p>{localize('If the <strong>last tick</strong> is equal to the average of the ticks, you don\'t win the payout.')}</p>
            </div>

            <div id='winning_digits' className='invisible'>
                <h3>{localize('Winning the contract')}</h3>
                <p>{localize('If you select "Matches", you will win the payout if the <strong>last digit</strong> of the last tick is the <strong>same</strong> as your <strong>prediction.</strong>')}</p>
                <p>{localize('If you select "Differs", you will win the payout if the <strong>last digit</strong> of the last tick is <strong>not the same</strong> as your <strong>prediction</strong>.')}</p>
            </div>

            <div id='winning_endsinout' className='invisible'>
                <h3>{localize('Winning the contract')}</h3>
                <p>{localize('If you select "Ends Between", you win the payout if the <strong>exit spot</strong> is strictly higher than the <strong>Low barrier</strong> AND strictly lower than the <strong>High barrier</strong>.')}</p>
                <p>{localize('If you select "Ends Outside", you win the payout if the <strong>exit spot</strong> is EITHER strictly higher than the <strong>High barrier</strong>, OR strictly lower than the <strong>Low barrier</strong>.')}</p>
                <p>{localize('If the <strong>exit spot</strong> is equal to either the <strong>Low barrier</strong> or the <strong>High barrier</strong>, you don\'t win the payout.')}</p>
            </div>

            <div id='winning_evenodd' className='invisible'>
                <h3>{localize('Winning the contract')}</h3>
                <p>{localize('If you select "Even", you will win the payout if the <strong>last digit</strong> of the last tick is an <strong>even number (i.e., 2, 4, 6, 8, or 0).</strong>')}</p>
                <p>{localize('If you select "Odd", you will win the payout if the <strong>last digit</strong> of the last tick is an <strong>odd number (i.e., 1, 3, 5, 7, or 9).</strong>')}</p>
            </div>

            <div id='winning_higherlower' className='invisible'>
                <h3>{localize('Winning the contract')}</h3>
                <p>{localize('If you select "Higher", you win the payout if the <strong>exit spot</strong> is strictly higher than the <strong>barrier</strong>.')}</p>
                <p>{localize('If you select "Lower", you win the payout if the <strong>exit spot</strong> is strictly lower than the <strong>barrier</strong>.')}</p>
                <p>{localize('If the <strong>exit spot</strong> is equal to the <strong>barrier</strong>, you don\'t win the payout.')}</p>
            </div>

            <div id='winning_overunder' className='invisible'>
                <h3>{localize('Winning the contract')}</h3>
                <p>{localize('If you select "Over", you will win the payout if the <strong>last digit</strong> of the last tick is <strong>greater than your prediction.</strong>')}</p>
                <p>{localize('If you select "Under", you will win the payout if the <strong>last digit</strong> of the last tick is <strong>less than your prediction.</strong>')}</p>
            </div>

            <div id='winning_risefall' className='invisible'>
                <h3>{localize('Winning the contract')}</h3>
                <p>{localize('If you select "Rise", you win the payout if the <strong>exit spot</strong> is strictly higher than the <strong>entry spot</strong>.')}</p>
                <p>{localize('If you select "Fall", you win the payout if the <strong>exit spot</strong> is strictly lower than the <strong>entry spot</strong>.')}</p>
                <p>{localize('If you select "Allow equals", you win the payout if exit spot is higher than or equal to entry spot for "Rise". Similarly, you win the payout if exit spot is lower than or equal to entry spot for "Fall".')}</p>
            </div>

            <div id='winning_runbet-lucky10' className='invisible'>
                <h3>{localize('Winning the contract')}</h3>
                <p>{localize('You win the payout if the market price ends in the digit you have selected.')}</p>
            </div>

            <div id='winning_runbet-quick10' className='invisible'>
                <h3>{localize('Winning the contract')}</h3>
                <p>{localize('You win the payout if the market price does not end in the digit you have selected.')}</p>
            </div>

            <div id='winning_runbet-updown' className='invisible'>
                <h3>{localize('Winning the contract')}</h3>
                <p>{localize('If you select "rises", you win the payout if the market price is higher than the <strong>entry spot</strong>.')}</p>
                <p>{localize('If you select "falls", you win the payout if the market price is lower than the <strong>entry spot</strong>.')}</p>
            </div>

            <div id='winning_staysinout' className='invisible'>
                <h3>{localize('Winning the contract')}</h3>
                <p>{localize('If you select "Stays Between", you win the payout if the market stays between (does not touch) either the <strong>High barrier</strong> or the <strong>Low barrier</strong> at any time during the <strong>contract period</strong>.')}</p>
                <p>{localize('If you select "Goes Outside", you win the payout if the market touches either the <strong>High barrier</strong> or the <strong>Low barrier</strong> at any time during the <strong>contract period</strong>.')}</p>
            </div>

            <div id='winning_ticks' className='invisible'>
                <h3>{localize('Winning the contract')}</h3>
                <p>{localize('If you select "Rises", you win the payout if the <strong>exit spot</strong> is strictly higher than the <strong>entry spot</strong>.')}</p>
                <p>{localize('If you select "Falls", you win the payout if the <strong>exit spot</strong> is strictly lower than the <strong>entry spot</strong>.')}</p>
            </div>

            <div id='winning_touchnotouch' className='invisible'>
                <h3>{localize('Winning the contract')}</h3>
                <p>{localize('If you select "Touches", you win the payout if the market touches the <strong>barrier</strong> at any time during the <strong>contract period</strong>.')}</p>
                <p>{localize('If you select "Does Not Touch", you win the payout if the market never touches the <strong>barrier</strong> at any time during the <strong>contract period</strong>.')}</p>
            </div>

            <div id='winning_updown' className='invisible'>
                <h3>{localize('Winning the contract')}</h3>
                <p>{localize('If you select "rises", you win the payout if the market price is higher than the entry spot.')}</p>
                <p>{localize('If you select "falls", you win the payout if the market price is lower than the entry spot.')}</p>
            </div>

            <div id='winning_lookbacklow' className='invisible'>
                <h3>{localize('Pay-out')}</h3>
                <p>{localize('By purchasing the <strong>"Close-Low"</strong> contract, you\'ll win the multiplier times the difference between the <strong>close</strong> and <strong>low</strong> over the duration of the contract.')}</p>
            </div>
            <div id='winning_lookbackhigh' className='invisible'>
                <h3>{localize('Pay-out')}</h3>
                <p>{localize('By purchasing the <strong>"High-Close"</strong> contract, you\'ll win the multiplier times the difference between the <strong>high</strong> and <strong>close</strong> over the duration of the contract.')}</p>
            </div>
            <div id='winning_lookbackhighlow' className='invisible'>
                <h3>{localize('Pay-out')}</h3>
                <p>{localize('By purchasing the <strong>"High-Low"</strong> contract, you\'ll win the multiplier times the difference between the <strong>high</strong> and <strong>low</strong> over the duration of the contract.')}</p>
            </div>

            <div id='winning_reset' className='invisible'>
                <h3>{localize('Winning the contract')}</h3>
                <p>{localize('If you select "Reset-Call", you win the payout if the exit spot is strictly higher than either the entry spot or the spot at reset time.')}</p>
                <p>{localize('If you select "Reset-Put", you win the payout if the exit spot is strictly lower than either the entry spot or the spot at reset time.')}</p>
                <p>{localize('If the <strong>exit spot</strong> is equal to the <strong>barrier</strong> or the <strong>new barrier (if a reset occurs)</strong>, you don\'t win the payout.')}</p>
            </div>

            <div id='winning_highlowticks' className='invisible'>
                <h3>{localize('Winning the contract')}</h3>
                <p>{localize('If you select <strong>"High Tick"</strong>, you win the payout if the selected tick is the <strong>highest among the next five ticks</strong>.')}</p>
                <p>{localize('If you select <strong>"Low Tick"</strong>, you win the payout if the selected tick is the <strong>lowest among the next five ticks</strong>.')}</p>
            </div>

            <div id='winning_runs' className='invisible'>
                <h3>{localize('Winning the contract')}</h3>
                <p>{localize('If you select <strong>"Only Ups"</strong>, you win the payout if consecutive ticks rise successively after the <strong>entry spot</strong>.<br />No payout if any tick falls or is equal to any of the previous ticks.')}</p>
                <p>{localize('If you select <strong>"Only Downs"</strong>, you win the payout if consecutive ticks fall successively after the <strong>entry spot</strong>.<br />No payout if any tick rises or is equal to any of the previous ticks.')}</p>
            </div>
        </div>

        {/* ========== Image ========== */}
        <div id='explanation_image' className='invisible'>
            <div className='gr-row'>
                <div className='gr-2 hide-mobile' />
                <div className='gr-4 gr-12-m padding-right' style={{ margin: 'auto' }}>
                    <img id='explanation_image_1' className='responsive' />
                </div>
                <div className='gr-4 gr-12-m padding-left'>
                    <img id='explanation_image_2' className='responsive' />
                </div>
                <div className='gr-2 hide-mobile' />
            </div>
        </div>

        {/* ========== Explain ========== */}
        <div id='explanation_explain' className='invisible gr-child'>
            <div id='explain_asian' className='invisible'>
                <h3>{localize('Entry Spot')}</h3>
                <p>{localize('The entry spot is the first tick after the contract is processed by our servers.')}</p>
                <h3>{localize('The Average')}</h3>
                <p>{localize('The average is the average of the ticks, including the entry spot and the last tick.')}</p>
            </div>

            <div id='explain_digits' className='invisible'>
                <h3>{localize('Entry Spot')}</h3>
                <p>{localize('The entry spot is the first tick after the contract is processed by our servers.')}</p>
            </div>

            <div id='explain_endsinout' className='invisible'>
                <h3>{localize('Exit spot')}</h3>
                <p>{localize('The <strong>exit spot</strong> is the latest tick at or before the <strong>end time</strong>.')}</p>
                <p>{localize('The <strong>end time</strong> is the selected number of minutes/hours after the <strong>start time</strong> (if less than one day in duration), or at the end of the trading day (if one day or more in duration).')}</p>
                <p>{localize('The <strong>start time</strong> is when the contract is processed by our servers.')}</p>
            </div>

            <div id='explain_evenodd' className='invisible'>
                <h3>{localize('Entry Spot')}</h3>
                <p>{localize('The entry spot is the first tick after the contract is processed by our servers.')}</p>
            </div>

            <div id='explain_higherlower' className='invisible'>
                <h3>{localize('Exit spot')}</h3>
                <p>{localize('The <strong>exit spot</strong> is the latest tick at or before the <strong>end time</strong>.')}</p>
                <p>{localize('The <strong>end time</strong> is the selected number of minutes/hours after the <strong>start time</strong> (if less than one day in duration), or at the end of the trading day (if one day or more in duration).')}</p>
                <p>{localize('The <strong>start time</strong> is when the contract is processed by our servers.')}</p>
            </div>

            <div id='explain_overunder' className='invisible'>
                <h3>{localize('Entry Spot')}</h3>
                <p>{localize('The entry spot is the first tick after the contract is processed by our servers.')}</p>
            </div>

            <div id='explain_risefall' className='invisible'>
                <h3>{localize('Entry spot')}</h3>
                <p>{localize('The <strong>start time</strong> is when the contract is processed by our servers and the <strong>entry spot</strong> is the <strong>next tick</strong> thereafter.')}</p>
                <p>{localize('If you select a <strong>start time</strong> in the future, the <strong>start time</strong> is that which is selected and the <strong>entry spot</strong> is the price in effect at that time.')}</p>
                <h3>{localize('Exit spot')}</h3>
                <p>{localize('The <strong>exit spot</strong> is the latest tick at or before the <strong>end time</strong>.')}</p>
                <p>{localize('If you select a <strong>start time</strong> of "Now", the <strong>end time</strong> is the selected number of minutes/hours after the <strong>start time</strong> (if less than one day in duration), or at the end of the trading day (if one day or more in duration).')}</p>
                <p>{localize('If you select a specific <strong>end time</strong>, the <strong>end time</strong> is the selected time.')}</p>
            </div>

            <div id='explain_staysinout' className='invisible'>
                <h3>{localize('Contract period')}</h3>
                <p>{localize('The <strong>contract period</strong> is the period between the <strong>next tick</strong> after the <strong>start time</strong> and the <strong>end time</strong>.')}</p>
                <p>{localize('The <strong>start time</strong> is when the contract is processed by our servers.')}</p>
                <p>{localize('The <strong>end time</strong> is the selected number of minutes/hours after the <strong>start time</strong> (if less than one day in duration), or at the end of the trading day (if one day or more in duration).')}</p>
            </div>

            <div id='explain_touchnotouch' className='invisible'>
                <h3>{localize('Contract period')}</h3>
                <p>{localize('The <strong>contract period</strong> is the period between the <strong>next tick</strong> after the <strong>start time</strong> and the <strong>end time</strong>.')}</p>
                <p>{localize('The <strong>start time</strong> is when the contract is processed by our servers.')}</p>
                <p>{localize('The <strong>end time</strong> is the selected number of minutes/hours after the <strong>start time</strong> (if less than one day in duration), or at the end of the trading day (if one day or more in duration).')}</p>
            </div>

            {/* Removed lookback explanation sections as lookback functionality has been removed */}

            <div id='explain_reset' className='invisible'>
                <h3>{localize('Reset Time')}</h3>
                <p>{localize('At reset time, if the spot is in the opposite direction of your prediction, the barrier is reset to that spot.')}</p>
                <p>{localize('The <strong>exit spot</strong> is the latest tick at or before the <strong>end time</strong>.')}</p>
                <p>{localize('The <strong>end time</strong> is the selected number of minutes/hours after the <strong>start time</strong>.')}</p>
                <p>{localize('The <strong>start time</strong> is when the contract is processed by our servers.')}</p>
                <p>{localize('The <strong>entry spot</strong> is the first tick after the contract is processed by our servers.')}</p>
            </div>

            <div id='explain_highlowticks' className='invisible'>
                <h3>{localize('Entry Spot')}</h3>
                <p>{localize('The entry spot is the first tick after the contract is processed by our servers.')}</p>
            </div>
            <div id='explain_runs' className='invisible'>
                <h3>{localize('Entry spot')}</h3>
                <p>{localize('The <strong>start time</strong> is when the contract has been processed by our servers and the <strong>entry spot</strong> is the <strong>next tick</strong> thereafter.')}</p>
                <h3>{localize('Exit Spot')}</h3>
                <p>{localize('The <strong>exit spot</strong> is the last tick when the contract ends. Contract ends when all ticks rise or fall successively, or when a single tick breaks the predicted pattern.')}</p>
            </div>
        </div>

        {/* ========== Duration ========== */}
        {/* <div id='explanation_duration'> */}
        {/*    <div id='duration_forex' className='invisible'> */}
        {/*        <Duration link='market-forex' /> */}
        {/*    </div> */}

        {/*    <div id='duration_indices' className='invisible'> */}
        {/*        <Duration link='market-indices' /> */}
        {/*    </div> */}

        {/*    <div id='duration_commodities' className='invisible'> */}
        {/*        <Duration link='market-commodities' /> */}
        {/*    </div> */}

        {/*    <div id='duration_synthetic_index' className='invisible'> */}
        {/*        <Duration link='market-synthetic_index' /> */}
        {/*    </div> */}
        {/* </div> */}

        {/* ========== Note ========== */}
        <div id='explanation_note' className='invisible gr-padding-20 gr-child'>
            <div id='note_asian' className='invisible'>
                <Note text={localize('Asian contracts will be refunded at the purchase price if the contract doesn\'t end within 5 minutes.')} />
            </div>

            <div id='note_digits' className='invisible'>
                <Note text={localize('Digit contracts will be refunded at the purchase price if the contract doesn\'t end within 5 minutes.')} />
            </div>

            <div id='note_endsinout' className='invisible'>
                <Note text={localize('Ends Between/Ends Outside contracts will be refunded at the purchase price if there are less than 2 ticks between the start and end times.')} />
            </div>

            <div id='note_evenodd' className='invisible'>
                <Note text={localize('Even/Odd contracts will be refunded at the purchase price if the contract doesn\'t end within 5 minutes.')} />
            </div>

            <div id='note_higherlower' className='invisible'>
                <Note text={localize('Higher/Lower contracts will be refunded at the purchase price if there are less than 2 ticks between the start and end times.')} />
            </div>

            <div id='note_overunder' className='invisible'>
                <Note text={localize('Over/Under contracts will be refunded at the purchase price if the contract doesn\'t end within 5 minutes.')} />
            </div>

            <div id='note_risefall' className='invisible'>
                <Note>
                    {localize('Rise/Fall contracts will be refunded if:')} <br />
                    • {localize('There are less than 2 ticks between the start and end times')} <br />
                    • {localize('The contract doesn\'t end within 5 minutes (for tick duration contracts)')}
                </Note>
            </div>

            <div id='note_staysinout' className='invisible'>
                <Note text={localize('Stays Between/Goes Outside Contracts will be refunded at the purchase price if there are less than 2 ticks between the start and end times.')} />
            </div>

            <div id='note_touchnotouch' className='invisible'>
                <Note text={localize('Touch/No Touch contracts will be refunded at the purchase price if there are less than 2 ticks between the start and end times.')} />
            </div>

            <div id='note_highlowticks' className='invisible'>
                <Note text={localize('High Tick/Low Tick contracts have a strict duration of five ticks.')} />
            </div>
        </div>
    </div>
);

export default Explanation;
