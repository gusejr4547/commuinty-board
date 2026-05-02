package org.example.communityboard.domain.post.controller;

import jakarta.validation.Valid;

import org.example.communityboard.domain.post.dto.PostCreateRequest;
import org.example.communityboard.domain.post.dto.PostResponse;
import org.example.communityboard.domain.post.dto.PostUpdateRequest;
import org.example.communityboard.domain.post.service.PostService;
import org.example.communityboard.global.dto.PageResponse;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/posts")
public class PostController {

    private final PostService postService;

    public PostController(PostService postService) {
        this.postService = postService;
    }

    @PostMapping
    public ResponseEntity<PostResponse> create(@Valid @RequestBody PostCreateRequest request, Authentication authentication) {
        return ResponseEntity.status(HttpStatus.CREATED).body(postService.create(request, authentication.getName()));
    }

    @GetMapping
    public ResponseEntity<PageResponse<PostResponse>> getPosts(Pageable pageable) {
        return ResponseEntity.ok(PageResponse.from(postService.getPosts(pageable)));
    }

    @GetMapping("/{postId}")
    public ResponseEntity<PostResponse> getPost(@PathVariable Long postId) {
        return ResponseEntity.ok(postService.getPost(postId));
    }

    @PutMapping("/{postId}")
    public ResponseEntity<PostResponse> update(
            @PathVariable Long postId,
            @Valid @RequestBody PostUpdateRequest request,
            Authentication authentication
    ) {
        return ResponseEntity.ok(postService.update(postId, request, authentication.getName()));
    }

    @DeleteMapping("/{postId}")
    public ResponseEntity<Void> delete(@PathVariable Long postId, Authentication authentication) {
        postService.delete(postId, authentication.getName());
        return ResponseEntity.noContent().build();
    }
}
