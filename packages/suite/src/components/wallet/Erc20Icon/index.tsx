import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
// @ts-ignore no types for this lib
import ScaleText from 'react-scale-text';

interface Props {
    address: string;
    symbol?: string;
}

const Icon = styled.img`
    width: 24px;
    height: 24px;
    border-radius: 50%;
    align-items: center;
    object-fit: cover;
`;

const Fallback = styled.div`
    display: flex;
    margin-right: 12px;
    background: #8a92b2;
    color: #fefefe;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    align-items: center;
    /* line-height: 30px; */
    text-transform: uppercase;
    user-select: none;
    text-align: center;
    padding: 3px;
`;

export default ({ address, symbol }: Props) => {
    // fork this lib
    const tokenUrl = `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/${address}/logo.png`;
    const [error, setError] = useState(false);

    useEffect(() => {
        fetch(tokenUrl)
            .then(response => {
                if (response.status !== 200) {
                    setError(true);
                }
            })
            .catch(() => {});
    });

    if (error)
        return (
            <Fallback>
                <ScaleText widthOnly>{symbol}</ScaleText>
            </Fallback>
        );

    return <Icon src={tokenUrl} />;
};
