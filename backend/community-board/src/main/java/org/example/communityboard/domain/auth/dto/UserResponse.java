package org.example.communityboard.domain.auth.dto;

import java.time.LocalDateTime;

import org.example.communityboard.domain.user.User;

public record UserResponse(
        Long id,
        String username,
        String email,
        LocalDateTime createdAt
) {
    public static UserResponse from(User user) {
        return new UserResponse(user.getId(), user.getUsername(), user.getEmail(), user.getCreatedAt());
    }
}
