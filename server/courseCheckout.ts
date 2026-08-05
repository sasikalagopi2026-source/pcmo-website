export const isPaidCourse = (price: number | string | null | undefined) => Number(price ?? 0) > 0;

export const isCourseEnrolled = (status?: string | null) => ["active", "completed"].includes(status ?? "");

export const getCourseCheckoutSuccessUrl = (clientUrl: string, courseId: string) => `${clientUrl}/courses/${courseId}?payment=success&session_id={CHECKOUT_SESSION_ID}`;

export const getCourseCheckoutCancelUrl = (clientUrl: string, courseId: string) => `${clientUrl}/courses/${courseId}?payment=cancelled`;
