var _a;
import { __decorate, __metadata } from "tslib";
/* eslint-disable no-console */
import { Component, ChangeDetectionStrategy } from '@angular/core';
import { Injector } from '@angular/core';
import { SentryTicketId } from '@plano/global-error-handler/sentry-ticket-id.enum';
import { PSentryService } from '../../../sentry/sentry.service';
import { MeService } from '../../me/me.service';
import { assumeDefinedToGetStrictNullChecksRunning } from '../../null-type-utils';
let ErrorModalContentComponent = class ErrorModalContentComponent {
    /**
     * TODO: Currently there is sometimes a problem with modal not hiding the page navigation so
     * you can navigate somewhere else after error modal opened. This will report us a wrong href where
     * error happened. To do a hotfix we save the href on modal open.
     */
    constructor(injector, pSentryService) {
        this.injector = injector;
        this.pSentryService = pSentryService;
        this.userMessage = '';
        this.USER_MESSAGE_LENGTH_LIMIT = 180;
    }
    /* eslint-disable-next-line jsdoc/require-jsdoc */
    initModal(error) {
        this.errorObj = error;
        if (this.errorObj.name === 'Error' && this.errorObj.message)
            this.errorObj.name = `${this.errorObj.name}: ${this.errorObj.message}`;
        if (this.errorObj.name.includes(SentryTicketId.PLANO_FE_CY))
            this.customErrorModalDescription = `
			Du hast einen Fehler ausgelöst, der uns so richtig Kopfzerbrechen bereitet!
			Jetzt ist jede Information für uns Gold wert.
			Kann es sein, dass du im selben Browser vorher mit einem anderen Account eingeloggt warst?
			War sonst etwas besonders?
		`;
        const me = this.injector.get(MeService);
        console.log(this.errorObj);
        this.pSentryService.captureException(this.errorObj, me);
    }
    /* eslint-disable-next-line jsdoc/require-jsdoc */
    refreshBrowserTab() {
        window.location.reload();
    }
    /* eslint-disable-next-line jsdoc/require-jsdoc */
    onClose() {
        const me = this.injector.get(MeService);
        assumeDefinedToGetStrictNullChecksRunning(this.errorObj, 'this.errorObj');
        this.pSentryService.captureException(this.errorObj, me, this.userMessage);
        this.pSentryService.flush(2500).then(() => {
            this.refreshBrowserTab();
        });
    }
    /** Get some color if user comes close or is at length limit */
    lengthLimitState(length) {
        if (!length)
            return null;
        if (length >= this.USER_MESSAGE_LENGTH_LIMIT)
            return 'danger';
        if (length >= (this.USER_MESSAGE_LENGTH_LIMIT / 100 * 70))
            return 'warning';
        return null;
    }
};
ErrorModalContentComponent = __decorate([
    Component({
        selector: 'p-error-modal-content',
        templateUrl: './error-modal-content.component.html',
        styleUrls: ['./error-modal-content.component.scss'],
        changeDetection: ChangeDetectionStrategy.Default,
    }),
    __metadata("design:paramtypes", [typeof (_a = typeof Injector !== "undefined" && Injector) === "function" ? _a : Object, PSentryService])
], ErrorModalContentComponent);
export { ErrorModalContentComponent };
//# sourceMappingURL=error-modal-content.component.js.map