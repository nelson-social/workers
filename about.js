async function handleRequest(request) {
  try {
    const { pathname } = new URL(request.url);

    if (pathname.startsWith('/about')) {
      const response = await fetch(request);
      const contentType = response.headers.get('Content-Type');

      if (contentType.startsWith('text/html')) {
        return rewriter.transform(response);
      } else {
        return response;
      }
    }
  } catch(err) {
    return new Response(err.stack, { status: 500 })
  }
}

class AboutRewriter {
  text(text) {
    if (text.text.includes('summary of rules you need to follow')) {
      text.replace('nelson.social is an online space dedicated to the community of Nelson, BC. Please carefully read our Terms of Use as set out on this page before using this online space. These terms govern your use of the nelson.social online space and by using the nelson.social online space, you agree to be bound by these terms.')
    }
  }
}

const rewriter = new HTMLRewriter().on('p', new AboutRewriter());

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});
