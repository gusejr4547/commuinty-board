package org.example.communityboard.global.exception;

import java.time.LocalDateTime;
import java.util.List;

public record ErrorResponse(
        LocalDateTime timestamp,
        int status,
        String message,
        List<String> details
) {
    public static ErrorResponse of(int status, String message) {
        return new ErrorResponse(LocalDateTime.now(), status, message, List.of());
    }

    public static ErrorResponse of(int status, String message, List<String> details) {
        return new ErrorResponse(LocalDateTime.now(), status, message, details);
    }
}
