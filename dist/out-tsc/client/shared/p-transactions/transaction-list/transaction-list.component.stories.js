import { action } from '@storybook/addon-actions';
import { moduleMetadata } from '@storybook/angular';
import { FakeSchedulingApiService } from '@plano/client/scheduling/shared/api/scheduling-api.service.mock';
import { TransactionListComponent } from './transaction-list.component';
import { PTransactionsModule } from '../p-transactions.module';
// eslint-disable-next-line import/no-default-export
export default {
    title: 'Client/PTransactions/p-transaction-list',
    component: TransactionListComponent,
    decorators: [
        moduleMetadata({
            imports: [
                PTransactionsModule,
            ],
        }),
    ],
    argTypes: {},
};
const TEMPLATE = (args) => ({
    template: `
		<p-transaction-list
			[isLoading]="isLoading"
			[transactions]="transactions"
			(onEditItem)="onEditItem($event)"
		></p-transaction-list>
	`,
    props: args,
});
export const loading = TEMPLATE.bind({});
loading.args = {
    isLoading: true,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onEditItem: action('onEditItem'),
    // transactions: new SchedulingApiTransactions(),
};
const fakeApi = new FakeSchedulingApiService();
const TRANSACTIONS = fakeApi.data.transactions.iterable();
export const story = TEMPLATE.bind({});
story.args = {
    isLoading: false,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onEditItem: action('onEditItem'),
    transactions: TRANSACTIONS,
};
//# sourceMappingURL=transaction-list.component.stories.js.map