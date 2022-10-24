/* eslint-disable indent */
import { HttpParams } from '@angular/common/http';
import { PMomentService } from '@plano/client/shared/p-moment.service';
import { SchedulingApiService } from '@plano/shared/api';
import { EmailValidApiService } from '@plano/shared/api';
import { TestingUtils } from '@plano/shared/testing/testing-utils';
import { PSupportedLocaleIds } from '../../base/generated-types.ag';
describe('EmailUnusedApiService #needsapi', () => {
    const testingUtils = new TestingUtils();
    const pMoment = new PMomentService(PSupportedLocaleIds.de_DE);
    let api;
    let member1;
    let member1Email;
    let member2;
    let member2Email;
    testingUtils.init({
        imports: [],
        providers: [EmailValidApiService, SchedulingApiService],
    });
    beforeAll(async () => {
        api = testingUtils.getService(EmailValidApiService);
        await testingUtils.login();
        // We need email addresses of two members for the tests.
        // Email is detailed information.
        const now = pMoment.m();
        const queryParams = new HttpParams()
            .set('data', 'calendar')
            .set('start', now.valueOf().toString())
            .set('end', now.valueOf().toString());
        const schedulingApi = await testingUtils.unloadAndLoadApi(SchedulingApiService, null, queryParams);
        member1 = schedulingApi.data.members.get(0);
        await member1.loadDetailed();
        member1Email = member1.email;
        member2 = schedulingApi.data.members.get(1);
        await member2.loadDetailed();
        member2Email = member2.email;
    });
    const doTest = (memberId, email, expectedInvalid, expectedUsed, done) => {
        let queryParams = new HttpParams()
            .set('emails', email)
            .set('checkIsUsed', '');
        if (memberId)
            queryParams = queryParams.set('user', memberId);
        api.load({ success: () => {
                expect(api.data.invalid).toBe(expectedInvalid);
                expect(api.data.used).toBe(expectedUsed);
                done();
            },
            error: () => {
                fail();
            },
            searchParams: queryParams,
        });
    };
    describe('edit-member', () => {
        it('used-email', (done) => {
            doTest(member1.id.rawData, member2Email, false, true, done);
        });
        it('unused-email', (done) => {
            doTest(member1.id.rawData, testingUtils.getRandomEmail(), false, false, done);
        });
        it('user\'s email', (done) => {
            doTest(member1.id.rawData, member1Email, false, false, done);
        });
        it('invalid email', (done) => {
            doTest(member1.id.rawData, 'asd@dasdasdadasda.de', true, false, done);
        });
    });
    describe('create-new-member', () => {
        it('used-email', (done) => {
            doTest(null, member2Email, false, true, done);
        });
        it('unused-email', (done) => {
            doTest(null, testingUtils.getRandomEmail(), false, false, done);
        });
    });
});
//# sourceMappingURL=email-valid-api.service.spec.js.map