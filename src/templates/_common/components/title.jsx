import React from 'react';
import { localize } from '@deriv-com/translations';
import { getBrandName } from '../brand.config';

const Title = () => (
    <title>{`${it.title ? `${localize(it.title)} | ` : ''}${localize('Online trading platform')} | ${getBrandName()}`}</title>
);

export default Title;
