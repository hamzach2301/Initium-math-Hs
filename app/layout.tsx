import type { Metadata } from "next";
import { AppPreferences } from "../components/AppPreferences";
import "./globals.css";

export const metadata: Metadata = {
  title: "Initium Math.HS",
  description: "Academic workspace for the National Mathematical High School of Algiers.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-theme="notion-light" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var key='initium-theme',value=localStorage.getItem(key),themes={'notion-light':1,'notion-dark':1,'akiflow-midnight':1,'warm-sepia':1};if(!themes[value])value=matchMedia('(prefers-color-scheme: dark)').matches?'notion-dark':'notion-light';document.documentElement.dataset.theme=value;document.documentElement.classList.toggle('dark',value==='notion-dark'||value==='akiflow-midnight')}catch(e){}})()` }} />
      </head>
      <body>
        <AppPreferences>{children}</AppPreferences>
      </body>
    </html>
  );
}
