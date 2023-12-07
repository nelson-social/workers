async function handleRequest(request, env) {
    try {
      const body = await request.json();
  
      if (body.event !== 'account.created') {
        throw new Error('Invalid event');
      }
  
      // TODO: post to mastodon
  
      await sendWelcomeEmail(
        env.POSTMARK_TOKEN,
        body.object.email,
        body.object.username
      );
  
      return new Response(
        JSON.stringify({ status: 'ok' }, null, 2),
        { headers: { 'content-type': 'application/json;charset=UTF-8' } }
      );
    } catch(err) {
      return new Response(err.stack, { status: 500 })
    }
  }
  
  async function sendWelcomeEmail(token, email, username) {
    await fetch('https://api.postmarkapp.com/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'content-type': 'application/json;charset=UTF-8',
        'x-postmark-server-token': token,
      },
      body: JSON.stringify({
        'From': 'admin@nelson.social',
        'To': 'till@nelson.social', // TODO: use email
        'Subject': 'New account',
        'TextBody': `${username} (${email}) just signed up.`, // TODO: use template
        'MessageStream': 'outbound'
      }),
    });
  }
  
  addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request));
  });
  