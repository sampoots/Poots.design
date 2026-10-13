// Poots Design — start your project page.
// Package picker (reads ?package= from the link), checklist progress, and ticks saved on this device.
(function () {
  var KEY = 'pd-start-ticks';
  var store = {
    get: function () { try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch (e) { return []; } },
    set: function (v) { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch (e) { /* storage blocked: ticks just won't be remembered */ } }
  };

  // ---- Package picker ----
  var radios = document.querySelectorAll('input[name="package"]');
  var info = document.getElementById('pkg-info');
  function showPackage() {
    var r = document.querySelector('input[name="package"]:checked');
    if (!r || !info) return;
    var d = r.dataset;
    if (!d.price) {
      info.innerHTML = '<p>Not sure? That’s fine. Send your details and I’ll recommend the right package, with a fixed quote and no obligation.</p>';
      return;
    }
    info.innerHTML = '';
    var p = document.createElement('p');
    p.innerHTML = '<strong></strong> ';
    p.firstChild.textContent = d.name + ' – ' + d.price + '.';
    p.appendChild(document.createTextNode(
      'Deposit to start: ' + d.deposit + '. You’ll need ' + d.photos +
      ', and your site is usually ready in ' + d.time + ' once I have your deposit and content.'));
    info.appendChild(p);
  }
  var wanted = new URLSearchParams(location.search).get('package');
  if (wanted) {
    var match = document.querySelector('input[name="package"][value="' + wanted.replace(/[^a-z]/g, '') + '"]');
    if (match) match.checked = true;
  }
  Array.prototype.forEach.call(radios, function (r) { r.addEventListener('change', showPackage); });
  showPackage();
  var form = document.getElementById('enquiry');
  if (form) form.addEventListener('reset', function () { setTimeout(showPackage, 0); });

  // ---- Checklist progress ----
  var ticks = Array.prototype.slice.call(document.querySelectorAll('input[data-tick]'));
  var text = document.getElementById('progress-text');
  var bar = document.getElementById('progress-bar');
  var saved = store.get();
  ticks.forEach(function (t) { if (saved.indexOf(t.id) !== -1) t.checked = true; });
  function update(save) {
    var done = ticks.filter(function (t) { return t.checked; });
    if (text) text.textContent = done.length === ticks.length
      ? 'All ' + ticks.length + ' ready. Great, send them over in step 3.'
      : done.length + ' of ' + ticks.length + ' ready';
    if (bar) bar.style.width = (ticks.length ? (done.length / ticks.length * 100) : 0) + '%';
    if (save) store.set(done.map(function (t) { return t.id; }));
  }
  ticks.forEach(function (t) { t.addEventListener('change', function () { update(true); }); });
  var clear = document.getElementById('clear-ticks');
  if (clear) clear.addEventListener('click', function () {
    ticks.forEach(function (t) { t.checked = false; });
    update(true);
  });
  update(false);
})();
