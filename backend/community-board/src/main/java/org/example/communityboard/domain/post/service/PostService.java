package org.example.communityboard.domain.post.service;

import org.example.communityboard.domain.post.Post;
import org.example.communityboard.domain.post.PostRepository;
import org.example.communityboard.domain.post.dto.PostCreateRequest;
import org.example.communityboard.domain.post.dto.PostResponse;
import org.example.communityboard.domain.post.dto.PostUpdateRequest;
import org.example.communityboard.domain.user.User;
import org.example.communityboard.domain.user.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class PostService {

    private final PostRepository postRepository;
    private final UserRepository userRepository;

    public PostService(PostRepository postRepository, UserRepository userRepository) {
        this.postRepository = postRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public PostResponse create(PostCreateRequest request, String username) {
        User author = getUser(username);
        Post post = new Post(request.title(), request.content(), author);

        return PostResponse.from(postRepository.save(post));
    }

    public Page<PostResponse> getPosts(Pageable pageable) {
        return postRepository.findAllByOrderByCreatedAtDesc(pageable)
                .map(PostResponse::from);
    }

    public PostResponse getPost(Long postId) {
        return PostResponse.from(getPostEntity(postId));
    }

    @Transactional
    public PostResponse update(Long postId, PostUpdateRequest request, String username) {
        Post post = getPostEntity(postId);
        validateAuthor(post, username);
        post.update(request.title(), request.content());

        return PostResponse.from(post);
    }

    @Transactional
    public void delete(Long postId, String username) {
        Post post = getPostEntity(postId);
        validateAuthor(post, username);
        postRepository.delete(post);
    }

    private User getUser(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
    }

    private Post getPostEntity(Long postId) {
        return postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("게시글을 찾을 수 없습니다."));
    }

    private void validateAuthor(Post post, String username) {
        if (!post.isWrittenBy(username)) {
            throw new AccessDeniedException("게시글 작성자만 수정 또는 삭제할 수 있습니다.");
        }
    }
}
