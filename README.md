# coinflux-api
CoinFlux.com JavaScript API Client

This is an asynchronous NodeJS client for the coinflux.com API. It exposes all the API methods found here: https://api.coinflux.com/v0/ through the ```api``` method:

---

## Install

```sh
$ npm install coinflux-api
```

---

## Example Usage:

```javascript
const key          = '...'; // API Key
const secret       = '...'; // API Private Key
const options      = {
	"env": "test", //defaults to prod -> production
	"timeout": 20000, //optional, defaults to 20000
	"ua" : "Client software name" //optional
}
const CoinFluxClient = require('coinflux-api');
const coinflux       = new CoinFluxClient(key, secret, options);

(async () => {
	// Get Ticker Info
	console.log(await coinflux.api('getRate', { pair : 'XBTEUR' }));

	// Get Ticker Info
	console.log(await coinflux.api('getWallet', { walletid : '0a846ac16f5842e6b48e769e6caa8942' }));
})();
```
---
# __Documentation__

This section states available methods and required parameters.

# __Public methods__ (no authentication required)

## __Rates__
### getRates
### getRate
parameters: `pair`

# __Private methods__ (authentication required)

## __Fluxes__
### getFluxes
### getFlux
parameters: `fluxid`
### getFluxAddresses
parameters: `fluxid`
### getFluxOfAddress
parameters: `address`
### newSellAddress
parameters: `fluxid`

## __Wallets__
### getWallets
### getWallet
parameters: `walletid`
### getWalletHistory
parameters: `walletid`
### getWalletHistoryTx
parameters: `walletid` and `historyid`

## __Ledger__
### getLedger
### getLedgerTx
parameters: `ledgerid`

## __Bank accounts__
### getBankAccounts
### getBankAccount
parameters: `accountid`

## __Trade__
### buyToAddress
parameters: `walletid`, `address`, `ccy1`, `cost` and, optionally for XRP, `address_tag`

---

### Credit:
We used the NodeJS implementation from https://github.com/nothingisdead/npm-kraken-api as reference.
