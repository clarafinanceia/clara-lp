import type { APIRoute } from 'astro';

export const prerender = false; // Força SSR para esta rota

export const POST: APIRoute = async ({ request }) => {
  const railwayUrl = import.meta.env.RAILWAY_API_URL;
  const railwayKey = import.meta.env.RAILWAY_API_KEY;

  if (!railwayUrl || !railwayKey) {
    console.error('Missing RAILWAY_API_URL or RAILWAY_API_KEY env vars');
    return new Response(
      JSON.stringify({ error: 'Server misconfiguration' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Validar Content-Type
  const contentType = request.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    return new Response(
      JSON.stringify({ error: 'Content-Type must be application/json' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Parse do body
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(
      JSON.stringify({ error: 'Invalid JSON' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const { email } = body;

  // Validação de email
  if (!email || typeof email !== 'string') {
    return new Response(
      JSON.stringify({ error: 'Email is required' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return new Response(
      JSON.stringify({ error: 'Invalid email format' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Fazer request para Railway com autenticação por API key
  try {
    const railwayResponse = await fetch(railwayUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': railwayKey,
      },
      body: JSON.stringify({ email }),
    });

    const responseData = await railwayResponse.json().catch(() => ({}));

    // Proxy da resposta do Railway
    return new Response(
      JSON.stringify(responseData),
      {
        status: railwayResponse.status,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error proxying to Railway:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to connect to backend' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// Bloquear outros métodos HTTP
export const GET: APIRoute = async () => {
  return new Response(
    JSON.stringify({ error: 'Method not allowed' }),
    { status: 405, headers: { 'Content-Type': 'application/json' } }
  );
};
