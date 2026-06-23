/**
 * 生活部文化有限公司 — 留言板（Supabase 后端）
 * 使用前需替换下方的 SUPABASE_URL 和 SUPABASE_KEY
 */
(function () {
  'use strict';

  // ======== ⚠️ 替换为你自己的 Supabase 配置 ========
  var SUPABASE_URL = 'https://xpjscwinakuifoounjdp.supabase.co';
  var SUPABASE_KEY = 'sb_publishable_F1JEY_RaNdI1Zkqwh_Fg0Q_dcEnfdTs';
  // =================================================

  var page = location.pathname.split('/').pop() || '';
  var client = null;

  // ============ 加载 Supabase CDN ============
  function loadSupabase(cb) {
    // 国内 jsdelivr 不稳定，尝试 fastly 线路
    var urls = [
      'https://fastly.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js',
      'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js'
    ];
    var idx = 0;

    function tryLoad() {
      if (idx >= urls.length) {
        var list = document.getElementById('comment-list');
        if (list) list.innerHTML = '<div class="comment-empty">留言板加载失败，请检查网络后刷新页面</div>';
        cb();
        return;
      }
      var script = document.createElement('script');
      script.src = urls[idx];
      script.onload = function () {
        var s = window.supabase || self.supabase || (typeof supabase !== 'undefined' ? supabase : null);
        if (s) {
          client = s.createClient(SUPABASE_URL, SUPABASE_KEY);
        }
        cb();
      };
      script.onerror = function () {
        idx++;
        tryLoad();
      };
      document.head.appendChild(script);
    }
    tryLoad();
  }

  // ============ 注入留言板 DOM ============
  function injectCommentSection() {
    var container = document.querySelector('.page-container');
    if (!container) return;

    var div = document.createElement('div');
    div.className = 'comment-section';
    div.innerHTML =
      '<div class="comment-title">💬 留言板</div>' +
      '<div class="comment-form">' +
        '<div class="comment-row">' +
          '<input type="text" id="comment-name" placeholder="你的名字（选填）" maxlength="30" autocomplete="off">' +
        '</div>' +
        '<textarea id="comment-text" placeholder="说点什么吧..." maxlength="500"></textarea>' +
        '<button class="comment-submit" id="comment-submit">发送留言</button>' +
      '</div>' +
      '<div class="comment-list" id="comment-list">' +
        '<div class="comment-empty">加载中...</div>' +
      '</div>';

    container.appendChild(div);
  }

  // ============ 加载留言列表 ============
  function loadComments() {
    if (!client) return;
    var list = document.getElementById('comment-list');
    if (!list) return;

    client.from('comments')
      .select('*')
      .eq('page', page)
      .order('created_at', { ascending: false })
      .limit(50)
      .then(function (res) {
        if (res.error) {
          list.innerHTML = '<div class="comment-empty">加载失败，请稍后重试</div>';
          return;
        }
        if (!res.data || res.data.length === 0) {
          list.innerHTML = '<div class="comment-empty">暂无留言，来说第一句吧 💬</div>';
          return;
        }

        var html = '';
        res.data.forEach(function (c) {
          var name = c.name || '匿名同学';
          var date = new Date(c.created_at);
          var time = (date.getMonth() + 1) + '/' + date.getDate() + ' ' +
            pad(date.getHours()) + ':' + pad(date.getMinutes());
          html +=
            '<div class="comment-item">' +
              '<div class="comment-meta">' +
                '<span class="comment-author">' + esc(name) + '</span>' +
                '<span class="comment-time">' + esc(time) + '</span>' +
              '</div>' +
              '<div class="comment-body">' + esc(c.content) + '</div>' +
            '</div>';
        });
        list.innerHTML = html;
      });
  }

  function esc(str) {
    var d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  function pad(n) { return ('0' + n).slice(-2); }

  // ============ 发送留言 ============
  function setupForm() {
    var btn = document.getElementById('comment-submit');
    var nameInp = document.getElementById('comment-name');
    var textInp = document.getElementById('comment-text');
    if (!btn || !textInp) return;

    btn.addEventListener('click', function () {
      var name = (nameInp.value || '').trim();
      var text = textInp.value.trim();
      if (!text) return;
      if (text.length > 500) { alert('留言太长了，最多 500 字'); return; }

      btn.disabled = true;
      btn.textContent = '发送中...';

      client.from('comments')
        .insert([{ page: page, name: name || null, content: text }])
        .then(function (res) {
          if (res.error) {
            console.error('留言失败:', res.error);
            btn.disabled = false;
            btn.textContent = '发送失败，重试';
            return;
          }
          nameInp.value = '';
          textInp.value = '';
          btn.disabled = false;
          btn.textContent = '发送留言';
          loadComments();
        })
        .catch(function () {
          btn.disabled = false;
          btn.textContent = '发送失败，重试';
        });
    });
  }

  injectCommentSection();
  loadSupabase(function () {
    setupForm();
    loadComments();
  });
})();
