import { Context } from 'hono'

// Bible Contest Page Component - Simple redirect handler for Cloudflare
export async function BibleContest({ c }: { c: Context }) {
  // Use JavaScript redirect to avoid server-side redirect loops
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>GospelWays Bible Contest</title>
    <script>
        // Redirect to the HTML file using JavaScript to avoid redirect loops
        window.location.replace('/bible-contest.html');
    </script>
</head>
<body>
    <p>Redirecting to Bible Contest...</p>
</body>
</html>`;

  c.header('Content-Type', 'text/html');
  c.header('Cache-Control', 'public, max-age=3600');
  return c.html(html);
}
