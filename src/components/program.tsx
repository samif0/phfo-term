import "./components.css";

type ProgramProps = {
    content: string;
}

export default function Program({ content }: ProgramProps) {
  return (
    <section className="program-section">
        <p>{content}</p>
    </section>
  );
}