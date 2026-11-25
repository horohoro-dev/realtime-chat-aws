/* ライト / ダーク切替。
   - 保存済みの選択があれば描画前に <html data-theme> へ反映し、ちらつきを防ぐ
   - 選択が無ければ data-theme を付けず、CSS が OS の設定（prefers-color-scheme）に従う
   - 右上の切替ボタンを挿入し、押すと現在と逆のテーマを保存する
   head 内で同期読み込み（async / defer なし）すること。 */
(function () {
  var KEY = 'mb-theme';
  var root = document.documentElement;
  var media = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;

  function load() {
    try {
      var v = localStorage.getItem(KEY);
      return v === 'light' || v === 'dark' ? v : null;
    } catch (e) {
      return null;
    }
  }

  function save(v) {
    try { localStorage.setItem(KEY, v); } catch (e) { /* 保存できない環境では表示中だけ切り替える */ }
  }

  function current() {
    var v = root.getAttribute('data-theme');
    if (v === 'light' || v === 'dark') return v;
    return media && media.matches ? 'dark' : 'light';
  }

  var saved = load();
  if (saved) root.setAttribute('data-theme', saved);

  var SVG_NS = 'http://www.w3.org/2000/svg';
  var ICONS = {
    // ダーク表示中は「ライトへ」を示す太陽、ライト表示中は「ダークへ」を示す月
    sun: '<circle cx="12" cy="12" r="4.5"/><path d="M12 1.5v3M12 19.5v3M1.5 12h3M19.5 12h3M4.6 4.6l2.1 2.1M17.3 17.3l2.1 2.1M4.6 19.4l2.1-2.1M17.3 6.7l2.1-2.1"/>',
    moon: '<path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5a8.5 8.5 0 1 0 11 11z"/>'
  };

  function render(btn) {
    var dark = current() === 'dark';
    btn.innerHTML =
      '<svg xmlns="' + SVG_NS + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
      'stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      (dark ? ICONS.sun : ICONS.moon) + '</svg>';
    var label = dark ? 'ライト表示に切り替え' : 'ダーク表示に切り替え';
    btn.setAttribute('aria-label', label);
    btn.title = label;
  }

  function mount() {
    if (document.querySelector('.mb-theme-toggle')) return;
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'mb-theme-toggle';
    btn.addEventListener('click', function () {
      var next = current() === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      save(next);
      render(btn);
    });
    render(btn);
    document.body.appendChild(btn);

    // 選択が未保存の間は OS 設定の変更にアイコンを追従させる
    if (media) {
      var onChange = function () { if (!load()) render(btn); };
      if (media.addEventListener) media.addEventListener('change', onChange);
      else if (media.addListener) media.addListener(onChange);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }
})();
