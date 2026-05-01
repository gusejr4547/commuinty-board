package org.example.communityboard.domain.post.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;

import org.example.communityboard.domain.post.Post;
import org.example.communityboard.domain.post.PostRepository;
import org.example.communityboard.domain.post.dto.PostCreateRequest;
import org.example.communityboard.domain.post.dto.PostResponse;
import org.example.communityboard.domain.post.dto.PostUpdateRequest;
import org.example.communityboard.domain.user.User;
import org.example.communityboard.domain.user.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

@ExtendWith(MockitoExtension.class)
class PostServiceTest {

    @Mock
    private PostRepository postRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private PostService postService;

    @Test
    void createSavesPostWithCurrentUser() {
        User author = new User("writer", "password", "writer@example.com");
        PostCreateRequest request = new PostCreateRequest("title", "content");
        when(userRepository.findByUsername("writer")).thenReturn(Optional.of(author));
        when(postRepository.save(any(Post.class))).thenAnswer(invocation -> invocation.getArgument(0));

        PostResponse response = postService.create(request, "writer");

        assertThat(response.title()).isEqualTo("title");
        assertThat(response.authorName()).isEqualTo("writer");
    }

    @Test
    void updateRejectsNonAuthor() {
        User author = new User("writer", "password", "writer@example.com");
        Post post = new Post("title", "content", author);
        when(postRepository.findById(1L)).thenReturn(Optional.of(post));

        assertThatThrownBy(() -> postService.update(1L, new PostUpdateRequest("new", "new content"), "other"))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessage("게시글 작성자만 수정 또는 삭제할 수 있습니다.");
    }

    @Test
    void deleteRemovesPostWhenAuthorMatches() {
        User author = new User("writer", "password", "writer@example.com");
        Post post = new Post("title", "content", author);
        when(postRepository.findById(1L)).thenReturn(Optional.of(post));

        postService.delete(1L, "writer");

        verify(postRepository).delete(post);
    }
}
