import {
	ObjectId,
	SuiAddress,
	SuiObjectResponse,
	getObjectOwner,
} from "@mysten/sui.js";
import { AftermathApi } from "../providers/aftermathApi";
import { AnyObjectType, PackageId } from "../../types";

export class ObjectsApiHelpers {
	/////////////////////////////////////////////////////////////////////
	//// Constructor
	/////////////////////////////////////////////////////////////////////

	constructor(private readonly Provider: AftermathApi) {
		this.Provider = Provider;
	}

	/////////////////////////////////////////////////////////////////////
	//// Public Methods
	/////////////////////////////////////////////////////////////////////

	/////////////////////////////////////////////////////////////////////
	//// Fetching
	/////////////////////////////////////////////////////////////////////

	public fetchDoesObjectExist = async (objectId: ObjectId | PackageId) => {
		const object = await this.Provider.provider.getObject({ id: objectId });
		return ObjectsApiHelpers.objectExists(object);
	};

	public fetchIsObjectOwnedByAddress = async (
		objectId: ObjectId,
		address: SuiAddress
	) => {
		const object = await this.fetchObject(objectId);
		const objectOwner = getObjectOwner(object);

		if (!objectOwner || typeof objectOwner !== "object") return false;

		if (
			"AddressOwner" in objectOwner &&
			objectOwner.AddressOwner === address
		)
			return true;
		if ("ObjectOwner" in objectOwner && objectOwner.ObjectOwner === address)
			return true;

		return false;
	};

	public fetchObjectsOfTypeOwnedByAddress = async (
		walletAddress: SuiAddress,
		objectType: AnyObjectType
	): Promise<SuiObjectResponse[]> => {
		const objectsOwnedByAddress =
			await this.Provider.provider.getOwnedObjects({
				owner: walletAddress,
				filter: {
					StructType: objectType,
				},
			});

		return objectsOwnedByAddress.data;
	};

	public fetchObject = async (
		objectId: ObjectId
	): Promise<SuiObjectResponse> => {
		const object = await this.Provider.provider.getObject({ id: objectId });
		if (object.status !== "Exists")
			throw new Error("object does not exist");
		return object;
	};

	public fetchCastObject = async <ObjectType>(
		objectId: ObjectId,
		castFunc: (SuiObjectResponse: SuiObjectResponse) => ObjectType
	): Promise<ObjectType> => {
		return castFunc(await this.fetchObject(objectId));
	};

	public fetchObjectBatch = async (
		objectIds: ObjectId[]
	): Promise<SuiObjectResponse[]> => {
		const objectBatch = await this.Provider.provider.multiGetObjects({
			ids: objectIds,
		});
		const objectDataResponses = objectBatch.filter(
			(data) => data.status === "Exists"
		);

		if (objectDataResponses.length <= 0)
			throw new Error("no existing objects found with fetchObjectBatch");
		// REVIEW: throw error on any objects that don't exist ?
		// or don't throw any errors and return empty array ?
		return objectDataResponses;
	};

	public fetchFilterAndCastObjectBatch = async <ObjectType>(
		objectIds: ObjectId[],
		filterSuiObjectResponse: (data: SuiObjectResponse) => boolean,
		objectFromSuiObjectResponse: (data: SuiObjectResponse) => ObjectType
	): Promise<ObjectType[]> => {
		return (await this.fetchObjectBatch(objectIds))
			.filter((data) => filterSuiObjectResponse(data))
			.map((SuiObjectResponse: SuiObjectResponse) => {
				return objectFromSuiObjectResponse(SuiObjectResponse);
			});
	};

	public fetchCastObjectsOwnedByAddressOfType = async <ObjectType>(
		walletAddress: SuiAddress,
		objectType: AnyObjectType,
		objectFromSuiObjectResponse: (
			SuiObjectResponse: SuiObjectResponse
		) => ObjectType
	): Promise<ObjectType[]> => {
		// i. obtain all owned object IDs
		const objects = (
			await this.fetchObjectsOfTypeOwnedByAddress(
				walletAddress,
				objectType
			)
		).map((SuiObjectResponse: SuiObjectResponse) => {
			return objectFromSuiObjectResponse(SuiObjectResponse);
		});

		return objects;
	};

	/////////////////////////////////////////////////////////////////////
	//// Helpers
	/////////////////////////////////////////////////////////////////////

	public static objectExists = (data: SuiObjectResponse) =>
		data.status === "Exists";
}
