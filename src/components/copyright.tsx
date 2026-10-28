export default function Copyright() {
  // On phones this is a frosted bar like the top nav so scrolled text doesn't show
  // through, with side padding that keeps the text clear of the corner buttons.
  // From sm up it is the original faded gradient.
  return (
    <footer className="fixed bottom-0 left-0 right-0 text-center px-24 py-4 text-xs bg-[rgb(var(--background-rgb)/0.85)] backdrop-blur-sm sm:px-4 sm:text-sm sm:opacity-70 sm:bg-transparent sm:bg-gradient-to-t sm:from-black/50 sm:to-transparent sm:backdrop-blur-none z-10">
      <p className="opacity-70 sm:opacity-100">
        <span className="inline-block">© 2026 Sami Fawcett.</span>{' '}
        <span className="inline-block">All rights reserved.</span>
      </p>
    </footer>
  );
}
