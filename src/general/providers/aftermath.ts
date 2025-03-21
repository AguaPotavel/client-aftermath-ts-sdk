import { Pools } from "../../packages/pools/pools";
import {
	CoinType,
	ConfigAddresses,
	SuiAddress,
	SuiNetwork,
	Url,
} from "../../types";
import { Wallet } from "../wallet/wallet";
import { SuiFrens } from "../../packages/suiFrens/suiFrens";
import { Coin } from "../../packages/coin/coin";
import { Faucet } from "../../packages/faucet/faucet";
import { Staking } from "../../packages/staking/staking";
import { Helpers } from "../utils/helpers";
import { Casting } from "../utils/casting";
import { Caller } from "../utils/caller";
import { Prices } from "../prices/prices";
import {
	// Auth,
	LeveragedStaking,
	NftAmm,
	ReferralVault,
	Router,
	Sui,
} from "../../packages";
import { HistoricalData } from "../historicalData/historicalData";
import { Perpetuals } from "../../packages/perpetuals";
import { Oracle } from "../../packages/oracle/oracle";
// import { PriceFeeds } from "../priceFeeds/priceFeeds";
import { Farms } from "../../packages/farms/farms";
import { DynamicGas } from "../dynamicGas/dynamicGas";
import { AftermathApi } from "./aftermathApi";
import { SuiClient, SuiHTTPTransport } from "@mysten/sui/client";
import { Dca } from "../../packages/dca/dca";
import { Multisig } from "../../packages/multisig/multisig";
import { LimitOrders } from "../../packages/limitOrders/limitOrders";
import { UserData } from "../../packages/userData/userData";

/**
 * @class Aftermath Provider
 *
 * @example
 * ```
 * // Create provider
 * const aftermath = new Aftermath("MAINNET");
 * // Create package provider
 * const router = aftermath.Router();
 * // Call sdk from package provider
 * const supportedCoins = await router.getSupportedCoins();
 *
 * // Or do it all in one go
 * const supportedCoins = await (new Aftermath("MAINNET")).Router().getSupportedCoins();
 * ```
 */
export class Aftermath extends Caller {
	// =========================================================================
	//  Constructor
	// =========================================================================

	/**
	 * Creates `Aftermath` provider to call api.
	 *
	 * @param network - The Sui network to interact with
	 * @returns New `Aftermath` instance
	 */
	constructor(
		private readonly network?: SuiNetwork,
		private Provider?: AftermathApi,
	) {
		super({
			network,
			accessToken: undefined,
		});
	}

	// =========================================================================
	//  Public Methods
	// =========================================================================

	public async init(inputs?: { fullnodeUrl: Url }) {
		const addresses = await this.getAddresses();
		const fullnodeUrl =
			inputs?.fullnodeUrl ??
			(this.network === "LOCAL"
				? "http://127.0.0.1:9000"
				: this.network === "DEVNET"
					? "https://fullnode.devnet.sui.io:443"
					: this.network === "TESTNET"
						? "https://fullnode.testnet.sui.io:443"
						: "https://fullnode.mainnet.sui.io:443");

		this.Provider = new AftermathApi(
			new SuiClient({
				transport: new SuiHTTPTransport({
					url: fullnodeUrl,
				}),
			}),
			addresses,
		);
	}

	/**
	 * Retrieves the addresses from the Aftermath API.
	 * @returns A promise that resolves to a ConfigAddresses object.
	 */
	public async getAddresses() {
		return this.fetchApi<ConfigAddresses>("addresses");
	}

	public getApiBaseUrl() {
		return this.apiBaseUrl;
	}

	// =========================================================================
	//  Class Object Creation
	// =========================================================================

	// =========================================================================
	//  Packages
	// =========================================================================

	/**
	 * Returns an instance of the Pools class.
	 * @returns {Pools} An instance of the Pools class.
	 */
	public Pools = () => new Pools(this.config, this.Provider);
	/**
	 * Creates a new instance of the Staking class.
	 * @returns A new instance of the Staking class.
	 */
	public Staking = () => new Staking(this.config, this.Provider);
	public LeveragedStaking = () => new LeveragedStaking(this.config);
	public SuiFrens = () => new SuiFrens(this.config, this.Provider);
	public Faucet = () => new Faucet(this.config, this.Provider);
	/**
	 * Creates a new instance of the Router class with the current network.
	 * @returns A new instance of the Router class.
	 */
	public Router = () => new Router(this.config);
	public NftAmm = () => new NftAmm(this.config, this.Provider);
	public ReferralVault = () => new ReferralVault(this.config, this.Provider);
	public Perpetuals = () => new Perpetuals(this.config);
	public Oracle = () => new Oracle(this.config, this.Provider);
	/**
	 * Creates a new instance of the Farms class.
	 * @returns A new instance of the Farms class.
	 */
	public Farms = () => new Farms(this.config, this.Provider);
	/**
	 * Creates a new instance of the DCA class.
	 * @returns A new instance of the DCA class.
	 */
	public Dca = () => new Dca(this.config);
	public Multisig = () => new Multisig(this.config, this.Provider);
	public LimitOrders = () => new LimitOrders(this.config);
	public UserData = () => new UserData(this.config);

	// =========================================================================
	//  General
	// =========================================================================

	public Sui = () => new Sui(this.config, this.Provider);
	public Prices = () => new Prices(this.config);
	/**
	 * Creates a new instance of the Wallet class.
	 * @param address - The address of the wallet.
	 * @returns A new instance of the Wallet class.
	 */
	public Wallet = (address: SuiAddress) =>
		new Wallet(address, this.config, this.Provider);
	/**
	 * Creates a new instance of the Coin class.
	 * @param coinType The type of coin to create.
	 * @returns A new instance of the Coin class.
	 */
	public Coin = (coinType?: CoinType) =>
		new Coin(coinType, this.config, this.Provider);
	public HistoricalData = () => new HistoricalData(this.config);
	// public PriceFeeds = () => new PriceFeeds(this.config, this.Provider);
	public DynamicGas = () => new DynamicGas(this.config);
	// public Auth = () => new Auth(this.config);

	// =========================================================================
	//  Utils
	// =========================================================================

	public static helpers = Helpers;
	public static casting = Casting;
}
