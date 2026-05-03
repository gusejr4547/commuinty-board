export type User = {
  id: number;
  username: string;
  email: string;
  createdAt: string;
};

export type Post = {
  id: number;
  title: string;
  content: string;
  authorId: number;
  authorName: string;
  createdAt: string;
  updatedAt: string;
};

export type Comment = {
  id: number;
  postId: number;
  content: string;
  authorId: number;
  authorName: string;
  createdAt: string;
  updatedAt: string;
};

export type PageResponse<T> = {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
};

export type Credentials = {
  username: string;
  password: string;
};
