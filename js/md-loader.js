
(function () {
  'use strict';

  function parseFrontmatter(raw) {
    const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
    if (!match) return { meta: {}, content: raw };

    const meta = {};
    match[1].split('\n').forEach(line => {
      const colonIdx = line.indexOf(':');
      if (colonIdx === -1) return;
      const key = line.slice(0, colonIdx).trim();
      let   val = line.slice(colonIdx + 1).trim();

      // Strip surrounding quotes
      if ((val.startsWith('"') && val.endsWith('"')) ||
          (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }

      // Arrays  e.g.  ["a", "b", "c"]  or  [a, b, c]
      if (val.startsWith('[') && val.endsWith(']')) {
        val = val.slice(1, -1)
          .split(',')
          .map(s => s.trim().replace(/^["']|["']$/g, ''))
          .filter(Boolean);
      }

      meta[key] = val;
    });

    return { meta, content: match[2] };
  }

  function renderPostHeader(meta, category) {
    const categoryLabels = {
      writeup:    '📋 CTF Write-up',
      blog:       '✍️  Blog',
      cheatsheet: '📄 Cheat Sheet',
      project:    '🛠️  Project',
    };

    const label = categoryLabels[category] || category || '📄 Post';

    // Tags
    const tags = Array.isArray(meta.tags) ? meta.tags : [];
    const tagsHtml = tags.length
      ? `<div class="post-tags">${tags.map(t => `<span class="tag">${t}</span>`).join('')}</div>`
      : '';

    // Difficulty badge (write-ups)
    const diff = meta.difficulty
      ? `<span class="tag difficulty-${meta.difficulty.toLowerCase()}">${meta.difficulty}</span>`
      : '';

    // Language badge (projects)
    const lang = meta.language
      ? `<span class="tag tag-accent">${meta.language}</span>`
      : '';

    // Status badge (projects)
    let statusHtml = '';
    if (meta.status) {
      const statusClass = { active: 'status-active', wip: 'status-wip', archived: 'status-archived' }[meta.status.toLowerCase()] || '';
      statusHtml = `<span class="project-status ${statusClass}">${meta.status}</span>`;
    }

    // GitHub link (projects)
    const githubHtml = meta.github
      ? `<a href="${meta.github}" target="_blank" rel="noopener" class="btn btn-outline" style="font-size:0.78rem;padding:0.35rem 0.75rem;">
           <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>
           GitHub
         </a>`
      : '';

    return `
      <div class="post-category">${label}</div>
      <h1 class="post-title">${meta.title || 'Untitled'}</h1>
      <div class="post-meta">
        ${meta.date ? `<span>📅 ${meta.date}</span>` : ''}
        ${meta.platform ? `<span>🎯 ${meta.platform}</span>` : ''}
        ${diff}
        ${lang}
        ${statusHtml}
        ${githubHtml}
      </div>
      ${tagsHtml}
    `;
  }

  function enhanceCodeBlocks(container) {
    container.querySelectorAll('pre').forEach(pre => {
      const code = pre.querySelector('code');
      const wrapper = document.createElement('div');
      wrapper.className = 'code-block-wrapper';

      const lang = code
        ? ([...code.classList].find(c => c.startsWith('language-'))?.replace('language-', '') || '')
        : '';

      // Single element: lang badge + copy trigger
      const badge = document.createElement('button');
      badge.className = 'code-lang-label';
      badge.dataset.lang = lang || 'code';
      badge.textContent = lang || 'code';

      badge.addEventListener('click', () => {
        const text = code ? code.innerText : pre.innerText;
        navigator.clipboard.writeText(text).then(() => {
          badge.textContent = 'copied!';
          badge.classList.add('copied');
          setTimeout(() => {
            badge.textContent = lang || 'code';
            badge.classList.remove('copied');
          }, 2000);
        });
      });

      // Hover: swap label to "copy" / restore on leave
      badge.addEventListener('mouseenter', () => {
        if (!badge.classList.contains('copied')) {
          badge.textContent = 'copy';
          badge.classList.add('copy-btn');
        }
      });
      badge.addEventListener('mouseleave', () => {
        if (!badge.classList.contains('copied')) badge.textContent = lang || 'code';
      });

      pre.parentNode.insertBefore(wrapper, pre);
      wrapper.appendChild(pre);
      wrapper.appendChild(badge);
    });
  }

  async function loadPost() {
    const params   = new URLSearchParams(window.location.search);
    const file     = params.get('file');
    const category = params.get('cat') || '';

    const headerEl  = document.getElementById('post-header');
    const bodyEl    = document.getElementById('post-body');
    const titleEl   = document.querySelector('title');

    if (!file || !headerEl || !bodyEl) return;

    bodyEl.innerHTML = `
      <div class="loading">
        <div class="spinner"></div>
        <span>loading post...</span>
      </div>`;

    try {
      const GITHUB_RAW = 'https://raw.githubusercontent.com/turalshkrov/turalshkrov.github.io/main';
      const fileUrl = GITHUB_RAW + '/' + file.replace(/^\/+/, '');
      const res = await fetch(fileUrl);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const raw = await res.text();

      const { meta, content } = parseFrontmatter(raw);

      if (titleEl && meta.title) titleEl.textContent = meta.title;

      headerEl.innerHTML = renderPostHeader(meta, category);

      if (typeof marked === 'undefined') throw new Error('marked.js not loaded');
      bodyEl.innerHTML = marked.parse(content);

      if (typeof hljs !== 'undefined') {
        bodyEl.querySelectorAll('pre code').forEach(block => {
          hljs.highlightElement(block);
        });
      }

      enhanceCodeBlocks(bodyEl);

    } catch (err) {
      bodyEl.innerHTML = `
        <div class="empty-state">
          <div class="icon">⚠️</div>
          <h3>Could not load post</h3>
          <p style="font-family:var(--font-mono);font-size:0.8rem;color:var(--text-muted)">${err.message}</p>
        </div>`;
    }
  }

  window.loadListing = async function (jsonPath, containerSel, category) {
    const container = document.querySelector(containerSel);
    const searchInput = document.getElementById('search-input');
    if (!container) return;

    container.innerHTML = `<div class="loading"><div class="spinner"></div><span>loading...</span></div>`;

    let posts = [];
    try {
      const res = await fetch(jsonPath);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      posts = await res.json();
    } catch (err) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="icon">📭</div>
          <h3>No posts yet</h3>
          <p>Check back soon.</p>
        </div>`;
      return;
    }

    function renderCards(items) {
      if (!items.length) {
        container.innerHTML = `
          <div class="empty-state">
            <div class="icon">🔍</div>
            <h3>No results found</h3>
            <p>Try a different search term.</p>
          </div>`;
        return;
      }

      container.innerHTML = items.map(post => {
        const tags = (post.tags || []).map(t => `<span class="tag">${t}</span>`).join('');

        const diffBadge = post.difficulty
          ? `<span class="tag difficulty-${post.difficulty.toLowerCase()}">${post.difficulty}</span>` : '';

        const langBadge = post.language
          ? `<span class="card-lang"><span class="lang-dot"></span>${post.language}</span>` : '';

        let statusBadge = '';
        if (post.status) {
          const sc = { active: 'status-active', wip: 'status-wip', archived: 'status-archived' }[post.status.toLowerCase()] || '';
          statusBadge = `<span class="project-status ${sc}">${post.status}</span>`;
        }

        const postUrl = `template/post.html?file=${encodeURIComponent(post.file)}&cat=${category}`;

        return `
          <article class="card" onclick="window.location='${postUrl}'" role="button" tabindex="0"
                   onkeydown="if(event.key==='Enter')window.location='${postUrl}'">
            <div class="card-meta">
              <span class="card-date">${post.date || ''}</span>
              <div style="display:flex;gap:0.35rem;align-items:center;">
                ${diffBadge}
                ${statusBadge}
              </div>
            </div>
            <h2>${post.title}</h2>
            <p class="card-excerpt">${post.excerpt || ''}</p>
            <div class="card-tags">
              ${langBadge}
              ${tags}
            </div>
            <div class="card-footer">
              <span class="card-read-more">Read more</span>
            </div>
          </article>`;
      }).join('');
    }

    renderCards(posts);

    if (searchInput) {
      searchInput.addEventListener('input', () => {
        const q = searchInput.value.toLowerCase();
        const filtered = posts.filter(p =>
          p.title.toLowerCase().includes(q) ||
          (p.excerpt || '').toLowerCase().includes(q) ||
          (p.tags || []).some(t => t.toLowerCase().includes(q)) ||
          (p.language || '').toLowerCase().includes(q)
        );
        renderCards(filtered);
      });
    }
  };

  document.addEventListener('DOMContentLoaded', loadPost);

})();