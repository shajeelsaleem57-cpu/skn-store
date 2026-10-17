type SafeHtmlProps = {
  html: string;
  className?: string;
};

/**
 * Renders admin-authored rich HTML (product descriptions, CMS pages, blog posts).
 * Content comes from the store admin, not from untrusted users.
 */
export default function SafeHtml({ html, className }: SafeHtmlProps) {
  return <div className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}
