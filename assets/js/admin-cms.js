(function(){
  'use strict';
  const C = window.BWD_CMS_CONFIG || {};
  const SEED = window.BWD_CMS_SEED || {};
  const $ = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));
  const moduleName = document.body.dataset.cmsModule || 'blogs';
  const storageKey = (type) => `${C.localStoragePrefix || 'bwd-cms'}:${type}`;
  const authKey = `${C.localStoragePrefix || 'bwd-cms'}:auth`;
  const pageBase = {blogs:'blog', services:'services', pages:'', categories:'category', tags:'tag', seo:'', geo:'', aeo:''};
  const moduleLabels = {blogs:'Blogs', services:'Services', categories:'Categories', tags:'Tags', pages:'Pages', seo:'SEO Meta', geo:'GEO Targets', aeo:'AEO FAQs'};
  const fieldSets = {
    blogs:['id','status','title','slug','category','tags','publishDate','author','readTime','imageUrl','imageAlt','excerpt','contentHtml','metaTitle','metaDescription','canonicalUrl','focusKeyword','robots','targetCountry','targetCity','geoServiceArea','aeoQuestion','aeoAnswer','schemaType','schemaJson'],
    services:['id','status','title','slug','category','tags','priceRange','imageUrl','imageAlt','shortDescription','contentHtml','metaTitle','metaDescription','canonicalUrl','focusKeyword','robots','targetCountry','targetCity','geoServiceArea','aeoQuestion','aeoAnswer','schemaType','schemaJson'],
    categories:['id','status','title','slug','parent','description','sortOrder','metaTitle','metaDescription','canonicalUrl','focusKeyword','robots','schemaType'],
    tags:['id','status','title','slug','description','sortOrder','metaTitle','metaDescription','canonicalUrl','focusKeyword','robots','schemaType'],
    pages:['id','status','title','slug','pageType','category','tags','imageUrl','imageAlt','excerpt','contentHtml','metaTitle','metaDescription','canonicalUrl','focusKeyword','robots','targetCountry','targetCity','geoServiceArea','aeoQuestion','aeoAnswer','schemaType','schemaJson'],
    seo:['id','status','pageType','title','slug','metaTitle','metaDescription','canonicalUrl','focusKeyword','secondaryKeywords','robots','imageUrl','imageAlt','contentHtml','targetCountry','targetCity','geoServiceArea','aeoQuestion','aeoAnswer','schemaType','schemaJson'],
    geo:['id','status','title','slug','targetCountry','targetRegion','targetCity','geoServiceArea','serviceRadius','localKeywords','address','latitude','longitude','metaTitle','metaDescription','canonicalUrl','schemaType'],
    aeo:['id','status','title','slug','aeoQuestion','aeoAnswer','faqGroup','relatedQuestions','contentHtml','metaTitle','metaDescription','canonicalUrl','schemaType','schemaJson']
  };
  const fieldMeta = {
    id:{label:'Record ID', type:'text', help:'Auto generated; editable if you need a stable key.'}, status:{label:'Status',type:'select',options:['draft','published','archived']}, title:{label:'Title / H1',type:'text'}, slug:{label:'URL Slug',type:'text',help:'Lowercase path part only.'}, category:{label:'Category',type:'text'}, tags:{label:'Tags',type:'text',help:'Comma separated.'}, publishDate:{label:'Published Date',type:'date'}, author:{label:'Author',type:'text'}, readTime:{label:'Read Time',type:'text',placeholder:'6 min read'}, imageUrl:{label:'Image URL',type:'url'}, imageAlt:{label:'Image Alt Text',type:'text'}, excerpt:{label:'Card Excerpt',type:'textarea'}, shortDescription:{label:'Short Description',type:'textarea'}, contentHtml:{label:'Main Content HTML',type:'textarea',full:true,placeholder:'<h2>Section title</h2><p>Content...</p>'}, metaTitle:{label:'Meta Title',type:'text',help:'Best 35-60 chars.'}, metaDescription:{label:'Meta Description',type:'textarea',help:'Best 120-160 chars.'}, canonicalUrl:{label:'Canonical URL',type:'url'}, focusKeyword:{label:'Focus Keyword',type:'text'}, secondaryKeywords:{label:'Secondary Keywords',type:'text'}, robots:{label:'Robots',type:'text'}, targetCountry:{label:'Target Country',type:'text'}, targetRegion:{label:'Target Region / State',type:'text'}, targetCity:{label:'Target City',type:'text'}, geoServiceArea:{label:'GEO Service Area',type:'textarea'}, serviceRadius:{label:'Service Radius',type:'text'}, localKeywords:{label:'Local Keywords',type:'textarea'}, address:{label:'Business Address',type:'text'}, latitude:{label:'Latitude',type:'text'}, longitude:{label:'Longitude',type:'text'}, aeoQuestion:{label:'AEO / FAQ Question',type:'text'}, aeoAnswer:{label:'AEO / FAQ Answer',type:'textarea'}, faqGroup:{label:'FAQ Group',type:'text'}, relatedQuestions:{label:'Related Questions',type:'textarea'}, schemaType:{label:'Schema Type',type:'select',options:['Article','BlogPosting','Service','WebPage','FAQPage','LocalBusiness','CollectionPage','BreadcrumbList']}, schemaJson:{label:'Custom Schema JSON-LD',type:'textarea',full:true}, parent:{label:'Parent Category',type:'text'}, sortOrder:{label:'Sort Order',type:'number'}, pageType:{label:'Page Type',type:'select',options:['Page','Landing Page','Blog Index','Service Index','Legal','Location']}, priceRange:{label:'Price Range',type:'text'}, description:{label:'Description',type:'textarea'}
  };
  const defaults = {status:'draft', author:C.defaultAuthor||'Best Web Developer', robots:C.defaultRobots||'index, follow, max-image-preview:large', targetCountry:C.defaultCountry||'', geoServiceArea:C.defaultServiceAreas||'', schemaType:C.defaultSchemaType||'Article'};
  let records = [];
  let currentId = null;
  let sortDesc = true;

  function slugify(s){ return (s||'').toString().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/&/g,' and ').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,90); }
  function escapeHTML(s){ return (s||'').toString().replace(/[&<>'"]/g, c => ({'&':'and','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }
  function stripTags(s){ const d=document.createElement('div'); d.innerHTML=s||''; return d.textContent||d.innerText||''; }
  function wordCount(s){ return (stripTags(s).trim().match(/\b[\w'-]+\b/g)||[]).length; }
  function today(){ return new Date().toISOString().slice(0,10); }
  function toast(msg){ const el=document.createElement('div'); el.className='toast-line'; el.textContent=msg; document.body.appendChild(el); setTimeout(()=>el.remove(),4200); }
  function configuredEndpoint(){ return C.appsScriptUrl && !/PASTE|YOUR|^\s*$/.test(C.appsScriptUrl); }
  function cleanRecord(r){ const out={}; Object.keys(r||{}).forEach(k=>{ if(r[k]!==undefined && r[k]!==null) out[k]=String(r[k]); }); return out; }
  function publicUrlFor(data){ if(data.canonicalUrl) return data.canonicalUrl; const slug = data.slug || slugify(data.title); const base = (C.siteBaseUrl||'').replace(/\/$/,''); const prefix = pageBase[moduleName] || ''; if(moduleName==='pages' && !slug) return base + '/'; return base + '/' + (prefix ? prefix + '/' : '') + slug + '.html'; }
  function loadLocal(type){ const raw=localStorage.getItem(storageKey(type)); if(raw){ try{return JSON.parse(raw)||[]}catch(e){} } return (SEED[type]||[]).map(cleanRecord); }
  function saveLocal(type, list){ localStorage.setItem(storageKey(type), JSON.stringify(list)); }

  function checkPassword(pw){ return String(pw||'') === String(C.adminPassword || 'BWD@2026'); }
  function initAuth(){
    const login=$('#cmsLogin'); const app=$('#cmsApp');
    if(!login || !app) return true;
    if(sessionStorage.getItem(authKey)==='1'){ login.classList.add('cms-hidden'); app.classList.remove('cms-hidden'); return true; }
    login.classList.remove('cms-hidden'); app.classList.add('cms-hidden');
    $('#loginForm')?.addEventListener('submit', (e)=>{ e.preventDefault(); const pw=$('#adminPassword').value; if(checkPassword(pw)){ sessionStorage.setItem(authKey,'1'); login.classList.add('cms-hidden'); app.classList.remove('cms-hidden'); initApp(); } else { toast('Wrong password. Change the default in assets/js/cms-config.js.'); } });
    return false;
  }

  function fieldHTML(name){
    const m=fieldMeta[name] || {label:name,type:'text'}; const isFull=m.full || ['contentHtml','schemaJson'].includes(name); const cls='field'+(isFull?' full':'');
    let input=''; const placeholder=m.placeholder?` placeholder="${escapeHTML(m.placeholder)}"`:'';
    if(m.type==='select') input=`<select class="cms-select" name="${name}">${(m.options||[]).map(o=>`<option value="${escapeHTML(o)}">${escapeHTML(o)}</option>`).join('')}</select>`;
    else if(m.type==='textarea') input=`<textarea class="cms-textarea" name="${name}"${placeholder}></textarea>`;
    else input=`<input class="cms-input" type="${m.type||'text'}" name="${name}"${placeholder}>`;
    const counter=['metaTitle','metaDescription','contentHtml','imageAlt'].includes(name) ? `<small data-count-for="${name}">0</small>` : (m.help?`<small>${escapeHTML(m.help)}</small>`:'');
    return `<div class="${cls}"><label><span>${escapeHTML(m.label)}</span>${counter}</label>${input}</div>`;
  }

  function renderForm(){
    const form=$('#cmsForm'); if(!form) return;
    form.innerHTML=(fieldSets[moduleName]||fieldSets.blogs).map(fieldHTML).join('') + `<div class="cms-actions field full"><button class="cms-btn primary" type="submit"><i class="bi bi-save2"></i> Save to table</button><button class="cms-btn light" type="button" id="newRecord"><i class="bi bi-plus-circle"></i> New</button><button class="cms-btn dark" type="button" id="syncSheet"><i class="bi bi-cloud-arrow-down"></i> Sync Google Sheet</button><button class="cms-btn light" type="button" id="copyJson"><i class="bi bi-braces"></i> Copy JSON</button><button class="cms-btn light" type="button" id="downloadHtml"><i class="bi bi-filetype-html"></i> Download HTML</button></div>`;
    form.addEventListener('input', formChanged);
    form.addEventListener('submit', saveCurrent);
    $('#newRecord')?.addEventListener('click', ()=>fillForm({}));
    $('#syncSheet')?.addEventListener('click', loadFromSheet);
    $('#copyJson')?.addEventListener('click', copyCurrentJson);
    $('#downloadHtml')?.addEventListener('click', downloadCurrentHtml);
  }

  function fillForm(data){
    const form=$('#cmsForm'); if(!form) return;
    currentId=data.id||null;
    const values={...defaults, ...data};
    if(!values.id) values.id = `${moduleName}-${Date.now()}`;
    if(!values.publishDate && moduleName==='blogs') values.publishDate=today();
    if(!values.schemaType){ values.schemaType = moduleName==='services'?'Service':(moduleName==='blogs'?'BlogPosting':'WebPage'); }
    Object.entries(values).forEach(([k,v])=>{ const el=form.elements[k]; if(el) el.value=v||''; });
    formChanged();
  }

  function getFormData(){
    const form=$('#cmsForm'); const data={}; if(!form) return data;
    (fieldSets[moduleName]||[]).forEach(k=>{ const el=form.elements[k]; if(el) data[k]=el.value.trim(); });
    if(!data.title && data.metaTitle) data.title=data.metaTitle;
    if(!data.slug && data.title) data.slug=slugify(data.title);
    if(!data.id) data.id=`${moduleName}-${data.slug||Date.now()}`;
    if(!data.canonicalUrl) data.canonicalUrl=publicUrlFor(data);
    return data;
  }

  function formChanged(){
    const form=$('#cmsForm'); if(!form) return;
    const title=form.elements.title; const slug=form.elements.slug; const metaTitle=form.elements.metaTitle; const metaDescription=form.elements.metaDescription;
    if(title && slug && (!slug.value || slug.dataset.autofill==='1')){ slug.value=slugify(title.value); slug.dataset.autofill='1'; }
    if(slug) slug.addEventListener('input',()=>slug.dataset.autofill='0',{once:true});
    if(metaTitle && !metaTitle.value && title && title.value){ metaTitle.value=(title.value + ' | ' + (C.siteName||'Best Web Developer')).slice(0,70); }
    if(metaDescription && !metaDescription.value){ const ex=form.elements.excerpt||form.elements.shortDescription||form.elements.description; if(ex && ex.value) metaDescription.value=stripTags(ex.value).slice(0,165); }
    (fieldSets[moduleName]||[]).forEach(k=>{ const el=form.elements[k]; const c=$(`[data-count-for="${k}"]`); if(el && c){ c.textContent = k==='contentHtml' ? `${wordCount(el.value)} words` : `${el.value.length} chars`; } });
    const data=getFormData(); renderPreview(data); renderScore(data); renderUrl(data);
  }

  function renderUrl(data){ const el=$('#finalUrl'); if(el) el.textContent=publicUrlFor(data); }
  function renderPreview(data){
    const el=$('#livePreview'); if(!el) return;
    const image=data.imageUrl || C.defaultOgImage || 'assets/images/digital-marketing-services-partner.webp';
    el.innerHTML=`<div class="preview-card"><img src="${escapeHTML(image)}" alt=""><div class="p"><span class="cms-pill ${data.status==='published'?'live':'draft'}">${escapeHTML(data.status||'draft')}</span><h3>${escapeHTML(data.title||data.metaTitle||'New content')}</h3><p>${escapeHTML(data.excerpt||data.shortDescription||data.description||data.metaDescription||'Preview text appears here.')}</p><small>${escapeHTML(data.category||data.pageType||moduleLabels[moduleName]||'CMS')} • ${escapeHTML(data.tags||data.targetCity||'')}</small></div></div>`;
  }

  function analyze(data){
    const checks=[]; let score=0;
    const add=(ok, pts, msg, warn=false)=>{ if(ok) score+=pts; checks.push({ok, warn:!ok && warn, msg, pts}); };
    const mt=(data.metaTitle||'').trim(); const md=(data.metaDescription||'').trim(); const slug=(data.slug||'').trim(); const kw=(data.focusKeyword||'').toLowerCase().trim(); const content=data.contentHtml||data.excerpt||data.description||''; const wc=wordCount(content); const title=(data.title||'').toLowerCase();
    add(mt.length>=35 && mt.length<=60, 12, `Meta title length: ${mt.length}/35-60`, true);
    add(md.length>=120 && md.length<=160, 12, `Meta description length: ${md.length}/120-160`, true);
    add(!!slug && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug), 8, 'Clean lowercase hyphen slug', true);
    add(!!data.canonicalUrl || !!slug, 6, 'Canonical URL is present');
    add(!!data.imageAlt && data.imageAlt.length>=12, 7, 'Image alt text is descriptive');
    add(wc >= (moduleName==='blogs'?500:180), 10, `Content word count: ${wc}`, true);
    add(/<h2[\s>]/i.test(content), 6, 'Content includes at least one H2 section');
    add(!!data.category, 5, 'Category is set');
    add(!!data.tags || moduleName==='categories' || moduleName==='tags', 4, 'Tags are set');
    add(!!kw && (mt.toLowerCase().includes(kw) || title.includes(kw)), 7, 'Focus keyword appears in title/meta title', true);
    add(!!kw && md.toLowerCase().includes(kw), 5, 'Focus keyword appears in meta description', true);
    add(!!data.targetCountry && (!!data.targetCity || !!data.geoServiceArea), 8, 'GEO target fields are complete');
    add(!!data.aeoQuestion && !!data.aeoAnswer, 8, 'AEO question and answer are complete');
    add(!!data.schemaType || !!data.schemaJson, 6, 'Schema type or custom JSON-LD is set');
    return {score:Math.min(100,score), checks};
  }
  function renderScore(data){
    const a=analyze(data); const ring=$('#seoScoreRing'); const list=$('#seoChecklist'); const bar=$('#seoMeterBar');
    if(ring){ ring.style.setProperty('--score', a.score); ring.querySelector('strong').textContent=a.score; }
    if(bar){ bar.style.width=a.score+'%'; }
    if(list){ list.innerHTML=a.checks.map(c=>`<div class="score-item ${c.ok?'ok':(c.warn?'warn':'bad')}"><i class="bi ${c.ok?'bi-check-circle-fill':(c.warn?'bi-exclamation-triangle-fill':'bi-x-circle-fill')}"></i><span>${escapeHTML(c.msg)}</span></div>`).join(''); }
  }

  function renderTable(){
    const tbody=$('#recordsBody'); if(!tbody) return;
    const q=($('#recordSearch')?.value||'').toLowerCase(); const status=($('#statusFilter')?.value||'all');
    const list=[...records].sort((a,b)=> sortDesc ? String(b.id||'').localeCompare(String(a.id||'')) : String(a.id||'').localeCompare(String(b.id||''))).filter(r=>{ const hay=JSON.stringify(r).toLowerCase(); return (!q || hay.includes(q)) && (status==='all' || (r.status||'draft')===status); });
    tbody.innerHTML=list.map(r=>`<tr><td><b>${escapeHTML(r.title||r.metaTitle||r.slug||r.id)}</b><br><small>${escapeHTML(r.slug||'')}</small></td><td><span class="cms-pill ${(r.status||'draft')==='published'?'live':'draft'}">${escapeHTML(r.status||'draft')}</span></td><td>${escapeHTML(r.category||r.pageType||r.parent||'')}</td><td>${escapeHTML((r.metaTitle||'').slice(0,80))}<br><small>${escapeHTML((r.metaDescription||'').slice(0,110))}</small></td><td>${analyze(r).score}</td><td><button class="cms-btn light btn-edit" data-id="${escapeHTML(r.id)}" type="button">Edit</button> <button class="cms-btn danger btn-delete" data-id="${escapeHTML(r.id)}" type="button">Delete</button></td></tr>`).join('') || `<tr><td colspan="6">No records yet. Add your first item or sync from Google Sheets.</td></tr>`;
    $$('.btn-edit').forEach(btn=>btn.addEventListener('click',()=>{ const rec=records.find(r=>r.id===btn.dataset.id); if(rec){ fillForm(rec); window.scrollTo({top:0,behavior:'smooth'}); } }));
    $$('.btn-delete').forEach(btn=>btn.addEventListener('click',()=>deleteRecord(btn.dataset.id)));
    renderStats();
  }
  function renderStats(){
    const stats=$('#cmsStats'); if(!stats) return;
    const published=records.filter(r=>r.status==='published').length; const drafts=records.filter(r=>(r.status||'draft')==='draft').length; const avg=records.length?Math.round(records.reduce((s,r)=>s+analyze(r).score,0)/records.length):0;
    stats.innerHTML=`<div class="stat"><small>Total</small><b>${records.length}</b></div><div class="stat"><small>Published</small><b>${published}</b></div><div class="stat"><small>Drafts</small><b>${drafts}</b></div><div class="stat"><small>Avg SEO</small><b>${avg}</b></div>`;
  }

  async function fetchSheet(payload, method='POST'){
    if(!configuredEndpoint()) throw new Error('Apps Script URL is not set in assets/js/cms-config.js');
    let res;
    if(method==='GET'){
      const url=new URL(C.appsScriptUrl); Object.entries(payload).forEach(([k,v])=>url.searchParams.set(k,v)); res=await fetch(url.toString(), {method:'GET'});
    } else {
      res=await fetch(C.appsScriptUrl, {method:'POST', headers:{'Content-Type':'text/plain;charset=utf-8'}, body:JSON.stringify(payload)});
    }
    const text=await res.text();
    try { return JSON.parse(text); } catch(e){ throw new Error('Apps Script returned non-JSON. Check deployment permissions.'); }
  }
  async function loadFromSheet(){
    try{ const out=await fetchSheet({action:'list', type:moduleName}, 'GET'); if(out.ok){ records=(out.records||[]).map(cleanRecord); saveLocal(moduleName, records); renderTable(); toast('Synced from Google Sheets.'); } else throw new Error(out.error||'Sync failed'); }
    catch(err){ toast(err.message + ' Using browser data.'); }
  }
  async function saveCurrent(e){
    e?.preventDefault(); const data=getFormData(); const idx=records.findIndex(r=>r.id===data.id); if(idx>=0) records[idx]=data; else records.unshift(data); saveLocal(moduleName, records); renderTable(); fillForm(data);
    if(configuredEndpoint()){
      try{ const out=await fetchSheet({action:'save', type:moduleName, password:C.adminPassword, record:data}); if(!out.ok) throw new Error(out.error||'Save failed'); toast('Saved locally and to Google Sheets.'); }
      catch(err){ toast('Saved locally only: '+err.message); }
    } else toast('Saved locally. Add Apps Script URL to sync Google Sheets.');
  }
  async function deleteRecord(id){
    if(!confirm('Delete this record from the local table and Google Sheet if connected?')) return;
    records=records.filter(r=>r.id!==id); saveLocal(moduleName, records); renderTable();
    if(configuredEndpoint()) { try{ await fetchSheet({action:'delete', type:moduleName, password:C.adminPassword, id}); toast('Deleted.'); } catch(e){ toast('Deleted locally only: '+e.message); } }
  }

  function copyCurrentJson(){ const data=getFormData(); navigator.clipboard?.writeText(JSON.stringify(data,null,2)); $('#exportCode').textContent=JSON.stringify(data,null,2); toast('Current JSON copied.'); }
  function download(name, text, type='text/plain'){ const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([text],{type})); a.download=name; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),1000); }
  function exportCsv(){ const keys=fieldSets[moduleName]||[]; const rows=[keys.join(',')].concat(records.map(r=>keys.map(k=>'"'+String(r[k]||'').replace(/"/g,'""')+'"').join(','))); download(`${moduleName}.csv`, rows.join('\n'), 'text/csv'); }
  function exportJson(){ download(`${moduleName}.json`, JSON.stringify(records,null,2), 'application/json'); }
  function schemaFor(data){
    if(data.schemaJson){ try{return JSON.parse(data.schemaJson)}catch(e){} }
    const url=publicUrlFor(data); const type=data.schemaType || (moduleName==='services'?'Service':moduleName==='blogs'?'BlogPosting':'WebPage');
    if(type==='Service') return {'@context':'https://schema.org','@type':'Service',name:data.title,description:data.metaDescription||data.shortDescription,provider:{'@type':'Organization',name:C.siteName,url:C.siteBaseUrl},areaServed:data.geoServiceArea||data.targetCountry,url};
    if(type==='FAQPage' || data.aeoQuestion) return {'@context':'https://schema.org','@type':'FAQPage',mainEntity:[{'@type':'Question',name:data.aeoQuestion||data.title,acceptedAnswer:{'@type':'Answer',text:data.aeoAnswer||data.metaDescription||''}}]};
    return {'@context':'https://schema.org','@type':type,headline:data.title,description:data.metaDescription||data.excerpt,url,image:data.imageUrl||C.defaultOgImage,author:{'@type':'Organization',name:data.author||C.siteName},publisher:{'@type':'Organization',name:C.siteName,logo:{'@type':'ImageObject',url:(C.siteBaseUrl||'')+'/assets/images/best-web-developer-logo.png'}},datePublished:data.publishDate||today()};
  }
  function htmlPage(data){
    const title=data.metaTitle||data.title||'Untitled'; const desc=data.metaDescription||data.excerpt||data.shortDescription||''; const url=publicUrlFor(data); const img=data.imageUrl||C.defaultOgImage||''; const schema=JSON.stringify(schemaFor(data),null,2).replace(/<\//g,'<\\/');
    return `<!doctype html>\n<html lang="en">\n<head>\n  <meta charset="utf-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1">\n  <title>${escapeHTML(title)}</title>\n  <meta name="description" content="${escapeHTML(desc)}">\n  <meta name="robots" content="${escapeHTML(data.robots||C.defaultRobots||'index, follow')}">\n  <link rel="canonical" href="${escapeHTML(url)}">\n  <meta property="og:title" content="${escapeHTML(title)}">\n  <meta property="og:description" content="${escapeHTML(desc)}">\n  <meta property="og:url" content="${escapeHTML(url)}">\n  <meta property="og:type" content="${moduleName==='blogs'?'article':'website'}">\n  <meta property="og:image" content="${escapeHTML(img)}">\n  <meta name="twitter:card" content="summary_large_image">\n  <meta name="geo.placename" content="${escapeHTML(data.targetCity||data.geoServiceArea||'')}">\n  <meta name="answer-engine-optimization" content="${escapeHTML(data.aeoAnswer||desc)}">\n  <link rel="icon" href="../assets/images/favicon.png" type="image/png">\n  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">\n  <link href="../assets/css/styles.css" rel="stylesheet">\n  <script type="application/ld+json">${schema}<\/script>\n</head>\n<body>\n<main class="py-5">\n  <article class="container-xl article">\n    <a href="../${moduleName==='blogs'?'blog.html':'services.html'}" class="btn btn-outline-dark rounded-pill mb-4">Back</a>\n    <h1>${escapeHTML(data.title||title)}</h1>\n    <p class="lead">${escapeHTML(data.excerpt||data.shortDescription||desc)}</p>\n    ${img?`<img src="${escapeHTML(img)}" alt="${escapeHTML(data.imageAlt||data.title||title)}" class="img-fluid rounded-4 mb-4">`:''}\n    ${data.contentHtml||''}\n    ${data.aeoQuestion?`<section class="quote-box"><h2>${escapeHTML(data.aeoQuestion)}</h2><p>${escapeHTML(data.aeoAnswer||'')}</p></section>`:''}\n  </article>\n</main>\n<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"><\/script>\n</body>\n</html>`;
  }
  function downloadCurrentHtml(){ const data=getFormData(); const name=(data.slug||slugify(data.title)||'page')+'.html'; const code=htmlPage(data); $('#exportCode').textContent=code; download(name, code, 'text/html'); }

  function initButtons(){
    $('#recordSearch')?.addEventListener('input', renderTable); $('#statusFilter')?.addEventListener('change', renderTable); $('#sortToggle')?.addEventListener('click',()=>{sortDesc=!sortDesc;renderTable();}); $('#exportCsv')?.addEventListener('click', exportCsv); $('#exportJson')?.addEventListener('click', exportJson); $('#setupHint')?.addEventListener('click',()=>toast('Open apps-script/Code.gs in Apps Script, run setupSheets(), deploy as Web App, then paste URL in cms-config.js.'));
  }
  function initDashboard(){
    const dash=$('#adminDashboard'); if(!dash) return;
    const types=['blogs','services','pages','categories','tags','seo']; const cards=types.map(t=>{ const list=loadLocal(t); const avg=list.length?Math.round(list.reduce((s,r)=>s+analyze(r).score,0)/list.length):0; return `<div class="stat"><small>${moduleLabels[t]}</small><b>${list.length}</b><div class="cms-meter"><span style="width:${avg}%"></span></div><small>Avg SEO ${avg}</small></div>`; }).join('');
    dash.innerHTML=cards;
  }
  function initApp(){
    renderForm(); initButtons(); records=loadLocal(moduleName); renderTable(); fillForm(records[0] || {}); initDashboard();
    if($('#endpointStatus')) $('#endpointStatus').textContent = configuredEndpoint() ? 'Google Sheets sync enabled' : 'Local mode: paste Apps Script Web App URL in assets/js/cms-config.js';
  }
  if(initAuth()) initApp();
})();
