import type { Comment, Credentials, PageResponse, Post, User } from "@/types/community";

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  credentials?: Credentials | null;
};

const jsonHeaders: HeadersInit = {
  "Content-Type": "application/json",
};

function authHeader(credentials?: Credentials | null): HeadersInit {
  if (!credentials?.username || !credentials.password) {
    return {};
  }

  return {
    Authorization: `Basic ${btoa(`${credentials.username}:${credentials.password}`)}`,
  };
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const response = await fetch(path, {
    method: options.method ?? "GET",
    headers: {
      ...(options.body ? jsonHeaders : {}),
      ...authHeader(options.credentials),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
    cache: "no-store",
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `요청에 실패했습니다. (${response.status})`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export const api = {
  signup(payload: { username: string; password: string; email: string }) {
    return request<User>("/api/auth/signup", {
      method: "POST",
      body: payload,
    });
  },
  login(payload: Credentials) {
    return request<User>("/api/auth/login", {
      method: "POST",
      body: payload,
    });
  },
  getPosts(page = 0, size = 20) {
    return request<PageResponse<Post>>(`/api/posts?page=${page}&size=${size}`);
  },
  getPost(postId: number) {
    return request<Post>(`/api/posts/${postId}`);
  },
  createPost(payload: { title: string; content: string }, credentials: Credentials) {
    return request<Post>("/api/posts", {
      method: "POST",
      body: payload,
      credentials,
    });
  },
  updatePost(postId: number, payload: { title: string; content: string }, credentials: Credentials) {
    return request<Post>(`/api/posts/${postId}`, {
      method: "PUT",
      body: payload,
      credentials,
    });
  },
  deletePost(postId: number, credentials: Credentials) {
    return request<void>(`/api/posts/${postId}`, {
      method: "DELETE",
      credentials,
    });
  },
  getComments(postId: number) {
    return request<Comment[]>(`/api/posts/${postId}/comments`);
  },
  createComment(postId: number, payload: { content: string }, credentials: Credentials) {
    return request<Comment>(`/api/posts/${postId}/comments`, {
      method: "POST",
      body: payload,
      credentials,
    });
  },
  updateComment(commentId: number, payload: { content: string }, credentials: Credentials) {
    return request<Comment>(`/api/comments/${commentId}`, {
      method: "PUT",
      body: payload,
      credentials,
    });
  },
  deleteComment(commentId: number, credentials: Credentials) {
    return request<void>(`/api/comments/${commentId}`, {
      method: "DELETE",
      credentials,
    });
  },
};
