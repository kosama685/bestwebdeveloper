(function () {
  "use strict";

  const STORAGE_KEY = "bestwebdeveloper_blog_posts";
  const blogGrid = document.getElementById("blogGrid");
  const searchInput = document.getElementById("blogSearch");
  const filterWrap = document.getElementById("categoryFilters");
  const countEl = document.getElementById("blogCount");
  const emptyEl = document.getElementById("blogEmpty");

  if (!blogGrid) return;

  const escapeHTML = (value = "") =>
    String(value).replace(/[&<>"']/g, (char) => ({
      "&": "and",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    }[char]));

  const normalizePost = (post) => {
    const slug = post.slug || slugify(post.title || "blog-post");
    return {
      id: post.id || slug,
      slug,
      title: post.title || "Untitled Blog",
      metaTitle: post.metaTitle || post.title || "Blog",
      metaDescription: post.metaDescription || post.excerpt || "",
      excerpt: post.excerpt || post.metaDescription || "",
      category: post.category || "SEO",
      url: post.url || `blog/${slug}.html`,
      image: post.image || "assets/images/digital-marketing-services-partner.webp",
      imageAlt: post.imageAlt || post.title || "Best Web Developer blog image",
      author: post.author || "Best Web Developer",
      datePublished: post.datePublished || new Date().toISOString().slice(0, 10),
      dateModified: post.dateModified || new Date().toISOString().slice(0, 10),
      readTime: post.readTime || "5 min read",
      keywords: post.keywords || "",
      content: post.content || "",
      faq: Array.isArray(post.faq) ? post.faq : []
    };
  };

  function slugify(value) {
    return String(value)
      .toLowerCase()
      .trim()
      .replace(/&/g, "and")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
  }

  function getLocalPosts() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      return Array.isArray(saved) ? saved.map(normalizePost) : [];
    } catch (error) {
      console.warn("Could not read local blog posts", error);
      return [];
    }
  }

  function getAllPosts() {
    const basePosts = Array.isArray(window.BWD_BLOG_POSTS) ? window.BWD_BLOG_POSTS.map(normalizePost) : [];
    const localPosts = getLocalPosts();

    const map = new Map();
    [...basePosts, ...localPosts].forEach((post) => {
      if (!post.status || post.status === "published") {
        map.set(post.id || post.slug, post);
      }
    });

    return Array.from(map.values()).sort((a, b) => String(b.datePublished).localeCompare(String(a.datePublished)));
  }

  function renderCategories(posts) {
    if (!filterWrap) return;
    const current = filterWrap.querySelector(".active")?.dataset.filter || "all";
    const categories = ["all", ...new Set(posts.map((post) => post.category).filter(Boolean).sort())];

    filterWrap.innerHTML = categories.map((cat) => {
      const label = cat === "all" ? "All" : cat;
      return `<button class="filter-btn ${cat === current ? "active" : ""}" data-filter="${escapeHTML(cat)}">${escapeHTML(label)}</button>`;
    }).join("");
  }

  function postMatches(post, query, category) {
    const q = query.trim().toLowerCase();
    const searchable = [
      post.title,
      post.excerpt,
      post.category,
      post.metaTitle,
      post.metaDescription,
      post.keywords,
      post.content
    ].join(" ").toLowerCase();

    const matchesQuery = !q || searchable.includes(q);
    const matchesCategory = category === "all" || post.category === category;
    return matchesQuery && matchesCategory;
  }

  function renderPosts() {
    const posts = getAllPosts();
    renderCategories(posts);

    const query = searchInput ? searchInput.value : "";
    const activeCategory = filterWrap?.querySelector(".active")?.dataset.filter || "all";
    const filtered = posts.filter((post) => postMatches(post, query, activeCategory));

    blogGrid.innerHTML = filtered.map((post, index) => `
      <div class="col-md-6 col-xl-4" data-aos="fade-up" data-aos-delay="${[0, 80, 160][index % 3]}">
        <article class="blog-card h-100" data-category="${escapeHTML(post.category)}" data-title="${escapeHTML(post.title)}">
          <a href="${escapeHTML(post.url)}" class="blog-img">
            <img src="${escapeHTML(post.image)}" alt="${escapeHTML(post.imageAlt)}" loading="lazy">
          </a>
          <div class="p-4">
            <span class="blog-cat">${escapeHTML(post.category)}</span>
            <h3><a href="${escapeHTML(post.url)}">${escapeHTML(post.title)}</a></h3>
            <p>${escapeHTML(post.excerpt)}</p>
            <div class="d-flex justify-content-between small text-muted">
              <span>${escapeHTML(post.author)}</span>
              <span>${escapeHTML(post.readTime)}</span>
            </div>
          </div>
        </article>
      </div>
    `).join("");

    if (countEl) {
      countEl.textContent = `${filtered.length} ${filtered.length === 1 ? "article" : "articles"}`;
    }

    if (emptyEl) {
      emptyEl.classList.toggle("d-none", filtered.length !== 0);
    }

    injectItemListSchema(posts);

    if (window.AOS) {
      window.AOS.refreshHard();
    }
  }

  function absoluteUrl(url) {
    if (!url) return "https://bestwebdeveloper.org/";
    if (/^https?:\/\//i.test(url)) return url;
    return "https://bestwebdeveloper.org/" + url.replace(/^\/+/, "");
  }

  function injectItemListSchema(posts) {
    const old = document.getElementById("blogDynamicSchema");
    if (old) old.remove();

    const schema = {
      "@context": "https://schema.org",
      "@type": "ItemList",
      "@id": "https://bestwebdeveloper.org/blog.html#dynamicItemList",
      "itemListElement": posts.map((post, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "url": absoluteUrl(post.url),
        "name": post.title
      }))
    };

    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = "blogDynamicSchema";
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);
  }

  searchInput?.addEventListener("input", renderPosts);

  filterWrap?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-filter]");
    if (!button) return;

    filterWrap.querySelectorAll(".filter-btn").forEach((btn) => btn.classList.remove("active"));
    button.classList.add("active");
    renderPosts();
  });

  window.addEventListener("storage", (event) => {
    if (event.key === STORAGE_KEY) renderPosts();
  });

  renderPosts();
})();
