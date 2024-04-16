import { AftermathApi } from "../../../general/providers/aftermathApi";
import { RouterGraph } from "../utils/synchronous/routerGraph";
import {
	Balance,
	CoinType,
	RouterExternalFee,
	RouterCompleteTradeRoute,
	Slippage,
	SuiNetwork,
	Url,
	RouterSerializableCompleteGraph,
	RouterProtocolName,
	UserEventsInputs,
	RouterAsyncSerializablePool,
	isRouterSynchronousProtocolName,
	isRouterAsyncProtocolName,
	SynchronousProtocolsToPoolObjectIds,
	RouterSynchronousOptions,
	AllRouterOptions,
	PartialRouterOptions,
	SuiAddress,
	TxBytes,
	ApiRouterDynamicGasBody,
	RouterSynchronousSerializablePool,
	ServiceCoinData,
	SerializedTransaction,
	RouterServicePaths,
	IFixed,
} from "../../../types";
import {
	TransactionArgument,
	TransactionBlock,
} from "@mysten/sui.js/transactions";
import { DeepBookApi } from "../../external/deepBook/deepBookApi";
import { PoolsApi } from "../../pools/api/poolsApi";
import { CetusApi } from "../../external/cetus/cetusApi";
import { TurbosApi } from "../../external/turbos/turbosApi";
import { RouterApiHelpers } from "./routerApiHelpers";
import { InterestApi } from "../../external/interest/interestApi";
import { KriyaApi } from "../../external/kriya/kriyaApi";
import { BaySwapApi } from "../../external/baySwap/baySwapApi";
import { SuiswapApi } from "../../external/suiswap/suiswapApi";
import { BlueMoveApi } from "../../external/blueMove/blueMoveApi";
import { FlowXApi } from "../../external/flowX/flowXApi";
import { Coin } from "../..";
import { IndexerSwapVolumeResponse } from "../../../general/types/castingTypes";
import { Casting, Helpers } from "../../..";
import { SuiArgument } from "@mysten/sui.js/client";
import { TransactionObjectArgument } from "@scallop-io/sui-kit";

/**
 * RouterApi class provides methods for interacting with the Aftermath Router API.
 * @class
 */
export class RouterApi {
	// =========================================================================
	//  Constants
	// =========================================================================

	private static readonly defaultRouterOptions: AllRouterOptions = {
		regular: {
			synchronous: {
				maxRouteLength: 3,
				tradePartitionCount: 2,
				minRoutesToCheck: 5,
				maxRoutesToCheck: 20,
				maxGasCost: BigInt(500_000_000), // 0.5 SUI
			},
			async: {
				tradePartitionCount: 1,
				maxAsyncPoolsPerProtocol: 2,
			},
		},
		preAsync: {
			maxRouteLength: 2,
			tradePartitionCount: 1,
			minRoutesToCheck: 5,
			maxRoutesToCheck: 20,
			maxGasCost: BigInt(500_000_000), // 0.5 SUI
			// maxGasCost: BigInt(333_333_333), // 0.333 SUI
		},
	};

	private static readonly constants = {
		dynamicGas: {
			expectedRouterGasCostUpperBound: BigInt(7_000_000), // 0.007 SUI (mainnet)
			slippage: 0.1, // 10%
		},
	};

	// =========================================================================
	//  Class Members
	// =========================================================================

	public readonly Helpers;

	private readonly options;

	// =========================================================================
	//  Constructor
	// =========================================================================

	/**
	 * Creates an instance of RouterApi.
	 * @constructor
	 * @param {AftermathApi} Provider - The Aftermath API instance.
	 * @param {RouterProtocolName[]} protocols - The list of protocols to use.
	 * @param {PartialRouterOptions} regularOptions - The regular options to use.
	 * @param {Partial<RouterSynchronousOptions>} preAsyncOptions - The pre-async options to use.
	 */
	constructor(
		private readonly Provider: AftermathApi,
		public readonly protocols: RouterProtocolName[] = [
			"Aftermath",
			"afSUI",
		],
		regularOptions?: PartialRouterOptions,
		preAsyncOptions?: Partial<RouterSynchronousOptions>
	) {
		const optionsToSet: AllRouterOptions = {
			regular: {
				synchronous: {
					...RouterApi.defaultRouterOptions.regular.synchronous,
					...regularOptions?.synchronous,
				},
				async: {
					...RouterApi.defaultRouterOptions.regular.async,
					...regularOptions?.async,
				},
			},
			preAsync: {
				...RouterApi.defaultRouterOptions.preAsync,
				...preAsyncOptions,
			},
		};

		this.options = optionsToSet;

		this.Helpers = new RouterApiHelpers(Provider, optionsToSet);
	}

	// =========================================================================
	//  External Packages
	// =========================================================================

	public Aftermath = () => new PoolsApi(this.Provider);
	public DeepBook = () => new DeepBookApi(this.Provider);
	public Cetus = () => new CetusApi(this.Provider);
	public Turbos = () => new TurbosApi(this.Provider);
	public FlowX = () => new FlowXApi(this.Provider);
	public Interest = () => new InterestApi(this.Provider);
	public Kriya = () => new KriyaApi(this.Provider);
	public BaySwap = () => new BaySwapApi(this.Provider);
	public Suiswap = () => new SuiswapApi(this.Provider);
	public BlueMove = () => new BlueMoveApi(this.Provider);

	// =========================================================================
	//  Public Methods
	// =========================================================================

	// =========================================================================
	//  Inspections
	// =========================================================================

	/**
	 * Fetches the total volume of swaps within a specified duration.
	 * @param inputs - The inputs for fetching the total volume.
	 * @returns A Promise that resolves to an array of total volumes.
	 */
	public fetchVolume = async (inputs: { durationMs: number }) => {
		const { durationMs } = inputs;
		return this.Provider.indexerCaller.fetchIndexer<IndexerSwapVolumeResponse>(
			`router/swap-volume/${durationMs}`
		);
	};

	// =========================================================================
	//  Graph
	// =========================================================================

	public fetchCreateSerializableGraph =
		async (): Promise<RouterSerializableCompleteGraph> => {
			const [asyncPools, synchronousPools] = await Promise.all([
				this.fetchAsyncPools(),
				this.fetchSynchronousPools(),
			]);
			return this.Helpers.fetchCreateSerializableGraph({
				pools: [...asyncPools, ...synchronousPools],
			});
		};

	// =========================================================================
	//  Coin Paths
	// =========================================================================

	public supportedCoinsFromGraph = (inputs: {
		graph: RouterSerializableCompleteGraph;
	}) => {
		return RouterGraph.supportedCoinsFromGraph(inputs);
	};

	// =========================================================================
	//  Routing
	// =========================================================================

	/**
	 * Fetches the complete trade route given an input amount of a specified coin type.
	 * @param inputs An object containing the necessary inputs for the trade route calculation.
	 * @returns A Promise that resolves to a RouterCompleteTradeRoute object.
	 */
	public fetchCompleteTradeRouteGivenAmountIn = async (inputs: {
		network: SuiNetwork;
		graph: RouterSerializableCompleteGraph;
		coinInType: CoinType;
		coinInAmount: Balance;
		coinOutType: CoinType;
		referrer?: SuiAddress;
		externalFee?: RouterExternalFee;
		excludeProtocols?: RouterProtocolName[];
	}): Promise<RouterCompleteTradeRoute> => {
		return this.Helpers.fetchCompleteTradeRouteGivenAmountIn({
			...inputs,
			coinInType: Helpers.addLeadingZeroesToType(inputs.coinInType),
			coinOutType: Helpers.addLeadingZeroesToType(inputs.coinOutType),
			protocols: this.protocols,
		});
	};

	/**
	 * Fetches the complete trade route given the output amount of the trade.
	 * @param inputs - An object containing the necessary inputs for fetching the trade route.
	 * @returns A Promise that resolves to a RouterCompleteTradeRoute object.
	 */
	public fetchCompleteTradeRouteGivenAmountOut = async (inputs: {
		network: SuiNetwork;
		graph: RouterSerializableCompleteGraph;
		coinInType: CoinType;
		coinOutAmount: Balance;
		coinOutType: CoinType;
		referrer?: SuiAddress;
		externalFee?: RouterExternalFee;
		excludeProtocols?: RouterProtocolName[];
	}): Promise<RouterCompleteTradeRoute> => {
		return this.Helpers.fetchCompleteTradeRouteGivenAmountOut({
			...inputs,
			coinInType: Helpers.addLeadingZeroesToType(inputs.coinInType),
			coinOutType: Helpers.addLeadingZeroesToType(inputs.coinOutType),
			protocols: this.protocols,
		});
	};

	// =========================================================================
	//  V2
	// =========================================================================

	public fetchCompleteTradeRouteGivenAmountInV2 = async (inputs: {
		coinInType: CoinType;
		coinInAmount: Balance;
		coinOutType: CoinType;
		// TODO: handle this
		referrer?: SuiAddress;
		// TODO: handle this
		externalFee?: RouterExternalFee;
	}): Promise<RouterCompleteTradeRoute> => {
		const { coinInType, coinOutType, coinInAmount, referrer, externalFee } =
			inputs;

		const { paths } = await this.Provider.indexerCaller.fetchIndexer<
			{
				output_amount: number;
				paths: RouterServicePaths;
			},
			{
				from_coin_type: CoinType;
				to_coin_type: CoinType;
				input_amount: number;
				referred: boolean;
			}
		>(
			"router/forward-trade-route",
			{
				from_coin_type: coinInType,
				to_coin_type: coinOutType,
				// NOTE: is this conversion safe ?
				input_amount: Number(coinInAmount),
				referred: referrer !== undefined,
			},
			undefined,
			undefined,
			undefined,
			true
		);

		console.log("paths", JSON.stringify(paths, null, 4));

		return {
			...Casting.router.routerCompleteTradeRouteFromServicePaths(paths),
			// NOTE: should these be here ?
			referrer,
			externalFee,
		};
	};

	public fetchCompleteTradeRouteAndTxGivenAmountInV2 = async (inputs: {
		coinInType: CoinType;
		coinInAmount: Balance;
		coinOutType: CoinType;
		slippage: Slippage;
		tx?: TransactionBlock;
		coinIn?: TransactionArgument;
		walletAddress?: SuiAddress;
		referrer?: SuiAddress;
		externalFee?: RouterExternalFee;
		isSponsoredTx?: boolean;
		transferCoinOut?: boolean;
	}): Promise<{
		tx: TransactionBlock;
		completeRoute: RouterCompleteTradeRoute;
		coinOut: TransactionArgument;
		coinOutAmount: Balance;
	}> => {
		const {
			coinInType,
			coinOutType,
			coinInAmount,
			walletAddress,
			referrer,
			externalFee,
			coinIn,
			isSponsoredTx,
			slippage,
			transferCoinOut,
		} = inputs;

		const initTx = inputs.tx ?? new TransactionBlock();
		if (walletAddress) initTx.setSender(walletAddress);

		const coinTxArg =
			coinIn ??
			(walletAddress
				? await this.Provider.Coin().fetchCoinWithAmountTx({
						tx: initTx,
						coinAmount: coinInAmount,
						coinType: coinInType,
						walletAddress,
						isSponsoredTx,
				  })
				: (() => {
						throw new Error("no walletAddress provided");
				  })());

		const txBytes = await initTx.build({
			client: this.Provider.provider,
			onlyTransactionKind: true,
		});
		const b64TxBytes = Buffer.from(txBytes).toString("base64");

		const { output_coin, tx_kind, output_amount, paths } =
			await this.Provider.indexerCaller.fetchIndexer<
				{
					output_coin: ServiceCoinData;
					tx_kind: SerializedTransaction;
					output_amount: number;
					paths: RouterServicePaths;
				},
				{
					from_coin_type: CoinType;
					to_coin_type: CoinType;
					input_amount: number;
					input_coin: ServiceCoinData;
					slippage: number;
					tx_kind: SerializedTransaction;
					referrer?: SuiAddress;
					router_fee_recipient?: SuiAddress;
					router_fee?: number; // u64 format (same as on-chain)
				}
			>(
				"router/forward-trade-route-tx",
				{
					slippage,
					referrer,
					from_coin_type: coinInType,
					to_coin_type: coinOutType,
					// NOTE: is this conversion safe ?
					input_amount: Number(coinInAmount),
					input_coin:
						Helpers.transactions.serviceCoinDataFromCoinTxArg({
							coinTxArg,
						}),
					tx_kind: b64TxBytes,
					router_fee_recipient: externalFee?.recipient,
					// NOTE: is this conversion safe ?
					router_fee: externalFee
						? Number(
								Casting.numberToFixedBigInt(
									externalFee.feePercentage
								)
						  )
						: undefined,
				},
				undefined,
				undefined,
				undefined,
				true
			);

		const tx = TransactionBlock.fromKind(tx_kind);
		RouterApi.transferTxMetadata({
			initTx,
			newTx: tx,
		});

		const coinOut = Helpers.transactions.coinTxArgFromServiceCoinData({
			serviceCoinData: output_coin,
		});
		if (transferCoinOut) {
			tx.transferObjects([coinOut], tx.pure(walletAddress));
		}

		// TODO: take fee / return coin ?
		// tx.transferObjects([output_coin], tx.pure(walletAddress));

		return {
			tx,
			coinOut,
			coinOutAmount: BigInt(Math.round(output_amount)),
			completeRoute: {
				...Casting.router.routerCompleteTradeRouteFromServicePaths(
					paths
				),
				referrer,
				externalFee,
			},
		};
	};

	// =========================================================================
	//  Transactions
	// =========================================================================

	/**
	 * Fetches a transaction for a complete trade route.
	 * @param inputs An object containing the wallet address, complete trade route, slippage, and optional sponsored transaction flag.
	 * @returns A promise that resolves to a TransactionBlock object.
	 */
	public async fetchTransactionForCompleteTradeRoute(inputs: {
		walletAddress: SuiAddress;
		completeRoute: RouterCompleteTradeRoute;
		slippage: Slippage;
		isSponsoredTx?: boolean;
	}): Promise<TransactionBlock> {
		const tx = new TransactionBlock();
		await this.Helpers.fetchTransactionForCompleteTradeRoute({
			...inputs,
			tx,
			withTransfer: true,
		});
		return tx;
	}

	/**
	 * Fetches a transaction argument for a complete trade route.
	 * @param inputs An object containing the necessary inputs for the transaction.
	 * @returns A promise that resolves to a transaction argument, or undefined if the transaction failed.
	 */
	public async fetchAddTransactionForCompleteTradeRoute(inputs: {
		tx: TransactionBlock;
		walletAddress: SuiAddress;
		completeRoute: RouterCompleteTradeRoute;
		slippage: Slippage;
		coinInId?: TransactionArgument;
		isSponsoredTx?: boolean;
	}): Promise<TransactionArgument | undefined> {
		return this.Helpers.fetchTransactionForCompleteTradeRoute(inputs);
	}

	// =========================================================================
	//  V2
	// =========================================================================

	public fetchAddTxForCompleteTradeRouteV2 = async (inputs: {
		completeRoute: RouterCompleteTradeRoute;
		slippage: Slippage;
		tx?: TransactionBlock;
		coinIn?: TransactionArgument;
		walletAddress?: SuiAddress;
		referrer?: SuiAddress;
		externalFee?: RouterExternalFee;
		isSponsoredTx?: boolean;
		transferCoinOut?: boolean;
	}): Promise<{
		tx: TransactionBlock;
		coinOut: TransactionArgument;
	}> => {
		const {
			completeRoute,
			walletAddress,
			coinIn,
			isSponsoredTx,
			slippage,
			transferCoinOut,
			referrer,
			externalFee,
		} = inputs;

		const initTx = inputs.tx ?? new TransactionBlock();
		if (walletAddress) initTx.setSender(walletAddress);

		const coinTxArg =
			coinIn ??
			(walletAddress
				? await this.Provider.Coin().fetchCoinWithAmountTx({
						tx: initTx,
						coinAmount: completeRoute.coinIn.amount,
						coinType: completeRoute.coinIn.type,
						walletAddress,
						isSponsoredTx,
				  })
				: (() => {
						throw new Error("no walletAddress provided");
				  })());

		const txBytes = await initTx.build({
			client: this.Provider.provider,
			onlyTransactionKind: true,
		});
		const b64TxBytes = Buffer.from(txBytes).toString("base64");

		const { output_coin, tx_kind } =
			await this.Provider.indexerCaller.fetchIndexer<
				{
					output_coin: ServiceCoinData;
					tx_kind: SerializedTransaction;
				},
				{
					paths: RouterServicePaths;
					input_coin: ServiceCoinData;
					slippage: number;
					tx_kind: SerializedTransaction;
					referrer?: SuiAddress;
					router_fee_recipient?: SuiAddress;
					router_fee?: number; // u64 format (same as on-chain)
				}
			>(
				"router/tx-from-trade-route",
				{
					slippage,
					referrer,
					paths: Casting.router.routerServicePathsFromCompleteTradeRoute(
						completeRoute
					),
					input_coin:
						Helpers.transactions.serviceCoinDataFromCoinTxArg({
							coinTxArg,
						}),
					tx_kind: b64TxBytes,
					router_fee_recipient: externalFee?.recipient,
					// NOTE: is this conversion safe ?
					router_fee: externalFee
						? Number(
								Casting.numberToFixedBigInt(
									externalFee.feePercentage
								)
						  )
						: undefined,
				},
				undefined,
				undefined,
				undefined,
				true
			);

		const tx = TransactionBlock.fromKind(tx_kind);
		RouterApi.transferTxMetadata({
			initTx,
			newTx: tx,
		});

		const coinOut = Helpers.transactions.coinTxArgFromServiceCoinData({
			serviceCoinData: output_coin,
		});
		if (transferCoinOut) {
			tx.transferObjects([coinOut], tx.pure(walletAddress));
		}

		return {
			tx,
			coinOut,
		};
	};

	// =========================================================================
	//  Events
	// =========================================================================

	/**
	 * Fetches trade events for a given user.
	 * @param inputs - The inputs for fetching trade events.
	 * @returns A Promise that resolves with the fetched trade events.
	 */
	public async fetchTradeEvents(inputs: UserEventsInputs) {
		return this.Helpers.SynchronousHelpers.fetchTradeEvents(inputs);
	}

	// =========================================================================
	//  Private Helpers
	// =========================================================================

	private fetchAsyncPools = async (): Promise<
		RouterAsyncSerializablePool[]
	> => {
		return this.Helpers.AsyncHelpers.fetchAllPools({
			protocols: this.protocols.filter(isRouterAsyncProtocolName),
		});
	};

	private fetchSynchronousPools = async (): Promise<
		RouterSynchronousSerializablePool[]
	> => {
		return this.Helpers.SynchronousHelpers.fetchAllPools({
			protocols: this.protocols.filter(isRouterSynchronousProtocolName),
		});
	};

	private static transferTxMetadata = (inputs: {
		initTx: TransactionBlock;
		newTx: TransactionBlock;
	}) => {
		const { initTx, newTx } = inputs;

		if (initTx.blockData.sender) newTx.setSender(initTx.blockData.sender);

		if (initTx.blockData.expiration)
			newTx.setExpiration(initTx.blockData.expiration);

		if (
			initTx.blockData.gasConfig.budget &&
			typeof initTx.blockData.gasConfig.budget !== "string"
		)
			newTx.setGasBudget(initTx.blockData.gasConfig.budget);

		if (initTx.blockData.gasConfig.owner)
			newTx.setGasOwner(initTx.blockData.gasConfig.owner);

		if (initTx.blockData.gasConfig.payment)
			newTx.setGasPayment(initTx.blockData.gasConfig.payment);

		if (
			initTx.blockData.gasConfig.price &&
			typeof initTx.blockData.gasConfig.price !== "string"
		)
			newTx.setGasPrice(initTx.blockData.gasConfig.price);
	};
}
