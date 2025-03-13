import "./components.css";

type ProgramProps = {
  content: string;
  videoName?: string;
  githubUrl?: string;
}

export default function Program({ content, videoName, githubUrl }: ProgramProps) {
  const videoSrc = `/videos/${videoName}`;
  return (
    <section className="program-section">
      <div className="program-content-wrapper">
        <div>
          <p>{content}</p>
          <a href={githubUrl}> {githubUrl} </a>
        </div>
        
        <div className="video-container">
          <div className="video-wrapper">
            <video controls>
              <source src={videoSrc} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
        </div>
      </div>
    </section>
  );
}