const URL_REGEX = /(https?:\/\/[^\s)\]}"']+)/g;
const MARKDOWN_LINK_REGEX = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;

function linkifyRawUrls(text, keyPrefix = "url") {
  if (!text) return [];

  const parts = [];
  let lastIndex = 0;
  let match;
  let tokenIndex = 0;

  while ((match = URL_REGEX.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    const url = match[0];
    parts.push(
      <a
        key={`${keyPrefix}-${tokenIndex}`}
        href={url}
        target="_blank"
        rel="noreferrer"
        className="notification-inline-link"
      >
        {url}
      </a>
    );

    lastIndex = match.index + url.length;
    tokenIndex += 1;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
}

function renderInlineText(text, keyPrefix = "inline") {
  if (!text) return [];

  const nodes = [];
  let lastIndex = 0;
  let match;
  let tokenIndex = 0;

  while ((match = MARKDOWN_LINK_REGEX.exec(text)) !== null) {
    const fullMatch = match[0];
    const label = match[1];
    const url = match[2];

    if (match.index > lastIndex) {
      nodes.push(...linkifyRawUrls(text.slice(lastIndex, match.index), `${keyPrefix}-txt-${tokenIndex}`));
    }

    nodes.push(
      <a
        key={`${keyPrefix}-md-${tokenIndex}`}
        href={url}
        target="_blank"
        rel="noreferrer"
        className="notification-inline-link"
      >
        {label}
      </a>
    );

    lastIndex = match.index + fullMatch.length;
    tokenIndex += 1;
  }

  if (lastIndex < text.length) {
    nodes.push(...linkifyRawUrls(text.slice(lastIndex), `${keyPrefix}-txt-tail`));
  }

  return nodes;
}

function renderParagraphBlock(chunk, key) {
  const lines = chunk.split("\n").map((line) => line.trimRight());

  return (
    <p key={key}>
      {lines.map((line, index) => (
        <span key={`${key}-line-${index}`}>
          {renderInlineText(line, `${key}-${index}`)}
          {index < lines.length - 1 ? <br /> : null}
        </span>
      ))}
    </p>
  );
}

function renderListBlock(chunk, key) {
  const lines = chunk
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const isUnordered = lines.every((line) => /^[-*•]\s+/.test(line));
  const isOrdered = lines.every((line) => /^\d+\.\s+/.test(line));

  if (!isUnordered && !isOrdered) {
    return renderParagraphBlock(chunk, key);
  }

  const ListTag = isOrdered ? "ol" : "ul";

  return (
    <ListTag key={key}>
      {lines.map((line, index) => {
        const content = isOrdered
          ? line.replace(/^\d+\.\s+/, "")
          : line.replace(/^[-*•]\s+/, "");

        return <li key={`${key}-item-${index}`}>{renderInlineText(content, `${key}-item-${index}`)}</li>;
      })}
    </ListTag>
  );
}

export function renderNotificationMessage(message) {
  const normalized = String(message || "").replace(/\r\n/g, "\n").trim();

  if (!normalized) {
    return <p>No description provided.</p>;
  }

  const chunks = normalized.split(/\n\s*\n/).map((chunk) => chunk.trim()).filter(Boolean);

  return chunks.map((chunk, index) => {
    const lines = chunk.split("\n").map((line) => line.trim()).filter(Boolean);
    const looksLikeList = lines.length > 0 && lines.every((line) => /^([-*•]|\d+\.)\s+/.test(line));

    return looksLikeList
      ? renderListBlock(chunk, `block-${index}`)
      : renderParagraphBlock(chunk, `block-${index}`);
  });
}
