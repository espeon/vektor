import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import rehypeHighlight from 'rehype-highlight';

export function Markdown({
  content,
  isMobile,
  setIsSourcesOpen,
  processResponseWithSourceLinks,
}: {
  content: string;
  isMobile: boolean;
  setIsSourcesOpen: (isOpen: boolean) => void;
  processResponseWithSourceLinks: (content: string) => string;
}) {
  return (
    <div className="prose prose-slate dark:prose-invert max-w-none prose-a:no-underline">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, rehypeSanitize, rehypeHighlight]}
        components={{
          a: ({ node, ...props }) => {
            // Handle source links
            if (
              props.href?.startsWith('#source-') ||
              props.className === 'source-link'
            ) {
              return (
                <a
                  {...props}
                  className="source-link mx-0.5 px-1 border-1 rounded no-underline text-slate-400 hover:text-slate-500 transition-colors duration-300"
                  data-source-index={props.href?.replace('#source-', '')}
                  onClick={(e) => {
                    e.preventDefault();
                    const sourceIndex = (e.target as HTMLElement).getAttribute(
                      'data-source-index',
                    );
                    if (sourceIndex) {
                      // Open sources panel on mobile
                      if (isMobile) {
                        setIsSourcesOpen(true);
                      } else {
                        // Make sure sources panel is open on desktop
                        setIsSourcesOpen(true);
                      }

                      // Scroll to the source
                      setTimeout(() => {
                        const sourceElement = document.getElementById(
                          `source-${sourceIndex}`,
                        );
                        if (sourceElement) {
                          sourceElement.scrollIntoView({ behavior: 'smooth' });
                          sourceElement.classList.add('bg-primary/10');
                          setTimeout(() => {
                            sourceElement.classList.remove('bg-primary/10');
                          }, 2000);
                        }
                      }, 100);
                    }
                  }}
                >
                  {typeof props.children === 'string'
                    ? props.children.replace('[', '').replace(']', '')
                    : ''}
                </a>
              );
            }

            // Regular links
            return <a {...props} target="_blank" rel="noopener noreferrer" />;
          },
        }}
      >
        {processResponseWithSourceLinks(content.replace(/---/g, ''))}
      </ReactMarkdown>
    </div>
  );
}
