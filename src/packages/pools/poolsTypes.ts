import {
	Balance,
	Event,
	Object,
	Slippage,
	Timestamp,
} from "../../general/types/generalTypes";
import { ObjectId, SuiAddress } from "@mysten/sui.js/dist/types";
import { ManipulateType } from "dayjs";
import { CoinsToBalance, CoinType } from "../coin/coinTypes";

// TODO: create LpCoinType ?

/////////////////////////////////////////////////////////////////////
//// Name Only
/////////////////////////////////////////////////////////////////////

export type PoolName = string;
export type PoolWeight = bigint;
export type PoolTradeFee = bigint;
export type PoolFlatness = bigint;

/////////////////////////////////////////////////////////////////////
//// Objects
/////////////////////////////////////////////////////////////////////

export type PoolCoins = Record<CoinType, PoolCoin>;

export interface PoolCoin {
	weight: PoolWeight;
	balance: Balance;
	tradeFeeIn: PoolTradeFee;
	tradeFeeOut: PoolTradeFee;
	depositFee: PoolTradeFee;
	withdrawFee: PoolTradeFee;
}

export interface PoolObject extends Object {
	name: PoolName;
	creator: SuiAddress;
	lpCoinType: CoinType;
	lpCoinSupply: Balance;
	illiquidLpCoinSupply: Balance;
	flatness: PoolFlatness;
	coins: PoolCoins;
}

/////////////////////////////////////////////////////////////////////
//// Events
/////////////////////////////////////////////////////////////////////

export interface PoolTradeEvent extends Event {
	poolId: ObjectId;
	trader: SuiAddress;
	typeIn: CoinType;
	amountIn: Balance;
	typeOut: CoinType;
	amountOut: Balance;
}

export interface PoolDepositEvent extends Event {
	poolId: ObjectId;
	depositor: SuiAddress;
	types: CoinType[];
	deposits: Balance[];
	lpMinted: Balance;
}

export interface PoolWithdrawEvent extends Event {
	poolId: ObjectId;
	withdrawer: SuiAddress;
	types: CoinType[];
	withdrawn: Balance[];
	lpBurned: Balance;
}

/////////////////////////////////////////////////////////////////////
//// Stats
/////////////////////////////////////////////////////////////////////

export interface PoolStats {
	volume: number;
	tvl: number;
	supplyPerLps: number[];
	lpPrice: number;
	fees: number;
	aprRange: [number, number];
}

export interface PoolDataPoint {
	time: Timestamp;
	value: number;
}

export type PoolVolumeDataTimeframeKey = "1D" | "1W" | "1M" | "3M";
export interface PoolVolumeDataTimeframe {
	time: Timestamp;
	timeUnit: ManipulateType;
}

/////////////////////////////////////////////////////////////////////
//// API
/////////////////////////////////////////////////////////////////////

export interface ApiPoolTradeBody {
	walletAddress: SuiAddress;
	fromCoin: CoinType;
	fromCoinAmount: Balance;
	toCoin: CoinType;
	slippage: Slippage;
	referrer?: SuiAddress;
}

export interface ApiPoolDepositBody {
	walletAddress: SuiAddress;
	depositCoinAmounts: CoinsToBalance;
	slippage: Slippage;
	referrer?: SuiAddress;
}

export interface ApiPoolWithdrawBody {
	walletAddress: SuiAddress;
	withdrawCoinAmounts: CoinsToBalance;
	lpCoinAmount: Balance;
	slippage: Slippage;
	referrer?: SuiAddress;
}

export interface ApiPoolSpotPriceBody {
	coinInType: CoinType;
	coinOutType: CoinType;
}

export interface ApiPoolObjectIdForLpCoinTypeBody {
	lpCoinType: CoinType;
}
