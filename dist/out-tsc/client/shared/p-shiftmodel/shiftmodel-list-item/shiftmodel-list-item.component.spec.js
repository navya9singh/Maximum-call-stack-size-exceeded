import { TestingUtils } from '@plano/shared/testing/testing-utils';
import { PShiftmodelListItemComponent } from './shiftmodel-list-item.component';
describe('#PShiftmodelListItemComponent', () => {
    let component;
    const testingUtils = new TestingUtils();
    beforeEach(() => {
        component = testingUtils.createComponent(PShiftmodelListItemComponent);
    });
    it('should have a defined component', () => {
        expect(component).toBeDefined();
    });
});
//# sourceMappingURL=shiftmodel-list-item.component.spec.js.map