Best Web Developer Blog Update
==============================

Files included:
- blog.html
- add-blog.html
- assets/js/blog-data.js
- assets/js/blog-render.js
- assets/js/blog-admin.js

Upload these files to the same GitHub repository structure.

How to publish a new blog:
1. Open https://bestwebdeveloper.org/add-blog.html after upload.
2. Add blog title, slug, image URL, image alt tag, meta title, meta description, excerpt and HTML content.
3. Click Save Blog.
4. Click Download blog-data.js.
5. Replace assets/js/blog-data.js in GitHub with the downloaded file.
6. Optional: click Download Article HTML, then upload that file inside your /blog/ folder.
7. Open blog.html and confirm the new blog card appears.

Important static-site note:
A pure HTML/CSS/JavaScript website on GitHub Pages cannot permanently write files to GitHub from a public browser page without a backend or GitHub API token.
This tool saves in the browser for preview and exports files that you can upload to GitHub.
