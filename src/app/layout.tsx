import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Islah Audio',
  description: 'Stream Islamic audio content from Islah BD',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}