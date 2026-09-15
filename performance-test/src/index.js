export default {
  async fetch(request, env, ctx) {
    // Handle preflight CORS requests
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(),
      });
    }

    const url = new URL(request.url);
    const hostParts = url.hostname.split(".");
    const subdomain = hostParts.length > 2 ? hostParts[0] : "root";

    // Simulated latency (default 200ms, override with ?delay=XXX)
    const delay = parseInt(url.searchParams.get("delay")) || 200;
    await sleep(delay);

    return new Response(
      JSON.stringify({
        ok: true,
        subdomain,
        delay,
        timestamp: Date.now(),
      }),
      {
        headers: {
          "content-type": "application/json",
          "cache-control": "no-store",
          ...corsHeaders(),
        },
      }
    );
  },
};

// Helper for CORS headers
function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,Authorization",
    "Access-Control-Max-Age": "0", // cache preflight for 1 day
  };
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}