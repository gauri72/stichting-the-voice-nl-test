import { useState } from "react";

export default function EventCardMedia({ src, alt = "", className = "", imgClassName = "" }) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className={`relative overflow-hidden bg-evx-bg-muted ${className}`}>
      {!loaded ? (
        <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-evx-bg-muted via-evx-border/40 to-evx-bg-muted" aria-hidden="true" />
      ) : null}
      {src ? (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          onLoad={() => setLoaded(true)}
          className={`h-full w-full object-cover transition-opacity duration-500 ${loaded ? "opacity-100" : "opacity-0"} ${imgClassName}`}
        />
      ) : null}
    </div>
  );
}
