/* eslint-disable max-statements -- TODO: Milad… for the sake of 'clean code': Fix this.  */
import { ReCaptchaV3Service } from 'ng-recaptcha';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { PMomentService } from '@plano/client/shared/p-moment.service';
import { SchedulingApiService } from '@plano/shared/api';
import { PSupportedLocaleIds } from '@plano/shared/api/base/generated-types.ag';
import { TestingUtils } from '@plano/shared/testing/testing-utils';
import { assumeDefinedToGetStrictNullChecksRunning, assumeNonNull } from '../../../../core/null-type-utils';
import { AdyenTestingUtils } from '../../../base/adyen-testing-utils';
/**
 * Early authorization is the phenomenon that we receive the AUTHORIZATION event of an online-payment before actually
 * the booking has been created. This can be the case for SOFORT payments. As the payment has already been executed
 * it is important to directly create the booking on the AUTHORIZATION event. Otherwise, we might end up have a payment without
 * a booking belonging to it.
 */
describe('#SchedulingApiService #needsapi', () => {
    let api;
    const testingUtils = new TestingUtils();
    const pMoment = new PMomentService(PSupportedLocaleIds.de_DE);
    const adyenTestingUtils = new AdyenTestingUtils();
    let recaptchaV3Service;
    beforeAll(() => {
        recaptchaV3Service = testingUtils.getService(ReCaptchaV3Service);
    });
    const getApiQueryParams = (dataType) => {
        // start/end
        // Hack: data.shifts currently returns shifts of the whole day. workingTimes/absences not. So, to be consistent, start/end should be start/end of day
        const start = pMoment.m().subtract(1, 'week').startOf('day').valueOf().toString();
        const end = pMoment.m().add(1, 'week').startOf('day').valueOf().toString();
        return new HttpParams()
            .set('data', dataType)
            .set('start', start)
            .set('end', end)
            .set('bookingsStart', start)
            .set('bookingsEnd', end)
            .set('bookingsByShiftTime', 'true');
    };
    const httpClient = () => {
        // We cannot inject this at object creation so we do it lazily
        return TestBed.inject(HttpClient);
    };
    const getRequestOptions = () => {
        // headers
        const headers = new HttpHeaders({
            // eslint-disable-next-line @typescript-eslint/naming-convention
            Authorization: `Basic ${btoa('test:test')}`,
        });
        // query params (bypass the hmac verification as we dont have the certificates to generate the hmac)
        const queryParams = new HttpParams().set('ignoreHMAC', 'true');
        // return result
        return {
            headers: headers,
            params: queryParams,
            observe: 'response',
            responseType: 'text',
        };
    };
    /**
     * Get TempBookableData based on either tempBookableDataId or deferredPaymentToken
     */
    const getTemporaryBookableData = async (tempBookableDataId, deferredPaymentToken) => {
        var _a;
        const requestOptions = getRequestOptions();
        if (!!tempBookableDataId) {
            requestOptions.params = new HttpParams().set('tempBookableDataId', tempBookableDataId);
        }
        if (!!deferredPaymentToken) {
            requestOptions.params = new HttpParams().set('deferredPaymentToken', deferredPaymentToken);
        }
        const result = (_a = await httpClient().get('http://localhost:8182/temp_bookable_data', requestOptions).toPromise()) !== null && _a !== void 0 ? _a : null;
        assumeNonNull(result);
        return result;
    };
    const executeBookable = async (bookableJson) => {
        var _a;
        const requestOptions = getRequestOptions();
        const result = (_a = await httpClient().post('http://localhost:8182/bookable', bookableJson, requestOptions).toPromise()) !== null && _a !== void 0 ? _a : null;
        assumeNonNull(result);
        return result;
    };
    /**
     * Backend creates a tempBookableData-Object and returns the UUID for this object
     */
    const createTemporaryBookableData = async (courseDate, bookableJson) => {
        var _a;
        const requestOptions = getRequestOptions();
        const token = await recaptchaV3Service.execute('BOOKABLE').toPromise();
        const result = (_a = await httpClient().post(`http://localhost:8182/temp_bookable_data?token=${token}`, { bookable: bookableJson, date: courseDate }, requestOptions).toPromise()) !== null && _a !== void 0 ? _a : null;
        assumeNonNull(result);
        return result;
    };
    const createDefaultTemporaryBookableData = async (type) => {
        // get the 'Kindergeburtstag'-ShiftModel
        const shiftModel = api.data.shiftModels.search('Kindergeburtstag').get(0);
        // get the course dates for that shift model
        assumeDefinedToGetStrictNullChecksRunning(shiftModel, 'shiftModel');
        const result = await getCourseDates(shiftModel.id);
        assumeDefinedToGetStrictNullChecksRunning(result.body, 'result.body');
        const body = JSON.parse(result.body);
        let bookableCourseDate = null;
        for (const item of body) {
            if (item.state === 'BOOKABLE') {
                bookableCourseDate = item;
                break;
            }
        }
        expect(bookableCourseDate).toBeDefined();
        clientId = api.data.id.rawData;
        // create a tempBookable
        if (type === 'booking') {
            bookableJson = {
                type: 'booking',
                clientId: clientId,
                shiftModelId: shiftModel.id.rawData,
                firstName: 'Hans',
                lastName: 'Wurst',
                // cSpell:ignore hans
                email: 'hans@dr-plano.com',
                dateOfBirth: '1990-01-01',
                streetAndHouseNumber: 'Holzweg 1',
                city: 'Horst-Town',
                postalCode: '12345',
                phoneMobile: '123456789',
                participantCount: 3,
                paymentMethodId: 0,
                ageMin: 2,
                ageMax: 20,
            };
        }
        else {
            bookableJson = {
                type: 'voucher',
                firstName: 'Hans',
                lastName: 'Müller',
                email: 'hans@mueller.de',
                value: 20,
                clientId: clientId,
            };
        }
        return createTemporaryBookableData(bookableCourseDate, bookableJson);
    };
    const getCourseDates = async (shiftModelId) => {
        var _a;
        const requestOptions = getRequestOptions();
        const start = new Date();
        const end = new Date();
        end.setMonth(end.getMonth() + 1);
        requestOptions.params = new HttpParams().set('id', shiftModelId.rawData).set('end', end.getTime()).set('start', start.getTime());
        const result = (_a = await httpClient().get('http://localhost:8182/courses_dates', requestOptions).toPromise()) !== null && _a !== void 0 ? _a : null;
        assumeNonNull(result);
        return result;
    };
    let tempBookableResult;
    let bookableJson;
    let tempBookableDataId;
    let psp;
    let bookable = null;
    let clientId;
    let testingReservedBookableNumber;
    let testingDeferredPaymentToken;
    const paymentsRequestJson = {
        shopperLocale: 'de_DE',
        countryCode: 'DE',
        amount: {
            value: 500,
            currency: 'EUR',
        },
        paymentMethod: {
            type: 'scheme',
            encryptedCardNumber: 'test_4111111111111111',
            encryptedExpiryMonth: 'test_03',
            encryptedExpiryYear: 'test_2030',
            encryptedSecurityCode: 'test_737',
        },
        browserInfo: {
            language: 'de-DE',
            javaEnabled: false,
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.45 Safari/537.36',
            screenHeight: '1080',
            screenWidth: '1920',
            colorDepth: '24',
            timeZoneOffset: -60,
        },
    };
    const doTransactionTests = (type) => {
        describe('ONLINE_PAYMENT-test-early-redirect-AUTHORIZATION', () => {
            it('basic-bookable', async () => {
                const result2 = await createDefaultTemporaryBookableData(type);
                tempBookableDataId = JSON.parse(result2.body).tempBookableDataId;
                expect(tempBookableDataId).toBeDefined();
                // get the reservedBookableNumber
                tempBookableResult = await getTemporaryBookableData(tempBookableDataId);
                let tempBookableDataGetResponseJson = JSON.parse(tempBookableResult.body);
                testingReservedBookableNumber = tempBookableDataGetResponseJson.testingReservedBookableNumber;
                bookableJson = tempBookableDataGetResponseJson.bookable;
                expect(testingReservedBookableNumber).toBeDefined();
                // send an earlyRedirect-Authorization event
                psp = testingUtils.getRandomString(10);
                await adyenTestingUtils.sendAuthorizationSuccessTrue(`c:${clientId};b:${testingReservedBookableNumber};t:${tempBookableDataId}`, 500, psp);
                // send the event again with a different psp but same tempBookableDataId. this should not create a new transaction/booking
                psp = testingUtils.getRandomString(10);
                await adyenTestingUtils.sendAuthorizationSuccessTrue(`c:${clientId};b:${testingReservedBookableNumber};t:${tempBookableDataId}`, 500, psp);
                // reload api to get changes
                await api.reload();
                // check that temp-bookable-data has been updated
                tempBookableResult = await getTemporaryBookableData(tempBookableDataId);
                tempBookableDataGetResponseJson = JSON.parse(tempBookableResult.body);
                expect(tempBookableDataGetResponseJson.isProcessed).toBeTrue();
                if (type === 'booking')
                    expect(tempBookableDataGetResponseJson.bookable.paymentMethodId > 0).toBeTrue();
                // we expect one booking with 5€ paid
                if (type === 'booking') {
                    const bookings = api.data.bookings.filterBy((item) => {
                        return item.bookingNumber === testingReservedBookableNumber;
                    });
                    expect(bookings.length).toBe(1);
                    bookable = bookings.get(0);
                    expect(bookable === null || bookable === void 0 ? void 0 : bookable.currentlyPaid).toBe(5);
                    // check content of bookable
                    await (bookable === null || bookable === void 0 ? void 0 : bookable.loadDetailed());
                    testingDeferredPaymentToken = bookable === null || bookable === void 0 ? void 0 : bookable.testingDeferredPaymentToken;
                    expect(bookable === null || bookable === void 0 ? void 0 : bookable.firstName).toBe('Hans');
                    expect(bookable === null || bookable === void 0 ? void 0 : bookable.lastName).toBe('Wurst');
                    expect(bookable === null || bookable === void 0 ? void 0 : bookable.email).toBe('hans@dr-plano.com');
                    expect(bookable === null || bookable === void 0 ? void 0 : bookable.streetAndHouseNumber).toBe('Holzweg 1');
                    expect(bookable === null || bookable === void 0 ? void 0 : bookable.city).toBe('Horst-Town');
                    expect(bookable === null || bookable === void 0 ? void 0 : bookable.postalCode).toBe('12345');
                    expect(bookable === null || bookable === void 0 ? void 0 : bookable.phoneMobile).toBe('123456789');
                    expect(bookable === null || bookable === void 0 ? void 0 : bookable.participantCount).toBe(3);
                    expect(bookable === null || bookable === void 0 ? void 0 : bookable.ageMin).toBe(2);
                    expect(bookable === null || bookable === void 0 ? void 0 : bookable.ageMax).toBe(20);
                }
                else {
                    const vouchers = api.data.vouchers.filterBy((item) => {
                        return item.bookingNumber === testingReservedBookableNumber;
                    });
                    expect(vouchers.length).toBe(1);
                    bookable = vouchers.get(0);
                    await (bookable === null || bookable === void 0 ? void 0 : bookable.loadDetailed());
                    testingDeferredPaymentToken = bookable === null || bookable === void 0 ? void 0 : bookable.testingDeferredPaymentToken;
                    expect(bookable === null || bookable === void 0 ? void 0 : bookable.currentlyPaid).toBe(5);
                    // check content of bookable
                    expect(bookable === null || bookable === void 0 ? void 0 : bookable.firstName).toBe('Hans');
                    expect(bookable === null || bookable === void 0 ? void 0 : bookable.lastName).toBe('Müller');
                    expect(bookable === null || bookable === void 0 ? void 0 : bookable.email).toBe('hans@mueller.de');
                }
                // execute /booking with same tempBookableDataId
                bookableJson.paymentsRequestJson = paymentsRequestJson;
                await executeBookable(bookableJson);
                // reload api to get changes
                await api.reload();
                // we still expect one booking and still with 10€ paid
                if (type === 'booking') {
                    const bookings = api.data.bookings.filterBy((item) => {
                        return item.bookingNumber === testingReservedBookableNumber;
                    });
                    expect(bookings.length).toBe(1);
                    expect(bookable === null || bookable === void 0 ? void 0 : bookable.currentlyPaid).toBe(5);
                }
                else {
                    const vouchers = api.data.vouchers.filterBy((item) => {
                        return item.bookingNumber === testingReservedBookableNumber;
                    });
                    expect(vouchers.length).toBe(1);
                    expect(bookable === null || bookable === void 0 ? void 0 : bookable.currentlyPaid).toBe(5);
                }
            });
        });
        it('deferred-bookable', async () => {
            // get a new tempBookableData for a deferred payment on the same bookable
            tempBookableResult = await getTemporaryBookableData(undefined, testingDeferredPaymentToken);
            let tempBookableDataGetResponseJson = JSON.parse(tempBookableResult.body);
            bookableJson = tempBookableDataGetResponseJson.bookable;
            expect(tempBookableDataGetResponseJson.tempBookableDataId).toBeDefined();
            expect(tempBookableDataGetResponseJson.tempBookableDataId).not.toEqual(tempBookableDataId);
            tempBookableDataId = tempBookableDataGetResponseJson.tempBookableDataId;
            // send an deferred earlyRedirect-Authorization event
            psp = testingUtils.getRandomString(10);
            await adyenTestingUtils.sendAuthorizationSuccessTrue(`c:${clientId};b:${testingReservedBookableNumber};t:${tempBookableDataId}`, 500, psp);
            // reload api to get changes
            await api.reload();
            // check that temp-bookable-data has been processed
            tempBookableResult = await getTemporaryBookableData(tempBookableDataId);
            tempBookableDataGetResponseJson = JSON.parse(tempBookableResult.body);
            expect(tempBookableDataGetResponseJson.isProcessed).toBeTrue();
            if (type === 'booking')
                expect(tempBookableDataGetResponseJson.bookable.paymentMethodId > 0).toBeTrue();
            // we still expect one booking but now with 10€ paid
            if (type === 'booking') {
                const bookings = api.data.bookings.filterBy((item) => { return item.bookingNumber === testingReservedBookableNumber; });
                expect(bookings.length).toBe(1);
                expect(bookable === null || bookable === void 0 ? void 0 : bookable.currentlyPaid).toBe(10);
            }
            else {
                const vouchers = api.data.vouchers.filterBy((item) => { return item.bookingNumber === testingReservedBookableNumber; });
                expect(vouchers.length).toBe(1);
                expect(bookable === null || bookable === void 0 ? void 0 : bookable.currentlyPaid).toBe(10);
            }
            // execute /booking with same tempBookableDataId
            bookableJson.paymentsRequestJson = paymentsRequestJson;
            await executeBookable(bookableJson);
            // reload api to get changes
            await api.reload();
            // we still expect one booking and still with 10€ paid
            if (type === 'booking') {
                const bookings = api.data.bookings.filterBy((item) => { return item.bookingNumber === testingReservedBookableNumber; });
                expect(bookings.length).toBe(1);
                bookable = bookings.get(0);
                expect(bookable === null || bookable === void 0 ? void 0 : bookable.currentlyPaid).toBe(10);
                // check content of bookable
                await (bookable === null || bookable === void 0 ? void 0 : bookable.loadDetailed());
                expect(bookable === null || bookable === void 0 ? void 0 : bookable.firstName).toBe('Hans');
                expect(bookable === null || bookable === void 0 ? void 0 : bookable.lastName).toBe('Wurst');
                expect(bookable === null || bookable === void 0 ? void 0 : bookable.email).toBe('hans@dr-plano.com');
                expect(bookable === null || bookable === void 0 ? void 0 : bookable.streetAndHouseNumber).toBe('Holzweg 1');
                expect(bookable === null || bookable === void 0 ? void 0 : bookable.city).toBe('Horst-Town');
                expect(bookable === null || bookable === void 0 ? void 0 : bookable.postalCode).toBe('12345');
                expect(bookable === null || bookable === void 0 ? void 0 : bookable.phoneMobile).toBe('123456789');
                expect(bookable === null || bookable === void 0 ? void 0 : bookable.participantCount).toBe(3);
                expect(bookable === null || bookable === void 0 ? void 0 : bookable.ageMin).toBe(2);
                expect(bookable === null || bookable === void 0 ? void 0 : bookable.ageMax).toBe(20);
            }
            else {
                const vouchers = api.data.vouchers.filterBy((item) => { return item.bookingNumber === testingReservedBookableNumber; });
                bookable = vouchers.get(0);
                expect(vouchers.length).toBe(1);
                expect(bookable === null || bookable === void 0 ? void 0 : bookable.currentlyPaid).toBe(10);
                // check content of bookable
                expect(bookable === null || bookable === void 0 ? void 0 : bookable.firstName).toBe('Hans');
                expect(bookable === null || bookable === void 0 ? void 0 : bookable.lastName).toBe('Müller');
                expect(bookable === null || bookable === void 0 ? void 0 : bookable.email).toBe('hans@mueller.de');
            }
        });
    };
    describe('booking', () => {
        beforeAll(async () => {
            await testingUtils.login();
            api = await testingUtils.unloadAndLoadApi(SchedulingApiService, null, getApiQueryParams('bookings'));
        });
        doTransactionTests('booking');
    });
    describe('voucher', () => {
        beforeAll(async () => {
            await testingUtils.login();
            api = await testingUtils.unloadAndLoadApi(SchedulingApiService, null, getApiQueryParams('vouchers'));
        });
        doTransactionTests('voucher');
    });
});
//# sourceMappingURL=scheduling-api-early-authorisation.spec.js.map