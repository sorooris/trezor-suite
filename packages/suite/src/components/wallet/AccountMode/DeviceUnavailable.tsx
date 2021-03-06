/* eslint-disable @typescript-eslint/camelcase */

import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { Button, colors } from '@trezor/components';
import { SUITE } from '@suite-actions/constants';
import * as deviceSettingsActions from '@settings-actions/deviceSettingsActions';
import { NotificationCard, Translation } from '@suite-components';

import { AppState, Dispatch } from '@suite-types';

const mapStateToProps = (state: AppState) => ({
    locks: state.suite.locks,
});

const mapDispatchToProps = (dispatch: Dispatch) =>
    bindActionCreators(
        {
            applySettings: deviceSettingsActions.applySettings,
        },
        dispatch,
    );

export type Props = ReturnType<typeof mapStateToProps> & ReturnType<typeof mapDispatchToProps>;

const Disconnected = ({ locks, applySettings }: Props) => {
    const progress = locks.includes(SUITE.LOCK_TYPE.DEVICE) || locks.includes(SUITE.LOCK_TYPE.UI);
    return (
        <NotificationCard variant="info">
            <Translation id="TR_ACCOUNT_PASSPHRASE_DISABLED" />
            <Button
                variant="tertiary"
                icon="REFRESH"
                color={colors.BLUE_INFO}
                onClick={() => applySettings({ use_passphrase: true })}
                isLoading={progress}
                disabled={progress}
            >
                <Translation id="TR_ACCOUNT_ENABLE_PASSPHRASE" />
            </Button>
        </NotificationCard>
    );
};

export default connect(mapStateToProps, mapDispatchToProps)(Disconnected);
