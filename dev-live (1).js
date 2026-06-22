/*!
 * al BOURJI ELECTRICS — وضع المطور المباشر (Live Developer Mode)
 * =================================================================
 * ملف واحد إضافي — اجعله في: js/dev-live.js
 *
 * طريقة التركيب (سطر واحد فقط):
 *   في ملف index.html (أو الصفحة الرئيسية)، أضف السطر التالي
 *   قبل السطر:   <script src="js/main.js"></script>
 *
 *     <script src="js/dev-live.js"></script>
 *
 * المميزات:
 *   ✅ زر "حفظ وتطبيق فوري" داخل لوحة المطور (في تبويب "تصدير")
 *   ✅ زر "استعادة الافتراضي" بجانبه
 *   ✅ شارة صغيرة في الزاوية تدل على أن البث المباشر مفعّل
 *   ✅ التعديلات تظهر فوراً على الصفحة — بدون رفع أي ملف
 *   ✅ البيانات محفوظة في localStorage — تبقى بعد إغلاق المتصفح
 *   ✅ متوافق تماماً مع main.js و dev.js الحاليين
 *   ✅ يعترض طلبات products.json و contact.json ويُرجع البيانات
 *      المحفوظة محلياً (إن وُجدت) — أي أن كل مرة تفتح الصفحة
 *      ستجد تعديلاتك جاهزة
 *
 * ⚠️ ملاحظة مهمة:
 *   هذا يحفظ التعديلات في متصفحك أنت فقط. إذا أردت أن تظهر
 *   التعديلات للزوار أيضاً، استخدم زر "تنزيل الملفات" الموجود
 *   في تبويب "تصدير" داخل لوحة المطور، وارفع الملفات الناتجة
 *   على الاستاضة.
 *
 * 🛠 إذا أردت حفظ المنتجات أيضاً عبر زر الحفظ المباشر، أضف
 *    السطر التالي إلى main.js (داخل دالة تحميل المنتجات):
 *      window.__bourjiProducts = products;
 * =================================================================
 */

(function () {
  'use strict';

  /* لا تُحمِّل الملف مرتين */
  if (window.__bourjiLiveLoaded) return;
  window.__bourjiLiveLoaded = true;

  /* =================================================================
     مفاتيح التخزين في localStorage
     ================================================================= */
  const K = {
    products: 'bourji_live_products_v1',
    contact:  'bourji_live_contact_v1',
    content:  'bourji_live_content_v1',
    branding: 'bourji_live_branding_v1',
    theme:    'bourji_live_theme_v1',
    active:   'bourji_live_active'
  };

  /* =================================================================
     أدوات DOM
     ================================================================= */
  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));

  /* =================================================================
     قراءة / كتابة / مسح من localStorage
     ================================================================= */
  function read(key) {
    try {
      const r = localStorage.getItem(key);
      return r ? JSON.parse(r) : null;
    } catch (_) { return null; }
  }
  function write(key, val) {
    try {
      localStorage.setItem(key, JSON.stringify(val));
      return true;
    } catch (e) {
      console.error('[bourji-live] save failed:', key, e);
      return false;
    }
  }
  function clearAll() {
    Object.values(K).forEach(k => localStorage.removeItem(k));
  }

  /* =================================================================
     [1] اعتراض fetch — لو فيه بيانات محفوظة محلياً،
         استخدمها بدل الملف الموجود على السيرفر.
     هذا يجعل الصفحة تستخدم تعديلاتك تلقائياً في كل تحميل.
     ================================================================= */
  (function patchFetch() {
    if (window.__bourjiFetchPatched) return;
    window.__bourjiFetchPatched = true;

    const orig = window.fetch.bind(window);

    window.fetch = function (input, init) {
      try {
        const url = typeof input === 'string'
          ? input
          : (input && input.url) ? input.url : '';

        if (/\/products\.json(\?|$)/.test(url)) {
          const saved = read(K.products);
          if (Array.isArray(saved) && saved.length) {
            return Promise.resolve(new Response(JSON.stringify(saved), {
              status: 200,
              headers: { 'Content-Type': 'application/json' }
            }));
          }
        }

        if (/\/contact\.json(\?|$)/.test(url)) {
          const saved = read(K.contact);
          if (saved && typeof saved === 'object') {
            return Promise.resolve(new Response(JSON.stringify(saved), {
              status: 200,
              headers: { 'Content-Type': 'application/json' }
            }));
          }
        }
      } catch (_) { /* fallback to original fetch */ }
      return orig(input, init);
    };
  })();

  /* =================================================================
     [2] تطبيق البيانات على الصفحة مباشرة
     ================================================================= */
  function applyContact(c) {
    if (!c || typeof c !== 'object') return;

    // تحديث النصوص التي عليها data-c
    $$('[data-c]').forEach(el => {
      if (c[el.dataset.c] != null && c[el.dataset.c] !== '') {
        el.textContent = c[el.dataset.c];
      }
    });

    // تحديث روابط واتساب
    const wa = (n) => n ? 'https://wa.me/' + String(n).replace(/[^\d]/g, '') : null;
    if (c.whatsapp) {
      const u = wa(c.whatsapp);
      if (u) $$('[data-social="whatsapp_url"]').forEach(a => a.href = u);
    }
    if (c.whatsapp2) {
      const u = wa(c.whatsapp2);
      if (u) $$('[data-social="whatsapp2_url"]').forEach(a => a.href = u);
    }

    // تحديث روابط السوشيال
    ['instagram', 'facebook', 'tiktok'].forEach(name => {
      if (c[name]) {
        $$('[data-social="' + name + '"]').forEach(a => a.href = c[name]);
      }
    });
  }

  function applyBranding(b) {
    if (!b || typeof b !== 'object') return;
    $$('[data-c]').forEach(el => {
      const parts = String(el.dataset.c || '').split('.');
      let v = b;
      for (const p of parts) {
        if (v && typeof v === 'object' && p in v) v = v[p];
        else { v = undefined; break; }
      }
      if (v !== undefined && v !== null && v !== '') el.textContent = v;
    });
  }

  function applyContent(c) {
    if (!c || typeof c !== 'object') return;
    const map = {
      'topbar.announcement': '.announcement__track > span:first-child',
      'hero.title':          '.hero__title',
      'hero.subtitle':       '.hero__sub',
      'about.p1':            '.about__text p:nth-of-type(1)',
      'about.p2':            '.about__text p:nth-of-type(2)'
    };
    Object.entries(map).forEach(([key, sel]) => {
      if (c[key] != null && c[key] !== '') {
        const el = $(sel);
        if (el) el.textContent = c[key];
      }
    });
  }

  function applyTheme(t) {
    if (!t || typeof t !== 'object') return;
    const root = document.documentElement;
    Object.entries(t).forEach(([k, v]) => {
      if (typeof v === 'string' && /^#([0-9a-f]{3}){1,2}$/i.test(v)) {
        root.style.setProperty(k, v);
      }
    });
  }

  function loadAll() {
    applyContact(read(K.contact));
    applyBranding(read(K.branding));
    applyContent(read(K.content));
    applyTheme(read(K.theme));
    if (read(K.active)) showLiveBadge(true);
  }

  /* =================================================================
     [3] تجميع التعديلات من داخل لوحة المطور
     ================================================================= */
  function collectBranding() {
    const out = {};
    $$('[data-branding]').forEach(input => {
      const parts = String(input.dataset.branding || '').split('.');
      let o = out;
      while (parts.length > 1) {
        const p = parts.shift();
        if (!(p in o) || typeof o[p] !== 'object') o[p] = {};
        o = o[p];
      }
      o[parts[0]] = input.value;
    });
    return out;
  }
  function collectContent() {
    const out = {};
    $$('[data-content]').forEach(input => {
      out[input.dataset.content] = input.value;
    });
    return out;
  }
  function collectTheme() {
    const out = {};
    $$('[data-theme]').forEach(input => {
      out[input.dataset.theme] = input.value;
    });
    return out;
  }
  function collectContact() {
    const out = {};
    $$('[data-c]').forEach(el => {
      const t = el.textContent.trim();
      if (t) out[el.dataset.c] = t;
    });
    const br = collectBranding();
    if (br.contact && typeof br.contact === 'object') {
      Object.assign(out, br.contact);
    }
    return out;
  }
  function collectProducts() {
    const candidates = [
      window.__bourjiProducts,
      window.products,
      window.PRODUCTS,
      window.bourjiProducts
    ];
    for (const c of candidates) {
      if (Array.isArray(c) && c.length) {
        try { return JSON.parse(JSON.stringify(c)); } catch (_) { return c.slice(); }
      }
    }
    return null;
  }

  /* =================================================================
     [4] حفظ وتطبيق فوري
     ================================================================= */
  function saveAll() {
    const branding = collectBranding();
    const content  = collectContent();
    const theme    = collectTheme();
    const contact  = collectContact();
    const products = collectProducts();

    write(K.branding, branding);
    write(K.content,  content);
    write(K.theme,    theme);
    write(K.contact,  contact);
    if (products) write(K.products, products);
    write(K.active, { at: Date.now() });

    applyBranding(branding);
    applyContent(content);
    applyTheme(theme);
    applyContact(contact);
    showLiveBadge(true);

    toast('✅ تم الحفظ المباشر — التعديلات ظاهرة فوراً!');
  }

  function resetAll() {
    if (!confirm('سيتم حذف كل التعديلات المحفوظة محلياً وإعادة الصفحة للوضع الافتراضي. متأكد؟')) return;
    clearAll();
    location.reload();
  }

  /* =================================================================
     [5] واجهة المستخدم: شارة، إشعار، أزرار الحفظ
     ================================================================= */
  function ensureStyles() {
    if ($('#bourjiLiveStyles')) return;
    const s = document.createElement('style');
    s.id = 'bourjiLiveStyles';
    s.textContent = `
      #bourjiLiveBadge {
        position: fixed; bottom: 24px; left: 24px; z-index: 99998;
        background: linear-gradient(135deg, #0e0e0e, #1a1a1a);
        color: #c9a45c; border: 1px solid #c9a45c; border-radius: 999px;
        padding: 8px 14px; font-family: Cairo, Tajawal, sans-serif;
        font-size: 12px; font-weight: 700; cursor: pointer;
        display: flex; align-items: center; gap: 8px;
        box-shadow: 0 6px 20px rgba(0,0,0,.5);
        transition: transform .15s;
      }
      #bourjiLiveBadge:hover { transform: translateY(-2px); }
      #bourjiLiveBadge .dot {
        width: 8px; height: 8px; border-radius: 50%;
        background: #25D366; box-shadow: 0 0 8px #25D366;
        animation: bourjiPulse 1.4s infinite;
      }
      #bourjiToast {
        position: fixed; bottom: 90px; right: 24px; z-index: 99999;
        background: linear-gradient(135deg, #1a1a1a, #2a2a2a);
        color: #fff; padding: 14px 20px; border-radius: 12px;
        border: 1px solid #c9a45c;
        font-family: Cairo, Tajawal, sans-serif;
        font-size: 14px; font-weight: 600;
        opacity: 0; pointer-events: none;
        transition: opacity .25s, transform .25s;
        box-shadow: 0 10px 30px rgba(0,0,0,.5);
        transform: translateY(10px); max-width: 340px;
      }
      #bourjiToast.show { opacity: 1; transform: translateY(0); }
      @keyframes bourjiPulse {
        0%, 100% { opacity: 1; transform: scale(1); }
        50%      { opacity: .5; transform: scale(1.3); }
      }
      .bourji-live-block {
        margin-top: 16px; padding-top: 14px;
        border-top: 1px dashed rgba(201,164,92,.35);
      }
      .bourji-live-block h4 { margin: 0 0 10px; color: #c9a45c; font-size: 15px; }
      .bourji-live-actions { display: flex; flex-wrap: wrap; gap: 10px; }
      .bourji-live-note {
        font-size: 12px; color: #9b9b9b;
        margin: 10px 0 0; line-height: 1.7;
      }
      .bourji-live-note code {
        background: rgba(201,164,92,.12);
        color: #c9a45c; padding: 1px 6px; border-radius: 4px;
        font-family: monospace; font-size: 11px;
      }
    `;
    document.head.appendChild(s);
  }

  function toast(msg) {
    let t = $('#bourjiToast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'bourjiToast';
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(t._timer);
    t._timer = setTimeout(() => t.classList.remove('show'), 2800);
  }

  function showLiveBadge(active) {
    let b = $('#bourjiLiveBadge');
    if (!active) { if (b) b.remove(); return; }
    if (b) return;
    b = document.createElement('button');
    b.id = 'bourjiLiveBadge';
    b.type = 'button';
    b.title = 'البث المباشر مفعّل — اضغط لاستعادة الافتراضي';
    b.innerHTML = '<span class="dot"></span><span>البث المباشر مفعّل</span>';
    b.onclick = resetAll;
    document.body.appendChild(b);
  }

  /* =================================================================
     [6] حقن زرّي "حفظ وتطبيق فوري" و"استعادة الافتراضي"
         داخل تبويب "تصدير" بلوحة المطور.
     ================================================================= */
  function injectSaveButtons() {
    const tryInject = () => {
      const exportPane = $('.dev-section[data-pane="export"]');
      if (!exportPane) return false;
      if ($('#bourjiLiveSave')) return true;

      const block = document.createElement('div');
      block.className = 'bourji-live-block';
      block.innerHTML = `
        <h4>⚡ الحفظ المباشر (بدون رفع الملفات)</h4>
        <div class="bourji-live-actions">
          <button id="bourjiLiveSave" type="button" class="btn btn--gold">⚡ حفظ وتطبيق فوري</button>
          <button id="bourjiLiveReset" type="button" class="btn btn--ghost">↩️ استعادة الافتراضي</button>
        </div>
        <p class="bourji-live-note">
          التعديلات تُحفظ في متصفحك (<code>localStorage</code>) وتظهر فوراً على الصفحة.
          لا حاجة لرفع أي ملف. اضغط زر "حفظ وتطبيق فوري" بعد كل تعديل.
          <br>• للتجربة السريعة: استخدم هذا الزر.
          <br>• لنشر التعديلات للزوار: استخدم زر "تنزيل الملفات" بالأعلى ثم ارفعها على الاستضافة.
        </p>
      `;
      exportPane.appendChild(block);

      $('#bourjiLiveSave').onclick = saveAll;
      $('#bourjiLiveReset').onclick = resetAll;
      return true;
    };

    if (!tryInject()) {
      const iv = setInterval(() => { if (tryInject()) clearInterval(iv); }, 300);
      setTimeout(() => clearInterval(iv), 12000);
    }
  }

  /* =================================================================
     [7] ملء حقول لوحة المطور من البيانات المحفوظة
         عند فتح اللوحة أو التنقل بين التبويبات.
     ================================================================= */
  function populateDevPanelInputs() {
    const br = read(K.branding);
    const ct = read(K.content);
    const th = read(K.theme);

    if (br && typeof br === 'object') {
      $$('[data-branding]').forEach(i => {
        const parts = String(i.dataset.branding || '').split('.');
        let v = br;
        for (const p of parts) {
          if (v && typeof v === 'object' && p in v) v = v[p];
          else { v = undefined; break; }
        }
        if (v !== undefined && v !== null) i.value = v;
      });
    }
    if (ct && typeof ct === 'object') {
      $$('[data-content]').forEach(i => {
        if (ct[i.dataset.content] != null) i.value = ct[i.dataset.content];
      });
    }
    if (th && typeof th === 'object') {
      $$('[data-theme]').forEach(i => {
        if (th[i.dataset.theme]) i.value = th[i.dataset.theme];
      });
    }
  }

  function watchDevInteractions() {
    const modal = $('#devModal');
    if (modal) {
      const obs = new MutationObserver(() => {
        if (!modal.hidden) setTimeout(populateDevPanelInputs, 220);
      });
      obs.observe(modal, { attributes: true, attributeFilter: ['hidden'] });
    }
    $$('.dev-tab').forEach(tab => {
      tab.addEventListener('click', () => setTimeout(populateDevPanelInputs, 220));
    });
  }

  /* =================================================================
     [8] تشغيل
     ================================================================= */
  function init() {
    ensureStyles();
    loadAll();

    const ready = () => { injectSaveButtons(); watchDevInteractions(); };
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', ready);
    } else {
      ready();
    }
  }

  init();
})();