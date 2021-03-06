import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { Button } from '@trezor/components';
import * as modalActions from '@suite-actions/modalActions';
import * as routerActions from '@suite-actions/routerActions';
import { SUITE } from '@suite-actions/constants';
import { AppState, Dispatch } from '@suite-types';
import { Translation, Image } from '@suite-components';

import Wrapper from './components/Wrapper';

const mapStateToProps = (state: AppState) => ({
    device: state.suite.device,
    locks: state.suite.locks,
});

const mapDispatchToProps = (dispatch: Dispatch) =>
    bindActionCreators(
        {
            openModal: modalActions.openModal,
            goto: routerActions.goto,
        },
        dispatch,
    );

type Props = ReturnType<typeof mapStateToProps> & ReturnType<typeof mapDispatchToProps>;

/**
 * Handler for invalid wallet setting, no coins in discovery
 * see: @wallet-actions/selectedAccountActions
 */
const DiscoveryEmpty = (props: Props) => {
    const { locks, device } = props;
    const disabled = !device || !device.connected || device.authFailed || device.authConfirm;
    const locked = locks.includes(SUITE.LOCK_TYPE.DEVICE) || locks.includes(SUITE.LOCK_TYPE.UI);
    return (
        <Wrapper
            title={<Translation id="TR_ACCOUNT_EXCEPTION_DISCOVERY_EMPTY" />}
            image={<Image image="EMPTY_WALLET" />}
            description={<Translation id="TR_ACCOUNT_EXCEPTION_DISCOVERY_EMPTY_DESC" />}
        >
            <Button
                variant="secondary"
                isLoading={locked}
                isDisabled={disabled}
                onClick={() => props.goto('settings-wallet')}
            >
                <Translation id="TR_COIN_SETTINGS" />
            </Button>
            <Button
                variant="primary"
                isLoading={locked}
                isDisabled={disabled}
                onClick={() =>
                    props.openModal({
                        type: 'add-account',
                        device: device!,
                    })
                }
            >
                <Translation id="TR_ADD_ACCOUNT" />
            </Button>
        </Wrapper>
    );
};

export default connect(mapStateToProps, mapDispatchToProps)(DiscoveryEmpty);
