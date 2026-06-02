"use client";

import "highlight.js/styles/github.css";

import hljs from "highlight.js/lib/core";
import javascript from "highlight.js/lib/languages/javascript";
import { useLayoutEffect, useRef } from "react";

import styles from "./styles.module.scss";

hljs.registerLanguage("javascript", javascript);

interface CodeBlockProps {
  title: string;
  code: string;
}

/**
 * 代码高亮块 — 使用 highlight.js 对代码进行语法着色
 */
export default function CodeBlock({ title, code }: CodeBlockProps) {
  const codeRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const el = codeRef.current;
    if (!el) return;

    el.removeAttribute("data-highlighted");
    hljs.highlightElement(el);
  }, [code]);

  return (
    <section className={styles.section}>
      <h2 className={styles.title}>{title}</h2>
      <pre className={styles.pre}>
        <code ref={codeRef} className={styles.code}>
          {code}
        </code>
      </pre>
    </section>
  );
}
