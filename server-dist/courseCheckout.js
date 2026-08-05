export const isPaidCourse = (price) => Number(price ?? 0) > 0;
export const isCourseEnrolled = (status) => ["active", "completed"].includes(status ?? "");
export const getCourseCheckoutSuccessUrl = (clientUrl, courseId) => `${clientUrl}/courses/${courseId}?payment=success&session_id={CHECKOUT_SESSION_ID}`;
export const getCourseCheckoutCancelUrl = (clientUrl, courseId) => `${clientUrl}/courses/${courseId}?payment=cancelled`;
//# sourceMappingURL=courseCheckout.js.map