// app/layout.js
import './globals.css';
import ReduxProvider from '@/src/providers/ReduxProvider';

export const metadata = {
  title: 'EMI APP Locker',
  description: 'Admin control panel for EMI APP Locker',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        {/* Dark mode initialization - static script is safe as it's hardcoded */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const html = document.documentElement;
                  html.classList.add('dark');
                  html.style.colorScheme = 'dark';
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body>
        <ReduxProvider>{children}</ReduxProvider>
      </body>
    </html>
  );
}
