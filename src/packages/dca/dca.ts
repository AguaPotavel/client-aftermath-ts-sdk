import { CallerConfig, ObjectId } from "../../types";
import { Caller } from "../../general/utils/caller";
import { SuiAddress } from "../../types";
import {
	ApiDCAsOwnedBody,
	ApiDcaTransactionForCreateOrderBody,
	ApiDcaTransactionForCloseOrderBody,
	DcaOrderObject,
	DcaOrdersObject,
	ApiDcaCreateUserBody,
} from "./dcaTypes";
import { Transaction } from "@mysten/sui/transactions";

export class Dca extends Caller {
	// =========================================================================
	//  Constants
	// =========================================================================

	public static readonly constants = {
		gasAmount: BigInt(50_000_000),
	};

	// =========================================================================
	//  Constructor
	// =========================================================================

	constructor(config?: CallerConfig) {
		super(config, "dca");
	}

	// =========================================================================
	//  Class Objects
	// =========================================================================

	/**
	 * Fetches the API for dollar cost averaging orders list.
	 * @deprecated please use `getActiveDcaOrders` and `getPastDcaOrders` instead
	 */

	public async getAllDcaOrders(inputs: ApiDCAsOwnedBody) {
		return this.fetchApi<DcaOrdersObject, ApiDCAsOwnedBody>(
			"orders",
			inputs
		);
	}

	/**
	 * Fetches the API for dollar cost averaging active orders list.
	 * @async
	 * @param { ApiDCAsOwnedBody } inputs - An object containing the walletAddress.
	 * @returns { Promise<DcaOrderObject[]> } A promise that resolves to object with array of fetched events for active dca's.
	 */

	public async getActiveDcaOrders(inputs: { walletAddress: SuiAddress }) {
		return this.fetchApi<DcaOrderObject[], ApiDCAsOwnedBody>(
			"active",
			inputs
		);
	}

	/**
	 * Fetches the API for dollar cost averaging past orders list.
	 * @async
	 * @param { ApiDCAsOwnedBody } inputs - An object containing the walletAddress.
	 * @returns { Promise<DcaOrderObject[]> } A promise that resolves to object with array of fetched events for past dca's.
	 */

	public async getPastDcaOrders(inputs: { walletAddress: SuiAddress }) {
		return this.fetchApi<DcaOrderObject[], ApiDCAsOwnedBody>(
			"past",
			inputs
		);
	}

	// =========================================================================
	// Transactions
	// =========================================================================

	/**
	 * Fetches the API transaction for creating DCA order.
	 * @param { ApiDcaTransactionForCreateOrderBody } inputs - The inputs for the transaction.
	 * @returns { Promise<Transaction> } A promise that resolves with the API transaction.
	 */

	public async getCreateDcaOrderTx(
		inputs: ApiDcaTransactionForCreateOrderBody
	): Promise<Transaction> {
		return this.fetchApiTransaction<ApiDcaTransactionForCreateOrderBody>(
			"transactions/create-order",
			inputs
		);
	}

	/**
	 * Fetches the API for canceling DCA order.
	 * @param inputs - The inputs for the transaction.
	 * @returns { Promise<boolean> } A promise that resolves with transaction execution status.
	 */

	public async closeDcaOrder(
		inputs: ApiDcaTransactionForCloseOrderBody
	): Promise<boolean> {
		return this.fetchApi<boolean, ApiDcaTransactionForCloseOrderBody>(
			`cancel`,
			inputs
		);
	}

	// =========================================================================
	// Interactions
	// =========================================================================

	/**
	 * Method for getting the cancellation dca order message to sign.
	 * @param inputs - The inputs for the message.
	 * @returns Message to sign.
	 */

	public closeDcaOrdersMessageToSign(inputs: { orderIds: ObjectId[] }): {
		action: string;
		order_object_ids: string[];
	} {
		return {
			action: "CANCEL_DCA_ORDERS",
			order_object_ids: inputs.orderIds,
		};
	}

	// =========================================================================
	// Interactions - Deprecated
	// =========================================================================

	/**
	 * Method for getting the creation user message to sign.
	 * @param inputs - The inputs for the message.
	 * @returns Message to sign.
	 * @deprecated please use method from `userData` package instead
	 */

	public createUserAccountMessageToSign(): {
		action: string;
	} {
		return {
			action: "CREATE_DCA_ACCOUNT",
		};
	}

	// =========================================================================
	// User Public Key
	// =========================================================================

	/**
	 * Fetches the API for users public key.
	 * @async
	 * @param { ApiDCAsOwnedBody } inputs - An object containing the walletAddress.
	 * @returns { Promise<string | undefined> } A promise that resolves users public key.
	 * @deprecated please use method `getUserPublicKey` from `userData` package instead
	 */

	public async getUserPublicKey(inputs: {
		walletAddress: SuiAddress;
	}): Promise<string | undefined> {
		return this.fetchApi<
			string | undefined,
			{
				walletAddress: SuiAddress;
			}
		>(`user/get`, inputs);
	}

	/**
	 * Fetches the API to create users public key.
	 * @async
	 * @param { ApiDcaCreateUserBody } inputs - The inputs for creating users public key on BE side.
	 * @returns { Promise<boolean> } A promise that resolves to result if user pk has been created.
	 * @deprecated please use method `createUserPublicKey` from `userData` package instead
	 */

	public async createUserPublicKey(
		inputs: ApiDcaCreateUserBody
	): Promise<boolean> {
		return this.fetchApi<boolean, ApiDcaCreateUserBody>(
			`/user/add`,
			inputs
		);
	}
}
