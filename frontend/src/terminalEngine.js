// ============================================================
// Candidate Terminal - Fake Filesystem Engine
// Pure logic only.
// No React, no DOM.
// ============================================================


// ------------------------------------------------------------
// Identify the current location
// ------------------------------------------------------------

export function locationOf(path) {
  // Home:
  // ["~"]
  if (path.length === 1 && path[0] === "~") {
    return {
      type: "home",
    };
  }

  // Projects list:
  // ["~", "projects"]
  if (
    path.length === 2 &&
    path[1] === "projects"
  ) {
    return {
      type: "projects",
    };
  }

  // One specific project:
  // ["~", "projects", "codeplay-edtech"]
  if (
    path.length === 3 &&
    path[1] === "projects"
  ) {
    return {
      type: "project",
      id: path[2],
    };
  }

  // Skills:
  // ["~", "skills"]
  if (
    path.length === 2 &&
    path[1] === "skills"
  ) {
    return {
      type: "skills",
    };
  }

  // Experience:
  // ["~", "experience"]
  if (
    path.length === 2 &&
    path[1] === "experience"
  ) {
    return {
      type: "experience",
    };
  }

  // Resume:
  // ["~", "resume.pdf"]
  if (
    path.length === 2 &&
    path[1] === "resume.pdf"
  ) {
    return {
      type: "resume",
    };
  }

  return {
    type: "unknown",
  };
}


// ------------------------------------------------------------
// Resolve a cd command
//
// Examples:
//
// cd
// cd ~
// cd ..
// cd ~/projects
// cd ~/skills
// cd ~/experience
// cd projects
// cd projects/codeplay-edtech
// ------------------------------------------------------------

export function resolveCd(currentPath, arg, profile) {
  // Empty cd, ~, or /
  // always returns home.
  if (
    !arg ||
    arg === "~" ||
    arg === "/"
  ) {
    return ["~"];
  }

  let newPath = [...currentPath];

  const segments = arg
    .replace(/^\/+/, "")
    .replace(/\/+$/, "")
    .split("/")
    .filter(Boolean);

  for (const segment of segments) {
    const seg = segment.toLowerCase();

    // Go one level up
    if (seg === "..") {
      if (newPath.length > 1) {
        newPath = newPath.slice(0, -1);
      }

      continue;
    }

    // ~ always means home
    if (seg === "~") {
      newPath = ["~"];
      continue;
    }

    const currentLocation =
      locationOf(newPath);

    // --------------------------------------------------------
    // HOME
    // --------------------------------------------------------

    if (
      currentLocation.type === "home"
    ) {
      // Projects
      if (seg === "projects") {
        newPath = [
          "~",
          "projects",
        ];

        continue;
      }

      // Skills
      if (seg === "skills") {
        newPath = [
          "~",
          "skills",
        ];

        continue;
      }

      // Experience
      if (seg === "experience") {
        newPath = [
          "~",
          "experience",
        ];

        continue;
      }

      return null;
    }

    // --------------------------------------------------------
    // PROJECTS
    // --------------------------------------------------------

    if (
      currentLocation.type === "projects"
    ) {
      const projects =
        Array.isArray(profile?.projects)
          ? profile.projects
          : [];

      const projectExists =
        projects.some(
          (project) =>
            project.id?.toLowerCase() === seg
        );

      if (projectExists) {
        newPath = [
          "~",
          "projects",
          seg,
        ];

        continue;
      }

      return null;
    }

    // --------------------------------------------------------
    // PROJECT / SKILLS / EXPERIENCE / RESUME
    //
    // These are leaf locations.
    // We don't allow cd deeper into them.
    // --------------------------------------------------------

    return null;
  }

  return newPath;
}


// ------------------------------------------------------------
// List current directory
//
// Every project comes from the LIVE profile.
// No hard-coded project names.
// ------------------------------------------------------------

export function listDirectory(path, profile) {
  const location =
    locationOf(path);

  // ----------------------------------------------------------
  // HOME
  // ----------------------------------------------------------

  if (
    location.type === "home"
  ) {
    return [
      {
        name: "projects/",
        action: {
          type: "cd",
          value: "~/projects",
        },
      },
      {
        name: "skills/",
        action: {
          type: "cd",
          value: "~/skills",
        },
      },
      {
        name: "experience/",
        action: {
          type: "cd",
          value: "~/experience",
        },
      },
      {
        name: "resume.pdf",
        action: {
          type: "cat",
          value: "resume.pdf",
        },
      },
    ];
  }

  // ----------------------------------------------------------
  // PROJECTS
  // ----------------------------------------------------------

  if (
    location.type === "projects"
  ) {
    const projects =
      Array.isArray(profile?.projects)
        ? profile.projects
        : [];

    return projects.map(
      (project) => ({
        name: `${project.id}/`,
        action: {
          type: "open-project",
          value: project.id,
        },
      })
    );
  }

  // ----------------------------------------------------------
  // PROJECT
  // ----------------------------------------------------------

  if (
    location.type === "project"
  ) {
    return [
      {
        name: "README.md",
        action: {
          type: "cat",
          value: "README.md",
        },
      },
    ];
  }

  // ----------------------------------------------------------
  // SKILLS
  // ----------------------------------------------------------

  if (
    location.type === "skills"
  ) {
    return [
      {
        name: "skills.txt",
        action: {
          type: "cat",
          value: "skills.txt",
        },
      },
    ];
  }

  // ----------------------------------------------------------
  // EXPERIENCE
  // ----------------------------------------------------------

  if (
    location.type === "experience"
  ) {
    return [
      {
        name: "experience.txt",
        action: {
          type: "cat",
          value: "experience.txt",
        },
      },
    ];
  }

  // ----------------------------------------------------------
  // RESUME
  // ----------------------------------------------------------

  if (
    location.type === "resume"
  ) {
    return [];
  }

  return [];
}


// ------------------------------------------------------------
// Convert path array to terminal path string
//
// ["~"]
// → "~"
//
// ["~", "projects"]
// → "~/projects"
//
// ["~", "projects", "codeplay-edtech"]
// → "~/projects/codeplay-edtech"
// ------------------------------------------------------------

export function pathToString(path) {
  return path.join("/");
}


// ------------------------------------------------------------
// Static command suggestions
// ------------------------------------------------------------

export const KNOWN_COMMANDS = [
  "help",
  "clear",
  "whoami",
  "about",
  "ls",
  "cd projects/",
  "cd skills/",
  "cd experience/",
  "cd ..",
  "cd ~",
  "cat skills.txt",
  "cat experience.txt",
  "cat resume.pdf",
  "cat README.md",
  "history",
  "date",
];


// ------------------------------------------------------------
// Tab-completion suggestion
// ------------------------------------------------------------

export function getSuggestion(value) {
  if (!value) {
    return null;
  }

  const lower =
    value.toLowerCase();

  return (
    KNOWN_COMMANDS.find(
      (command) =>
        command.startsWith(lower) &&
        command !== lower
    ) || null
  );
}