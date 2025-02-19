const { ApiPromise, Keyring, WsProvider } = require("@polkadot/api");
const { cryptoWaitReady } = require("@polkadot/util-crypto");

const DEFAULT_NETWORK = "paseo";
// This is the amount denoted in units, not the raw amount.
const DEFAULT_AMOUNT = 1;

const decimalsPerNetwork = {
  polkadot: 10, paseo: 10, kusama: 12,
};

const paraIdPerNetwork = {
  polkadot: 2094, paseo: 2124, kusama: 2124,
};

const wssPerNetwork = {
  polkadot: "wss://polkadot-rpc.dwellir.com",
  paseo: "wss://paseo-rpc.dwellir.com",
  kusama: "wss://kusama-rpc.dwellir.com",
};

// Prefix for the env variable
const SUBMITTER_KEY_ENV_PREFIX = "SUBMITTER_KEY_";

async function createProviderForNetwork(relayNetwork) {
  console.log(`Creating provider for ${relayNetwork}. Connecting to ${wssPerNetwork[relayNetwork]}...`);
  const provider = new WsProvider(wssPerNetwork[relayNetwork]);
  console.log(`Connected to ${wssPerNetwork[relayNetwork]}.`);
  return ApiPromise.create({ provider });
}

async function buyForNetwork(relayNetwork, amount, api, keypair) {
  const maxAmountRaw = BigInt(amount * 10 ** decimalsPerNetwork[relayNetwork]).toString();
  const paraId = paraIdPerNetwork[relayNetwork];
  console.log(`Buying on-demand coretime with a maximum of ${maxAmountRaw} tokens on ${relayNetwork} for paraId ${paraId} with account ${keypair.address}...`);

  // Buy the on-demand core-time
  const transaction = api.tx.onDemand.placeOrderKeepAlive(maxAmountRaw, paraId);
  await new Promise((resolve, reject) => {
    transaction.signAndSend(keypair, ({ status, dispatchError }) => {
      if (dispatchError) {
        if (dispatchError.isModule) {
          // for module errors, we have the section indexed, lookup
          const decoded = api.registry.findMetaError(dispatchError.asModule);
          const { docs, name, section } = decoded;

          const errorMessage = `${section}.${name}: ${docs.join(" ")}`;
          console.log(errorMessage);
          reject(errorMessage);
        } else {
          // Other, CannotLookup, BadOrigin, no extra info
          console.log(dispatchError.toString());
        }
        reject(dispatchError.toString());
      }

      if (status.isInBlock) {
        console.log("Success: transaction in block");
        resolve();
      }

      if (status.isFinalized) {
        console.log("Transaction finalized");
      }
    });
  });
}

async function buyOnDemand() {
  // Get parameters from the CLI
  const args = process.argv.slice(2);
  const [relayNetwork, maxAmount] = args;

  // Check if the network is supported
  const network = relayNetwork.toLowerCase() || DEFAULT_NETWORK.toLowerCase();
  if (network !== "all" && !decimalsPerNetwork[network]) {
    console.error(`Network '${relayNetwork}' is not supported`);
    return;
  }

  const amount = maxAmount || DEFAULT_AMOUNT;
  const keyring = new Keyring({ type: "sr25519" });
  await cryptoWaitReady();

  const buy = async (network, amount) => {
    try {
      const envKey = `${SUBMITTER_KEY_ENV_PREFIX}${network.toUpperCase()}`;
      const submitterSecret = process.env[envKey];
      if (!submitterSecret) {
        throw Error(`No submitter key found for ${network}. Please define ${envKey} in the environment variables.`);
      }
      const keypair = keyring.addFromUri(submitterSecret);

      const api = await createProviderForNetwork(network);

      await buyForNetwork(network, amount, api, keypair);

      console.log("Successfully bought on-demand coretime on", network);
    } catch (error) {
      console.error(`Error buying on-demand coretime on ${network}: ${error}`);
    }
  };

  if (network === "all") {
    for (const network in decimalsPerNetwork) {
      await buy(network, amount);
    }
  } else {
    await buy(network, amount);
  }

  console.log("All done!");

  process.exit(0);
}

buyOnDemand();
