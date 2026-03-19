interface LoadingSpinnerProps {
  fullScreen?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function LoadingSpinner({ fullScreen = true, size = 'md' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-24 h-24',
    md: 'w-48 h-48',
    lg: 'w-72 h-72',
  };

  const spinner = (
    <img
      src="/the-manager-visuals-10_(1).png"
      alt="Loading"
      className={sizeClasses[size]}
      style={{
        animation: 'flipY 1.5s infinite',
        transformStyle: 'preserve-3d',
      }}
    />
  );

  if (fullScreen) {
    return (
      <>
        <style>{`
          @keyframes flipY {
            from {
              transform: rotateY(0deg);
            }
            to {
              transform: rotateY(360deg);
            }
          }
        `}</style>
        <div className="fixed inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-50">
          {spinner}
        </div>
      </>
    );
  }

  return (
    <>
      <style>{`
        @keyframes flipY {
          from {
            transform: rotateY(0deg);
          }
          to {
            transform: rotateY(360deg);
          }
        }
      `}</style>
      <div className="flex items-center justify-center py-12">
        {spinner}
      </div>
    </>
  );
}
