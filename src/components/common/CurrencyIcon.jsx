import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { FaDollarSign, FaRupeeSign, FaEuroSign, FaPoundSign, FaYenSign } from 'react-icons/fa';

const CurrencyIcon = ({ className = '', size }) => {
    const { company } = useAuth();
    const currency = company?.transaction_currency?.toLowerCase();

    switch (currency) {
        case 'inr':
            return <FaRupeeSign className={className} size={size} />;
        case 'eur':
            return <FaEuroSign className={className} size={size} />;
        case 'gbp':
            return <FaPoundSign className={className} size={size} />;
        case 'jpy':
            return <FaYenSign className={className} size={size} />;
        case 'usd':
        default:
            return <FaDollarSign className={className} size={size} />;
    }
};

export default CurrencyIcon;
