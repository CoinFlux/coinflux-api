const axios  = require('axios');
const crypto = require('crypto');
const qs     = require('qs');

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
  private : ["getFluxes", "getFlux", "getFluxAddresses", "getAddress", "newAddress", "getWallets", "getWallet", "getLedger", "getLedgerTx", "getWalletHistory", "getWalletHistoryTx", "getBankAccounts", "getBankAccount"],
  get: ["getRates", "getRate", "getFluxes", "getFlux", "getFluxAddresses", "getAddress", "getWallets", "getWallet", "getLedger", "getLedgerTx", "getWalletHistory", "getWalletHistoryTx", "getBankAccounts", "getBankAccount"],
  post: ["newAddress"]
}
const paths = {
  getRates: "/public/rates",
  getRate: "/public/rates/{pair}",
  getFluxes: "/private/fluxes",
  getFlux: "/private/fluxes/{fluxid}",
  getFluxAddresses: "/private/fluxes/{fluxid}/addresses",
  getAddress: "/private/addresses/{address}",
  newAddress: "/private/addresses",
  getWallets: "/private/wallets",
  getWallet: "/private/wallets/{walletid}",
  getLedger: "/private/ledger",
  getLedgerTx: "/private/ledger/{ledgerid}",
  getWalletHistory: "/private/wallets/{walletid}/history",
  getWalletHistoryTx: "/private/wallets/{walletid}/history/{historyid}",
  getBankAccounts: "/private/bankaccounts",
  getBankAccount: "/private/bankaccounts/{accountid}"
}

// Create a signature for a request
const getMessageSignature = (path, body, secret, nonce) => {
	const message       = qs.stringify(body);
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
  		body   : qs.stringify(reqData)
  	});
  }
  console.log(options);

  try {
    const {data} = await axios(options);
    return data;
  } catch (err) {
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
      case 'getAddress':
        if (params.address) {
          path = path.replace("{address}", params.address)
        } else {
          throw new Error("Missing parmater: address");
        }
        break;
      case 'newAddress':
        verb = 'POST';
        if (params.fluxid) {
          path = path.replace("{fluxid}", params.fluxid)
        } else {
          throw new Error("Missing parmater: fluxid");
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

module.exports = CoinFluxClient;
