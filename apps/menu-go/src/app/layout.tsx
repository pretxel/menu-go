export const metadata = {
  title: 'Dineqrs',
  description: 'Dineqrs',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
