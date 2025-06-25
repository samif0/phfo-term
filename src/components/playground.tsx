import "./components.css";

type PlaygroundProps = {
  content: string;
  githubUrl?: string;
}

export default function Playground({ content, githubUrl }: PlaygroundProps) {
  return (
    <section className="program-section-minimal">
      <div className="program-content-minimal">
        <p className="program-description">{content}</p>
        
        {githubUrl && (
          <a href={githubUrl} className="program-github-link">
            <span className="github-icon">↗</span>
            View on GitHub
          </a>
        )}
      </div>
    </section>
  );
}