import { AftermathApi } from "../../../general/providers/aftermathApi";
import { RouterApiHelpers } from "./routerApiHelpers";
import { Pool } from "../../pools";
import { RouterGraph } from "../utils/routerGraph";
import {
	Balance,
	CoinType,
	RouterCompleteTradeRoute,
	SerializedTransaction,
	Slippage,
	SuiNetwork,
} from "../../../types";
import { SuiAddress } from "@mysten/sui.js";
import { Helpers } from "../../../general/utils/helpers";
import { createRouterPool } from "../utils/routerPoolInterface";

export class RouterApi {
	/////////////////////////////////////////////////////////////////////
	//// Class Members
	/////////////////////////////////////////////////////////////////////

	public readonly Helpers;

	/////////////////////////////////////////////////////////////////////
	//// Constructor
	/////////////////////////////////////////////////////////////////////

	constructor(private readonly Provider: AftermathApi) {
		this.Provider = Provider;
		this.Helpers = new RouterApiHelpers(Provider);
	}

	/////////////////////////////////////////////////////////////////////
	//// Public Methods
	/////////////////////////////////////////////////////////////////////

	/////////////////////////////////////////////////////////////////////
	//// Inspections
	/////////////////////////////////////////////////////////////////////

	public fetchSupportedCoins = async () => {
		const pools = await this.Provider.Pools().fetchAllPools();
		const allCoins: CoinType[] = pools
			.map((pool) => Object.keys(pool.coins))
			.reduce((prev, cur) => [...prev, ...cur], []);

		const uniqueCoins = Helpers.uniqueArray(allCoins);
		return uniqueCoins;
	};

	public fetchCompleteTradeRouteGivenAmountIn = async (
		network: SuiNetwork,
		pools: Pool[],
		coinIn: CoinType,
		coinInAmount: Balance,
		coinOut: CoinType,
		maxRouteLength?: number
	): Promise<RouterCompleteTradeRoute> => {
		return new RouterGraph(
			pools.map((pool) =>
				createRouterPool({
					protocolName: "Aftermath",
					pool: pool.pool,
					network,
				})
			)
		).getCompleteRouteGivenAmountIn(
			coinIn,
			coinInAmount,
			coinOut,
			maxRouteLength
		);
	};

	public fetchCompleteTradeRouteGivenAmountOut = async (
		network: SuiNetwork,
		pools: Pool[],
		coinIn: CoinType,
		coinOut: CoinType,
		coinOutAmount: Balance,
		maxRouteLength?: number
	): Promise<RouterCompleteTradeRoute> => {
		return new RouterGraph(
			pools.map((pool) =>
				createRouterPool({
					protocolName: "Aftermath",
					pool: pool.pool,
					network,
				})
			)
		).getCompleteRouteGivenAmountOut(
			coinIn,
			coinOut,
			coinOutAmount,
			maxRouteLength
		);
	};

	/////////////////////////////////////////////////////////////////////
	//// Transactions
	/////////////////////////////////////////////////////////////////////

	public async fetchTransactionForCompleteTradeRoute(
		// TODO: make it so that api can be called with different rpc nodes ?
		network: SuiNetwork,
		walletAddress: SuiAddress,
		completeRoute: RouterCompleteTradeRoute,
		slippage: Slippage,
		referrer?: SuiAddress
	): Promise<SerializedTransaction> {
		const tx =
			await this.Helpers.fetchBuildTransactionForCompleteTradeRoute(
				network,
				walletAddress,
				completeRoute,
				slippage,
				referrer
			);
		return this.Provider.Transactions().fetchSetGasBudgetAndSerializeTransaction(
			tx
		);
	}
}
