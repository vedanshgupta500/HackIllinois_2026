const form = document.getElementById('moggpt-form');
const result = document.getElementById('result');

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const payload = Object.fromEntries(new FormData(form).entries());

  const response = await fetch('/api/evaluate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  if (!response.ok) {
    result.classList.remove('hidden');
    result.innerHTML = `<p>⚠️ ${data.error || 'Unable to evaluate.'}</p>`;
    return;
  }

  result.classList.remove('hidden');
  result.innerHTML = `
    <div class="result-label">${data.label}</div>
    <div class="result-score">Score: <strong>${data.score}</strong>/100</div>
    <p>${data.summary}</p>
    <p><strong>Strengths:</strong> ${data.strengths.length ? data.strengths.join(', ') : 'None'}</p>
    <p><strong>Risk factors:</strong> ${data.risk_factors.length ? data.risk_factors.join(', ') : 'None'}</p>
  `;
});
