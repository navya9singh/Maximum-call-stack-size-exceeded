import { storiesOf, moduleMetadata } from '@storybook/angular';
import { StorybookModule } from '@plano/storybook/storybook.module';
import { STORYBOOK_OUTPUT_FN, STORYBOOK_STRINGIFY_FN } from '@plano/storybook/storybook.utils';
import { PFormsModule } from '../p-forms.module';
var Gender;
(function (Gender) {
    Gender[Gender["MALE"] = 0] = "MALE";
    Gender[Gender["FEMALE"] = 1] = "FEMALE";
    Gender[Gender["DIVERS"] = 2] = "DIVERS";
})(Gender || (Gender = {}));
const getPRadios = (readMode) => {
    return `
		<p-radios
			[inline]="inline"
			[hideRadioCircles]="hideRadioCircles"
			[readMode]="${readMode}"
			[(ngModel)]="ngModel"
		>
			<p-radios-radio
				[value]="${Gender.MALE}"
				icon="mars"
				label="Männlich"
				[disabled]="true"
				[cannotEditHint]="'Du hast kein recht das hier auszuwählen. Admin ist schuld.'"
			></p-radios-radio>
			<p-radios-radio
				[value]="${Gender.FEMALE}"
				icon="venus"
				label="Weiblich"
			></p-radios-radio>
			<p-radios-radio
				[value]="${Gender.DIVERS}"
				icon="genderless"
				label="Divers"
			></p-radios-radio>
		</p-radios>
	`;
};
const getTempalte = () => {
    return `
		${getPRadios(false)}
		<br>
		${getPRadios(true)}
		<hr>
		${STORYBOOK_OUTPUT_FN('ngModel')}
	`;
};
const myStory = storiesOf('Client/PForms/p-radios', module);
myStory
    .addDecorator(moduleMetadata({
    imports: [
        StorybookModule,
        PFormsModule,
    ],
}))
    .add('default', () => ({
    template: getTempalte(),
    props: {
        stringify: STORYBOOK_STRINGIFY_FN,
        inline: false,
        hideRadioCircles: false,
        ngModel: true,
    },
}))
    .add('with a predefined value', () => ({
    template: getTempalte(),
    props: {
        stringify: STORYBOOK_STRINGIFY_FN,
        inline: false,
        hideRadioCircles: false,
        ngModel: Gender.DIVERS,
    },
}))
    .add('inline', () => ({
    template: getTempalte(),
    props: {
        stringify: STORYBOOK_STRINGIFY_FN,
        inline: true,
        hideRadioCircles: false,
        ngModel: Gender.DIVERS,
    },
}));
//# sourceMappingURL=p-radios.component.stories.js.map