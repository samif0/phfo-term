'use client';
import ReactMarkdown from 'react-markdown';
import type { Components, ExtraProps } from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import PdfReader, { isPdfHref } from './pdf-reader';
import "./components.css";

type WritingProps = {
    title: string;
    content: string;
    date: string;
}

type MarkdownElement = NonNullable<ExtraProps['node']>;
type MarkdownNode = MarkdownElement['children'][number];

function textOf(node: MarkdownNode): string {
  if (node.type === 'text') return node.value;
  if (node.type === 'element') return node.children.map(textOf).join('');
  return '';
}

/** A paragraph that holds nothing but a link to a PDF is shown as a reader instead of a link. */
function standalonePdfLink(paragraph: MarkdownElement | undefined) {
  const children = paragraph?.children.filter(
    (child) => !(child.type === 'text' && child.value.trim() === '')
  );
  if (children?.length !== 1) return null;

  const [link] = children;
  if (link.type !== 'element' || link.tagName !== 'a') return null;

  const href = link.properties.href;
  if (typeof href !== 'string' || !isPdfHref(href)) return null;

  return { href, title: textOf(link).trim() || 'pdf' };
}

const markdownComponents: Components = {
  p({ node, children, ...props }) {
    const pdf = standalonePdfLink(node);
    if (pdf) return <PdfReader src={pdf.href} title={pdf.title} />;
    return <p {...props}>{children}</p>;
  },
};

export default function Writing({ title, content, date }: WritingProps) {
  return (
    <section className="writing-section">
        <p className="writing-date">{date}</p>
        <h1 className="writing-title">{title}</h1>
        <div className="writing-text">
          <ReactMarkdown
            remarkPlugins={[remarkMath]}
            rehypePlugins={[rehypeKatex]}
            components={markdownComponents}
          >
            {content}
          </ReactMarkdown>
        </div>
    </section>
  );
}
