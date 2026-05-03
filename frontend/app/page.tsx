"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import type { Comment, Credentials, PageResponse, Post, User } from "@/types/community";
import Link from "next/link";

const emptyPage: PageResponse<Post> = {
  content: [],
  page: 0,
  size: 20,
  totalElements: 0,
  totalPages: 0,
  first: true,
  last: true,
};

const boardTabs = ["전체", "공지", "정보", "질문", "잡담", "후기"];

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function getStoredCredentials(): Credentials | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.sessionStorage.getItem("community.credentials");
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as Credentials;
  } catch {
    window.sessionStorage.removeItem("community.credentials");
    return null;
  }
}

export default function Home() {
  const [posts, setPosts] = useState<PageResponse<Post>>(emptyPage);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [credentials, setCredentials] = useState<Credentials | null>(null);

  const [commentDraft, setCommentDraft] = useState("");
  const [editingComment, setEditingComment] = useState<Comment | null>(null);
  const [searchType, setSearchType] = useState<"title" | "author">("title");
  const [searchTerm, setSearchTerm] = useState("");


  const selectedPostComments = useMemo(
    () => comments.filter((comment) => comment.postId === selectedPost?.id),
    [comments, selectedPost],
  );
  const filteredPosts = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) {
      return posts.content;
    }

    return posts.content.filter((post) => {
      const target = searchType === "title" ? post.title : post.authorName;
      return target.toLowerCase().includes(keyword);
    });
  }, [posts.content, searchTerm, searchType]);

  async function loadPost(postId: number) {
    setDetailLoading(true);
    setError("");

    try {
      const [post, nextComments] = await Promise.all([api.getPost(postId), api.getComments(postId)]);
      setSelectedPost(post);
      setComments(nextComments);
    } catch (err) {
      setError(err instanceof Error ? err.message : "상세 정보를 불러오지 못했습니다.");
    } finally {
      setDetailLoading(false);
    }
  }

  async function loadPosts(nextPage = page) {
    setLoading(true);
    setError("");

    try {
      const response = await api.getPosts(nextPage, 20);
      setPosts(response);
      setPage(response.page);

      if (response.content.length > 0) {
        const currentExists = response.content.some((post) => post.id === selectedPost?.id);
        if (!selectedPost || !currentExists) {
          await loadPost(response.content[0].id);
        }
      } else {
        setSelectedPost(null);
        setComments([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "게시글을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const stored = getStoredCredentials();
    if (stored) {
      setCredentials(stored);
      api.login(stored)
        .then((u) => setUser(u))
        .catch(() => {
          window.sessionStorage.removeItem("community.credentials");
          setCredentials(null);
        });
    }

    void loadPosts(0);
    // 최초 진입 시에만 목록을 불러온다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleLogout() {
    setUser(null);
    setCredentials(null);
    window.sessionStorage.removeItem("community.credentials");
    setNotice("로그아웃되었습니다.");
  }

  async function handleDeletePost(postId: number) {
    if (!credentials) {
      setError("로그인이 필요합니다.");
      return;
    }

    setError("");
    setNotice("");

    try {
      await api.deletePost(postId, credentials);
      setNotice("게시글이 삭제되었습니다.");
      setSelectedPost(null);
      setComments([]);
      await loadPosts(page);
    } catch (err) {
      setError(err instanceof Error ? err.message : "게시글 삭제에 실패했습니다.");
    }
  }



  async function handleSubmitComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedPost || !credentials || commentDraft.trim().length === 0) {
      setError("로그인 후 댓글 내용을 입력해 주세요.");
      return;
    }

    setError("");
    setNotice("");

    try {
      if (editingComment) {
        await api.updateComment(editingComment.id, { content: commentDraft.trim() }, credentials);
      } else {
        await api.createComment(selectedPost.id, { content: commentDraft.trim() }, credentials);
      }

      setCommentDraft("");
      setEditingComment(null);
      setNotice(editingComment ? "댓글이 수정되었습니다." : "댓글이 작성되었습니다.");
      await loadPost(selectedPost.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "댓글 저장에 실패했습니다.");
    }
  }

  async function handleDeleteComment(commentId: number) {
    if (!selectedPost || !credentials) {
      setError("로그인이 필요합니다.");
      return;
    }

    setError("");
    setNotice("");

    try {
      await api.deleteComment(commentId, credentials);
      setNotice("댓글이 삭제되었습니다.");
      await loadPost(selectedPost.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "댓글 삭제에 실패했습니다.");
    }
  }

  function startCommentEdit(comment: Comment) {
    setEditingComment(comment);
    setCommentDraft(comment.content);
  }

  return (
    <main className="app-shell">
      <header className="site-topbar">
        <a className="site-logo" href="#" aria-label="Community Board">
          <span>CB</span>
          <strong>Community Board</strong>
        </a>
        <nav className="global-nav" aria-label="주요 메뉴">
          {user ? (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', fontWeight: 600 }}>{user.username}님</span>
              <button type="button" onClick={handleLogout} style={{ fontSize: '13px' }}>
                로그아웃
              </button>
            </div>
          ) : (
            <Link href="/login">
              <button type="button" style={{ fontSize: '13px', fontWeight: 600 }}>
                로그인
              </button>
            </Link>
          )}
        </nav>
      </header>

      <section className="channel-head">
        <div className="channel-banner">
          <div>
            <p>커뮤니티 채널</p>
            <h1>자유 게시판</h1>
          </div>
          <dl>
            <div>
              <dt>글</dt>
              <dd>{posts.totalElements}</dd>
            </div>
            <div>
              <dt>댓글</dt>
              <dd>{selectedPostComments.length}</dd>
            </div>
          </dl>
        </div>
        <div className="channel-menu">
          {boardTabs.map((tab, index) => (
            <button className={index === 0 ? "active" : ""} key={tab} type="button">
              {tab}
            </button>
          ))}
        </div>
      </section>

      <div className="notice-strip">
        <strong>공지</strong>
        <span>게시글과 댓글 수정/삭제 권한은 백엔드에서 작성자 기준으로 다시 검증됩니다.</span>
      </div>

      {(error || notice) && <div className={error ? "feedback error" : "feedback notice"}>{error || notice}</div>}

      <div className="content-grid">
        <section className="board-column">
          <div className="board-actions" style={{ justifyContent: 'flex-end' }}>
            <Link href="/write">
              <button className="write-link" type="button">
                글쓰기
              </button>
            </Link>
          </div>

          {selectedPost && !detailLoading && (
            <article className="detail-panel">
              <div className="detail-head">
                <h2>{selectedPost.title}</h2>
                <div className="detail-meta">
                  <div className="detail-info">
                    <span className="author">{selectedPost.authorName}</span>
                    <time>{formatDate(selectedPost.createdAt)}</time>
                    <span>조회 0</span>
                    <span>추천 0</span>
                  </div>
                  <div className="action-group">
                    <Link href={`/write?editId=${selectedPost.id}`}>
                      <button type="button">
                        수정
                      </button>
                    </Link>
                    <button type="button" onClick={() => void handleDeletePost(selectedPost.id)}>
                      삭제
                    </button>
                  </div>
                </div>
              </div>
              <div className="post-content">{selectedPost.content}</div>

              <section className="comments">
                <div className="section-title">
                  <h2>댓글 {selectedPostComments.length}</h2>
                  {editingComment && (
                    <button
                      className="text-button"
                      type="button"
                      onClick={() => {
                        setEditingComment(null);
                        setCommentDraft("");
                      }}
                    >
                      수정 취소
                    </button>
                  )}
                </div>

                <form className="comment-form" onSubmit={handleSubmitComment}>
                  <textarea
                    value={commentDraft}
                    onChange={(event) => setCommentDraft(event.target.value)}
                    placeholder={credentials ? "댓글을 입력하세요" : "로그인 후 댓글을 작성할 수 있습니다."}
                  />
                  <button className="secondary-button" type="submit" disabled={!credentials || commentDraft.trim().length === 0}>
                    {editingComment ? "수정" : "등록"}
                  </button>
                </form>

                <div className="comment-list">
                  {selectedPostComments.length === 0 ? (
                    <div className="empty-state compact">첫 댓글을 작성해 보세요.</div>
                  ) : (
                    selectedPostComments.map((comment) => (
                      <div className="comment-item" key={comment.id}>
                        <div className="comment-meta">
                          <strong>{comment.authorName}</strong>
                          <time>{formatDate(comment.createdAt)}</time>
                        </div>
                        <p>{comment.content}</p>
                        <div className="action-group small">
                          <button type="button" onClick={() => startCommentEdit(comment)}>
                            수정
                          </button>
                          <button type="button" onClick={() => void handleDeleteComment(comment.id)}>
                            삭제
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>
            </article>
          )}
          
          {detailLoading && <div className="empty-state detail-panel">상세 정보를 불러오는 중입니다.</div>}

          <div className="post-list" aria-live="polite">
            <div className="list-head">
              <span>번호</span>
              <span>분류</span>
              <span>제목</span>
              <span>글쓴이</span>
              <span>등록일</span>
              <span>조회</span>
              <span>추천</span>
            </div>

            {loading ? (
              <div className="empty-state">게시글을 불러오는 중입니다.</div>
            ) : filteredPosts.length === 0 ? (
              <div className="empty-state">{posts.content.length === 0 ? "등록된 게시글이 없습니다." : "검색 결과가 없습니다."}</div>
            ) : (
              filteredPosts.map((post) => (
                <button
                  className={`post-row ${selectedPost?.id === post.id ? "selected" : ""}`}
                  key={post.id}
                  type="button"
                  onClick={() => {
                    window.scrollTo({ top: 0, behavior: "smooth" });
                    void loadPost(post.id);
                  }}
                >
                  <span className="id">{post.id}</span>
                  <span className="category">일반</span>
                  <strong className="title">
                    {post.title}
                    <small>[{comments.filter((comment) => comment.postId === post.id).length || "0"}]</small>
                  </strong>
                  <span className="author">{post.authorName}</span>
                  <time>{formatDate(post.createdAt)}</time>
                  <span className="views">0</span>
                  <span className="recs">0</span>
                </button>
              ))
            )}
          </div>

          <div className="pagination">
            <button type="button" disabled={posts.first} onClick={() => void loadPosts(page - 1)}>
              이전
            </button>
            <span>
              {posts.totalPages === 0 ? 0 : posts.page + 1} / {posts.totalPages}
            </span>
            <button type="button" disabled={posts.last} onClick={() => void loadPosts(page + 1)}>
              다음
            </button>
          </div>

          <div className="board-actions" style={{ justifyContent: 'center', marginTop: '16px' }}>
            <div className="search-box">
              <select
                aria-label="검색 조건"
                value={searchType}
                onChange={(event) => setSearchType(event.target.value as "title" | "author")}
              >
                <option value="title">제목</option>
                <option value="author">작성자</option>
              </select>
              <input
                aria-label="검색어"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="검색어를 입력하세요"
              />
              <button type="button">검색</button>
            </div>
          </div>
        </section>

        <aside className="side-column">
          <section className="panel-section login-panel">
            <div className="section-title">
              <h2>내 정보</h2>
            </div>

            {user ? (
              <div className="profile-box">
                <strong>{user.username}</strong>
                <span>{user.email}</span>
                <button className="secondary-button" type="button" onClick={handleLogout}>
                  로그아웃
                </button>
              </div>
            ) : (
              <div className="profile-box" style={{ padding: '20px 0' }}>
                <span style={{ marginBottom: '12px' }}>로그인 후 이용하실 수 있습니다.</span>
                <Link href="/login" style={{ width: '100%' }}>
                  <button className="primary-button" type="button" style={{ width: '100%' }}>
                    로그인
                  </button>
                </Link>
              </div>
            )}
          </section>

          <section className="panel-section channel-card">
            <h2>채널 정보</h2>
            <p>Spring Boot API와 연결된 글, 댓글 테스트용 게시판입니다.</p>
            <ul>
              <li>회원 인증 필요</li>
              <li>작성자 수정/삭제</li>
              <li>최근 글 자동 선택</li>
            </ul>
          </section>
        </aside>
      </div>
    </main>
  );
}
