import "./globals.css";

export const metadata = {
  title: "GrowEasy CRM | Intelligent Lead Importer",
  description: "Enterprise CSV lead importer for GrowEasy CRM with dynamic schema mapping and automated data ingestion.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
