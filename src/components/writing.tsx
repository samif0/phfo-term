'use client';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import "./components.css";

type WritingProps = {
    title: string;
    content: string;
    date: string;
}

export default function Writing({ title, content, date }: WritingProps) {
  return (
    <section className="writing-section">
        <p className="writing-date">{date}</p>
        <h1 className="writing-title">{title}</h1>
        <div className="writing-text">
          <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
            {content}
          </ReactMarkdown>
        </div>
    </section>
  );
}