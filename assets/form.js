/* Poots Design: enquiry forms. Handles every form[data-enquiry] on the page.
   Without JS the forms post straight to Formspree. With JS: inline accessible errors,
   "at least one of" groups ([data-one-of="email phone"]), a fetch submit, and a success panel.
   Prefill: ?business= &trade= &town= &package= (whitelisted, plain text only). */
(function () {
  'use strict';
  var d = document;
  var forms = d.querySelectorAll('form[data-enquiry]');
  if (!forms.length) return;

  // Site root, worked out from this script's own URL (assets/form.js), for links in the success panel.
  var me = d.currentScript || d.querySelector('script[src*="assets/form.js"]');
  var base = me ? new URL('../', me.src).href : '/';
  var ERR = "Sorry, that didn't send. Please call or text 07395 229191, or email infopootsdesign@gmail.com.";
  var LABELS = {
    trade: { electrician: 'Electrician', roofer: 'Roofer', cafe: 'Café', 'café': 'Café', salon: 'Salon', barber: 'Barber', cleaner: 'Cleaner', trainer: 'Personal trainer', pt: 'Personal trainer', restaurant: 'Restaurant', fitness: 'Fitness' },
    package: { launch: 'Launch', essential: 'Essential', starter: 'Starter', business: 'Business', unsure: 'Not sure yet' }
  };

  function clean(v) {
    return String(v || '').replace(/[^0-9A-Za-z\u00C0-\u024F '&.,-]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 40);
  }
  function nice(key, v) {
    var k = v.toLowerCase();
    if (LABELS[key] && LABELS[key][k]) return LABELS[key][k];
    return v.charAt(0).toUpperCase() + v.slice(1);
  }
  function el(tag, cls, text) {
    var n = d.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function describe(input, id, add) {
    var ids = (input.getAttribute('aria-describedby') || '').split(/\s+/).filter(function (x) { return x && x !== id; });
    if (add) ids.push(id);
    if (ids.length) input.setAttribute('aria-describedby', ids.join(' ')); else input.removeAttribute('aria-describedby');
  }
  function message(input) {
    if (input.dataset.err) return input.dataset.err;
    var v = input.validity, t = input.type;
    if (t === 'checkbox') return 'Please tick this box to continue.';
    if (t === 'radio') return 'Please choose one option.';
    if (v.typeMismatch && t === 'email') return 'Please check your email address. It should look like name@example.com.';
    if (v.typeMismatch && t === 'url') return 'Please enter a full web address, starting with https://';
    if (v.valueMissing && t === 'email') return 'Please enter your email address.';
    if (v.valueMissing && t === 'tel') return 'Please enter your phone number.';
    if (v.valueMissing && input.tagName === 'SELECT') return 'Please choose an option.';
    if (v.valueMissing) return 'Please fill this in.';
    if (v.tooLong || v.tooShort) return 'Please check the length of this answer.';
    return input.validationMessage || 'Please check this answer.';
  }

  Array.prototype.forEach.call(forms, function (form, n) {
    form.setAttribute('novalidate', '');
    var box = form.closest('[data-form-box]');
    if (box) box.hidden = false;
    var status = form.querySelector('[data-status]');
    var button = form.querySelector('button[type="submit"], button:not([type])');
    var sending = false;
    var errs = [];

    function fields() {
      return Array.prototype.filter.call(form.elements, function (f) {
        return f.willValidate && f.tagName !== 'BUTTON' && f.type !== 'hidden' && !f.closest('.hp');
      });
    }
    function holder(f) {
      if (f.type === 'radio' || f.type === 'checkbox') {
        var fs = f.closest('fieldset');
        if (f.type === 'radio' && fs) return fs;
      }
      return f.closest('.field') || f.closest('.check') || f.parentNode;
    }
    function clearOne(key) {
      var gone = errs.filter(function (e) { return e.key === key; });
      if (!gone.length) return;
      errs = errs.filter(function (e) { return e.key !== key; });
      gone.forEach(function (e) {
        e.inputs.forEach(function (i) {
          describe(i, e.id, false);
          var still = errs.some(function (x) { return x.inputs.indexOf(i) > -1; });
          if (!still) i.removeAttribute('aria-invalid');
        });
        if (e.node.parentNode) e.node.parentNode.removeChild(e.node);
      });
    }
    function addErr(key, inputs, place, text) {
      clearOne(key);
      var id = (inputs[0].id || ('f' + n + '-' + key.replace(/\W+/g, ''))) + '-err';
      var node = el('p', 'field__err', text);
      node.id = id;
      if (place.tagName === 'LABEL') place.parentNode.insertBefore(node, place.nextSibling);
      else place.appendChild(node);
      inputs.forEach(function (i) { i.setAttribute('aria-invalid', 'true'); describe(i, id, true); });
      errs.push({ key: key, inputs: inputs, node: node, id: id });
    }
    function groupOk(g) {
      return g.getAttribute('data-one-of').split(/\s+/).some(function (name) {
        var f = form.elements[name];
        return f && f.value && f.value.trim();
      });
    }
    function groupInputs(g) {
      return g.getAttribute('data-one-of').split(/\s+/).map(function (name) { return form.elements[name]; }).filter(Boolean);
    }

    // Check everything; returns the error list in page order.
    function validate() {
      var seenRadio = {};
      fields().forEach(function (f) {
        var key = f.type === 'radio' ? 'r:' + f.name : 'f:' + (f.name || f.id);
        if (f.type === 'radio') { if (seenRadio[f.name]) return; seenRadio[f.name] = 1; }
        if (f.checkValidity()) { clearOne(key); return; }
        var inputs = f.type === 'radio' ? Array.prototype.slice.call(form.elements[f.name].length ? form.elements[f.name] : [f]) : [f];
        addErr(key, inputs, holder(f), message(f));
      });
      Array.prototype.forEach.call(form.querySelectorAll('[data-one-of]'), function (g, i) {
        var key = 'g:' + i;
        var inputs = groupInputs(g);
        if (groupOk(g) || !inputs.length) {
          clearOne(key);
          return;
        }
        addErr(key, inputs, g, g.getAttribute('data-err') || 'Please give an email address or a phone number, so I can reply.');
      });
      return errs.slice().sort(function (a, b) {
        return a.inputs[0].compareDocumentPosition(b.inputs[0]) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
      });
    }

    // Live re-check once a field has shown an error.
    function recheck(e) {
      var f = e.target;
      if (!f || !f.name) return;
      var touched = errs.some(function (x) { return x.inputs.indexOf(f) > -1; });
      if (!touched) return;
      validate();
      if (status && !errs.length && status.classList.contains('err')) { status.textContent = ''; status.className = 'form-status'; }
    }
    form.addEventListener('input', recheck);
    form.addEventListener('change', recheck);

    // Prefill from the URL: values only, from a fixed list of keys.
    try {
      var q = new URLSearchParams(location.search);
      var biz = clean(q.get('business'));
      var bizField = form.elements.business;
      if (biz && bizField && !bizField.value) bizField.value = biz;
      var msg = form.elements.message;
      if (msg && !msg.value) {
        var bits = [];
        ['trade', 'town', 'package'].forEach(function (k) {
          var v = clean(q.get(k));
          if (!v) return;
          if (k === 'package' && form.elements['package'] && form.elements['package'].tagName !== 'TEXTAREA') return;
          bits.push((k === 'package' ? 'Package' : k.charAt(0).toUpperCase() + k.slice(1)) + ': ' + nice(k, v) + '.');
        });
        if (bits.length) msg.value = bits.join(' ') + ' ';
      }
    } catch (err) { /* old browser: no prefill */ }

    function setStatus(text, kind) {
      if (!status) return;
      status.className = 'form-status' + (kind ? ' ' + kind : '');
      status.textContent = text;
    }

    function success() {
      var nameField = form.elements.name;
      var first = nameField && nameField.value ? clean(nameField.value).split(' ')[0] : '';
      var subject = form.elements._subject ? form.elements._subject.value : '';
      var head = 'Got it, thanks' + (first ? ' ' + first : '') + '.';
      var text = form.getAttribute('data-done-text');
      var demos = false;
      if (!text) {
        if (subject === 'New project details') text = "I'll go through your details and reply within one working day.";
        else if (subject === 'Care plan change request') text = "Your change request is with me. I'll reply within one working day.";
        else { text = "I'll reply within one working day with your free mock-up. No obligation."; demos = true; }
      }
      var panel = el('div', 'form-done');
      var hid = (form.id || 'enquiry') + '-done';
      panel.setAttribute('tabindex', '-1');
      panel.setAttribute('role', 'region');
      panel.setAttribute('aria-labelledby', hid);
      var h = el('p', 'h3', head);
      h.id = hid;
      panel.appendChild(h);
      panel.appendChild(el('p', null, text));
      if (demos) {
        var p = el('p', null, 'Meanwhile, try a sample site on your phone: ');
        var a1 = el('a', null, 'Electrician demo'); a1.href = base + 'demo-electrician/';
        var a2 = el('a', null, 'Café demo'); a2.href = base + 'demo-cafe/';
        p.appendChild(a1); p.appendChild(d.createTextNode(' · ')); p.appendChild(a2);
        panel.appendChild(p);
      }
      form.parentNode.replaceChild(panel, form);
      panel.focus();
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (sending) return;
      var list = validate();
      if (list.length) {
        setStatus('Please fix ' + list.length + (list.length === 1 ? ' field.' : ' fields.'), 'err');
        list[0].inputs[0].focus();
        return;
      }
      sending = true;
      var label = button ? button.innerHTML : '';
      if (button) {
        button.style.minWidth = button.offsetWidth + 'px';
        button.setAttribute('aria-disabled', 'true');
        button.textContent = 'Sending…';
      }
      setStatus('Sending…', '');
      fetch(form.action, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } })
        .then(function (res) { if (!res.ok) throw new Error('HTTP ' + res.status); success(); })
        .catch(function () {
          sending = false;
          if (button) { button.innerHTML = label; button.removeAttribute('aria-disabled'); button.style.minWidth = ''; }
          setStatus(ERR, 'err');
        });
    });
  });
})();
