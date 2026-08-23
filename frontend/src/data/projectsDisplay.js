const API_BASE = "http://127.0.0.1:8000";

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
  const response = await fetch(`${API_BASE}/profile`);

  if (!response.ok) {
    throw new Error(`Profile API returned ${response.status}`);
  }

  return response.json();
}