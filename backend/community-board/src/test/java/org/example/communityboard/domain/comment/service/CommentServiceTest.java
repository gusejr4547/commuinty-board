package org.example.communityboard.domain.comment.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;

import org.example.communityboard.domain.comment.Comment;
import org.example.communityboard.domain.comment.CommentRepository;
import org.example.communityboard.domain.comment.dto.CommentCreateRequest;
import org.example.communityboard.domain.comment.dto.CommentResponse;
import org.example.communityboard.domain.comment.dto.CommentUpdateRequest;
import org.example.communityboard.domain.post.Post;
import org.example.communityboard.domain.post.PostRepository;
import org.example.communityboard.domain.user.User;
import org.example.communityboard.domain.user.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

@ExtendWith(MockitoExtension.class)
class CommentServiceTest {

    @Mock
    private CommentRepository commentRepository;

    @Mock
    private PostRepository postRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private CommentService commentService;

    @Test
    void createSavesCommentForPost() {
        User author = new User("writer", "password", "writer@example.com");
        Post post = new Post("title", "content", author);
        when(postRepository.findById(1L)).thenReturn(Optional.of(post));
        when(userRepository.findByUsername("writer")).thenReturn(Optional.of(author));
        when(commentRepository.save(any(Comment.class))).thenAnswer(invocation -> invocation.getArgument(0));

        CommentResponse response = commentService.create(1L, new CommentCreateRequest("comment"), "writer");

        assertThat(response.content()).isEqualTo("comment");
        assertThat(response.authorName()).isEqualTo("writer");
    }

    @Test
    void updateRejectsNonAuthor() {
        User postAuthor = new User("writer", "password", "writer@example.com");
        User commentAuthor = new User("commenter", "password", "commenter@example.com");
        Post post = new Post("title", "content", postAuthor);
        Comment comment = new Comment("comment", post, commentAuthor);
        when(commentRepository.findById(1L)).thenReturn(Optional.of(comment));

        assertThatThrownBy(() -> commentService.update(1L, new CommentUpdateRequest("new"), "other"))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessage("댓글 작성자만 수정 또는 삭제할 수 있습니다.");
    }

    @Test
    void deleteRemovesCommentWhenAuthorMatches() {
        User author = new User("writer", "password", "writer@example.com");
        Post post = new Post("title", "content", author);
        Comment comment = new Comment("comment", post, author);
        when(commentRepository.findById(1L)).thenReturn(Optional.of(comment));

        commentService.delete(1L, "writer");

        verify(commentRepository).delete(comment);
    }
}
