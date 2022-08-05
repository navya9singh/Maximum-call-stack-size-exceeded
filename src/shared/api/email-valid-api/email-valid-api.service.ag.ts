import { Injectable, NgZone, Injector } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { ApiBase, INITIALIZED_IN_BACKEND, NullableInDraftMode } from '@plano/shared/api/base/api-base';
import { Id } from '@plano/shared/api/base/id';
import { Meta } from '@plano/shared/api/base/meta';
import { ApiAttributeInfo } from '@plano/shared/api/base/api-attribute-info';
import { PApiPrimitiveTypes } from '@plano/shared/api/base/generated-types.ag';
import { ApiSaveArgs, ApiLoadArgs, ShiftId, ShiftSelector, ApiListWrapper, SchedulingApiPosSystem, SchedulingApiBooking, SchedulingApiAccountHolderState, ApiObjectWrapper, AuthenticatedApiRole } from '@plano/shared/api';
import { DateTime, Date, DateExclusiveEnd, LocalTime, Duration, Minutes, Hours, Days, Months, Years, Percent, Email, Search, Tel, Currency, Password, PostalCode, Integer, Url, Iban, Bic, Image } from '@plano/shared/api/base/generated-types.ag';
import { Config } from '@plano/shared/core/config';
import { AbstractControl } from '@angular/forms';
import { ApiErrorService } from '@plano/shared/api/api-error.service';



/**
 * This service enables access to the api "email_valid".
 * This file is auto generated by de.sage.scheduler.api_generator.ApiGenerator.
 */

// constants
class Consts
{
	INVALID = 1;
	USED = 2;
	FAULTY_EMAIL = 3;
}


@Injectable({
  providedIn: 'root',
})
export class EmailValidApiService<ValidationMode extends 'draft' | 'validated' = 'validated'> extends ApiBase
{
	consts = new Consts();

	constructor(h : HttpClient
			,	router : Router
			,	apiE : ApiErrorService
			,	zone : NgZone
			,	injector : Injector) {
		super(h, router, apiE, zone, injector, 'email_valid');
	}

	protected version() : string {
		return 'afd2426e43b85d8523149fb4951acb5e,3cf23f89747a03c3f7ed8329d165c940';
	}

	private dataWrapper = new EmailValidApiRoot<ValidationMode>(this);

	get data() : EmailValidApiRoot<ValidationMode> {
		return this.dataWrapper;
	}

	protected getRootWrapper() : EmailValidApiRoot<ValidationMode> {
		return this.dataWrapper;
	}

	protected recreateRootWrapper() : void {
		this.dataWrapper = new EmailValidApiRoot<ValidationMode>(this);
	}
}

		 
export class EmailValidApiRoot<ValidationMode extends 'draft' | 'validated' = 'validated'> extends ApiObjectWrapper<any, any>
{
	

	constructor(override readonly api : EmailValidApiService<ValidationMode> | null, idRaw : any = null) {
		super(api, EmailValidApiRoot as any);

		this._updateRawData(Meta.createNewObject(false, idRaw), true);

		// set parent attribute
	}


	private _id : Id | null = null;
	get id() : Id {
		return this._id !== null ? this._id : Id.create(Meta.getNewItemId(this.rawData) as any);
	}

	override attributeInfoThis : ApiAttributeInfo<EmailValidApiRoot<ValidationMode>, EmailValidApiRoot<ValidationMode>> = new ApiAttributeInfo<EmailValidApiRoot<ValidationMode>, EmailValidApiRoot<ValidationMode>>({
			apiObjWrapper: this as any as EmailValidApiRoot<ValidationMode>,
			name: '',
			id: 'ROOT',
			canEdit: () => false,
			readMode: () => true,
		});
	attributeInfoInvalid =  new ApiAttributeInfo<EmailValidApiRoot<ValidationMode>, boolean>({
			apiObjWrapper: this as any as EmailValidApiRoot<ValidationMode>,
			name: 'invalid',
			id: 'INVALID',
			primitiveType: PApiPrimitiveTypes.boolean,
			canEdit: () => false,
			readMode: () => true,
		});
	attributeInfoUsed =  new ApiAttributeInfo<EmailValidApiRoot<ValidationMode>, boolean>({
			apiObjWrapper: this as any as EmailValidApiRoot<ValidationMode>,
			name: 'used',
			id: 'USED',
			primitiveType: PApiPrimitiveTypes.boolean,
			canEdit: () => false,
			readMode: () => true,
		});
	attributeInfoFaultyEmail =  new ApiAttributeInfo<EmailValidApiRoot<ValidationMode>, Email>({
			apiObjWrapper: this as any as EmailValidApiRoot<ValidationMode>,
			name: 'faultyEmail',
			id: 'FAULTY_EMAIL',
			primitiveType: PApiPrimitiveTypes.Email,
			canEdit: () => false,
			readMode: () => true,
		});

	/**
     *  Is a passed email address not valid?
	 *
	 * @type {boolean}
     */
	get invalid() : NullableInDraftMode<boolean, ValidationMode> {
		return this.data[1];
	}

	set invalidTestSetter(v : NullableInDraftMode<boolean, ValidationMode>) {
        this.setterImpl(1, v, 'invalid');
	}

	/**
     *  Is a passed email address already used?
	 *
	 * @type {boolean}
     */
	get used() : NullableInDraftMode<boolean, ValidationMode> {
		return this.data[2];
	}

	set usedTestSetter(v : NullableInDraftMode<boolean, ValidationMode>) {
        this.setterImpl(2, v, 'used');
	}

	/**
     *  When one of the error booleans are true then this value contains the email address which triggered the error. Note, that this api stops checking finding the first error. So, this value is not a list but a potentially only a single email address.
	 *
	 * @type {Email}
     */
	get faultyEmail() : NullableInDraftMode<Email, ValidationMode> {
		return this.data[3];
	}

	set faultyEmailTestSetter(v : NullableInDraftMode<Email, ValidationMode>) {
        this.setterImpl(3, v, 'faultyEmail');
	}


	_fixIds(_idReplacements : Map<any, number>) : void {
	}

	override _updateRawData(data : any[] | null, generateMissingData : boolean) : void {
		super._updateRawData(data, generateMissingData);

		this.data = data;

		// update id wrapper
		const idRawData = Meta.getId(data);
		this._id = idRawData === null ? null : Id.create(idRawData as any);

		// create missing/default data
		if(generateMissingData && data) {
			this.fillWithDefaultValues(data, 4);

			data[1] = false;
			data[2] = false;
		}

		// propagate new raw data to children
	}

	protected get dni() : string {
		return '1';
	}

	static loadDetailed(	api : EmailValidApiService<any>
						,	id : Id
						,	{success = null, error = null, searchParams = null} : ApiLoadArgs = {}) : Promise<HttpResponse<unknown>> {
		return ApiObjectWrapper.loadDetailedImpl(api, id, '1', { success: success, error: error, searchParams: searchParams});
	}

	protected assumeValidated() : asserts this is EmailValidApiRoot<'validated'> {
		// TODO: PLANO-151346
	}
}



