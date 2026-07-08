/**
 * Blocking inline script that applies the saved theme to <html> BEFORE the
 * browser paints — so there's no dark→light flash on load. Defaults to dark
 * (the "Cinematic" look) when the visitor has no saved preference.
 *
 * Rendered as the first child of <body>; it runs synchronously during parse.
 */
export function ThemeScript() {
  const js = `(function(){try{var t=localStorage.getItem('theme');if(t==='light'){document.documentElement.classList.add('light')}else{document.documentElement.classList.remove('light')}}catch(e){}})();`;
  return <script dangerouslySetInnerHTML={{ __html: js }} />;
}
