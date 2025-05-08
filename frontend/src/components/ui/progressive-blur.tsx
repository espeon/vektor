interface ProgressiveBlurProps {
  reverse?: boolean;
}

export default function ProgressiveBlur({
  reverse = false,
}: ProgressiveBlurProps) {
  // Create gradient strings based on the reverse parameter
  const createGradient = (stops: string) => {
    return reverse
      ? `linear-gradient(to top, ${stops})`
      : `linear-gradient(${stops})`;
  };

  // Adjust the background gradient based on direction
  const bgGradient = reverse
    ? 'from-background/80 via-background/90 to-transparent bg-gradient-to-b'
    : 'from-background/80 via-background/70 to-transparent bg-gradient-to-t';

  return (
    <div className="pointer-events-none absolute right-0 bottom-0 left-0 h-full w-full -z-50">
      <div
        className="absolute inset-0 backdrop-blur-[0.4px]"
        style={{
          maskImage: createGradient(
            'rgba(0,0,0,0),rgba(0,0,0,1) 10%,rgba(0,0,0,1) 30%,rgba(0,0,0,0) 40%',
          ),
          WebkitMaskImage: createGradient(
            'rgba(0,0,0,0),rgba(0,0,0,1) 10%,rgba(0,0,0,1) 30%,rgba(0,0,0,0) 40%',
          ),
        }}
      ></div>
      <div
        className="absolute inset-0 backdrop-blur-[0.6px]"
        style={{
          maskImage: createGradient(
            'rgba(0,0,0,0) 15%,rgba(0,0,0,1) 20%,rgba(0,0,0,1) 40%,rgba(0,0,0,0) 50%',
          ),
          WebkitMaskImage: createGradient(
            'rgba(0,0,0,0) 15%,rgba(0,0,0,1) 20%,rgba(0,0,0,1) 40%,rgba(0,0,0,0) 50%',
          ),
        }}
      ></div>
      <div
        className="absolute inset-0 backdrop-blur-[0.8px]"
        style={{
          maskImage: createGradient(
            'rgba(0,0,0,0) 20%,rgba(0,0,0,1) 30%,rgba(0,0,0,1) 50%,rgba(0,0,0,0) 60%',
          ),
          WebkitMaskImage: createGradient(
            'rgba(0,0,0,0) 20%,rgba(0,0,0,1) 30%,rgba(0,0,0,1) 50%,rgba(0,0,0,0) 60%',
          ),
        }}
      ></div>
      <div
        className="absolute inset-0 backdrop-blur-[1.5px]"
        style={{
          maskImage: createGradient(
            'rgba(0,0,0,0) 30%,rgba(0,0,0,1) 40%,rgba(0,0,0,1) 60%,rgba(0,0,0,0) 70%',
          ),
          WebkitMaskImage: createGradient(
            'rgba(0,0,0,0) 30%,rgba(0,0,0,1) 40%,rgba(0,0,0,1) 60%,rgba(0,0,0,0) 70%',
          ),
        }}
      ></div>
      <div
        className="absolute inset-0 backdrop-blur-[2px]"
        style={{
          maskImage: createGradient(
            'rgba(0,0,0,0) 40%,rgba(0,0,0,1) 60%,rgba(0,0,0,1) 80%,rgba(0,0,0,0) 90%',
          ),
          WebkitMaskImage: createGradient(
            'rgba(0,0,0,0) 40%,rgba(0,0,0,1) 60%,rgba(0,0,0,1) 80%,rgba(0,0,0,0) 90%',
          ),
        }}
      ></div>
      <div
        className="absolute inset-0 backdrop-blur-[2px]"
        style={{
          maskImage: createGradient('rgba(0,0,0,0) 60%,rgba(0,0,0,1) 80%'),
          WebkitMaskImage: createGradient(
            'rgba(0,0,0,0) 60%,rgba(0,0,0,1) 80%',
          ),
        }}
      ></div>

      <div className={`absolute inset-0 ${bgGradient}`}></div>
    </div>
  );
}
