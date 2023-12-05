export const Link = (url: URL, text: string) => {
  return (
    <a
      className="app-link"
      href={url.toString()}
      target="_blank"
      rel="noopener noreferrer"
    >
      {text}
    </a>
  );
};
