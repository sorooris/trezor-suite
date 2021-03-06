import produce from 'immer';
import { AccountTransaction } from 'trezor-connect';
import { ACCOUNT, TRANSACTION, FIAT_RATES } from '@wallet-actions/constants';
import { getAccountKey, enhanceTransaction } from '@wallet-utils/accountUtils';
import { findTransaction } from '@wallet-utils/transactionUtils';
import { SETTINGS } from '@suite-config';
import { Account, WalletAction, Network } from '@wallet-types';
import { Action } from '@suite-types';
import { STORAGE } from '@suite-actions/constants';
import { TimestampedRates } from './fiatRatesReducer';

export interface WalletAccountTransaction extends AccountTransaction {
    id?: number;
    page?: number;
    deviceState: string;
    descriptor: string;
    symbol: Network['symbol'];
    rates?: TimestampedRates['rates'];
}

export interface State {
    transactions: { [key: string]: WalletAccountTransaction[] }; // object where a key is accountHash and a value is sparse array of fetched txs
    isLoading: boolean;
    error: string | null;
}

const initialState: State = {
    transactions: {},
    isLoading: false,
    error: null,
};

const initializeAccount = (draft: State, accountHash: string) => {
    // initialize an empty array at 'accountHash' index if not yet initialized
    if (!draft.transactions[accountHash]) {
        draft.transactions[accountHash] = [];
    }
};

const update = (
    draft: State,
    account: Account,
    txid: string,
    updateObject: Partial<WalletAccountTransaction>,
) => {
    const accountHash = getAccountKey(account.descriptor, account.symbol, account.deviceState);
    initializeAccount(draft, accountHash);
    const accountTxs = draft.transactions[accountHash];
    if (!accountTxs) return;

    const index = accountTxs.findIndex(t => t && t.txid === txid);
    accountTxs[index] = {
        ...accountTxs[index],
        ...updateObject,
    };
};

const add = (draft: State, transactions: AccountTransaction[], account: Account, page?: number) => {
    if (transactions.length < 1) return;
    const accountHash = getAccountKey(account.descriptor, account.symbol, account.deviceState);
    initializeAccount(draft, accountHash);
    const accountTxs = draft.transactions[accountHash];
    if (!accountTxs) return;

    transactions.forEach((tx, i) => {
        const enhancedTx = enhanceTransaction(tx, account);
        // first we need to make sure that tx is not undefined, then check if txid matches
        const existingTx = findTransaction(tx.txid, accountTxs);
        if (!existingTx) {
            // add a new transaction
            if (page) {
                // insert a tx object at correct index
                const txIndex = (page - 1) * SETTINGS.TXS_PER_PAGE + i;
                accountTxs[txIndex] = enhancedTx;
            } else {
                // no page arg, insert the tx at the beginning of the array
                accountTxs.unshift(enhancedTx);
            }
        } else {
            // update the transaction if conditions are met
            const existingTxIndex = accountTxs.findIndex(t => t && t.txid === existingTx.txid);
            // eslint-disable-next-line no-lonely-if
            if (
                (!existingTx.blockHeight && enhancedTx.blockHeight) ||
                (!existingTx.blockTime && enhancedTx.blockTime)
            ) {
                // pending tx got confirmed (blockHeight changed from undefined/0 to a number > 0)
                accountTxs[existingTxIndex] = { ...enhancedTx };
            }
        }
    });
};

const remove = (draft: State, account: Account, txs: WalletAccountTransaction[]) => {
    const accountHash = getAccountKey(account.descriptor, account.symbol, account.deviceState);
    const transactions = draft.transactions[accountHash] || [];
    txs.forEach(tx => {
        const index = transactions.findIndex(t => t.txid === tx.txid);
        transactions.splice(index, 1);
    });
};

export default (state: State = initialState, action: Action | WalletAction): State => {
    return produce(state, draft => {
        switch (action.type) {
            case STORAGE.LOADED:
                return action.payload.wallet.transactions;
            case ACCOUNT.REMOVE:
                action.payload.forEach(a => {
                    delete draft.transactions[getAccountKey(a.descriptor, a.symbol, a.deviceState)];
                });
                break;
            case TRANSACTION.ADD:
                add(draft, action.transactions, action.account, action.page);
                break;
            case TRANSACTION.REMOVE:
                remove(draft, action.account, action.txs);
                break;
            case TRANSACTION.RESET:
                delete draft.transactions[
                    getAccountKey(
                        action.account.descriptor,
                        action.account.symbol,
                        action.account.deviceState,
                    )
                ];
                break;
            case FIAT_RATES.TX_FIAT_RATE_UPDATE:
                update(
                    draft,
                    action.payload.account,
                    action.payload.txid,
                    action.payload.updateObject,
                );
                break;
            case TRANSACTION.UPDATE:
                // TODO
                break;
            case TRANSACTION.FETCH_INIT:
                draft.isLoading = true;
                break;
            case TRANSACTION.FETCH_SUCCESS:
                draft.isLoading = false;
                break;
            case TRANSACTION.FETCH_ERROR:
                draft.error = action.error;
                draft.isLoading = false;
                break;
            // case TRANSACTION.FROM_STORAGE:
            //     draft.transactions = action.transactions;
            // no default
        }
    });
};
