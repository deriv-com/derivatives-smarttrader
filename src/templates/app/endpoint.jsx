import React from 'react';
import { Fieldset, FormRow } from '../_common/components/forms.jsx';

const Endpoint = () => (
    <div className='endpoint-config static-page-layout  static_full'>
        <div className='static-content'>
            <h1>{'Change API Endpoint'}</h1>
            <div className='gr-padding-10'>
                <form id='frm_endpoint'>
                    <Fieldset legend={'Details'}>
                        <FormRow
                            id='server_url'
                            className='input-class'
                            type='text'
                            label={'Server'}
                            attributes={{ maxLength: 30 }}
                            hint={'e.g. frontend.derivws.com'}
                        />
                    </Fieldset>
                    <div className='center-text'>
                        <button
                            className='button submit-button'
                            id='new_endpoint'
                            type='submit'
                        >
                            {'Submit'}
                        </button>
                        <a className='button' id='reset_endpoint'>
                            <span className='button'>
                                {'Reset to original settings'}
                            </span>
                        </a>
                    </div>
                </form>
            </div>
        </div>
    </div>
);

export default Endpoint;
