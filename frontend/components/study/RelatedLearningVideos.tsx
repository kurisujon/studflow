"use client";

import { useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";

import { FloatingVideoPlayer } from "@/components/study/FloatingVideoPlayer";
import { getRelatedVideos, type RelatedVideo } from "@/lib/api/related-videos";
import { useAuth } from "@clerk/nextjs";

export function RelatedLearningVideos({ documentId }: { documentId: string }) {
  const [videos, setVideos] = useState<RelatedVideo[]>([]);
  const [activeVideo, setActiveVideo] = useState<RelatedVideo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const { getToken } = useAuth();

  useEffect(() => {
    async function fetchVideos() {
      try {
        const token = await getToken();
        setVideos(await getRelatedVideos(documentId, token));
      } catch (err) {
        console.error(err);
        setError(true);
      } finally {
        setLoading(false);
      }
    }

    void fetchVideos();
  }, [documentId, getToken]);

  if (loading || error || videos.length === 0) {
    return null;
  }

  return (
    <>
      <div
        className="study-support-surface"
        style={{
          marginTop: "1.5rem",
        }}
      >
        <p className="study-meta-label" style={{ marginBottom: "0.45rem" }}>
          Further Study
        </p>
        <h3 style={{ marginBottom: "0.45rem" }}>Related learning videos</h3>
        <p style={{ fontSize: "0.95rem", color: "var(--distill-text-secondary)", marginBottom: "1rem" }}>
          Use these when you want extra context after reading the main study material.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: "1.2rem",
          }}
        >
          {videos.map((video) => (
            <article
              key={video.id}
              className="study-interactive-card"
              style={{
                display: "flex",
                flexDirection: "column",
                borderRadius: "16px",
                overflow: "hidden",
                backgroundColor: "var(--card)",
                border: "1px solid var(--border)",
                boxShadow: "0 8px 20px color-mix(in srgb, var(--foreground) 4%, transparent)",
              }}
            >
              <button
                type="button"
                aria-label={`Play ${video.title} inside Studflow`}
                onClick={() => setActiveVideo(video)}
                style={{
                  position: "relative",
                  width: "100%",
                  paddingTop: "56.25%",
                  border: 0,
                  cursor: "pointer",
                  background: "transparent",
                }}
              >
                {video.thumbnailUrl ? (
                  <img
                    src={video.thumbnailUrl}
                    alt={video.title}
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: "100%",
                      backgroundColor: "var(--muted)",
                    }}
                  />
                )}
              </button>
              <div style={{ padding: "1rem", display: "flex", flexDirection: "column", flex: 1 }}>
                <button
                  type="button"
                  onClick={() => setActiveVideo(video)}
                  style={{
                    border: 0,
                    padding: 0,
                    background: "transparent",
                    textAlign: "left",
                    cursor: "pointer",
                  }}
                >
                  <h3
                    style={{
                      fontSize: "0.95rem",
                      fontWeight: 600,
                      lineHeight: 1.3,
                      color: "var(--foreground)",
                      marginBottom: "0.25rem",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {video.title}
                  </h3>
                </button>
                <p style={{ fontSize: "0.75rem", color: "var(--muted-foreground)", marginBottom: "0.5rem" }}>
                  {video.channelTitle}
                </p>
                <p
                  style={{
                    fontSize: "0.8rem",
                    color: "var(--distill-text-secondary)",
                    lineHeight: 1.4,
                    marginBottom: "1rem",
                    flex: 1,
                    display: "-webkit-box",
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {video.relevanceReason}
                </p>
                <button
                  type="button"
                  onClick={() => setActiveVideo(video)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "100%",
                    minHeight: "38px",
                    borderRadius: "10px",
                    border: "1px solid var(--theme-primary)",
                    color: "var(--theme-primary)",
                    backgroundColor: "transparent",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Watch here
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {activeVideo ? (
          <FloatingVideoPlayer
            video={activeVideo}
            onClose={() => setActiveVideo(null)}
          />
        ) : null}
      </AnimatePresence>
    </>
  );
}
