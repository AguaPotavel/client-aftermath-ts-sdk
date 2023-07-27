import { ObjectId, SuiAddress, TransactionDigest } from "@mysten/sui.js";
import { AnyObjectType, BigIntAsString, ModuleName } from "./generalTypes";

// =========================================================================
//  On Chain
// =========================================================================

export interface EventOnChain<Fields> {
	id: {
		txDigest: TransactionDigest;
		eventSeq: BigIntAsString;
	};
	packageId: ObjectId;
	transactionModule: ModuleName;
	sender: SuiAddress;
	type: AnyObjectType;
	parsedJson: Fields; // | undefined;
	bcs: string; // | undefined;
	timestampMs: number | undefined;
}

export interface TableOnChain {
	type: AnyObjectType;
	fields: {
		id: {
			id: ObjectId;
		};
		size: BigIntAsString;
	};
}

export interface SupplyOnChain {
	type: AnyObjectType;
	fields: {
		value: BigIntAsString;
	};
}

export interface TypeNameOnChain {
	type: AnyObjectType;
	fields: {
		name: AnyObjectType;
	};
}
