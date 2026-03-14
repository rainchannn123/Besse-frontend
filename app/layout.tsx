import type { Metadata } from 'next';
import { Geist, Geist_Mono, Poppins, Righteous, Roboto_Mono } from 'next/font/google';
import { ToastContainer } from 'react-toastify';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

const robotoMono = Roboto_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-roboto-mono',
});
const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-poppins',
});

const righteous = Righteous({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-righteous',
});

export const metadata: Metadata = {
  title: 'Besse',
  description:
    'Blockchain-enabled ecosystem for sustainable waste management and recycling operations.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${robotoMono.variable} ${poppins.variable} ${righteous.variable} antialiased `}
      >
        {children}
        <ToastContainer />
      </body>
    </html>
  );
}
