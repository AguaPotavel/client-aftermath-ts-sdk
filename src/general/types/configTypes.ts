import { ObjectId, SuiAddress } from "@mysten/sui.js";

/////////////////////////////////////////////////////////////////////
//// Name Only
/////////////////////////////////////////////////////////////////////

export type RpcEndpoint = string;

/////////////////////////////////////////////////////////////////////
//// All Addresses
/////////////////////////////////////////////////////////////////////

export type ConfigAddresses = RequiredConfigAddresses &
	Partial<OptionalConfigAddresses>;

interface RequiredConfigAddresses {}

interface OptionalConfigAddresses {
	faucet: FaucetAddresses;
	staking: StakingAddresses;
	pools: PoolsAddresses;
	utilies: UtilitiesAddresses;
	capys: CapysAddresses;
	nftAmm: NftAmmAddresses;
	router: RouterAddresses;
	referralVault: ReferralVaultAddresses;
}

/////////////////////////////////////////////////////////////////////
//// Addresses By Package
/////////////////////////////////////////////////////////////////////

export interface FaucetAddresses {
	packages: {
		faucet: SuiAddress;
	};
	objects: {
		faucet: ObjectId;
		faucetRegistry: ObjectId;
	};
}

export interface StakingAddresses {
	packages: {
		lsd: SuiAddress;
		afsui: SuiAddress;
	};
	objects: {
		staking: ObjectId;
	};
	accounts: {
		bot: SuiAddress;
	};
}

export interface PoolsAddresses {
	packages: {
		amm: SuiAddress;
		ammInterface: SuiAddress;
		events: SuiAddress;
	};
	objects: {
		poolRegistry: ObjectId;
		protocolFeeVault: ObjectId;
		treasury: ObjectId;
		insuranceFund: ObjectId;
		lpCoinsTable: ObjectId;
	};
	other: {
		createLpCoinPackageCompilation: string;
	};
}

export interface UtilitiesAddresses {
	packages: {
		utilities: SuiAddress;
	};
}

export interface CapysAddresses {
	packages: {
		capy: SuiAddress;
		capyVault: SuiAddress;
	};
	objects: {
		capyVault: ObjectId;
		capyRegistry: ObjectId;
	};
}

export interface NftAmmAddresses {
	packages: {
		nftAmm: SuiAddress;
	};
	objects: {
		protocolFeeVault: ObjectId;
		treasury: ObjectId;
		insuranceFund: ObjectId;
		referralVault: ObjectId;
	};
}

export type RouterAddresses = RequiredRouterAddresses &
	Partial<OptionalRouterAddresses>;

export interface RequiredRouterAddresses {
	packages: {
		utils: SuiAddress;
	};
}

export interface OptionalRouterAddresses {
	deepBook: DeepBookAddresses;
	cetus: CetusAddresses;
	turbos: TurbosAddresses;
	aftermath: AftermathRouterAddresses;
}

export interface DeepBookAddresses {
	packages: {
		clob: SuiAddress;
		wrapper: SuiAddress;
	};
}

export interface CetusAddresses {
	packages: {
		scripts: SuiAddress;
		clmm: SuiAddress;
		wrapper: SuiAddress;
	};
	objects: {
		globalConfig: ObjectId;
		poolsTable: ObjectId;
	};
}

export interface TurbosAddresses {
	packages: {
		clmm: SuiAddress;
		wrapper: SuiAddress;
	};
	objects: {
		versioned: ObjectId;
		poolsTable: ObjectId;
	};
}

export interface AftermathRouterAddresses {
	packages: {
		wrapper: SuiAddress;
	};
}

export interface ReferralVaultAddresses {
	packages: {
		referralVault: SuiAddress;
	};
	objects: {
		referralVault: ObjectId;
	};
}
