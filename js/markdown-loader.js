// Markdown 포스트 로더
class MarkdownLoader {
  constructor(postsDir) {
    this.postsDir = postsDir;
    this.posts = [];
  }

  // 포스트 목록 로드
  async loadPosts() {
    try {
      const response = await fetch(`${this.postsDir}/index.json`);
      if (!response.ok) {
        console.warn('index.json not found, trying to load posts from directory');
        return [];
      }
      const data = await response.json();
      this.posts = data.posts || [];
      return this.posts;
    } catch (error) {
      console.error('Error loading posts:', error);
      return [];
    }
  }

  // 개별 포스트 로드
  async loadPost(filename) {
    try {
      const response = await fetch(`${this.postsDir}/${filename}`);
      if (!response.ok) {
        throw new Error(`Failed to load post: ${filename}`);
      }
      const text = await response.text();
      return this.parseMarkdown(text);
    } catch (error) {
      console.error('Error loading post:', error);
      return null;
    }
  }

  // Markdown 파싱 (YAML frontmatter + Markdown 본문)
  parseMarkdown(text) {
    const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
    const match = text.match(frontmatterRegex);

    if (match) {
      const frontmatterText = match[1];
      const content = match[2];
      
      // 간단한 YAML 파싱
      const frontmatter = {};
      frontmatterText.split('\n').forEach(line => {
        const colonIndex = line.indexOf(':');
        if (colonIndex > 0) {
          const key = line.substring(0, colonIndex).trim();
          let value = line.substring(colonIndex + 1).trim();
          // 배열 처리
          if (value.startsWith('[') && value.endsWith(']')) {
            value = value.slice(1, -1).split(',').map(v => v.trim().replace(/['"]/g, ''));
          } else {
            value = value.replace(/^['"]|['"]$/g, '');
          }
          frontmatter[key] = value;
        }
      });

      return {
        frontmatter,
        content,
        html: marked.parse(content)
      };
    } else {
      // frontmatter가 없으면 전체를 content로 처리
      return {
        frontmatter: {},
        content: text,
        html: marked.parse(text)
      };
    }
  }

  // 포스트 목록 렌더링
  renderPostList(container) {
    if (this.posts.length === 0) {
      container.innerHTML = `
        <div class="note">
          <strong>포스트가 없습니다</strong>
          <span class="muted">새로운 포스트를 추가해보세요.</span>
        </div>
      `;
      return;
    }

    const list = document.createElement('ul');
    list.className = 'rows';
    list.setAttribute('aria-label', '포스트 목록');

    this.posts.forEach(post => {
      const item = document.createElement('li');
      item.className = 'row';
      
      const date = post.date || '날짜 미정';
      const tags = post.tags ? (Array.isArray(post.tags) ? post.tags : [post.tags]) : [];

      item.innerHTML = `
        <div class="row__main">
          <div class="row__title">
            <strong><a href="#" class="post-link" data-filename="${post.filename}">${post.title}</a></strong>
            <span class="row__sub muted">${date}</span>
          </div>
          ${post.description ? `<p class="row__desc">${post.description}</p>` : ''}
          ${tags.length > 0 ? `
            <div class="tags tags--sm" aria-label="태그">
              ${tags.map(tag => `<span class="tag tag--sm">${tag}</span>`).join('')}
            </div>
          ` : ''}
        </div>
        <div class="row__side" aria-label="날짜">
          <span class="muted">${date}</span>
        </div>
      `;

      // 클릭 이벤트
      const link = item.querySelector('.post-link');
      link.addEventListener('click', (e) => {
        e.preventDefault();
        this.showPost(post.filename, container);
      });

      list.appendChild(item);
    });

    container.innerHTML = '';
    container.appendChild(list);
  }

  // 개별 포스트 표시
  async showPost(filename, container) {
    const post = await this.loadPost(filename);
    if (!post) {
      container.innerHTML = `
        <div class="note">
          <strong>오류</strong>
          <span class="muted">포스트를 불러올 수 없습니다.</span>
        </div>
      `;
      return;
    }

    const backButton = document.createElement('div');
    backButton.style.marginBottom = '24px';
    backButton.innerHTML = `
      <a href="#" class="btn" id="back-to-list">← 목록으로</a>
    `;
    backButton.querySelector('#back-to-list').addEventListener('click', (e) => {
      e.preventDefault();
      this.renderPostList(container);
    });

    const postContainer = document.createElement('article');
    postContainer.className = 'block';
    postContainer.style.marginTop = '0';

    const title = post.frontmatter.title || filename.replace('.md', '');
    const date = post.frontmatter.date || '';
    const tags = post.frontmatter.tags ? (Array.isArray(post.frontmatter.tags) ? post.frontmatter.tags : [post.frontmatter.tags]) : [];

    postContainer.innerHTML = `
      <h1>${title}</h1>
      ${date ? `<p class="muted">${date}</p>` : ''}
      ${tags.length > 0 ? `
        <div class="tags" style="margin-top: 12px;" aria-label="태그">
          ${tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
        </div>
      ` : ''}
      <div class="markdown-content" style="margin-top: 24px;">
        ${post.html}
      </div>
    `;

    container.innerHTML = '';
    container.appendChild(backButton);
    container.appendChild(postContainer);

    // 코드 블록 하이라이팅 (선택사항)
    if (typeof hljs !== 'undefined') {
      postContainer.querySelectorAll('pre code').forEach(block => {
        hljs.highlightElement(block);
      });
    }
  }
}
