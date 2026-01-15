export async function streamGenerate({ prompt, model, options = {}, baseUrl = import.meta.env.VITE_OLLAMA_BASE_URL || 'https://ollama.ayux.in' }, onToken, signal) {
  const url = `${baseUrl.replace(/\/$/, '')}/api/generate`;
  const body = {
    model: model || 'llama3.2:3b',
    prompt,
    stream: true,
    options: {
      num_ctx: options.num_ctx || 4000,
      ...options,
    },
  };

  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  });

  if (!resp.ok || !resp.body) {
    throw new Error(`Request failed: ${resp.status} ${resp.statusText}`);
  }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let done = false;
  let buffer = '';
  while (!done) {
    const chunk = await reader.read();
    done = chunk.done;
    if (chunk.value) {
      buffer += decoder.decode(chunk.value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const json = JSON.parse(line);
          if (json.response !== undefined) {
            onToken?.(json.response, json);
          }
          if (json.done) {
            done = true;
            break;
          }
        } catch (err) {
          console.warn('Failed to parse stream chunk', err, line);
        }
      }
    }
  }
}
