import { __decorate } from "tslib";
import { NgModule } from '@angular/core';
import { CoreModule } from '@plano/shared/core/core.module';
import { CalendarNavComponent } from './calendar-nav/calendar-nav.component';
import { CalendarViewSettingsComponent } from './calendar-nav/calendar-view-settings/calendar-view-settings.component';
import { PCalendarTitlePipe } from './p-calendar-title.pipe';
import { PFormsModule } from '../p-forms/p-forms.module';
let PCalendarModule = class PCalendarModule {
};
PCalendarModule = __decorate([
    NgModule({
        imports: [
            CoreModule,
            PFormsModule,
        ],
        declarations: [
            CalendarNavComponent,
            CalendarViewSettingsComponent,
            PCalendarTitlePipe,
        ],
        providers: [],
        exports: [
            CalendarNavComponent,
            CalendarViewSettingsComponent,
            PCalendarTitlePipe,
        ],
    })
], PCalendarModule);
export { PCalendarModule };
//# sourceMappingURL=p-calendar.module.js.map