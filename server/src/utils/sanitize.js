const sanitizeHtml = require('sanitize-html');

function normalizeEmail(email) {
  if (!email || typeof email !== 'string') return '';
  return email.trim().toLowerCase();
}

function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const re = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  return re.test(email.trim());
}

function renderTemplate(text, data = {}) {
  if (!text) return '';
  let result = text;
  const name = data.name || data.recipient_name || 'Hiring Manager';
  const title = data.title || data.recipient_title || 'Software Engineer';
  const company = data.company || data.recipient_company || 'your organization';

  // Replace case-insensitively {{Name}}, {{Title}}, {{Company}}
  result = result.replace(/{{\s*name\s*}}/gi, name);
  result = result.replace(/{{\s*title\s*}}/gi, title);
  result = result.replace(/{{\s*company\s*}}/gi, company);

  return result;
}

function cleanHtml(html) {
  if (!html) return '';
  return sanitizeHtml(html, {
    allowedTags: [
      'html', 'head', 'body', 'meta', 'title', 'style',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'br', 'b', 'i', 'strong', 'em',
      'a', 'ul', 'ol', 'li', 'span', 'div', 'hr', 'blockquote', 'table', 'tbody', 'tr', 'td', 'th'
    ],
    allowedAttributes: {
      a: ['href', 'title', 'target', 'rel', 'style'],
      '*': ['style', 'class', 'align', 'valign', 'width', 'cellpadding', 'cellspacing', 'border']
    },
    allowedSchemes: ['http', 'https', 'mailto']
  });
}

/**
 * Transforms plain-text / markdown / mixed content into an executive, 
 * beautifully styled corporate HTML email that renders in Gmail, Outlook, and Apple Mail.
 */
function formatEmailHtml(rawContent) {
  if (!rawContent) return '';

  let content = rawContent.trim();

  // 1. Convert Markdown bold **text** to <strong>text</strong>
  content = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

  // 2. Convert bare URLs (e.g. https://github.com/...) into clickable anchor tags
  const urlRegex = /(?<!href=["'])(https?:\/\/[^\s<]+)/gi;
  content = content.replace(urlRegex, (url) => {
    return `<a href="${url}" target="_blank" rel="noopener noreferrer" style="color: #1d4ed8; text-decoration: underline;">${url}</a>`;
  });

  // 3. If content does NOT contain HTML paragraph tags or breaks, convert newlines to HTML
  const hasParagraphs = /<\s*p[^>]*>/i.test(content) || /<\s*div[^>]*>/i.test(content);

  let formattedBody = '';

  if (!hasParagraphs) {
    // Split by 2 or more newlines into distinct paragraphs
    const paragraphs = content.split(/\r?\n\s*\r?\n/);
    formattedBody = paragraphs
      .map(p => {
        const trimmed = p.trim();
        if (!trimmed) return '';
        // Convert single newline inside paragraph to <br />
        const withBreaks = trimmed.replace(/\r?\n/g, '<br />');
        return `<p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.65; color: #1f2937;">${withBreaks}</p>`;
      })
      .filter(Boolean)
      .join('\n');
  } else {
    formattedBody = content;
  }

  // 4. Wrap in a clean, executive, cross-client email template
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 15px; line-height: 1.65; color: #1f2937;">
  <div style="max-width: 620px; margin: 0 auto; padding: 20px 24px;">
    ${formattedBody}
  </div>
</body>
</html>`;
}

// Escape formula characters to prevent CSV injection in spreadsheet software
function sanitizeCsvCell(value) {
  if (value === null || value === undefined) return '';
  let str = String(value);
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    str = `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

module.exports = {
  normalizeEmail,
  isValidEmail,
  renderTemplate,
  cleanHtml,
  formatEmailHtml,
  sanitizeCsvCell
};
