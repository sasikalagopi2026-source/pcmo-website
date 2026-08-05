import { describe, expect, it } from "vitest";
import { getCourseCheckoutCancelUrl, getCourseCheckoutSuccessUrl, isCourseEnrolled, isPaidCourse } from "./courseCheckout.js";
describe("course checkout helpers", () => {
    it("builds checkout success and cancel URLs for a course", () => {
        expect(getCourseCheckoutSuccessUrl("https://app.example.com", "course-123")).toBe("https://app.example.com/courses/course-123?payment=success&session_id={CHECKOUT_SESSION_ID}");
        expect(getCourseCheckoutCancelUrl("https://app.example.com", "course-123")).toBe("https://app.example.com/courses/course-123?payment=cancelled");
    });
    it("identifies paid and enrolled courses", () => {
        expect(isPaidCourse(79)).toBe(true);
        expect(isPaidCourse(0)).toBe(false);
        expect(isCourseEnrolled("active")).toBe(true);
        expect(isCourseEnrolled("completed")).toBe(true);
        expect(isCourseEnrolled("cancelled")).toBe(false);
    });
});
//# sourceMappingURL=courseCheckout.test.js.map