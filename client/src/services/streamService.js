/**
 * Client-Side Real-Time SSE Stream Consumer
 * Streams token-by-token LLM completions with ultra-smooth, buttery pacing
 * and resilience against trailing connection drops.
 */
export async function streamAiCompletion({
  endpoint,
  body,
  token,
  onChunk,
  onComplete,
  onError,
  signal,
}) {
  const baseURL = import.meta.env.VITE_BASE_URL || 'http://localhost:3000';
  const url = `${baseURL.replace(/\/$/, '')}${endpoint}`;

  let targetText = '';
  let displayedText = '';
  let isServerComplete = false;
  let hasCompleted = false;
  let animTimer = null;
  let reader = null;

  return new Promise(async (resolve, reject) => {
    // Helper to finish cleanly once displayedText catches up to targetText
    const finishGracefully = () => {
      if (hasCompleted) return;
      hasCompleted = true;
      if (animTimer) {
        clearInterval(animTimer);
        animTimer = null;
      }
      try {
        if (reader) reader.cancel();
      } catch (_) {}

      if (onComplete) {
        onComplete(displayedText || targetText);
      }
      resolve(displayedText || targetText);
    };

    // Helper to handle abort
    const handleAbort = () => {
      if (hasCompleted) return;
      hasCompleted = true;
      if (animTimer) {
        clearInterval(animTimer);
        animTimer = null;
      }
      try {
        if (reader) reader.cancel();
      } catch (_) {}
      console.log('Streaming stopped by user');
      if (onComplete) onComplete(displayedText || targetText);
      resolve(displayedText || targetText);
    };

    if (signal) {
      if (signal.aborted) {
        handleAbort();
        return;
      }
      signal.addEventListener('abort', handleAbort, { once: true });
    }

    // Smooth Pacing Animation Loop
    // Drips characters at a buttery-smooth, fluid pace
    const startSmoother = () => {
      if (animTimer) return;

      animTimer = setInterval(() => {
        if (signal?.aborted) {
          handleAbort();
          return;
        }

        const remaining = targetText.length - displayedText.length;

        if (remaining > 0) {
          // Dynamic adaptive step size for silky, buttery smooth flow
          let step = 1;
          if (remaining <= 8) {
            step = 1; // Ultra smooth character-by-character flow
          } else if (remaining <= 35) {
            step = 2; // Smooth reading pace
          } else if (remaining <= 90) {
            step = 3;
          } else if (remaining <= 200) {
            step = 5;
          } else {
            step = Math.ceil(remaining / 35); // Smooth catch-up on massive backlogs
          }

          const nextIndex = Math.min(displayedText.length + step, targetText.length);
          const chunkAdded = targetText.slice(displayedText.length, nextIndex);
          displayedText = targetText.slice(0, nextIndex);

          if (onChunk) {
            onChunk(chunkAdded, displayedText);
          }
        } else if (isServerComplete) {
          finishGracefully();
        }
      }, 20); // ~50fps buttery smooth cadence (~20ms ticks)
    };

    // Begin Network Stream
    try {
      startSmoother();

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
        signal,
      });

      if (!response.ok) {
        let errMessage = `HTTP error ${response.status}`;
        try {
          const errorJson = await response.json();
          errMessage = errorJson.message || errMessage;
        } catch (_) {}
        throw new Error(errMessage);
      }

      if (!response.body) {
        throw new Error('ReadableStream not supported by browser.');
      }

      reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        if (signal?.aborted) {
          handleAbort();
          return;
        }

        let readResult;
        try {
          readResult = await reader.read();
        } catch (readErr) {
          // If connection was reset/closed but we already have content or finished
          if (isServerComplete || targetText.length > 50) {
            console.warn('Stream socket closed after content delivery (ignoring):', readErr.message);
            isServerComplete = true;
            break;
          }
          throw readErr;
        }

        const { done, value } = readResult;
        if (done) {
          isServerComplete = true;
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data:')) continue;

          const dataStr = trimmed.replace(/^data:\s*/, '');
          if (dataStr === '[DONE]') {
            isServerComplete = true;
            break;
          }

          try {
            const parsed = JSON.parse(dataStr);
            if (parsed.error) {
              throw new Error(parsed.error);
            }
            if (parsed.chunk) {
              targetText += parsed.chunk;
            }
          } catch (jsonErr) {
            if (jsonErr.message && !jsonErr.message.includes('JSON')) {
              throw jsonErr;
            }
          }
        }

        if (isServerComplete) {
          break;
        }
      }

      // Process trailing buffer if any
      if (buffer.trim().startsWith('data:')) {
        const dataStr = buffer.trim().replace(/^data:\s*/, '');
        if (dataStr !== '[DONE]') {
          try {
            const parsed = JSON.parse(dataStr);
            if (parsed.chunk) targetText += parsed.chunk;
          } catch (_) {}
        }
      }

      isServerComplete = true;
      // Note: do not finish immediately here; let the smooth interval
      // drain remaining targetText into displayedText and call finishGracefully().

    } catch (error) {
      if (error.name === 'AbortError' || signal?.aborted) {
        handleAbort();
        return;
      }

      // If we already received substantial content from the server, don't show an error toast
      if (targetText.length > 50) {
        console.warn('Recovered from socket termination after content reception:', error.message);
        isServerComplete = true;
        return;
      }

      if (animTimer) {
        clearInterval(animTimer);
        animTimer = null;
      }

      if (onError) {
        onError(error);
      } else {
        reject(error);
      }
    }
  });
}
