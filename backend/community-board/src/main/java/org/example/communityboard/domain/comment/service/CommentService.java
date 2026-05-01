package org.example.communityboard.domain.comment.service;

import java.util.List;

import org.example.communityboard.domain.comment.Comment;
import org.example.communityboard.domain.comment.CommentRepository;
import org.example.communityboard.domain.comment.dto.CommentCreateRequest;
import org.example.communityboard.domain.comment.dto.CommentResponse;
import org.example.communityboard.domain.comment.dto.CommentUpdateRequest;
import org.example.communityboard.domain.post.Post;
import org.example.communityboard.domain.post.PostRepository;
import org.example.communityboard.domain.user.User;
import org.example.communityboard.domain.user.UserRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class CommentService {

    private final CommentRepository commentRepository;
    private final PostRepository postRepository;
    private final UserRepository userRepository;

    public CommentService(CommentRepository commentRepository, PostRepository postRepository, UserRepository userRepository) {
        this.commentRepository = commentRepository;
        this.postRepository = postRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public CommentResponse create(Long postId, CommentCreateRequest request, String username) {
        Post post = getPost(postId);
        User author = getUser(username);
        Comment comment = new Comment(request.content(), post, author);

        return CommentResponse.from(commentRepository.save(comment));
    }

    public List<CommentResponse> getComments(Long postId) {
        if (!postRepository.existsById(postId)) {
            throw new IllegalArgumentException("게시글을 찾을 수 없습니다.");
        }

        return commentRepository.findAllByPostIdOrderByCreatedAtAsc(postId).stream()
                .map(CommentResponse::from)
                .toList();
    }

    @Transactional
    public CommentResponse update(Long commentId, CommentUpdateRequest request, String username) {
        Comment comment = getComment(commentId);
        validateAuthor(comment, username);
        comment.update(request.content());

        return CommentResponse.from(comment);
    }

    @Transactional
    public void delete(Long commentId, String username) {
        Comment comment = getComment(commentId);
        validateAuthor(comment, username);
        commentRepository.delete(comment);
    }

    private Post getPost(Long postId) {
        return postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("게시글을 찾을 수 없습니다."));
    }

    private User getUser(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
    }

    private Comment getComment(Long commentId) {
        return commentRepository.findById(commentId)
                .orElseThrow(() -> new IllegalArgumentException("댓글을 찾을 수 없습니다."));
    }

    private void validateAuthor(Comment comment, String username) {
        if (!comment.isWrittenBy(username)) {
            throw new AccessDeniedException("댓글 작성자만 수정 또는 삭제할 수 있습니다.");
        }
    }
}
