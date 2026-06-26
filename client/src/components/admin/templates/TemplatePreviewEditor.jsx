/**
 * Split view: live HTML preview (left) + editable code (right). Pure controlled component —
 * real-time preview-on-edit falls out for free from `html` being a single piece of state
 * shared by both the iframe's srcDoc and the textarea's value, no debouncing needed at this
 * scale (a string in memory, not a network call).
 */
export default function TemplatePreviewEditor({ html, onHtmlChange, readOnly = false }) {
  return (
    <div className="admin-templates__split">
      <div className="admin-templates__split-pane">
        <p className="admin-templates__split-label">Live preview</p>
        <div className="admin-templates__preview-frame-wrap">
          {/* Same sandboxed-iframe pattern AdminBroadcastPage.jsx already uses for its own
              email preview — reused verbatim, no new sandboxing decision needed. */}
          <iframe title="Template preview" className="admin-templates__preview-frame" srcDoc={html} sandbox="allow-same-origin" />
        </div>
      </div>
      <div className="admin-templates__split-pane">
        <p className="admin-templates__split-label">HTML code{readOnly ? " (read-only)" : ""}</p>
        <textarea
          className="admin-templates__code-editor"
          value={html}
          onChange={(e) => onHtmlChange?.(e.target.value)}
          readOnly={readOnly}
          spellCheck={false}
          placeholder="Generated or pasted HTML will appear here…"
        />
      </div>
    </div>
  );
}
