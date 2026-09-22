window.erp = (function () {
  function token() {
    return document.querySelector('#erp-antiforgery input[name="__RequestVerificationToken"]')?.value || '';
  }

  async function send(url, method, body) {
    const headers = { RequestVerificationToken: token() };
    const options = { method, headers };
    if (body instanceof FormData) {
      options.body = body;
    } else if (body !== undefined) {
      headers['Content-Type'] = 'application/json';
      options.body = JSON.stringify(body);
    }
    const response = await fetch(url, options);
    if (response.redirected && response.url.indexOf('/login') >= 0) {
      window.location.href = response.url;
      return null;
    }
    const text = await response.text();
    try { return JSON.parse(text); } catch { return { success: response.ok, message: text }; }
  }

  return {
    get: (url) => send(url, 'GET'),
    post: (url, body) => send(url, 'POST', body),
    toast(icon, title) {
      if (window.Swal) Swal.fire({ toast: true, position: 'top-end', icon, title, timer: 2500, showConfirmButton: false });
      else alert(title);
    },
    confirm(title, text) {
      if (!window.Swal) return Promise.resolve(window.confirm(title));
      return Swal.fire({ title, text, icon: 'warning', showCancelButton: true, confirmButtonText: 'Sí', cancelButtonText: 'Cancelar' })
        .then(r => r.isConfirmed);
    }
  };
})();
