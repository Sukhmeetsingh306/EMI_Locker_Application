export default function LoginLayout({ children }) {
    // Root html/body are already in app/layout.js
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-black flex items-center justify-center">
        {children}
      </div>
    );
  }
  