'use client';

export const AnimatedHeadline = () => {
  const title = 'Vestigio';

  return (
    <h1 className="text-6xl md:text-8xl font-headline font-medium tracking-tighter" aria-label={title}>
      {title.split('').map((char, index) => (
        <span
          key={index}
          className="inline-block transition-opacity duration-500"
          style={{ animation: `fadeIn 0.5s ease-out ${index * 0.1}s forwards`, opacity: 0 }}
          aria-hidden="true"
        >
          {char}
        </span>
      ))}
      <style jsx>{`
        @keyframes fadeIn {
          to {
            opacity: 1;
          }
        }
      `}</style>
    </h1>
  );
};
