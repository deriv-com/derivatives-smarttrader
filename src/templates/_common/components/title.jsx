import React from 'react';
import { getBrandName } from '../brand.config';

const Title = () => (
    <title>{`SmartTrader | Online trading platform | ${getBrandName()}`}</title>
);

export default Title;
