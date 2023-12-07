export default {

    async fetch(request, env) {
      try {
        const body = await request.json();
    
        if (body.event !== 'account.created') {
          throw new Error('Invalid event');
        }
    
        await this.sendWelcomeEmail(
          env.POSTMARK_TOKEN,
          body.object.email,
          body.object.username,
        );
    
        await this.welcomeToot(
          env.MASTODON_TOKEN,
          body.object.username,
        );
    
        return new Response(
          JSON.stringify({ status: 'success' }, null, 2),
          { headers: { 'content-type': 'application/json;charset=UTF-8' } }
        );
      } catch(err) {
        return new Response(err.stack, { status: 500 })
      }
    },

    async sendWelcomeEmail(token, email, username) {
      await fetch('https://api.postmarkapp.com/email/withTemplate', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'content-type': 'application/json;charset=UTF-8',
          'x-postmark-server-token': token,
        },
        body: JSON.stringify({
          'TemplateAlias': 'welcome',
          'TemplateModel': {
            'email': email,
            'username': username,
          },
          'From': 'admin@nelson.social',
          'To': email,
        }),
      });
    },
    
    async welcomeToot(token, username) {
      await fetch('https://nelson.social/api/v1/statuses', {
        method: 'POST',
        headers: {
          'authorization': `Bearer ${token}`,
          'idempotency-key': `${username}-signup-toot`,
          'content-type': 'application/json;charset=UTF-8',
        },
        body: JSON.stringify({
          'visibility': 'public',
          'status': `Everyone, meet ${username}! #introduction\n\nWhat brought you here and what should people know about you?`,
        }),
      });
    },
  
  };
  