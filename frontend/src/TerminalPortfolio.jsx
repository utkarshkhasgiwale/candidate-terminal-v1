import { useState, useRef, useEffect } from "react";
import {
  Code2,
  ExternalLink,
  Sun,
  Moon,
  Send,
  Copy,
  CopyCheck,
  FileDown,
} from "lucide-react";

import {
  locationOf,
  resolveCd,
  listDirectory,
  pathToString,
  getSuggestion,
} from "./terminalEngine";

import { askBackend, fetchProfile } from "./api";

const NAME = "Utkarsh";

const THEMES = {
  dark: {
    bg: "#0b0e14",
    panel: "#141922",
    sidebar: "#0e1219",
    border: "#262d3a",
    text: "#c9d1d9",
    dim: "#6e7681",
    prompt: "#7ee787",
    branch: "#d2a8ff",
    dollar: "#58a6ff",
    dir: "#79c0ff",
    file: "#d29922",
    cardBg: "#161b22",
  },

  light: {
    bg: "#fafaf8",
    panel: "#f2f0e9",
    sidebar: "#f6f4ee",
    border: "#ddd8ca",
    text: "#2b2b28",
    dim: "#8a857a",
    prompt: "#1d7a4c",
    branch: "#7a4ab7",
    dollar: "#1a5fa8",
    dir: "#1a5fa8",
    file: "#a3720f",
    cardBg: "#ffffff",
  },
};

const HELP_LINES = [
  "available commands:",
  "  whoami             short bio",
  "  ls                 list contents of current folder",
  "  cd <folder>        move into a folder",
  "  cd ..              move up one level",
  "  cd ~               return home",
  "  cat <file>         read a file",
  "  history            session command history",
  "  date               current date",
  "  clear              clear terminal",
  "  or just type a question in plain English",
];

const BOOT_LINES = [
  "booting candidate-terminal v1.0 ...",
  "loading resume_facts.json ... done",
  "mounting /projects ... done",
  "mounting /skills ... done",
  "mounting /experience ... done",
  "connecting to assistant backend ... done",
  `welcome — you're talking to ${NAME}'s AI assistant.`,
];

let idCounter = 0;

const nextId = () => {
  idCounter += 1;
  return idCounter;
};

export default function TerminalPortfolio() {
  const [themeName, setThemeName] = useState("dark");
  const [booted, setBooted] = useState(false);
  const [bootShown, setBootShown] = useState([]);

  const [history, setHistory] = useState([]);
  const [chatHistory, setChatHistory] = useState([]);

  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);

  const [cmdLog, setCmdLog] = useState([]);
  const [logIndex, setLogIndex] = useState(-1);

  const [clock, setClock] = useState(new Date());
  const [path, setPath] = useState(["~"]);

  const [profile, setProfile] = useState({
    name: "",
    tagline: "",
    location: "",
    email: "",
    phone: "",
    college: "",
    cgpa: "",
    about: "",
    skills: [],
    experience: [],
    projects: [],
    education: [],
    resume_url: "",
  });

  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState("");

  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  const theme = THEMES[themeName];

  // ------------------------------------------------------------
  // Load live profile from backend
  // ------------------------------------------------------------

  useEffect(() => {
    async function loadProfile() {
      try {
        setProfileLoading(true);

        const data = await fetchProfile();

        setProfile({
          name: data.name || "",
          tagline: data.tagline || "",
          location: data.location || "",
          email: data.email || "",
          phone: data.phone || "",
          college: data.college || "",
          cgpa: data.cgpa || "",
          about: data.about || "",
          skills:
  data.skills &&
  typeof data.skills === "object" &&
  !Array.isArray(data.skills)
    ? data.skills
    : {},
          experience: Array.isArray(data.experience)
            ? data.experience
            : [],
          projects: Array.isArray(data.projects)
            ? data.projects
            : [],
          education: Array.isArray(data.education)
            ? data.education
            : [],
          resume_url: data.resume_url || "",
        });
      } catch (error) {
        console.error("Failed to load profile:", error);
        setProfileError("Unable to load profile data from backend.");
      } finally {
        setProfileLoading(false);
      }
    }

    loadProfile();
  }, []);

  // ------------------------------------------------------------
  // Boot animation
  // ------------------------------------------------------------

  useEffect(() => {
    let i = 0;

    const id = setInterval(() => {
      i += 1;

      setBootShown((prev) => [
        ...prev,
        BOOT_LINES[i - 1],
      ]);

      if (i >= BOOT_LINES.length) {
        clearInterval(id);

        setTimeout(() => {
          setBooted(true);
        }, 400);
      }
    }, 380);

    return () => clearInterval(id);
  }, []);

  // ------------------------------------------------------------
  // Clock
  // ------------------------------------------------------------

  useEffect(() => {
    const id = setInterval(() => {
      setClock(new Date());
    }, 1000);

    return () => clearInterval(id);
  }, []);

  // ------------------------------------------------------------
  // Auto scroll
  // ------------------------------------------------------------

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop =
        scrollRef.current.scrollHeight;
    }
  }, [history, loading, bootShown]);

  function push(entry) {
    setHistory((prev) => [
      ...prev,
      {
        id: nextId(),
        ...entry,
      },
    ]);
  }

  // ------------------------------------------------------------
  // Project lookup
  // ------------------------------------------------------------

  function findProject(id) {
    return (
      profile.projects.find(
        (project) => project.id === id
      ) || null
    );
  }

  // ------------------------------------------------------------
  // AI
  // ------------------------------------------------------------

  async function askAI(question) {
    setLoading(true);

    try {
      const result = await askBackend(
        question,
        chatHistory
      );

      push({
        type: "out",
        text: result.answer,
        typed: true,
      });

      const project = findProject(
        result.mentioned_project
      );

      if (project) {
        push({
          type: "project",
          project,
        });
      }

      setChatHistory((prev) => [
        ...prev,
        {
          role: "user",
          content: question,
        },
        {
          role: "assistant",
          content: result.answer,
        },
      ]);
    } catch (error) {
      console.error(error);

      push({
        type: "out",
        text: "Couldn't reach the assistant backend right now.",
        typed: true,
      });
    } finally {
      setLoading(false);
    }
  }

  // ------------------------------------------------------------
  // UI actions
  // ------------------------------------------------------------

  function runAction(action) {
    if (!action) return;

    if (action.type === "cd") {
      processCommand(`cd ${action.value}`);
    }

    if (action.type === "cat") {
      processCommand(`cat ${action.value}`);
    }

    if (action.type === "open-project") {
      openProject(action.value);
    }
  }

  function openProject(id) {
    const project = findProject(id);

    if (!project) return;

    setPath(["~", "projects", id]);

    push({
      type: "cmd",
      text: `cd projects/${id} && cat README.md`,
      path: pathToString(path),
    });

    setCmdLog((prev) => [
      ...prev,
      `cd projects/${id}`,
    ]);

    push({
      type: "project",
      project,
    });

    inputRef.current?.focus();
  }

  // ------------------------------------------------------------
  // Terminal command processor
  // ------------------------------------------------------------

  function processCommand(raw) {
    const trimmed = raw.trim();

    if (!trimmed) return;

    push({
      type: "cmd",
      text: trimmed,
      path: pathToString(path),
    });

    setCmdLog((prev) => [
      ...prev,
      trimmed,
    ]);

    setLogIndex(-1);

    const lower = trimmed.toLowerCase();

    if (lower.startsWith("sudo ")) {
      push({
        type: "out",
        text:
          "nice try — I don't need root access to be honest with you.",
        typed: true,
      });

      return;
    }

    if (lower === "help") {
      push({
        type: "out",
        text: HELP_LINES.join("\n"),
      });

      return;
    }

    if (lower === "clear") {
      setHistory([]);
      return;
    }

    if (lower === "date") {
      push({
        type: "out",
        text: new Date().toString(),
      });

      return;
    }

    if (lower === "history") {
      push({
        type: "out",
        text: cmdLog.length
          ? cmdLog.join("\n")
          : "no history yet",
      });

      return;
    }

    if (
      lower === "whoami" ||
      lower === "about"
    ) {
      push({
        type: "out",
        text:
          profile.about ||
          `Hi, I'm ${profile.name || NAME}. Ask me anything, or type help.`,
        typed: true,
      });

      return;
    }

    // ----------------------------------------------------------
    // cd
    // ----------------------------------------------------------

    if (
      lower === "cd" ||
      lower.startsWith("cd ")
    ) {
      const arg = trimmed.slice(2).trim();

      const newPath = resolveCd(
        path,
        arg,
        profile
      );

      if (newPath) {
        setPath(newPath);
      } else {
        push({
          type: "out",
          text:
            `cd: no such file or directory: ${arg}`,
        });
      }

      return;
    }

    // ----------------------------------------------------------
    // ls
    // ----------------------------------------------------------

    if (lower === "ls") {
      const items = listDirectory(
        path,
        profile
      );

      push({
        type: "listing",
        items,
      });

      return;
    }

    // ----------------------------------------------------------
    // cat
    // ----------------------------------------------------------

    if (lower.startsWith("cat ")) {
      const arg = trimmed
        .slice(4)
        .trim()
        .toLowerCase();

      const loc = locationOf(path);

      // README inside a project
      if (
        loc.type === "project" &&
        (arg === "readme.md" ||
          arg === "readme")
      ) {
        const project = findProject(loc.id);

        if (project) {
          push({
            type: "project",
            project,
          });
        }

        return;
      }

      // Resume
      if (arg === "resume.pdf") {
        push({
          type: "resume",
        });

        return;
      }

      // Skills
      if (
        loc.type === "skills" &&
        (arg === "skills.txt" ||
          arg === "strengths.txt")
      ) {
        push({
          type: "skills",
        });

        return;
      }

      // Experience
      if (
        loc.type === "experience" &&
        arg === "experience.txt"
      ) {
        push({
          type: "experience",
        });

        return;
      }

      // Project lookup from any directory
      const project =
        profile.projects.find(
          (project) =>
            arg.includes(
              project.id.toLowerCase()
            ) ||
            arg.includes(
              project.name.toLowerCase()
            )
        );

      if (project) {
        push({
          type: "project",
          project,
        });

        return;
      }

      push({
        type: "out",
        text: `cat: ${arg}: no such file`,
      });

      return;
    }

    // ----------------------------------------------------------
    // Plain-English question
    // ----------------------------------------------------------

    askAI(trimmed);
  }

  const suggestion = getSuggestion(value);

  function handleKeyDown(e) {
    if (e.key === "Enter") {
      processCommand(value);
      setValue("");
    } else if (e.key === "Tab") {
      if (suggestion) {
        e.preventDefault();
        setValue(suggestion);
      }
    } else if (e.key === "ArrowUp") {
      if (cmdLog.length === 0) return;

      const next =
        logIndex < 0
          ? cmdLog.length - 1
          : Math.max(0, logIndex - 1);

      setLogIndex(next);
      setValue(cmdLog[next]);

      e.preventDefault();
    } else if (e.key === "ArrowDown") {
      if (logIndex < 0) return;

      const next = logIndex + 1;

      if (next >= cmdLog.length) {
        setLogIndex(-1);
        setValue("");
      } else {
        setLogIndex(next);
        setValue(cmdLog[next]);
      }

      e.preventDefault();
    }
  }

  function openSection(section) {
  const targetPath = ["~", section];

  setPath(targetPath);

  push({
    type: "cmd",
    text: `cd ~/${section}`,
    path: pathToString(targetPath),
  });

  setCmdLog((prev) => [
    ...prev,
    `cd ~/${section}`,
  ]);

  if (section === "skills") {
    push({
      type: "skills",
    });
  }

  if (section === "experience") {
    push({
      type: "experience",
    });
  }

  inputRef.current?.focus();
}

function runQuick(cmd) {
  processCommand(cmd);

  inputRef.current?.focus();
}

  // ------------------------------------------------------------
  // Render
  // ------------------------------------------------------------

  return (
    <div
      style={{
        fontFamily: "monospace",
        background: theme.bg,
        height: "100vh",
        width: "100vw",
        overflow: "hidden",
        position: "relative",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(6px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .term-fade-in {
          animation: fadeInUp 0.25s ease-out;
        }

        .term-nav-item {
          background: none;
          border: none;
          cursor: pointer;
          padding: 0;
          font: inherit;
        }

        .term-layout {
          display: flex;
        }

        .term-sidebar {
          width: 170px;
          flex-shrink: 0;
        }

        @media (max-width: 520px) {
          .term-layout {
            flex-direction: column;
          }

          .term-sidebar {
            width: 100%;
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            border-right: none !important;
            border-bottom: 1px solid rgba(128, 128, 128, 0.25);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .term-fade-in {
            animation: none;
          }
        }
      `}</style>

      {/* ----------------------------------------------------- */}
      {/* Header */}
      {/* ----------------------------------------------------- */}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 14px",
          background: theme.panel,
          borderBottom:
            `1px solid ${theme.border}`,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: "#ff5f57",
              display: "inline-block",
            }}
          />

          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: "#febc2e",
              display: "inline-block",
            }}
          />

          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: "#28c840",
              display: "inline-block",
            }}
          />

          <span
            style={{
              color: theme.dim,
              fontSize: 12,
              marginLeft: 8,
            }}
          >
            zsh — {NAME.toLowerCase()}@candidate-terminal — 80x24
          </span>
        </div>

        <button
          onClick={() =>
            setThemeName(
              themeName === "dark"
                ? "light"
                : "dark"
            )
          }
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            background: "transparent",
            border:
              `1px solid ${theme.border}`,
            borderRadius: 6,
            padding: "4px 8px",
            color: theme.dim,
            fontSize: 12,
            cursor: "pointer",
          }}
        >
          {themeName === "dark" ? (
            <Moon size={13} />
          ) : (
            <Sun size={13} />
          )}

          {themeName}
        </button>
      </div>

      {/* ----------------------------------------------------- */}
      {/* Main */}
      {/* ----------------------------------------------------- */}

      <div
        className="term-layout"
        style={{
          position: "relative",
          flex: 1,
          minHeight: 0,
        }}
      >
        {/* -------------------------------------------------- */}
        {/* Sidebar */}
        {/* -------------------------------------------------- */}

        <div
          className="term-sidebar"
          style={{
            background: theme.sidebar,
            borderRight:
              `1px solid ${theme.border}`,
            padding: "12px 10px",
            fontSize: 12,
            overflowY: "auto",
          }}
        >
  <button
  onClick={() => openSection("skills")}
  style={{
    display: "block",
    background: "none",
    border: "none",
    color: theme.dir,
    fontSize: 14,
    padding: "3px 0",
    cursor: "pointer",
    textAlign: "left",
  }}
>
  skills/
</button>

<button
  onClick={() => openSection("experience")}
  style={{
    display: "block",
    background: "none",
    border: "none",
    color: theme.dir,
    fontSize: 14,
    padding: "3px 0",
    cursor: "pointer",
    textAlign: "left",
  }}
>
  experience/
</button>

          <button
            onClick={() =>
              runQuick("cat resume.pdf")
            }
            style={{
              display: "block",
              background: "none",
              border: "none",
              color: theme.file,
              fontSize: 14,
              padding: "3px 0",
              cursor: "pointer",
              textAlign: "left",
            }}
          >
            resume.pdf
          </button>

          {profileLoading && (
            <p
              style={{
                color: theme.dim,
                fontSize: 10,
                marginTop: 10,
              }}
            >
              loading profile...
            </p>
          )}

          {profileError && (
            <p
              style={{
                color: "#f85149",
                fontSize: 10,
                marginTop: 10,
                lineHeight: 1.4,
              }}
            >
              {profileError}
            </p>
          )}
        </div>

        {/* -------------------------------------------------- */}
        {/* Terminal */}
        {/* -------------------------------------------------- */}

        <div
          style={{
            flex: 1,
            minWidth: 0,
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
          }}
        >
          <div
            ref={scrollRef}
            role="log"
            aria-live="polite"
            style={{
              padding: 14,
              flex: 1,
              overflowY: "auto",
              minHeight: 0,
            }}
          >
            {!booted ? (
              bootShown.map((line, i) => (
                <p
                  key={i}
                  className="term-fade-in"
                  style={{
                    color: theme.prompt,
                    fontSize: 12,
                    margin: "0 0 4px",
                  }}
                >
                  {line}
                </p>
              ))
            ) : (
              <>
                <p
                  className="term-fade-in"
                  style={{
                    color: theme.dim,
                    fontSize: 14,
                    margin: "0 0 12px",
                  }}
                >
                  type "help" for commands, "cd"
                  to move around, or just ask a
                  question.
                </p>

                {history.map((entry) => (
                  <HistoryLine
                    key={entry.id}
                    entry={entry}
                    theme={theme}
                    onAction={runAction}
                    profile={profile}
                  />
                ))}

                {loading && (
                  <p
                    style={{
                      color: theme.dim,
                      fontSize: 13,
                      margin: "4px 0",
                    }}
                  >
                    thinking…
                  </p>
                )}
              </>
            )}
          </div>

          {/* ------------------------------------------------ */}
          {/* Quick project buttons */}
          {/* ------------------------------------------------ */}

          {booted &&
            profile.projects.length > 0 && (
              <div
                style={{
                  display: "flex",
                  gap: 6,
                  padding: "0 14px 8px",
                  flexWrap: "wrap",
                }}
              >
                {profile.projects.map(
                  (project) => (
                    <button
                      key={project.id}
                      onClick={() =>
                        openProject(project.id)
                      }
                      style={{
                        fontSize: 13,
                        color: theme.dir,
                        border:
                          `1px solid ${theme.border}`,
                        borderRadius: 12,
                        padding:
                          "4px 10px",
                        background:
                          "transparent",
                        cursor: "pointer",
                        fontFamily:
                          "inherit",
                      }}
                    >
                      cd projects/{project.id}
                    </button>
                  )
                )}
              </div>
            )}

          {/* ------------------------------------------------ */}
          {/* Input */}
          {/* ------------------------------------------------ */}

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "10px 14px",
              borderTop:
                `1px solid ${theme.border}`,
              position: "relative",
            }}
          >
            <span
              style={{
                color: theme.prompt,
                fontSize: 15,
              }}
            >
              {NAME.toLowerCase()}@candidate-terminal
            </span>

            <span
              style={{
                color: theme.branch,
                fontSize: 15,
              }}
            >
              {pathToString(path)}
            </span>

            <span
              style={{
                color: theme.dollar,
                fontSize: 15,
              }}
            >
              $
            </span>

            <div
              style={{
                flex: 1,
                position: "relative",
              }}
            >
              <input
                ref={inputRef}
                value={value}
                onChange={(e) =>
                  setValue(e.target.value)
                }
                onKeyDown={handleKeyDown}
                disabled={!booted}
                placeholder={
                  booted
                    ? "ask a question or type help"
                    : "booting..."
                }
                style={{
                  width: "100%",
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  color: theme.text,
                  fontFamily:
                    "inherit",
                  fontSize: 15,
                  position:
                    "relative",
                  zIndex: 1,
                }}
              />

              {suggestion && (
                <span
                  style={{
                    position:
                      "absolute",
                    left: 0,
                    top: "50%",
                    transform:
                      "translateY(-50%)",
                    color:
                      theme.dim,
                    fontSize: 13,
                    opacity: 0.5,
                    pointerEvents:
                      "none",
                  }}
                >
                  {suggestion}
                  <span
                    style={{
                      marginLeft: 8,
                      fontSize: 10,
                    }}
                  >
                    tab →
                  </span>
                </span>
              )}
            </div>

            <button
              onClick={() => {
                processCommand(value);
                setValue("");
              }}
              disabled={!booted}
              style={{
                background:
                  "none",
                border: "none",
                color: theme.dim,
                cursor: "pointer",
                display: "flex",
              }}
            >
              <Send size={14} />
            </button>
          </div>

          {/* ------------------------------------------------ */}
          {/* Footer */}
          {/* ------------------------------------------------ */}

          <div
            style={{
              display: "flex",
              justifyContent:
                "space-between",
              padding:
                "4px 14px",
              background:
                theme.panel,
              borderTop:
                `1px solid ${theme.border}`,
              fontSize: 12,
              color: theme.dim,
            }}
          >
            <span>
              -- INSERT --
            </span>

            <span>
              {themeName} ·{" "}
              {clock.toLocaleTimeString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// History line renderer
// ============================================================

function HistoryLine({
  entry,
  theme,
  onAction,
  profile,
}) {
  if (entry.type === "cmd") {
    return (
      <p
        className="term-fade-in"
        style={{
          fontSize: 15,
          margin:
            "6px 0 2px",
        }}
      >
        <span
          style={{
            color:
              theme.prompt,
          }}
        >
          {"utkarsh@candidate-terminal"}
        </span>

        <span
          style={{
            color:
              theme.branch,
          }}
        >
          {" "}
          {entry.path}{" "}
        </span>

        <span
          style={{
            color:
              theme.dollar,
          }}
        >
          ${" "}
        </span>

        <span
          style={{
            color:
              theme.text,
          }}
        >
          {entry.text}
        </span>
      </p>
    );
  }

  if (entry.type === "listing") {
    return (
      <div
        className="term-fade-in"
        style={{
          display: "flex",
          gap: 16,
          flexWrap: "wrap",
          padding:
            "2px 0 8px",
        }}
      >
        {entry.items.map(
          (item) => (
            <button
              key={item.name}
              className="term-nav-item"
              onClick={() =>
                onAction(
                  item.action
                )
              }
              style={{
                color:
                  item.action?.type ===
                  "cat"
                    ? theme.file
                    : theme.dir,
                fontSize: 13,
              }}
            >
              {item.name}
            </button>
          )
        )}
      </div>
    );
  }

  if (entry.type === "resume") {
    return (
      <div
        className="term-fade-in"
        style={{
          background:
            theme.cardBg,
          border:
            `1px solid ${theme.border}`,
          borderRadius: 8,
          padding:
            "10px 12px",
          margin:
            "4px 0 10px",
          maxWidth: 320,
        }}
      >
        <p
          style={{
            color: theme.text,
            fontSize: 13,
            margin:
              "0 0 8px",
          }}
        >
          resume.pdf
        </p>

        {profile.resume_url ? (
          <a
            href={profile.resume_url}
            target="_blank"
            rel="noreferrer"
            style={{
              display: "flex",
              alignItems:
                "center",
              gap: 4,
              fontSize: 12,
              color:
                theme.prompt,
              textDecoration:
                "none",
            }}
          >
            <FileDown size={13} />
            Download resume
          </a>
        ) : (
          <p
            style={{
              color:
                theme.dim,
              fontSize: 11,
              margin: 0,
            }}
          >
            resume URL is not configured
          </p>
        )}
      </div>
    );
  }

  if (entry.type === "skills") {
  const skillCategories = [
    {
      key: "languages",
      label: "LANGUAGES",
    },
    {
      key: "frontend",
      label: "FRONT-END",
    },
    {
      key: "backend_apis",
      label: "BACK-END / APIs",
    },
    {
      key: "generative_ai",
      label: "GENERATIVE AI",
    },
    {
      key: "core_cs",
      label: "CORE CS",
    },
    {
      key: "tools",
      label: "TOOLS",
    },
  ];

  return (
    <div
      className="term-fade-in"
      style={{
        background: theme.cardBg,
        border: `1px solid ${theme.border}`,
        borderRadius: 8,
        padding: "12px",
        margin: "4px 0 10px",
        maxWidth: 620,
      }}
    >
      <p
        style={{
          color: theme.dir,
          fontSize: 13,
          margin: "0 0 12px",
        }}
      >
        skills.txt
      </p>

      {skillCategories.map((category) => {
        const skills =
          profile.skills?.[category.key] || [];

        if (skills.length === 0) {
          return null;
        }

        return (
          <div
            key={category.key}
            style={{
              marginBottom: 14,
            }}
          >
            <div
              style={{
                color: theme.prompt,
                fontSize: 15,
                fontWeight: 600,
                marginBottom: 6,
              }}
            >
              {category.label}
            </div>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 6,
              }}
            >
              {skills.map((skill) => (
                <span
                  key={skill}
                  style={{
                    color: theme.text,
                    fontSize: 13,
                    border: `1px solid ${theme.border}`,
                    borderRadius: 4,
                    padding: "3px 7px",
                  }}
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
  if (entry.type === "experience") {
    return (
      <div
        className="term-fade-in"
        style={{
          background:
            theme.cardBg,
          border:
            `1px solid ${theme.border}`,
          borderRadius: 8,
          padding:
            "10px 12px",
          margin:
            "4px 0 10px",
          maxWidth: 520,
        }}
      >
        <p
          style={{
            color:
              theme.dir,
            fontSize: 15,
            margin:
              "0 0 8px",
          }}
        >
          experience.txt
        </p>

        {profile.experience.length > 0 ? (
          profile.experience.map(
            (experience, index) => (
              <div
                key={index}
                style={{
                  marginBottom:
                    12,
                }}
              >
                <div
                  style={{
                    color:
                      theme.text,
                    fontSize: 12,
                    fontWeight:
                      600,
                  }}
                >
                  {experience.role ||
                    "Role"}
                </div>

                <div
                  style={{
                    color:
                      theme.prompt,
                    fontSize: 12,
                    marginTop:
                      2,
                  }}
                >
                  {experience.company ||
                    "Company"}
                </div>

                <div
                  style={{
                    color:
                      theme.dim,
                    fontSize: 11,
                    marginTop:
                      2,
                  }}
                >
                  {experience.duration ||
                    ""}
                </div>

                <div
                  style={{
                    color:
                      theme.text,
                    fontSize: 12,
                    lineHeight:
                      1.5,
                    marginTop:
                      5,
                  }}
                >
                  {experience.description ||
                    ""}
                </div>
              </div>
            )
          )
        ) : (
          <p
            style={{
              color:
                theme.dim,
              fontSize: 14,
            }}
          >
            No experience available.
          </p>
        )}
      </div>
    );
  }

  if (entry.type === "project") {
    const project =
      entry.project;

    if (!project) {
      return null;
    }

    return (
      <div
        className="term-fade-in"
        style={{
          background:
            theme.cardBg,
          border:
            `1px solid ${theme.border}`,
          borderRadius: 8,
          padding:
            "10px 12px",
          margin:
            "4px 0 10px",
          maxWidth: 460,
        }}
      >
        <p
          style={{
            color:
              theme.dir,
            fontSize: 13,
            fontWeight: 500,
            margin:
              "0 0 4px",
          }}
        >
          {project.name}
        </p>

        <p
          style={{
            color:
              theme.dim,
            fontSize: 12,
            margin:
              "0 0 8px",
            lineHeight:
              1.5,
          }}
        >
          {project.description}
        </p>

        <div
          style={{
            display:
              "flex",
            gap: 6,
            flexWrap:
              "wrap",
            marginBottom:
              8,
          }}
        >
          {(project.tech || []).map(
            (tech) => (
              <span
                key={tech}
                style={{
                  fontSize: 11,
                  color:
                    theme.dim,
                  border:
                    `1px solid ${theme.border}`,
                  borderRadius: 4,
                  padding:
                    "2px 6px",
                }}
              >
                {tech}
              </span>
            )
          )}
        </div>

        <div
          style={{
            display:
              "flex",
            gap: 12,
          }}
        >
          {project.github && (
            <a
              href={
                project.github
              }
              target="_blank"
              rel="noreferrer"
              style={{
                display:
                  "flex",
                alignItems:
                  "center",
                gap: 4,
                fontSize: 12,
                color:
                  theme.prompt,
                textDecoration:
                  "none",
              }}
            >
              <Code2
                size={13}
              />
              GitHub
            </a>
          )}

          {project.demo && (
            <a
              href={
                project.demo
              }
              target="_blank"
              rel="noreferrer"
              style={{
                display:
                  "flex",
                alignItems:
                  "center",
                gap: 4,
                fontSize: 12,
                color:
                  theme.prompt,
                textDecoration:
                  "none",
              }}
            >
              <ExternalLink
                size={13}
              />
              Live demo
            </a>
          )}
        </div>
      </div>
    );
  }

  if (entry.type === "out") {
    return (
      <OutputLine
        text={entry.text}
        typed={entry.typed}
        theme={theme}
      />
    );
  }

  return null;
}

// ============================================================
// Output renderer
// ============================================================

function OutputLine({
  text,
  typed,
  theme,
}) {
  const [copied, setCopied] =
    useState(false);

  function handleCopy() {
    navigator.clipboard
      ?.writeText(text)
      .then(() => {
        setCopied(true);

        setTimeout(() => {
          setCopied(false);
        }, 1500);
      });
  }

  return (
    <div
      className="term-fade-in"
      style={{
        display:
          "flex",
        alignItems:
          "flex-start",
        gap: 6,
        margin:
          "2px 0 10px",
      }}
    >
      <p
        style={{
          color: typed
            ? theme.text
            : theme.dim,
          fontSize: 13,
          margin: 0,
          whiteSpace:
            "pre-wrap",
          lineHeight:
            1.6,
          flex: 1,
        }}
      >
        {typed && (
          <span
            style={{
              color:
                theme.prompt,
              fontSize: 11,
              marginRight: 6,
            }}
          >
            [assistant]
          </span>
        )}

        {text}
      </p>

      {typed && (
        <button
          onClick={
            handleCopy
          }
          style={{
            background:
              "none",
            border:
              "none",
            color:
              theme.dim,
            cursor:
              "pointer",
            flexShrink:
              0,
            marginTop: 2,
          }}
          aria-label="Copy answer"
        >
          {copied ? (
            <CopyCheck
              size={13}
              color={
                theme.prompt
              }
            />
          ) : (
            <Copy size={13} />
          )}
        </button>
      )}
    </div>
  );
}