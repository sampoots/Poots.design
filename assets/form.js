// Poots Design — enquiry form. Sends to Formspree without leaving the page.
// The form stays hidden until a real Formspree endpoint is set in its action attribute,
// so visitors never see a form that can't send.
(function () {
  var form = document.getElementById('enquiry');
  if (!form) return;
  var box = form.closest('[data-form-box]') || form;
  if (form.action.indexOf('YOUR_FORM_ID') !== -1) { box.hidden = true; return; }
  box.hidden = false;

  var status = form.querySelector('[data-status]');
  var button = form.querySelector('button[type="submit"]');

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!form.reportValidity()) return;
    button.disabled = true;
    button.textContent = 'Sending…';
    status.textContent = '';
    fetch(form.action, {
      method: 'POST',
      body: new FormData(form),
      headers: { 'Accept': 'application/json' }
    }).then(function (res) {
      if (!res.ok) throw new Error('Request failed');
      form.reset();
      status.className = 'form-status ok';
      status.textContent = "Thanks! Your message has been sent. I'll get back to you within one working day.";
      button.textContent = 'Sent';
    }).catch(function () {
      status.className = 'form-status err';
      status.textContent = "Sorry, that didn't send. Please call or text 07395 229191, or email pootssam5@gmail.com.";
      button.disabled = false;
      button.textContent = 'Send message';
    });
  });
})();
