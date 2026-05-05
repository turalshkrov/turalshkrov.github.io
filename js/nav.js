(function () {
  const NAV_HTML = `
<nav class="navbar">
  <div class="navbar-inner">
    <a href="/index.html" class="nav-logo">
      <span class="prompt">~$</span> turalshkrov
    </a>
    <button class="nav-toggle" aria-label="Toggle menu" aria-expanded="false">
      <span></span><span></span><span></span>
    </button>
    <ul class="nav-links">
      <li><a href="/about.html">About</a></li>
      <li><a href="/blog.html">Blog</a></li>
      <li><a href="/writeups.html">Write-ups</a></li>
      <li><a href="/cheatsheets.html">Cheat Sheets</a></li>
      <li><a href="/projects.html">Projects</a></li>
    </ul>
  </div>
</nav>`;

  const FOOTER_HTML = `
<footer class="footer">
  <span>// built with curiosity &amp; caffeine — <a href="https://github.com/turalshkrov" target="_blank" rel="noopener">github</a></span>
</footer>`;

  document.addEventListener('DOMContentLoaded', () => {
    const navTarget = document.getElementById('navbar-placeholder');
    if (navTarget) navTarget.outerHTML = NAV_HTML;

    const footerTarget = document.getElementById('footer-placeholder');
    if (footerTarget) footerTarget.outerHTML = FOOTER_HTML;
  });
})();
