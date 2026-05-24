/**
 * Best Web Developer static-site CMS backend.
 * Google Apps Script is JavaScript and works with the HTML/CSS/JS admin pages in this ZIP.
 * Spreadsheet: https://docs.google.com/spreadsheets/d/1zlupdxEyaOhuurdvYi5DhRduXVszY5plN7UFqEfO0X4/edit
 */
const SPREADSHEET_ID = '1zlupdxEyaOhuurdvYi5DhRduXVszY5plN7UFqEfO0X4';
const DEFAULT_PASSWORD = 'BWD@2026';
const SHEETS = {
  pages: {name:'Pages', headers:['id','status','title','slug','pageType','category','tags','imageUrl','imageAlt','excerpt','contentHtml','metaTitle','metaDescription','canonicalUrl','focusKeyword','robots','targetCountry','targetCity','geoServiceArea','aeoQuestion','aeoAnswer','schemaType','schemaJson','updatedAt']},
  blogs: {name:'Blogs', headers:['id','status','title','slug','category','tags','publishDate','author','readTime','imageUrl','imageAlt','excerpt','contentHtml','metaTitle','metaDescription','canonicalUrl','focusKeyword','robots','targetCountry','targetCity','geoServiceArea','aeoQuestion','aeoAnswer','schemaType','schemaJson','updatedAt']},
  services: {name:'Services', headers:['id','status','title','slug','category','tags','priceRange','imageUrl','imageAlt','shortDescription','contentHtml','metaTitle','metaDescription','canonicalUrl','focusKeyword','robots','targetCountry','targetCity','geoServiceArea','aeoQuestion','aeoAnswer','schemaType','schemaJson','updatedAt']},
  categories: {name:'Categories', headers:['id','status','title','slug','parent','description','sortOrder','metaTitle','metaDescription','canonicalUrl','focusKeyword','robots','schemaType','updatedAt']},
  tags: {name:'Tags', headers:['id','status','title','slug','description','sortOrder','metaTitle','metaDescription','canonicalUrl','focusKeyword','robots','schemaType','updatedAt']},
  seo: {name:'SEO_Meta', headers:['id','contentType','contentId','status','pageType','title','slug','metaTitle','metaDescription','canonicalUrl','focusKeyword','secondaryKeywords','robots','imageUrl','imageAlt','schemaType','schemaJson','seoScore','updatedAt']},
  geo: {name:'GEO_Targets', headers:['id','contentType','contentId','status','title','slug','targetCountry','targetRegion','targetCity','geoServiceArea','serviceRadius','localKeywords','address','latitude','longitude','canonicalUrl','updatedAt']},
  aeo: {name:'AEO_FAQ', headers:['id','contentType','contentId','status','title','slug','aeoQuestion','aeoAnswer','faqGroup','relatedQuestions','canonicalUrl','schemaType','schemaJson','updatedAt']},
  settings: {name:'Settings', headers:['key','value','description','updatedAt']},
  log: {name:'Activity_Log', headers:['timestamp','action','type','id','title','status','message']}
};

function setupSheets() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  Object.keys(SHEETS).forEach(type => {
    const cfg = SHEETS[type];
    let sh = ss.getSheetByName(cfg.name) || ss.insertSheet(cfg.name);
    sh.clear();
    sh.getRange(1,1,1,cfg.headers.length).setValues([cfg.headers]);
    sh.setFrozenRows(1);
    sh.getRange(1,1,1,cfg.headers.length).setFontWeight('bold').setBackground('#ff8c00').setFontColor('#111111');
    sh.autoResizeColumns(1, cfg.headers.length);
    if (cfg.headers.indexOf('status') > -1) {
      const col = cfg.headers.indexOf('status') + 1;
      const rule = SpreadsheetApp.newDataValidation().requireValueInList(['draft','published','archived'], true).build();
      sh.getRange(2, col, Math.max(1, sh.getMaxRows()-1), 1).setDataValidation(rule);
    }
  });
  seedSettings_();
  log_('setup','all','setup','CMS sheets created','published','Created separate Pages, Blogs, Services, Categories, Tags, SEO, GEO, and AEO sheets.');
  return json_({ok:true, message:'CMS sheets created.'});
}

function seedSettings_() {
  const sh = getSheet_('settings');
  const rows = [
    ['siteBaseUrl','https://bestwebdeveloper.org','Public website base URL', new Date()],
    ['defaultAuthor','Best Web Developer','Default author for blog posts', new Date()],
    ['defaultRobots','index, follow, max-image-preview:large','Default robots meta tag', new Date()],
    ['defaultServiceAreas','USA, UK, Phoenix, Scottsdale, Tempe, London','Default GEO service area', new Date()],
    ['adminPasswordProperty','ADMIN_PASSWORD','Set this in Project Settings > Script properties for production.', new Date()]
  ];
  sh.getRange(2,1,rows.length,rows[0].length).setValues(rows);
}

function doGet(e) {
  try {
    const action = (e.parameter.action || 'list').toLowerCase();
    const type = (e.parameter.type || 'blogs').toLowerCase();
    if (action === 'list') return json_({ok:true, type:type, records:listRecords_(type)});
    if (action === 'setup') return setupSheets();
    return json_({ok:false, error:'Unknown action'});
  } catch(err) { return json_({ok:false, error:String(err)}); }
}

function doPost(e) {
  try {
    const payload = JSON.parse((e.postData && e.postData.contents) || '{}');
    if (!validPassword_(payload.password)) return json_({ok:false, error:'Invalid password'});
    const action = (payload.action || '').toLowerCase();
    const type = (payload.type || 'blogs').toLowerCase();
    if (action === 'save') return json_(saveRecord_(type, payload.record || {}));
    if (action === 'delete') return json_(deleteRecord_(type, payload.id));
    if (action === 'setup') return setupSheets();
    return json_({ok:false, error:'Unknown action'});
  } catch(err) { return json_({ok:false, error:String(err)}); }
}

function validPassword_(password) {
  const configured = PropertiesService.getScriptProperties().getProperty('ADMIN_PASSWORD') || DEFAULT_PASSWORD;
  return String(password || '') === String(configured);
}

function getSheet_(type) {
  const cfg = SHEETS[type];
  if (!cfg) throw new Error('Unsupported type: ' + type);
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sh = ss.getSheetByName(cfg.name);
  if (!sh) {
    sh = ss.insertSheet(cfg.name);
    sh.getRange(1,1,1,cfg.headers.length).setValues([cfg.headers]);
    sh.setFrozenRows(1);
  }
  return sh;
}

function listRecords_(type) {
  const cfg = SHEETS[type];
  if (!cfg) throw new Error('Unsupported type: ' + type);
  const sh = getSheet_(type);
  const values = sh.getDataRange().getValues();
  if (values.length < 2) return [];
  const headers = values[0];
  return values.slice(1).filter(row => row.join('').trim() !== '').map(row => {
    const rec = {};
    headers.forEach((h,i) => rec[h] = row[i] instanceof Date ? Utilities.formatDate(row[i], Session.getScriptTimeZone(), 'yyyy-MM-dd') : row[i]);
    return rec;
  });
}

function saveRecord_(type, record) {
  const cfg = SHEETS[type];
  if (!cfg) throw new Error('Unsupported type: ' + type);
  record.id = record.id || (type + '-' + new Date().getTime());
  record.updatedAt = new Date();
  const sh = getSheet_(type);
  const headers = cfg.headers;
  const ids = sh.getRange(1,1,Math.max(sh.getLastRow(),1),1).getValues().flat();
  let rowIndex = ids.indexOf(record.id) + 1;
  if (rowIndex < 2) rowIndex = sh.getLastRow() + 1;
  const row = headers.map(h => record[h] || '');
  sh.getRange(rowIndex,1,1,headers.length).setValues([row]);
  sh.autoResizeColumns(1, Math.min(headers.length, 12));
  syncSeoGeoAeo_(type, record);
  log_('save', type, record.id, record.title || record.metaTitle || record.slug || '', record.status || '', 'Saved record');
  return {ok:true, type:type, record:record};
}

function deleteRecord_(type, id) {
  const sh = getSheet_(type);
  const ids = sh.getRange(1,1,Math.max(sh.getLastRow(),1),1).getValues().flat();
  const rowIndex = ids.indexOf(id) + 1;
  if (rowIndex >= 2) sh.deleteRow(rowIndex);
  if (['blogs','services','pages','categories','tags'].indexOf(type) > -1) {
    ['seo','geo','aeo'].forEach(t => deleteSingleRecord_(t, type + '-' + id));
  }
  log_('delete', type, id, '', '', 'Deleted record');
  return {ok:true, type:type, id:id};
}

function deleteSingleRecord_(type, id) {
  const sh = getSheet_(type);
  const ids = sh.getRange(1,1,Math.max(sh.getLastRow(),1),1).getValues().flat();
  const rowIndex = ids.indexOf(id) + 1;
  if (rowIndex >= 2) sh.deleteRow(rowIndex);
}

function syncSeoGeoAeo_(type, record) {
  const contentId = record.id;
  if (['blogs','services','pages','categories','tags'].indexOf(type) === -1) return;
  saveRecord_('seo', {id:type + '-' + contentId, contentType:type, contentId:contentId, status:record.status, pageType:record.pageType || type, title:record.title, slug:record.slug, metaTitle:record.metaTitle, metaDescription:record.metaDescription, canonicalUrl:record.canonicalUrl, focusKeyword:record.focusKeyword, secondaryKeywords:record.secondaryKeywords || record.tags, robots:record.robots, imageUrl:record.imageUrl, imageAlt:record.imageAlt, schemaType:record.schemaType, schemaJson:record.schemaJson, seoScore:score_(record)});
  saveRecord_('geo', {id:type + '-' + contentId, contentType:type, contentId:contentId, status:record.status, title:record.title, slug:record.slug, targetCountry:record.targetCountry, targetRegion:record.targetRegion, targetCity:record.targetCity, geoServiceArea:record.geoServiceArea, serviceRadius:record.serviceRadius, localKeywords:record.localKeywords || record.tags, address:record.address, latitude:record.latitude, longitude:record.longitude, canonicalUrl:record.canonicalUrl});
  if (record.aeoQuestion || record.aeoAnswer) saveRecord_('aeo', {id:type + '-' + contentId, contentType:type, contentId:contentId, status:record.status, title:record.title, slug:record.slug, aeoQuestion:record.aeoQuestion, aeoAnswer:record.aeoAnswer, faqGroup:record.category, relatedQuestions:record.relatedQuestions, canonicalUrl:record.canonicalUrl, schemaType:'FAQPage', schemaJson:record.schemaJson});
}

function score_(r) {
  let score = 0;
  const mt = String(r.metaTitle || '');
  const md = String(r.metaDescription || '');
  const slug = String(r.slug || '');
  const content = String(r.contentHtml || r.excerpt || r.shortDescription || '');
  const words = content.replace(/<[^>]+>/g,' ').split(/\s+/).filter(Boolean).length;
  if (mt.length >= 35 && mt.length <= 60) score += 15;
  if (md.length >= 120 && md.length <= 160) score += 15;
  if (/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) score += 10;
  if (r.canonicalUrl) score += 8;
  if (r.imageAlt) score += 8;
  if (words >= 180) score += 12;
  if (r.focusKeyword && mt.toLowerCase().indexOf(String(r.focusKeyword).toLowerCase()) > -1) score += 8;
  if (r.targetCountry && (r.targetCity || r.geoServiceArea)) score += 10;
  if (r.aeoQuestion && r.aeoAnswer) score += 8;
  if (r.schemaType || r.schemaJson) score += 6;
  return Math.min(100, score);
}

function log_(action, type, id, title, status, message) {
  const sh = getSheet_('log');
  sh.appendRow([new Date(), action, type, id, title, status, message]);
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
