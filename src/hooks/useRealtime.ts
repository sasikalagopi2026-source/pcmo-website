import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { io } from "socket.io-client";
import { getToken } from "@/lib/api";

export const useRealtime = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL || (
      window.location.port === "8080" ? `${window.location.protocol}//${window.location.hostname}:3001` : window.location.origin
    );
    const socket = io(apiUrl, {
      auth: { token: getToken() },
      transports: ["websocket", "polling"],
    });
    const refresh = () => void queryClient.invalidateQueries();
    [
      "courses:changed",
      "certifications:changed",
      "events:changed",
      "subscriptions:changed",
      "invoices:changed",
      "notifications:changed",
      "library:changed",
      "book-purchases:changed",
      "volunteer-opportunities:changed",
      "admin-modules:changed",
      "admin-records:changed",
      "enrollment:changed",
      "course-progress:changed",
      "course-materials:changed",
      "quiz-questions:changed",
      "event-registration:changed",
      "profile:updated",
      "membership:changed",
      "website-activity:changed",
      "contact-messages:changed",
    ].forEach((event) => socket.on(event, refresh));
    return () => socket.disconnect();
  }, [queryClient]);
};
