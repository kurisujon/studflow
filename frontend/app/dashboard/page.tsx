import Link from "next/link";

import { fetchDocuments, fetchUserStats, fetchUserQueue } from "@/lib/server-api";

export default async function DashboardPage() {
  const [documents, stats, queue] = await Promise.all([
    fetchDocuments(),
    fetchUserStats(),
    fetchUserQueue()
  ]);

  return (
    <section
      style={{
        minHeight: "calc(100dvh - var(--nav-height))",
        padding: "2rem 1.5rem 3rem",
        background:
          "radial-gradient(circle at top left, var(--theme-shadow), transparent 24%), linear-gradient(180deg, var(--background), color-mix(in srgb, var(--background) 82%, var(--theme-soft)))",
      }}
    >
      <div className="container">
        <div style={{ marginBottom: "2rem" }}>
          <h1 style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>Study Dashboard and Review Workflow</h1>
        </div>

        {/* Top Row: Continue Studying Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1.5rem", marginBottom: "1.5rem" }}>
          {documents.filter(doc => doc.status !== "COMPLETED").slice(0, 3).map((doc) => {
            const progress = doc.quiz_ready ? 85 : 40; // Mock progress for visual consistency
            return (
              <div key={doc.id} style={{ 
                padding: "1.25rem", 
                borderRadius: "20px", 
                backgroundColor: "var(--card)", 
                border: "1px solid var(--theme-border)",
                boxShadow: "0 10px 30px color-mix(in srgb, var(--theme-shadow) 40%, transparent)",
                display: "flex", flexDirection: "column", gap: "1rem"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontWeight: 600, fontSize: "1.05rem" }}>Continue Studying</span>
                  <span style={{ color: "var(--distill-text-secondary)", cursor: "pointer" }}>•••</span>
                </div>
                
                {/* Image Placeholder / Banner */}
                <div style={{ height: "60px", borderRadius: "12px", background: "linear-gradient(90deg, #1e1b4b, #312e81)", overflow: "hidden", position: "relative" }}>
                   <div style={{ position: "absolute", inset: 0, opacity: 0.3, backgroundImage: "url('/feature-dashboard.jpg')", backgroundSize: "cover", backgroundPosition: "center" }} />
                </div>
                
                {/* Progress Bar */}
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <div style={{ flex: 1, height: "6px", backgroundColor: "var(--theme-soft)", borderRadius: "99px", overflow: "hidden" }}>
                    <div style={{ width: `${progress}%`, height: "100%", backgroundColor: "var(--theme-primary)", borderRadius: "99px" }} />
                  </div>
                  <span style={{ fontSize: "0.8rem", fontWeight: 600 }}>{progress}%</span>
                </div>

                <div>
                  <h3 style={{ fontSize: "1.1rem", marginBottom: "0.25rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{doc.filename.replace(/\.[^/.]+$/, "")}</h3>
                  <p style={{ fontSize: "0.85rem", color: "var(--distill-text-secondary)", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {"Content summary and key concepts ready for review."}
                  </p>
                </div>
                
                <Link href={`/dashboard/study/${doc.id}`} style={{
                  marginTop: "auto",
                  display: "block", textAlign: "center", padding: "0.65rem", borderRadius: "12px",
                  backgroundColor: "var(--theme-primary)", color: "white", fontWeight: 600, fontSize: "0.95rem"
                }}>
                  Continue
                </Link>
              </div>
            );
          })}
          
          {documents.length === 0 && (
             <div style={{ 
               gridColumn: "1 / -1", padding: "3rem", borderRadius: "20px", 
               border: "1px dashed var(--theme-border)", textAlign: "center",
               backgroundColor: "color-mix(in srgb, var(--theme-soft) 40%, transparent)" 
             }}>
               <h3>No active documents</h3>
               <p style={{ color: "var(--distill-text-secondary)", marginBottom: "1rem" }}>Upload a document to start your study flow.</p>
               <Link href="/dashboard/upload" className="btn-primary">Upload Document</Link>
             </div>
          )}
        </div>

        {/* Bottom Row: Stats & Queue */}
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "1.5rem", alignItems: "start" }}>
          
          {/* Stats Group (Left) */}
          <div style={{ display: "grid", gap: "1.5rem" }}>
            
            {/* 3 Stat Widgets */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1.5rem" }}>
              {[
                { label: "Documents", value: stats.total_documents, sub: "Total uploaded", trend: "up" },
                { label: "Flashcards", value: stats.total_flashcards, sub: "Total generated", trend: "up" },
                { label: "Avg. Score", value: `${stats.avg_quiz_score}%`, sub: "Across quizzes", trend: "up" },
              ].map(stat => (
                <div key={stat.label} style={{ 
                  padding: "1.25rem", borderRadius: "20px", backgroundColor: "var(--card)", 
                  border: "1px solid var(--theme-border)", display: "flex", flexDirection: "column", gap: "0.75rem"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontWeight: 600 }}>{stat.label}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem" }}>
                    <div style={{ width: "2.5rem", height: "2.5rem", borderRadius: "12px", backgroundColor: "color-mix(in srgb, #10b981 15%, transparent)", color: "#10b981", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ fontSize: "1.25rem" }}>✦</span>
                    </div>
                    <div>
                      <span style={{ fontSize: "1.75rem", fontWeight: 800 }}>{stat.value}</span>
                      <p style={{ fontSize: "0.8rem", color: "#10b981", fontWeight: 600 }}>{stat.sub}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Study Streak */}
            <div style={{ padding: "1.5rem", borderRadius: "20px", backgroundColor: "var(--card)", border: "1px solid var(--theme-border)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}>
                <div>
                  <h3 style={{ fontSize: "1.1rem", marginBottom: "0.15rem" }}>Study Streak</h3>
                  <p style={{ fontSize: "0.85rem", color: "var(--distill-text-secondary)" }}>{stats.streak_days}-day streak</p>
                </div>
              </div>
              
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                {["6d", "5d", "4d", "3d", "2d", "1d", "Today"].map((day, i) => {
                  const active = stats.streak_activity[i];
                  return (
                    <div key={day} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
                      <div style={{ 
                        fontSize: "2rem", 
                        filter: active ? (i === 6 ? "hue-rotate(180deg) saturate(2)" : "none") : "grayscale(1) opacity(0.2)",
                      }}>🔥</div>
                      <span style={{ fontSize: "0.8rem", fontWeight: i === 6 ? 600 : 500, color: i === 6 ? "var(--theme-primary)" : "var(--distill-text-secondary)" }}>
                        {day}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Review Queue (Right) */}
          <div style={{ padding: "1.5rem", borderRadius: "20px", backgroundColor: "var(--card)", border: "1px solid var(--theme-border)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1.25rem" }}>
              <div>
                <h3 style={{ fontSize: "1.25rem", marginBottom: "0.15rem" }}>Review Queue</h3>
                <p style={{ fontSize: "0.85rem", color: "var(--distill-text-secondary)" }}>Tasks due today</p>
              </div>
              <span style={{ color: "var(--distill-text-secondary)", cursor: "pointer" }}>•••</span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {queue.tasks.length === 0 ? (
                <div style={{ textAlign: "center", padding: "2rem", color: "var(--distill-text-secondary)" }}>
                  You are all caught up!
                </div>
              ) : queue.tasks.map((task, i) => (
                <div key={task.title} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "1.25rem", borderBottom: i === queue.tasks.length - 1 ? "none" : "1px solid var(--border)" }}>
                  <div>
                    <p style={{ fontWeight: 600, fontSize: "0.95rem", marginBottom: "0.25rem" }}>{task.title}</p>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span style={{ fontSize: "0.8rem", color: "var(--distill-text-secondary)" }}>{task.subtitle}</span>
                      <span style={{ fontSize: "0.75rem", padding: "0.15rem 0.5rem", borderRadius: "99px", backgroundColor: task.color, color: task.text_color, fontWeight: 600 }}>
                        {task.badge}
                      </span>
                    </div>
                  </div>
                  <Link href={task.badge === "Review" ? "/dashboard/flashcards" : "/dashboard/quizzes"} style={{ 
                    padding: "0.4rem 0.8rem", borderRadius: "8px", border: "1px solid var(--theme-border)", 
                    backgroundColor: "var(--theme-primary)", color: "white", fontSize: "0.85rem", fontWeight: 500, cursor: "pointer", textDecoration: "none"
                  }}>
                    {task.badge === "Review" ? "Start Review" : "Start Practice"}
                  </Link>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
