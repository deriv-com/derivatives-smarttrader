import React from 'react';
import { FormComponent } from './form-component.jsx';
import { getElementById } from '../../../_common/common_functions.js';
import { renderReactComponent } from '../../../_common/react_root_manager';

export const init = () => {
    renderReactComponent(<FormComponent />, getElementById('contract_forms_wrapper'));
};

export default init;
