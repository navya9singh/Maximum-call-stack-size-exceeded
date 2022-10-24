var _a;
import { __decorate, __metadata } from "tslib";
import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { AccountApiService, SchedulingApiService, SchedulingApiAccountHolderState, AccountApiType } from '@plano/shared/api';
import { PSupportedCurrencyCodes } from '@plano/shared/api/base/generated-types.ag';
import { PlanoFaIconPool } from '@plano/shared/core/plano-fa-icon-pool.enum';
import { PThemeEnum } from '../../bootstrap-styles.enum';
import { PFormGroup } from '../../p-forms/p-form-control';
let PaymentComponent = class PaymentComponent {
    constructor(api, schedulingAPI) {
        this.api = api;
        this.schedulingAPI = schedulingAPI;
        this.turnIntoRealAccountForm = false;
        this.AccountApiType = AccountApiType;
        this.SchedulingApiAccountHolderState = SchedulingApiAccountHolderState;
        this.PThemeEnum = PThemeEnum;
        this.PlanoFaIconPool = PlanoFaIconPool;
        this.PSupportedCurrencyCodes = PSupportedCurrencyCodes;
    }
    ngAfterContentInit() {
        // load scheduling api for access to adyenAccountHolderState
        this.schedulingAPI.load({
            success: () => {
            },
        });
        this.api.isLoaded(() => {
            this.adyenRelevantDataInitial = {
                bankAccountBic: this.api.data.billing.bankAccountBic,
                bankAccountIban: this.api.data.billing.bankAccountIban,
                bankAccountOwner: this.api.data.billing.bankAccountOwner,
            };
        });
    }
    /**
     * Has the Adyen-relevant data been changed during the lifecycle of this component?
     */
    get adyenRelevantDataHasChanged() {
        if (this.adyenRelevantDataInitial.bankAccountBic !== this.api.data.billing.bankAccountBic)
            return true;
        if (this.adyenRelevantDataInitial.bankAccountIban !== this.api.data.billing.bankAccountIban)
            return true;
        if (this.adyenRelevantDataInitial.bankAccountOwner !== this.api.data.billing.bankAccountOwner)
            return true;
        return false;
    }
};
__decorate([
    Input('group'),
    __metadata("design:type", PFormGroup)
], PaymentComponent.prototype, "formGroup", void 0);
__decorate([
    Input(),
    __metadata("design:type", Boolean)
], PaymentComponent.prototype, "turnIntoRealAccountForm", void 0);
PaymentComponent = __decorate([
    Component({
        selector: 'p-payment[group]',
        templateUrl: './payment.component.html',
        styleUrls: ['./payment.component.scss'],
        changeDetection: ChangeDetectionStrategy.Default,
    }),
    __metadata("design:paramtypes", [AccountApiService, typeof (_a = typeof SchedulingApiService !== "undefined" && SchedulingApiService) === "function" ? _a : Object])
], PaymentComponent);
export { PaymentComponent };
//# sourceMappingURL=payment.component.js.map