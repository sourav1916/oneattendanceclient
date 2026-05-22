import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { FaDollarSign, FaRupeeSign, FaEuroSign, FaPoundSign, FaYenSign } from 'react-icons/fa';
import apiCall from '../../utils/api';

const DEFAULT_CURRENCIES = {
    usd: { value: 'usd', label: 'US Dollar', symbol: '$' },
    eur: { value: 'eur', label: 'Euro', symbol: '€' },
    inr: { value: 'inr', label: 'Indian Rupee', symbol: '₹' },
    jpy: { value: 'jpy', label: 'Japanese Yen', symbol: '¥' },
    gbp: { value: 'gbp', label: 'British Pound', symbol: '£' },
};

const ICONS_BY_SYMBOL = {
    '$': FaDollarSign,
    '€': FaEuroSign,
    '₹': FaRupeeSign,
    '¥': FaYenSign,
    '£': FaPoundSign,
};

let currencyTypesCache = null;
let currencyTypesRequest = null;

const normalizeCurrencyCode = (currency) => {
    if (!currency) return 'inr';
    if (typeof currency === 'object') return normalizeCurrencyCode(currency.value || currency.key);
    return String(currency).trim().toLowerCase() || 'inr';
};

const mapCurrencyTypes = (currencyTypes = []) =>
    currencyTypes.reduce((acc, item) => {
        const value = item?.value || {};
        const code = normalizeCurrencyCode(value.value || item?.key);
        if (code) acc[code] = value;
        return acc;
    }, {});

const loadCurrencyTypes = async () => {
    if (currencyTypesCache) return currencyTypesCache;
    if (!currencyTypesRequest) {
        currencyTypesRequest = apiCall('/constants/?type=currency', 'GET')
            .then(async (response) => {
                const result = await response.json();
                if (!result.success) return DEFAULT_CURRENCIES;
                currencyTypesCache = {
                    ...DEFAULT_CURRENCIES,
                    ...mapCurrencyTypes(result.data?.currency_types || []),
                };
                return currencyTypesCache;
            })
            .catch((error) => {
                console.error('Failed to load currency constants:', error);
                currencyTypesCache = DEFAULT_CURRENCIES;
                return currencyTypesCache;
            });
    }
    return currencyTypesRequest;
};

const CurrencyIcon = ({ className = '', size }) => {
    const { company } = useAuth();
    const [currencyTypes, setCurrencyTypes] = useState(currencyTypesCache || DEFAULT_CURRENCIES);
    const currency = normalizeCurrencyCode(company?.transaction_currency);

    useEffect(() => {
        let mounted = true;
        loadCurrencyTypes().then((types) => {
            if (mounted) setCurrencyTypes(types);
        });
        return () => {
            mounted = false;
        };
    }, []);

    const currencyMeta = useMemo(() => currencyTypes[currency] || DEFAULT_CURRENCIES[currency], [currencyTypes, currency]);
    const symbol = currencyMeta?.symbol || DEFAULT_CURRENCIES.inr.symbol;
    const Icon = ICONS_BY_SYMBOL[symbol];

    if (Icon) {
        return <Icon className={className} size={size} title={currencyMeta?.label} />;
    }

    return (
        <span className={className} style={size ? { fontSize: size, lineHeight: 1 } : undefined} title={currencyMeta?.label}>
            {symbol}
        </span>
    );

};

export default CurrencyIcon;
