import { TestingUtils } from '@plano/shared/testing/testing-utils';
import { BookingRelatedCourseComponent } from './booking-related-course.component';
import { PBookingsModule } from '../../p-bookings.module';
describe('BookingRelatedCourseComponent', () => {
    let component;
    const testingUtils = new TestingUtils();
    testingUtils.init({ imports: [PBookingsModule] });
    beforeAll(() => {
        component = testingUtils.createComponent(BookingRelatedCourseComponent);
    });
    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
//# sourceMappingURL=booking-related-course.component.spec.js.map