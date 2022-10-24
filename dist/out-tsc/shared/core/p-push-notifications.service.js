var _a, _b;
import { __decorate, __metadata } from "tslib";
import { Injectable, Injector } from '@angular/core';
import { AngularFireMessaging } from '@angular/fire/compat/messaging';
import { ToastsService } from '@plano/client/service/toasts.service';
import { PThemeEnum } from '@plano/client/shared/bootstrap-styles.enum';
import { MeService } from '@plano/shared/api';
import { SchedulingApiPushTokenAction, SchedulingApiPushTokenType } from '@plano/shared/api';
import { Config } from './config';
import { PCookieService } from './p-cookie.service';
import { LocalizePipe } from './pipe/localize.pipe';
import { PlanoFaIconPool } from './plano-fa-icon-pool.enum';
/**
 * Push token of this device. "null" there is no permission to send push notifications to this device.
 * "undefined" means that current push-token has not been determined yet.
 */
let currentPushToken = null;
let permissionBlockedInBrowser = null;
// Create here all handlers which should start independent of the service creation.
let serviceInstance = null;
if (Config.platform === 'appAndroid' || Config.platform === 'appIOS') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    window.nsWebViewInterface.on('pushToken', (data) => {
        currentPushToken = data.pushToken;
        if (serviceInstance)
            serviceInstance.performQueuedPushTokenAction();
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    window.nsWebViewInterface.emit('pushNotificationServiceReady');
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const permissions = window.navigator.permissions;
if (permissions) {
    permissions.query({ name: 'push', userVisibleOnly: true })
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .then((permissionStatus) => {
        permissionBlockedInBrowser = (permissionStatus.state === 'denied');
    });
}
else {
    // permissions is not supported on all browsers (e.g. app webview browser and safari).
    // See https://developer.mozilla.org/en-US/docs/Web/API/Navigator/permissions
    // For these browsers no web push-notification is supported. Safari doesn't support Push Api at all
    // And for apps we instead use native app notifications.
    permissionBlockedInBrowser = false;
}
/**
 *
 */
export var PRequestWebPushNotificationPermissionContext;
(function (PRequestWebPushNotificationPermissionContext) {
    PRequestWebPushNotificationPermissionContext[PRequestWebPushNotificationPermissionContext["USER_REQUEST"] = 0] = "USER_REQUEST";
    PRequestWebPushNotificationPermissionContext[PRequestWebPushNotificationPermissionContext["SHIFT_EXCHANGE_CREATED"] = 1] = "SHIFT_EXCHANGE_CREATED";
    PRequestWebPushNotificationPermissionContext[PRequestWebPushNotificationPermissionContext["ILLNESS_ACCEPTED_WITH_SHIFT_EXCHANGE"] = 2] = "ILLNESS_ACCEPTED_WITH_SHIFT_EXCHANGE";
    PRequestWebPushNotificationPermissionContext[PRequestWebPushNotificationPermissionContext["MANAGER_STARTED_ASKING_MEMBER_PREFERENCES"] = 3] = "MANAGER_STARTED_ASKING_MEMBER_PREFERENCES";
    PRequestWebPushNotificationPermissionContext[PRequestWebPushNotificationPermissionContext["MANAGER_STARTED_EARLY_BIRD_SCHEDULING"] = 4] = "MANAGER_STARTED_EARLY_BIRD_SCHEDULING";
    PRequestWebPushNotificationPermissionContext[PRequestWebPushNotificationPermissionContext["CLOSED_UI_WISH_PICKER_MODE"] = 5] = "CLOSED_UI_WISH_PICKER_MODE";
    PRequestWebPushNotificationPermissionContext[PRequestWebPushNotificationPermissionContext["CLOSED_UI_EARLY_BIRD_MODE"] = 6] = "CLOSED_UI_EARLY_BIRD_MODE";
    PRequestWebPushNotificationPermissionContext[PRequestWebPushNotificationPermissionContext["STAMPED_PAST_SHIFT"] = 7] = "STAMPED_PAST_SHIFT";
    PRequestWebPushNotificationPermissionContext[PRequestWebPushNotificationPermissionContext["ONLINE_INQUIRY_SHIFT_CREATED"] = 8] = "ONLINE_INQUIRY_SHIFT_CREATED";
})(PRequestWebPushNotificationPermissionContext || (PRequestWebPushNotificationPermissionContext = {}));
//
// Push notification service
//
let PPushNotificationsService = class PPushNotificationsService {
    constructor(me, pCookieService, toasts, injector, localize, angularFireMessaging) {
        this.me = me;
        this.pCookieService = pCookieService;
        this.toasts = toasts;
        this.injector = injector;
        this.localize = localize;
        this.angularFireMessaging = angularFireMessaging;
        /**
         * See setApi() for details.
         */
        this.api = null;
        // eslint-disable-next-line unicorn/no-this-assignment, @typescript-eslint/no-this-alias
        serviceInstance = this;
        // login/logout handlers. Note, that for app these will create/remove the push-token
        // from backend. On the other hand, on browser this will enable/disable the push-token on backend.
        // I.e. if the push-token is not available yet in backend this will have no effect.
        this.me.afterLogin.subscribe((loggedInFromLoginForm) => {
            // only enable/create push-token when we are doing a real login from the login form.
            if (loggedInFromLoginForm) {
                this.queuePushTokenAction(Config.platform === 'browser' ? SchedulingApiPushTokenAction.ENABLE :
                    SchedulingApiPushTokenAction.CREATE);
            }
            this.performQueuedPushTokenAction();
        });
        this.me.beforeLogout.subscribe(() => {
            this.queuePushTokenAction(Config.platform === 'browser' ? SchedulingApiPushTokenAction.DISABLE :
                SchedulingApiPushTokenAction.REMOVE);
        });
        //
        // Web Push Token
        //
        if (Config.ANGULAR_FIRE_MESSAGING_ENABLED) {
            // get web push token
            this.angularFireMessaging.getToken.subscribe(token => {
                currentPushToken = token;
                this.performQueuedPushTokenAction();
            }, () => {
                currentPushToken = null;
            });
            // listen for web push notifications when application is in foreground
            this.angularFireMessaging.messages.subscribe((message) => {
                // PLANO-17682: This seems to also be called when user clicks on notification (no message.notification is then available).
                // In this case, we do not want to show any extra notification.
                if (!message.notification)
                    return;
                // manually show notification
                const notification = new Notification(message.notification.title, {
                    body: message.notification.body,
                    icon: message.notification.icon,
                });
                const clickAction = message.notification.click_action;
                if (!clickAction)
                    return;
                notification.addEventListener('click', event => {
                    event.preventDefault(); // prevent the browser from focusing the Notification's tab
                    window.open(clickAction, '_blank');
                    notification.close();
                });
            });
        }
    }
    /**
     * HACK: We must ensure that PPushNotificationService is instantiated is available when app starts
     * (to listen to me.afterLogin events).
     * So, we inject this service in AppComponent. But there, SchedulingApiService is not available.
     * So, we do a hack and set this later in ClientComponent, when it is available.
     * Some better solution should be found.
     */
    setApi(api) {
        this.api = api;
        this.performQueuedPushTokenAction();
    }
    /**
     * This will request push-notification permission from the browser.
     */
    requestWebPushNotificationPermissionFromBrowser() {
        this.angularFireMessaging.requestToken.subscribe(pushToken => {
            currentPushToken = pushToken;
            this.queuePushTokenAction(SchedulingApiPushTokenAction.CREATE);
        }, () => {
            permissionBlockedInBrowser = true;
            currentPushToken = null;
            this.toasts.addToast({
                content: this.localize.transform('Schade. Falls du dich doch dafür entscheidest, gib uns bei deinem Browser das Recht, dir Benachrichtigungen zu schicken.'),
                theme: PThemeEnum.SECONDARY,
                visibilityDuration: 'long',
            });
        });
    }
    getCustomWebNotificationPermissionDialogText(context) {
        if (!context)
            throw new Error('You must provide a context value.');
        // get context description
        const contextDescMap = new Map([
            [
                PRequestWebPushNotificationPermissionContext.SHIFT_EXCHANGE_CREATED,
                this.localize.transform('Neuigkeiten zu deiner Ersatzsuche'),
            ],
            [
                PRequestWebPushNotificationPermissionContext.ILLNESS_ACCEPTED_WITH_SHIFT_EXCHANGE,
                this.localize.transform('weitere Krankmeldungen'),
            ],
            [
                PRequestWebPushNotificationPermissionContext.MANAGER_STARTED_ASKING_MEMBER_PREFERENCES,
                this.localize.transform('den Status der Schichtverteilung'),
            ],
            [
                PRequestWebPushNotificationPermissionContext.MANAGER_STARTED_EARLY_BIRD_SCHEDULING,
                this.localize.transform('den Status der Schichtverteilung'),
            ],
            [
                PRequestWebPushNotificationPermissionContext.CLOSED_UI_WISH_PICKER_MODE,
                this.localize.transform('den Status der Schichtverteilung'),
            ],
            [
                PRequestWebPushNotificationPermissionContext.CLOSED_UI_EARLY_BIRD_MODE,
                this.localize.transform('den Status der Schichtverteilung'),
            ],
            [
                PRequestWebPushNotificationPermissionContext.STAMPED_PAST_SHIFT,
                this.localize.transform('fällige Zeiterfassung'),
            ],
            [
                PRequestWebPushNotificationPermissionContext.ONLINE_INQUIRY_SHIFT_CREATED,
                this.localize.transform('neue Buchungsanfragen'),
            ],
        ]);
        const contextDesc = contextDescMap.get(context);
        if (!contextDesc)
            throw new Error(`No context-desc could be found for value ${context}.`);
        // return text
        return this.localize.transform('Um über ${context} und ähnliche wichtige Dinge informiert zu werden, empfehlen wir dir Push-Nachrichten für diesen Browser einzuschalten.', { context: contextDesc });
    }
    /**
     * Requests permission to send push notifications in browser.
     * @param onUserRequest Has the user explicitly requested to give permission?
     * @param contextDesc Provide this when onUserRequest === false. Then this string describes the context
     * 		in which the dialog is shown to construct an appropriate dialog text.
     */
    requestWebPushNotificationPermission(context) {
        // For mobile we have apps. Only ask permission on desktop
        if (Config.IS_MOBILE)
            return;
        // validation tests
        if (!this.me.isLoaded())
            throw new Error('Only request web push-notification permission when user is logged in.');
        // only state where we should ask for permission is 'not_receiving'
        if (this.thisDeviceState !== 'not_receiving')
            return;
        //
        // Execute
        //
        if (context === PRequestWebPushNotificationPermissionContext.USER_REQUEST) {
            // when user requested it directly show browser permission dialog
            this.requestWebPushNotificationPermissionFromBrowser();
            return;
        }
        // Show custom permission dialog.
        // But only once (until user answers it).
        const userAnsweredCustomWebNotificationPermissionDialogCookieData = { name: 'userAnsweredCustomWebNotificationPermissionDialog', prefix: null };
        if (this.pCookieService.get(userAnsweredCustomWebNotificationPermissionDialogCookieData) === 'true')
            return;
        const DELAY = 3000;
        window.setTimeout(() => {
            // ok now we ask for permission using our custom dialog.
            // This is to avoid that the user denies permission on browser level.
            this.toasts.addToast({
                title: this.localize.transform('Browser-Benachrichtigungen'),
                content: this.getCustomWebNotificationPermissionDialogText(context),
                icon: PlanoFaIconPool.PUSH_NOTIFICATION,
                theme: PThemeEnum.PRIMARY,
                visibilityDuration: 'infinite',
                visibleOnMobile: true,
                closeBtnLabel: this.localize.transform('Ja, bitte'),
                dismissBtnLabel: this.localize.transform('Nein, danke'),
                close: () => {
                    // User has accepted our own custom permission dialog.
                    // Now show browser permission dialog.
                    this.requestWebPushNotificationPermissionFromBrowser();
                    this.pCookieService.put(userAnsweredCustomWebNotificationPermissionDialogCookieData, 'true');
                    this.toasts.addToast({
                        content: this.localize.transform('Einstellung wurde gespeichert'),
                        theme: PThemeEnum.SUCCESS,
                        visibilityDuration: 'short',
                    });
                },
                dismiss: () => {
                    this.pCookieService.put(userAnsweredCustomWebNotificationPermissionDialogCookieData, 'true');
                    this.toasts.addToast({
                        // eslint-disable-next-line literal-blacklist/literal-blacklist
                        content: this.localize.transform('Falls du dich doch dafür entscheidest, kannst du die Nachrichten unter <a class="nowrap" href="client/notifications">Benachrichtigungs-Einstellungen</a> einschalten.'),
                        theme: PThemeEnum.SECONDARY,
                        visibilityDuration: 'long',
                    });
                },
            });
        }, DELAY);
    }
    /**
     * The current push-notification state of this device. Note, that this can also be "undefined" when
     * the state could not be determined yet.
     * @param schedulingApi We cannot inject this service because it is in "client" module and "core" cannot import it
     * 	because of circular dependencies. So, we pass it as parameter. Dirty hack...
     */
    get thisDeviceState() {
        // blocked in browser?
        if (permissionBlockedInBrowser || !Config.ANGULAR_FIRE_MESSAGING_ENABLED)
            return 'blocked_in_browser';
        // cant determine value yet?
        if (currentPushToken === null ||
            permissionBlockedInBrowser === null ||
            !this.api.isLoaded()) {
            return undefined;
        }
        // is current push token in backend?
        return this.currentPushTokenIsInBackend ? 'receiving' : 'not_receiving';
    }
    /**
     * Is the current push-token stored in backend?
     * Can be undefined if this can currently not be determined.
     */
    get currentPushTokenIsInBackend() {
        if (currentPushToken === null || !this.api.isLoaded())
            return undefined;
        for (const pushToken of this.api.data.notificationSettings.pushTokens.iterable()) {
            if (pushToken.token === currentPushToken) {
                return true;
            }
        }
        return false;
    }
    /* eslint-disable-next-line jsdoc/require-jsdoc */
    unregisterThisDeviceFromPushNotifications() {
        this.queuePushTokenAction(SchedulingApiPushTokenAction.REMOVE);
    }
    get pushTokenType() {
        switch (Config.platform) {
            case 'browser':
                return SchedulingApiPushTokenType.WEB;
            case 'appAndroid':
                return SchedulingApiPushTokenType.ANDROID;
            case 'appIOS':
                return SchedulingApiPushTokenType.IOS;
            default:
                throw new Error('Unsupported case');
        }
    }
    /**
     * performing an action has some requirements (currentPushToken, me.isLoaded(), api).
     * So, we queue any desired actions. When all requirements are met the action will be performed.
     */
    queuePushTokenAction(action) {
        this.queuedAction = action;
        this.performQueuedPushTokenAction();
    }
    /* eslint-disable-next-line jsdoc/require-jsdoc */
    performQueuedPushTokenAction() {
        // nothing queued?
        if (!this.queuedAction)
            return;
        // requirements available?
        if (!this.me.isLoaded() || !currentPushToken || !this.api)
            return;
        // To be more efficient, this action does not require that api is loaded.
        // If it is not loaded we just set some empty data. So, because we
        // should not need to load api all actions are done by calling "createNewItem()".
        // Internally backend will not create a new item when the push-token already exists.
        if (!this.api.isLoaded())
            this.api.setEmptyData();
        const pushToken = this.api.data.notificationSettings.pushTokens.createNewItem();
        pushToken.token = currentPushToken;
        pushToken.type = this.pushTokenType;
        pushToken.action = this.queuedAction;
        // Because we don’t know when save is executed and if all data are valid
        // only save this change
        this.api.save({
            onlySavePath: [
                this.api.consts.NOTIFICATION_SETTINGS,
                this.api.consts.NOTIFICATION_SETTINGS_PUSH_TOKENS,
            ],
        });
        // reset queue
        this.queuedAction = undefined;
    }
};
PPushNotificationsService = __decorate([
    Injectable({ providedIn: 'root' }),
    __metadata("design:paramtypes", [MeService,
        PCookieService,
        ToastsService, typeof (_a = typeof Injector !== "undefined" && Injector) === "function" ? _a : Object, LocalizePipe, typeof (_b = typeof AngularFireMessaging !== "undefined" && AngularFireMessaging) === "function" ? _b : Object])
], PPushNotificationsService);
export { PPushNotificationsService };
//# sourceMappingURL=p-push-notifications.service.js.map