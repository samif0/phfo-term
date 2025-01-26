import "./components.css";

type ThoughtProps = {
    content: string;
    date: string;
}

export default function Thought({ content, date }: ThoughtProps) {
  return (
    <section className="thought-section">
        <p className="thought-text">{content} {date}</p>
    </section>
  );
}