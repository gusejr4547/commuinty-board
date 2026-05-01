package org.example.communityboard.domain.post.controller;

import jakarta.validation.Valid;

import org.example.communityboard.domain.post.dto.PostCreateRequest;
import org.example.communityboard.domain.post.dto.PostResponse;
import org.example.communityboard.domain.post.dto.PostUpdateRequest;
import org.example.communityboard.domain.post.service.PostService;
import org.example.communityboard.global.dto.PageResponse;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/posts")
public class PostController {

    private final PostService postService;

    public PostController(PostService postService) {
        this.postService = postService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public PostResponse create(@Valid @RequestBody PostCreateRequest request, Authentication authentication) {
        return postService.create(request, authentication.getName());
    }

    @GetMapping
    public PageResponse<PostResponse> getPosts(Pageable pageable) {
        return PageResponse.from(postService.getPosts(pageable));
    }

    @GetMapping("/{postId}")
    public PostResponse getPost(@PathVariable Long postId) {
        return postService.getPost(postId);
    }

    @PutMapping("/{postId}")
    public PostResponse update(
            @PathVariable Long postId,
            @Valid @RequestBody PostUpdateRequest request,
            Authentication authentication
    ) {
        return postService.update(postId, request, authentication.getName());
    }

    @DeleteMapping("/{postId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long postId, Authentication authentication) {
        postService.delete(postId, authentication.getName());
    }
}
