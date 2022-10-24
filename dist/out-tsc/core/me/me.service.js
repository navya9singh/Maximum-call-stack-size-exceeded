var _a, _b, _c, _d, _e;
import { __decorate, __metadata } from "tslib";
import { CookieService } from 'ngx-cookie-service';
import { Subject } from 'rxjs';
import { HttpParams } from '@angular/common/http';
import { HttpClient } from '@angular/common/http';
import { Injectable, NgZone, Injector } from '@angular/core';
import { Router } from '@angular/router';
import { AuthenticatedApiClientType, AuthenticatedApiGender, AuthenticatedApiRole } from '@plano/shared/api';
import { AuthenticatedApiService } from '@plano/shared/api';
import { Config } from '@plano/shared/core/config';
import { ApiErrorService } from '../../api/api-error.service';
import { PSentryService } from '../../sentry/sentry.service';
let MeService = class MeService extends AuthenticatedApiService {
    constructor(cookie, // we don’t include PCookieService to avoid circular dependency
    pSentryService, http, apiError, router, zone, injector) {
        super(http, router, apiError, zone, injector);
        this.cookie = cookie;
        this.pSentryService = pSentryService;
        /**
         * This is emitted before user is logging out.
         */
        this.beforeLogout = new Subject();
        /**
         * This is emitted after is logged in successfully.
         * The boolean value of this subject means "true" => Logged in from login form.
         * "false" => Logged in cookie credentials.
         */
        this.afterLogin = new Subject();
        /**
         * Previous executed load() failed because credentials were invalid?
         */
        this.previousLoginHadInvalidCredentials = false;
        this.basicAuthValue = null;
        // ensure tawk data are up-to-date
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const tawkApi = window.Tawk_API;
        if (tawkApi) {
            try {
                tawkApi.onBeforeLoad = () => {
                    this.updateTawkData();
                };
                tawkApi.onChatMaximized = () => {
                    this.updateTawkData();
                };
            }
            catch (error) {
                // eslint-disable-next-line no-console
                console.error(error);
            }
        }
        // handle api errors
        apiError.error.subscribe((response) => {
            // unauthorized api call?
            if (response.status === 401) {
                this.openLoginPage();
            }
        }, (error) => {
            // eslint-disable-next-line no-console
            console.error(error);
        });
    }
    /**
     * Sets up environment and user data necessary for chat support
     */
    updateTawkData() {
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const tawkApi = window.Tawk_API;
            if ((tawkApi === null || tawkApi === void 0 ? void 0 : tawkApi.setAttributes) && this.isLoaded()) {
                try {
                    // add visitor data
                    tawkApi.setAttributes({
                        name: `${this.data.firstName} ${this.data.lastName}`,
                        email: this.data.email,
                        hash: this.data.tawkHmac,
                    });
                }
                catch (_a) {
                    // eslint-disable-next-line no-console
                    console.warn('Error in tawk’s tawkApi.onBeforeLoad');
                }
                // add tags
                const tags = [];
                if (this.data.isOwner)
                    tags.push('Admin');
                if (this.data.testAccountDeadline)
                    // eslint-disable-next-line literal-blacklist/literal-blacklist
                    tags.push('Test-Account');
                switch (this.data.gender) {
                    case AuthenticatedApiGender.FEMALE: {
                        tags.push('female');
                        break;
                    }
                    case AuthenticatedApiGender.DIVERSE: {
                        tags.push('diverse');
                        break;
                    }
                    default:
                    case AuthenticatedApiGender.MALE: {
                        tags.push('male');
                    }
                }
                if (this.data.phone)
                    tags.push(`Phone: ${this.data.phone}`);
                tags.push(`${this.data.locationName}/${this.data.companyName} (Id: ${this.data.clientId.toString()})`, this.data.locale);
                try {
                    tawkApi.addTags(tags);
                }
                catch (_b) {
                    // eslint-disable-next-line no-console
                    console.warn('Error in tawk’s tawkApi.onBeforeLoad');
                }
            }
        }
        catch (error) {
            // We dont have control of tawk errors. So, just log them and ensure that user wont get an error modal
            // eslint-disable-next-line no-console
            console.warn(error);
        }
    }
    /**
     * Should the special test-client-expired view be shown? Note, that
     * depending if logged in user is default or owner client the view will be different. To differentiate it,
     * use `showExpiredClientViewForDefaultMember()` or `showExpiredClientViewForOwner()`.
     */
    get showExpiredClientView() {
        return this.isLoaded() &&
            this.data.clientType === AuthenticatedApiClientType.TEST_EXPIRED &&
            !this.data.loggedInWithMasterPassword;
    }
    /**
     * Should the special test-client-expired view for default-members be shown?
     */
    get showExpiredClientViewForDefaultMember() {
        return this.showExpiredClientView && this.data.role === AuthenticatedApiRole.CLIENT_DEFAULT;
    }
    /**
     * Should the special test-client-expired view for client-owner be shown?
     */
    get showExpiredClientViewForOwner() {
        return this.showExpiredClientView && this.data.role === AuthenticatedApiRole.CLIENT_OWNER;
    }
    /**
     * Returns the authentication value of the login data if === valid ascii
     */
    // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
    calcBasisAuthValue(email, password) {
        const basicAuthValue = `${email}:${password}`;
        // cspell:ignore restlet
        // restlet supports ASCII/ISO-8859-1 encoding.
        // cSpell:disable-next-line
        // See org.restlet.engine.security.HttpBasicHelper -> parseResponse().
        // Also btoa() on many browsers throw errors for utf-8.
        // eslint-disable-next-line no-control-regex
        if (/[^\u0000-\u00FF]/.test(basicAuthValue)) {
            return 'not_ascii';
        }
        return btoa(basicAuthValue);
    }
    /**
     * 	@param basicAuthValue credential basic-auth value
     *  @param changeCookies Should cookie values be touched?
     *  @param success Success event when credentials were set successfully.
     *  @param error Error event when credentials could not be set.
     */
    login(basicAuthValue, changeCookies, loggedInFromLoginForm, success, error, searchParams = new HttpParams()) {
        if (basicAuthValue === 'not_ascii' && error) {
            error('not_ascii');
            return new Promise(() => { });
        }
        this.basicAuthValue = basicAuthValue;
        // if admin area? Then add "adminArea" query param
        if (this.url.includes('/admin'))
            searchParams = searchParams.set('adminArea', '');
        // clear old data
        // Note that this call does not clear cookies (parameter is false) because on Android app
        // the following load call sometimes crashed. If this would clear cookies this would mean loss
        // of login data because no new cookies will be set then.
        this.clearCredentials(false);
        // set new credentials
        Config.HTTP_AUTH_CODE = `Basic ${this.basicAuthValue}`;
        // retrieve new data
        const storeCredentialsInCookies = () => {
            if (changeCookies)
                this.cookie.set('s', basicAuthValue, 3560, '/', undefined, undefined, 'Lax');
        };
        return this.load({
            success: () => {
                // Credentials were valid
                this.invalidCredentials = false;
                this.previousLoginHadInvalidCredentials = false;
                // store cookies of successful login
                storeCredentialsInCookies();
                // tell external tools about current login
                this.updateTawkData();
                this.setUserDataForErrorReporting();
                // call handlers
                if (success) {
                    success();
                }
                this.afterLogin.next(loggedInFromLoginForm);
                // forward when account is expired (do this last to override all other forwards)
                if (this.showExpiredClientViewForOwner) {
                    this.router.navigate(['/client/testaccount/']);
                }
                else if (this.showExpiredClientViewForDefaultMember) {
                    this.openLoginPage();
                }
                // ensure correct frontend country (do this last to have the final route)
                // eslint-disable-next-line sonarjs/no-collapsible-if
                if (this.ensureCorrectFrontendCountryVersion()) {
                    // Tell app about the country code.
                    if (Config.platform === 'appAndroid' || Config.platform === 'appIOS') {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        window.nsWebViewInterface.emit('countryCode', Config.getCountryCode());
                    }
                }
                // login was successful so we can reset pathWhenLoginFailed (do this last as the success() method might need this)
                this.pathWhenLoginFailed = undefined;
            },
            error: (response) => {
                // invalid credentials?
                this.previousLoginHadInvalidCredentials = (response.status === 401);
                this.invalidCredentials = (response.status === 401);
                if (this.invalidCredentials) {
                    this.clearCredentials(changeCookies);
                }
                else {
                    storeCredentialsInCookies();
                }
                if (error) {
                    error(response);
                }
            },
            searchParams: searchParams,
        });
    }
    /**
     * Checks if the frontend country version equals the country of logged in user. If not, this method forwards to correct version
     * ensuring that current route remains.
     * @returns `true` if no forward was needed. `false` when a forward was executed.
     */
    ensureCorrectFrontendCountryVersion() {
        // Frontend locale matches user locale?
        if (Config.APPLICATION_MODE === 'TEST' ||
            this.data.email === 'admin@dr-plano.de' || // Generate admin is currently always locale de-DE. Prevent redirect as otherwise we cannot login to admin area when another frontend version is started.
            this.data.locale === Config.LOCALE_ID) {
            return;
        }
        // otherwise forward to correct frontend country
        const url = this.url;
        const countryCode = Config.getCountryCode(this.data.locale);
        if (!countryCode)
            throw new Error('Could not get countryCode');
        const countryPath = countryCode.toLowerCase();
        window.location.href = `/${countryPath}${url}`;
    }
    /**
     * Collect and set the user data for error reporting tool
     */
    setUserDataForErrorReporting() {
        this.pSentryService.setUserAndAccountScope(this);
    }
    /**
     * Deletes the user data for error reporting tool
     */
    clearUserDataForErrorReporting() {
        this.pSentryService.setUserAndAccountScope(null);
    }
    /**
     *  Get current url
     */
    get url() {
        // Any navigation which has not been executed yet will be accessible through this.router.getCurrentNavigation().
        const currentNavigation = this.router.getCurrentNavigation();
        return currentNavigation ?
            currentNavigation.extractedUrl.toString() :
            this.router.url;
    }
    /**
     * The path to the page where the user navigated to before logging if != log-in page
     */
    rememberPathWhenLoginFailed() {
        if (this.router.url !== Config.LOGIN_PATH) {
            this.pathWhenLoginFailed = this.router.url;
        }
    }
    /**
     * Logs the current user out
     */
    logout() {
        this.beforeLogout.next();
        this.clearCredentials(true);
        this.clearUserDataForErrorReporting();
        // On login we have associated users data with current tawk chat. No, remove connection again
        // cspell:ignore tawkuuid
        this.cookie.delete('__tawkuuid', '/');
    }
    /**
     * Clear credential data.
     * @param changeCookies Should cookie values be touched?
     */
    clearCredentials(changeCookies) {
        this.unload();
        this.invalidCredentials = undefined;
        Config.HTTP_AUTH_CODE = null;
        // remove cookie
        if (changeCookies)
            this.cookie.delete('s', '/');
    }
    /**
     * Try to login from credentials in cookies.
     */
    loginFromCookieCredentials(success, error) {
        const basicAuthValue = this.cookie.get('s');
        // already logged in with these data?
        if (this.isLoaded() && basicAuthValue === this.basicAuthValue) {
            // Then no need to to anything
            if (success) {
                success();
            }
            return;
        }
        // set credentials
        if (basicAuthValue) {
            this.login(basicAuthValue, true, false, success, error);
        }
        else {
            if (error) {
                error(undefined);
            }
        }
    }
    /**
     * Navigates to the app-depending log-in page
     */
    openLoginPage() {
        const loginPath = Config.LOGIN_PATH;
        if (!loginPath) {
            return;
        }
        const currPath = this.url;
        if (currPath !== loginPath) {
            // redirect to login page
            this.router.navigate([loginPath]);
        }
    }
    /**
     * Check if the test-phase is running
     */
    get isTestAccount() {
        return !!this.data.testAccountDeadline;
    }
    /**
     * Returns the role and hence the permissions of the current user
     */
    get role() {
        if (!this.isLoaded())
            return undefined;
        if (this.data.isOwner)
            return AuthenticatedApiRole.CLIENT_OWNER;
        return AuthenticatedApiRole.CLIENT_DEFAULT;
    }
};
MeService = __decorate([
    Injectable({ providedIn: 'root' }),
    __metadata("design:paramtypes", [typeof (_a = typeof CookieService !== "undefined" && CookieService) === "function" ? _a : Object, PSentryService, typeof (_b = typeof HttpClient !== "undefined" && HttpClient) === "function" ? _b : Object, ApiErrorService, typeof (_c = typeof Router !== "undefined" && Router) === "function" ? _c : Object, typeof (_d = typeof NgZone !== "undefined" && NgZone) === "function" ? _d : Object, typeof (_e = typeof Injector !== "undefined" && Injector) === "function" ? _e : Object])
], MeService);
export { MeService };
//# sourceMappingURL=me.service.js.map