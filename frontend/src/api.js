const API_BASE = "/api";

export async function askBackend(question, history) {
  const response = await fetch(`${API_BASE}/ask`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      question,
      history,
    }),
  });

  if (!response.ok) {
    throw new Error(`Backend returned ${response.status}`);
  }

  return response.json();
}

export async function fetchProfile() {
  const response = await fetch(`${API_BASE}/profile`, {
    method: "GET",
  });

  if (!response.ok) {
    throw new Error(`Profile API returned ${response.status}`);
  }

  const data = await response.json();

  return {
    ...data,
    resume_url: data.resume_url
      ? `${API_BASE}${data.resume_url}`
      : "",
  };
}