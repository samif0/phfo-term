import "./components.css";

type ProgramProps = {
  content: string;
  videoName?: string;
  githubUrl?: string;
}

export default function Program({ content, videoName, githubUrl }: ProgramProps) {
  const videoSrc = `/videos/${videoName}`;
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
        
        {videoName && (
          <div className="video-container-minimal">
            <video controls playsInline className="video-minimal">
              <source src={videoSrc} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
        )}
      </div>
    </section>
  );
}