package org.example.communityboard.domain.comment.dto;

import java.time.LocalDateTime;

import org.example.communityboard.domain.comment.Comment;

public record CommentResponse(
        Long id,
        Long postId,
        String content,
        Long authorId,
        String authorName,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public static CommentResponse from(Comment comment) {
        return new CommentResponse(
                comment.getId(),
                comment.getPost().getId(),
                comment.getContent(),
                comment.getAuthor().getId(),
                comment.getAuthor().getUsername(),
                comment.getCreatedAt(),
                comment.getUpdatedAt()
        );
    }
}
