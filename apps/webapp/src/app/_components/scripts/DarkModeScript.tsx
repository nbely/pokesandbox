export function DarkModeScript() {
  const themeScript = `
    (function() {
      const isDark = localStorage.getItem('theme') === 'dark' ||
                     (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
      if (isDark) document.documentElement.classList.add('dark');
    })();
  `;

  return <script dangerouslySetInnerHTML={{ __html: themeScript }} />;
}
