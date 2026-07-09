"use client";

import { useEffect } from "react";

export default function CustomMarkupClient({ markup, target = "body" }) {
  useEffect(() => {
    if (!markup || !markup.trim()) return;

    try {
      // Create a document fragment to parse the HTML string
      const range = document.createRange();
      const fragment = range.createContextualFragment(markup);

      // Track the elements we insert so we can clean them up if needed
      const insertedNodes = Array.from(fragment.childNodes);

      const targetEl = target === "head" ? document.head : document.body;

      // Append all parsed elements to the target element (head or body)
      targetEl.appendChild(fragment);

      return () => {
        // Cleanup on unmount or update
        insertedNodes.forEach((node) => {
          if (node.parentNode) {
            try {
              node.parentNode.removeChild(node);
            } catch (err) {
              // Ignore if already removed by other scripts
            }
          }
        });
      };
    } catch (err) {
      console.error("[CustomMarkupClient] Failed to inject custom markup:", err);
    }
  }, [markup, target]);

  return null;
}
