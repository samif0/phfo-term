import "./components.css";

type ProgramProps = {
  content: string;
  videoName?: string;
}

export default function Program({ content, videoName}: ProgramProps) {
  const videoSrc = `/videos/${videoName}`;
  return (
    <section className="program-section">
      <div className="program-content-wrapper">
        <p>{content}</p>
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