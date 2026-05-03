"use client";

import { FormEvent, useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import type { Credentials, Post } from "@/types/community";
import Link from "next/link";

function WriteForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("editId");

  const [credentials, setCredentials] = useState<Credentials | null>(null);
  const [postDraft, setPostDraft] = useState({ title: "", content: "" });
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);

  const canSubmitPost = postDraft.title.trim().length > 0 && postDraft.content.trim().length > 0;

  useEffect(() => {
    if (typeof window !== "undefined") {
      const raw = window.sessionStorage.getItem("community.credentials");
      if (raw) {
        setCredentials(JSON.parse(raw));
      } else {
        router.push("/login");
      }
    }
  }, [router]);

  useEffect(() => {
    if (editId) {
      setLoading(true);
      api.getPost(Number(editId))
        .then((post) => {
          setPostDraft({ title: post.title, content: post.content });
        })
        .catch(() => {
          setError("원래 글을 불러오는데 실패했습니다.");
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [editId]);

  async function handleSubmitPost(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!credentials || !canSubmitPost) {
      setError("제목과 내용을 입력해 주세요.");
      return;
    }

    setError("");
    setNotice("");

    try {
      const payload = {
        title: postDraft.title.trim(),
        content: postDraft.content.trim(),
      };

      if (editId) {
        await api.updatePost(Number(editId), payload, credentials);
        setNotice("게시글이 수정되었습니다. 이동 중...");
      } else {
        await api.createPost(payload, credentials);
        setNotice("게시글이 작성되었습니다. 이동 중...");
      }
      
      setTimeout(() => {
        router.push("/");
      }, 500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "게시글 저장에 실패했습니다.");
    }
  }

  if (!credentials) return null;

  return (
    <div className="standalone-page">
      <div className="standalone-card" style={{ maxWidth: '800px' }}>
        <div className="section-title">
          <h2>{editId ? "글 수정" : "새 글 작성"}</h2>
        </div>

        {(error || notice) && <div className={error ? "feedback error" : "feedback notice"}>{error || notice}</div>}

        {loading ? (
          <div className="empty-state">정보를 불러오는 중입니다...</div>
        ) : (
          <form className="stack-form" onSubmit={handleSubmitPost}>
            <label>
              제목
              <input
                value={postDraft.title}
                onChange={(event) => setPostDraft({ ...postDraft, title: event.target.value })}
                maxLength={150}
                placeholder="제목을 입력하세요"
                required
              />
            </label>
            <label>
              내용
              <textarea
                value={postDraft.content}
                onChange={(event) => setPostDraft({ ...postDraft, content: event.target.value })}
                rows={15}
                placeholder="내용을 입력하세요"
                required
              />
            </label>
            <div className="action-group" style={{ justifyContent: 'flex-end', marginTop: '10px' }}>
              <Link href="/">
                <button className="secondary-button" type="button">취소</button>
              </Link>
              <button className="primary-button" type="submit" disabled={!canSubmitPost}>
                등록
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default function WritePage() {
  return (
    <Suspense fallback={<div className="standalone-page"><div className="standalone-card">로딩 중...</div></div>}>
      <WriteForm />
    </Suspense>
  );
}
