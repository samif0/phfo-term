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
        <p className="writing-text">{content}</p>
    </section>
  );
}