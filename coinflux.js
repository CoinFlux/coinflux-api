const axios  = require('axios');
const crypto = require('crypto');

// Default options
const defaults = {
	url     : {
    prod: "https://api.coinflux.com",
    test: "https://apitestnet.coinflux.com"
  },
	version : "v0",
	timeout : 20000,
  env     : "prod",
	ua: "CoinFlux Javascript API Client"
};
const methods = {
  public : ["getRates", "getRate"],
  private : ["getFluxes", "getFlux", "getFluxAddresses", "getFluxOfAddress", "newSellAddress", "getWallets", "getWallet", "getLedger", "getLedgerTx", "getWalletHistory", "getWalletHistoryTx", "getBankAccounts", "getBankAccount", "buyToAddress"],
  get: ["getRates", "getRate", "getFluxes", "getFlux", "getFluxAddresses", "getFluxOfAddress", "getWallets", "getWallet", "getLedger", "getLedgerTx", "getWalletHistory", "getWalletHistoryTx", "getBankAccounts", "getBankAccount"],
  post: ["newSellAddress", "buyToAddress"]
}
const paths = {
  getRates: "/public/rates",
  getRate: "/public/rates/{pair}",
  getFluxes: "/private/fluxes",
  getFlux: "/private/fluxes/{fluxid}",
  getFluxAddresses: "/private/fluxes/{fluxid}/addresses",
  getFluxOfAddress: "/private/fluxes/addresses/{address}",
  newSellAddress: "/private/fluxes/addresses",
  getWallets: "/private/wallets",
  getWallet: "/private/wallets/{walletid}",
  getLedger: "/private/ledger",
  getLedgerTx: "/private/ledger/{ledgerid}",
  getWalletHistory: "/private/wallets/{walletid}/history",
  getWalletHistoryTx: "/private/wallets/{walletid}/history/{historyid}",
  getBankAccounts: "/private/bankaccounts",
  getBankAccount: "/private/bankaccounts/{accountid}",
	buyToAddress: "/private/trade/buy/toAddress"
}

// Create a signature for a request
const getMessageSignature = (path, queryStringParameters, secret, nonce) => {
  const qs = require('qs');

  // Function to sort paramaters alphabetically
	function alphabeticalSort(a, b) {
    return a.localeCompare(b);
	}

	const message       = qs.stringify(queryStringParameters, {sort: alphabeticalSort});
	const secret_buffer = Buffer.from(secret, 'hex');
	const hash          = new crypto.createHash('sha256');
	const hmac          = new crypto.createHmac('sha512', secret_buffer);
	const hash_digest   = hash.update(nonce + message).digest('binary');
	const hmac_digest   = hmac.update(path + hash_digest, 'binary').digest('hex');

	return hmac_digest;
};

// Send an API request
const rawRequest = async (url, headers, reqData, verb, timeout) => {

	const options = { headers, timeout };

  Object.assign(options, {
		method : verb,
    url: url
	});

  if (verb === 'POST') {
    Object.assign(options, {
			params: reqData
  	});
  }
  console.log(options);

  try {
    const {data} = await axios(options);
    return data;
  } catch (err) {
		if (err.response) {
			err = err.response;
			if(Object.keys(err.data).includes("error")) {

				throw {
					statusCode: err.status,
					statusText: err.statusText,
					error: err.data.error
				};
			} else {
				throw {
					statusCode: err.status,
					statusText: err.statusText,
					error: err.statusText
				};
			}
		} else if (err.code === "ECONNABORTED") {
			throw {
				statusCode: "ECONNABORTED",
				statusText: "Connection timed out",
				error: "Connection timed out"
			};
		}

  }
};

/**
 * CoinFluxClient connects to the coinflux.com API
 * @param {String}        key               API Key
 * @param {String}        secret            API Secret
 * @param {Object}        [options={}]
 * @param {Number}        timeout Maximum timeout (in milliseconds) for all API-calls (passed to `request`)
 * @param {string}        version API version
 * @param {string}        env API environment [prod, test]
 */
class CoinFluxClient {
	constructor(key, secret, options) {

    if (typeof options !== 'object') {
      options = {};
    }

		this.config = Object.assign({ key, secret }, defaults, options);
	}


  /**
   * This method makes a public or private API request.
   * @param  {String}   method   The API method (public or private)
   * @param  {Object}   params   Arguments to pass to the api call
   * @param  {Function} callback A callback function to be executed when the request is complete
   * @return {Object}            The request object
   */
  api(method, params, callback) {
    // Default params to empty object
    if(typeof params === 'function') {
      callback = params;
      params   = {};
    }

    if(methods.public.includes(method)) {
      return this.publicMethod(method, params, callback);
    }
    else if(methods.private.includes(method)) {
      return this.privateMethod(method, params, callback);
    }
    else {
      throw new Error(method + ' is not a valid API method.');
    }
  }

  publicMethod (method, params, callback) {
    if(typeof params === 'function') {
      callback = params;
      params   = {};
    }

    let path = '/' + this.config.version + paths[method];
    let verb = 'GET'

    switch (method) {
      case 'getRate':
        if (params.pair) {
          path = path.replace("{pair}", params.pair)
        } else {
          throw new Error("Missing parmater: pair");
        }
        break;
    }

		const headers = {"user-agent": this.config.ua};
    const url      = this.config.url[this.config.env] + path;
    const response = rawRequest(url, headers, {}, verb, this.config.timeout);

    if(typeof callback === 'function') {
      response
        .then((result) => callback(null, result))
        .catch((error) => callback(error, null));
    }

    return response;
  }

  privateMethod (method, params, callback) {
    if(typeof params === 'function') {
      callback = params;
      params   = {};
    }

    let path = '/' + this.config.version + paths[method];
    let verb = 'GET';

    switch (method) {
      case 'getFlux':
        if (params.fluxid) {
          path = path.replace("{fluxid}", params.fluxid)
        } else {
          throw new Error("Missing parmater: fluxid");
        }
        break;
      case 'getFluxAddresses':
        if (params.fluxid) {
          path = path.replace("{fluxid}", params.fluxid)
        } else {
          throw new Error("Missing parmater: fluxid");
        }
        break;
      case 'getFluxOfAddress':
        if (params.address) {
          path = path.replace("{address}", params.address)
        } else {
          throw new Error("Missing parmater: address");
        }
        break;
      case 'newSellAddress':
        verb = 'POST';
        if (!params.fluxid) {
          throw new Error("Missing parmater: fluxid");
        }

				if (Object.keys(params).length > 1) {
					throw new Error("Call accepts a single parameter: fluxid");
				}
        break;
      case 'getWallet':
        if (params.walletid) {
          path = path.replace("{walletid}", params.walletid)
        } else {
          throw new Error("Missing parmater: walletid");
        }
        break;
      case 'getLedgerTx':
        if (params.ledgerid) {
          path = path.replace("{ledgerid}", params.ledgerid)
        } else {
          throw new Error("Missing parmater: ledgerid");
        }
        break;
      case 'getWalletHistory':
        if (params.walletid) {
          path = path.replace("{walletid}", params.walletid)
        } else {
          throw new Error("Missing parmater: walletid");
        }
        break;
      case 'getWalletHistoryTx':
        if (params.walletid) {
          path = path.replace("{walletid}", params.walletid)
        } else {
          throw new Error("Missing parmater: walletid");
        }

        if (params.historyid) {
          path = path.replace("{historyid}", params.historyid)
        } else {
          throw new Error("Missing parmater: historyid");
        }
        break;
      case 'getBankAccount':
        if (params.accountid) {
          path = path.replace("{accountid}", params.accountid)
        } else {
          throw new Error("Missing parmater: accountid");
        }
        break;
			case 'buyToAddress':
				verb = 'POST';
				if (!params.walletid) {
					throw new Error("Missing parmater: walletid");
				}

				if (!params.address) {
					throw new Error("Missing parmater: address");
				}

				if (!params.cost) {
					throw new Error("Missing parmater: cost");
				}

				if (!params.ccy1) {
					throw new Error("Missing parmater: ccy1");
				}

				if (Object.keys(params).length > 5) {
					throw new Error("Call accepts the following parameters: walletid, address, cost, ccy1");
				}
				break;
    }

    const url      = this.config.url[this.config.env] + path;
	  const nonce = new Date() * 1000; // spoof microsecond

    let headers = {
      "coinflux-api-key"  : this.config.key,
      "coinflux-api-sign" : "",
      "coinflux-api-nonce" : nonce,
			"user-agent": this.config.ua
    };

    let signature, response;

    if (methods.get.includes(method)) {
      signature = getMessageSignature(
  			path,
  			'',
  			this.config.secret,
  			nonce
  		);
      headers["coinflux-api-sign"] = signature;
      response = rawRequest(url, headers, {}, verb, this.config.timeout);
    } else if (methods.post.includes(method)) {
      signature = getMessageSignature(
  			path,
  			params,
  			this.config.secret,
  			nonce
  		);
      headers["coinflux-api-sign"] = signature;
      response = rawRequest(url, headers, params, verb, this.config.timeout);
    }

    if(typeof callback === 'function') {
      response
        .then((result) => callback(null, result))
        .catch((error) => callback(error, null));
    }

    return response;
  }

}

function sorted(o) {
  let p = Object.create(null);
  for (const k of Object.keys(o).sort()) p[k] = o[k];
  return p;
}

module.exports = CoinFluxClient;
