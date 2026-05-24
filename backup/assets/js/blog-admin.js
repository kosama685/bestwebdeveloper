(function () {
  "use strict";

  const STORAGE_KEY = "bestwebdeveloper_blog_posts";
  const TODAY = new Date().toISOString().slice(0, 10);

  const fields = {
    postId: document.getElementById("postId"),
    title: document.getElementById("title"),
    category: document.getElementById("category"),
    slug: document.getElementById("slug"),
    readTime: document.getElementById("readTime"),
    image: document.getElementById("image"),
    imageAlt: document.getElementById("imageAlt"),
    metaTitle: document.getElementById("metaTitle"),
    metaDescription: document.getElementById("metaDescription"),
    excerpt: document.getElementById("excerpt"),
    keywords: document.getElementById("keywords"),
    datePublished: document.getElementById("datePublished"),
    author: document.getElementById("author"),
    content: document.getElementById("content"),
    faqQuestion: document.getElementById("faqQuestion"),
    faqAnswer: document.getElementById("faqAnswer")
  };

  const form = document.getElementById("blogForm");
  const tableBody = document.querySelector("#blogTable tbody");
  const tableSearch = document.getElementById("tableSearch");
  const cardPreview = document.getElementById("cardPreview");
  const urlPreview = document.getElementById("urlPreview");
  const metaTitleCount = document.getElementById("metaTitleCount");
  const metaDescriptionCount = document.getElementById("metaDescriptionCount");
  const newPostBtn = document.getElementById("newPostBtn");
  const copyJsonBtn = document.getElementById("copyJsonBtn");
  const downloadDataBtn = document.getElementById("downloadDataBtn");
  const downloadArticleBtn = document.getElementById("downloadArticleBtn");

  let sortKey = "datePublished";
  let sortDir = "desc";

  const escapeHTML = (value = "") =>
    String(value).replace(/[&<>"']/g, (char) => ({
      "&": "and",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    }[char]));

  const stripHTML = (value = "") => String(value).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

  const slugify = (value) =>
    String(value || "")
      .toLowerCase()
      .trim()
      .replace(/&/g, "and")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");

  function getStaticPosts() {
    return Array.isArray(window.BWD_BLOG_POSTS) ? window.BWD_BLOG_POSTS : [];
  }

  function getLocalPosts() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      return Array.isArray(saved) ? saved : [];
    } catch (error) {
      console.warn("Could not read saved blog posts", error);
      return [];
    }
  }

  function saveLocalPosts(posts) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(posts, null, 2));
  }

  function getAllPosts() {
    const map = new Map();

    getStaticPosts().forEach((post) => {
      map.set(post.id || post.slug, normalizePost(post));
    });

    getLocalPosts().forEach((post) => {
      map.set(post.id || post.slug, normalizePost(post));
    });

    return Array.from(map.values());
  }

  function normalizePost(post) {
    const title = post.title || "Untitled Blog";
    const slug = post.slug || slugify(title);
    return {
      id: post.id || slug,
      slug,
      title,
      metaTitle: post.metaTitle || `${title} | Best Web Developer`,
      metaDescription: post.metaDescription || post.excerpt || "",
      excerpt: post.excerpt || post.metaDescription || "",
      category: post.category || "SEO",
      url: post.url || `blog/${slug}.html`,
      image: post.image || "assets/images/digital-marketing-services-partner.webp",
      imageAlt: post.imageAlt || `${title} article image`,
      author: post.author || "Best Web Developer",
      datePublished: post.datePublished || TODAY,
      dateModified: TODAY,
      readTime: post.readTime || "6 min read",
      keywords: post.keywords || "",
      content: post.content || "",
      faq: Array.isArray(post.faq) ? post.faq : []
    };
  }

  function currentPostFromForm() {
    const title = fields.title.value.trim();
    const slug = slugify(fields.slug.value || title);
    const faq = [];

    if (fields.faqQuestion.value.trim() && fields.faqAnswer.value.trim()) {
      faq.push({
        question: fields.faqQuestion.value.trim(),
        answer: fields.faqAnswer.value.trim()
      });
    }

    return normalizePost({
      id: fields.postId.value || slug,
      slug,
      title,
      category: fields.category.value.trim(),
      readTime: fields.readTime.value.trim(),
      image: fields.image.value.trim(),
      imageAlt: fields.imageAlt.value.trim(),
      metaTitle: fields.metaTitle.value.trim(),
      metaDescription: fields.metaDescription.value.trim(),
      excerpt: fields.excerpt.value.trim(),
      keywords: fields.keywords.value.trim(),
      datePublished: fields.datePublished.value || TODAY,
      author: fields.author.value.trim(),
      content: fields.content.value.trim(),
      faq
    });
  }

  function fillForm(post) {
    const p = normalizePost(post);
    fields.postId.value = p.id;
    fields.title.value = p.title;
    fields.category.value = p.category;
    fields.slug.value = p.slug;
    fields.readTime.value = p.readTime;
    fields.image.value = p.image;
    fields.imageAlt.value = p.imageAlt;
    fields.metaTitle.value = p.metaTitle;
    fields.metaDescription.value = p.metaDescription;
    fields.excerpt.value = p.excerpt;
    fields.keywords.value = p.keywords;
    fields.datePublished.value = p.datePublished || TODAY;
    fields.author.value = p.author;
    fields.content.value = p.content;
    fields.faqQuestion.value = p.faq?.[0]?.question || "";
    fields.faqAnswer.value = p.faq?.[0]?.answer || "";
    updateHelpers();
    renderPreview();
    window.scrollTo({ top: document.getElementById("blogFormSection").offsetTop - 90, behavior: "smooth" });
  }

  function resetForm() {
    form.reset();
    fields.postId.value = "";
    fields.datePublished.value = TODAY;
    fields.author.value = "Best Web Developer";
    fields.readTime.value = "6 min read";
    fields.image.value = "assets/images/digital-marketing-services-partner.webp";
    fields.category.value = "SEO";
    fields.content.value = "<h2>Introduction</h2>\n<p>Write your blog introduction here with a clear answer to the main topic.</p>\n<h2>Key Takeaways</h2>\n<ul>\n  <li>Add one clear takeaway.</li>\n  <li>Add one useful action step.</li>\n</ul>";
    updateHelpers();
    renderPreview();
  }

  function saveCurrentPost(event) {
    event.preventDefault();
    const post = currentPostFromForm();

    if (!post.title || !post.slug || !post.image || !post.imageAlt || !post.metaTitle || !post.metaDescription || !post.excerpt || !post.content) {
      alert("Please complete all required fields.");
      return;
    }

    const localPosts = getLocalPosts().filter((item) => (item.id || item.slug) !== post.id);
    localPosts.unshift(post);
    saveLocalPosts(localPosts);
    fillForm(post);
    renderTable();

    alert("Blog saved in this browser. Use Download blog-data.js to publish it on GitHub.");
  }

  function renderTable() {
    if (!tableBody) return;

    const q = (tableSearch?.value || "").toLowerCase().trim();
    const posts = getAllPosts()
      .filter((post) => {
        const haystack = [post.title, post.category, post.metaDescription, post.imageAlt, post.keywords, stripHTML(post.content)].join(" ").toLowerCase();
        return !q || haystack.includes(q);
      })
      .sort((a, b) => {
        const av = String(a[sortKey] || "").toLowerCase();
        const bv = String(b[sortKey] || "").toLowerCase();
        return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
      });

    tableBody.innerHTML = posts.map((post) => `
      <tr>
        <td>
          <strong>${escapeHTML(post.title)}</strong><br>
          <small class="text-muted">${escapeHTML(post.url)}</small>
        </td>
        <td><span class="badge rounded-pill text-bg-light">${escapeHTML(post.category)}</span></td>
        <td>${escapeHTML(post.datePublished || "")}</td>
        <td style="max-width: 280px;">${escapeHTML(post.metaDescription || "").slice(0, 140)}${(post.metaDescription || "").length > 140 ? "..." : ""}</td>
        <td style="max-width: 240px;">${escapeHTML(post.imageAlt || "").slice(0, 120)}${(post.imageAlt || "").length > 120 ? "..." : ""}</td>
        <td class="table-actions">
          <div class="d-flex gap-1">
            <button class="btn btn-sm btn-outline-dark rounded-pill" data-action="edit" data-id="${escapeHTML(post.id)}">Edit</button>
            <button class="btn btn-sm btn-outline-danger rounded-pill" data-action="delete" data-id="${escapeHTML(post.id)}">Delete Local</button>
          </div>
        </td>
      </tr>
    `).join("");
  }

  function renderPreview() {
    if (!cardPreview) return;
    const post = currentPostFromForm();
    cardPreview.innerHTML = `
      <article class="blog-card h-100">
        <a href="${escapeHTML(post.url)}" class="blog-img">
          <img src="${escapeHTML(post.image)}" alt="${escapeHTML(post.imageAlt)}" loading="lazy">
        </a>
        <div class="p-4">
          <span class="blog-cat">${escapeHTML(post.category)}</span>
          <h3><a href="${escapeHTML(post.url)}">${escapeHTML(post.title || "Your Blog Title")}</a></h3>
          <p>${escapeHTML(post.excerpt || "Your attractive blog summary will show here.")}</p>
          <div class="d-flex justify-content-between small text-muted">
            <span>${escapeHTML(post.author)}</span>
            <span>${escapeHTML(post.readTime)}</span>
          </div>
        </div>
      </article>
      <div class="mt-3 small text-muted">
        <strong>Meta title:</strong> ${escapeHTML(post.metaTitle)}<br>
        <strong>Meta description:</strong> ${escapeHTML(post.metaDescription)}
      </div>
    `;
  }

  function updateHelpers() {
    const slug = slugify(fields.slug.value || fields.title.value || "example");
    fields.slug.value = slug;
    if (urlPreview) urlPreview.textContent = `blog/${slug}.html`;
    if (metaTitleCount) metaTitleCount.textContent = fields.metaTitle.value.length;
    if (metaDescriptionCount) metaDescriptionCount.textContent = fields.metaDescription.value.length;
  }

  function downloadFile(filename, content, type = "text/plain") {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function copyCurrentJson() {
    const post = currentPostFromForm();
    navigator.clipboard.writeText(JSON.stringify(post, null, 2)).then(() => {
      alert("Current blog JSON copied.");
    }).catch(() => {
      alert("Copy failed. You can still download blog-data.js.");
    });
  }

  function downloadDataFile() {
    const posts = getAllPosts().map(normalizePost);
    const content = "/* Blog database for Best Web Developer. */\n\nwindow.BWD_BLOG_POSTS = " + JSON.stringify(posts, null, 2) + ";\n";
    downloadFile("blog-data.js", content, "application/javascript");
  }

  function absoluteUrl(url) {
    if (/^https?:\/\//i.test(url)) return url;
    return "https://bestwebdeveloper.org/" + String(url || "").replace(/^\/+/, "");
  }

  function articleSchema(post) {
    const imageUrl = absoluteUrl(post.image);
    const schema = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "BlogPosting",
          "@id": absoluteUrl(post.url) + "#article",
          "headline": post.title,
          "description": post.metaDescription,
          "image": imageUrl,
          "datePublished": post.datePublished,
          "dateModified": post.dateModified || TODAY,
          "author": {"@type": "Organization", "name": post.author},
          "publisher": {
            "@type": "Organization",
            "name": "Best Web Developer",
            "logo": {
              "@type": "ImageObject",
              "url": "https://bestwebdeveloper.org/assets/images/best-web-developer-logo.png"
            }
          },
          "mainEntityOfPage": absoluteUrl(post.url),
          "keywords": post.keywords
        },
        {
          "@type": "BreadcrumbList",
          "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "Home", "item": "https://bestwebdeveloper.org/"},
            {"@type": "ListItem", "position": 2, "name": "Blog", "item": "https://bestwebdeveloper.org/blog.html"},
            {"@type": "ListItem", "position": 3, "name": post.title, "item": absoluteUrl(post.url)}
          ]
        }
      ]
    };

    if (post.faq && post.faq.length) {
      schema["@graph"].push({
        "@type": "FAQPage",
        "mainEntity": post.faq.map((item) => ({
          "@type": "Question",
          "name": item.question,
          "acceptedAnswer": {"@type": "Answer", "text": item.answer}
        }))
      });
    }

    return JSON.stringify(schema, null, 2);
  }

  function downloadArticleHtml() {
    const post = currentPostFromForm();
    const safeTitle = escapeHTML(post.title);
    const safeMetaTitle = escapeHTML(post.metaTitle);
    const safeMetaDescription = escapeHTML(post.metaDescription);
    const safeImage = escapeHTML(post.image);
    const safeAlt = escapeHTML(post.imageAlt);
    const safeCategory = escapeHTML(post.category);
    const safeAuthor = escapeHTML(post.author);
    const safeDate = escapeHTML(post.datePublished);
    const faqHtml = (post.faq || []).map((item) => `
      <div class="accordion-item">
        <h3 class="accordion-header"><button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#faq-${slugify(item.question)}">${escapeHTML(item.question)}</button></h3>
        <div id="faq-${slugify(item.question)}" class="accordion-collapse collapse" data-bs-parent="#faqAccordion"><div class="accordion-body">${escapeHTML(item.answer)}</div></div>
      </div>
    `).join("");

    const article = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${safeMetaTitle}</title>
  <meta name="description" content="${safeMetaDescription}">
  <meta name="robots" content="index, follow, max-image-preview:large">
  <link rel="canonical" href="${absoluteUrl(post.url)}">
  <meta property="og:title" content="${safeMetaTitle}">
  <meta property="og:description" content="${safeMetaDescription}">
  <meta property="og:url" content="${absoluteUrl(post.url)}">
  <meta property="og:type" content="article">
  <meta property="og:image" content="${absoluteUrl(post.image)}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${safeMetaTitle}">
  <meta name="twitter:description" content="${safeMetaDescription}">
  <link rel="icon" href="../assets/images/favicon.png" type="image/png">
  <link rel="preconnect" href="https://cdn.jsdelivr.net">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Sora:wght@500;600;700;800&display=swap" rel="stylesheet">
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
  <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css" rel="stylesheet">
  <link href="../assets/css/styles.css" rel="stylesheet">
  <script type="application/ld+json">${articleSchema(post)}</script>
</head>
<body>
  <main>
    <section class="hero-corporate position-relative overflow-hidden">
      <div class="container-xl position-relative">
        <div class="row align-items-center min-vh-100 py-5 g-5">
          <div class="col-lg-7 pt-5">
            <span class="eyebrow"><i class="bi bi-journal-text"></i> ${safeCategory}</span>
            <h1 class="display-4 fw-black mt-3 mb-4">${safeTitle}</h1>
            <p class="lead text-white-75 mb-4">${escapeHTML(post.excerpt)}</p>
            <div class="d-flex flex-wrap gap-3 text-white-75"><span>${safeAuthor}</span><span>•</span><time datetime="${safeDate}">${safeDate}</time><span>•</span><span>${escapeHTML(post.readTime)}</span></div>
          </div>
          <div class="col-lg-5">
            <div class="hero-device-wrap tilt-card">
              <img src="../${safeImage.replace(/^\/+/, "")}" class="img-fluid hero-img" alt="${safeAlt}" loading="eager">
            </div>
          </div>
        </div>
      </div>
    </section>
    <article class="py-5 bg-white">
      <div class="container-xl">
        <div class="row justify-content-center">
          <div class="col-lg-9">
            ${post.content}
            ${faqHtml ? `<hr class="my-5"><h2>Frequently Asked Questions</h2><div class="accordion mt-4" id="faqAccordion">${faqHtml}</div>` : ""}
            <div class="mt-5 p-4 rounded-4" style="background:#fff7ed;">
              <h2 class="h4">Need a website that ranks and converts?</h2>
              <p>Best Web Developer can help with SEO, AEO, GEO, web design, development, and digital marketing.</p>
              <a href="../contact.html" class="btn btn-orange rounded-pill">Book Free Consultation</a>
            </div>
          </div>
        </div>
      </div>
    </article>
  </main>
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>`;
    downloadFile(`${post.slug}.html`, article, "text/html");
  }

  form?.addEventListener("submit", saveCurrentPost);
  newPostBtn?.addEventListener("click", resetForm);
  tableSearch?.addEventListener("input", renderTable);
  copyJsonBtn?.addEventListener("click", copyCurrentJson);
  downloadDataBtn?.addEventListener("click", downloadDataFile);
  downloadArticleBtn?.addEventListener("click", downloadArticleHtml);

  document.querySelectorAll("#blogTable th[data-sort]").forEach((th) => {
    th.addEventListener("click", () => {
      const key = th.dataset.sort;
      if (sortKey === key) {
        sortDir = sortDir === "asc" ? "desc" : "asc";
      } else {
        sortKey = key;
        sortDir = "asc";
      }
      renderTable();
    });
  });

  tableBody?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-action]");
    if (!button) return;

    const id = button.dataset.id;
    const action = button.dataset.action;
    const post = getAllPosts().find((item) => item.id === id);

    if (action === "edit" && post) {
      fillForm(post);
    }

    if (action === "delete") {
      const localPosts = getLocalPosts();
      const existsLocal = localPosts.some((item) => (item.id || item.slug) === id);
      if (!existsLocal) {
        alert("This is a default GitHub post. Edit it and save to create an override, or remove it from blog-data.js manually.");
        return;
      }
      if (confirm("Delete this local saved blog?")) {
        saveLocalPosts(localPosts.filter((item) => (item.id || item.slug) !== id));
        renderTable();
      }
    }
  });

  Object.values(fields).forEach((field) => {
    field?.addEventListener("input", () => {
      if (field === fields.title && !fields.postId.value) {
        const autoSlug = slugify(fields.title.value);
        fields.slug.value = autoSlug;
        fields.metaTitle.value = fields.metaTitle.value || `${fields.title.value} | Best Web Developer`;
      }
      updateHelpers();
      renderPreview();
    });
  });

  resetForm();
  renderTable();
})();
