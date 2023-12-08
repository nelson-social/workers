
export default {

  async fetch(request, env) {
    let maxId = null;
    let timeline = [];

    const { startOfDay, endOfDay } = this.today();

    try {
      while (true) {
        const statuses = await this.fetchStatuses(env.MASTODON_TOKEN, maxId);

        if (statuses.length === 0) {            
            break;
        }

        timeline.push(...statuses.filter(
          status => new Date(status.created_at) >= startOfDay && new Date(status.created_at) <= endOfDay
        ));

        const lastId = Math.min(...statuses.map(status => status.id));
        const reachedDayBefore = new Date(statuses.pop().created_at) < startOfDay;

        if (reachedDayBefore || maxId == lastId) {            
            break;
        }

        maxId = lastId;
      }
    } catch(err) {
      return new Response(err.stack, { status: 500 })
    }

    const scoredTimeline = this.scoreTimeline(timeline)
      .filter(status => status._score > 2) // remove junk
      .slice(0, 5); // limit to 5 posts

    const { pathname } = new URL(request.url);

    if (pathname.endsWith('.json')) {
      return new Response(JSON.stringify(scoredTimeline, null, 2), {
        headers: { 'content-type': 'application/json;charset=UTF-8' },
      });
    }

    const iframes = scoredTimeline.map(status => {
      return `<iframe src="${status.url}/embed" class="mastodon-embed" width="400" style="border: 0; max-width: 100%; margin-bottom: 2rem;"></iframe>`
    });

    const html = `<!DOCTYPE html>
      <body style="text-align: center;">
        <h1>Daily Digest</h1>
        <h3>${startOfDay.toLocaleString('en-GB', {timeZone: 'America/Vancouver'})} — ${endOfDay.toLocaleString('en-GB', {timeZone: 'America/Vancouver'})}</h3>
        ${iframes.join('<br>')}
        <script src="https://nelson.social/embed.js" async="async"></script>
      </body>`;

    return new Response(html, {
      headers: { 'content-type': 'text/html;charset=UTF-8' },
    });    
  },

  async fetchStatuses(token, maxId) {
    let params = 'local=1&limit=5';

    if (maxId) {
      params += `&max_id=${maxId}`;
    }

    const response = await fetch(`https://nelson.social/api/v1/timelines/public?${params}`, {
      headers: {
        'authorization': `Bearer ${token}`,
      },
    });

    return await response.json();
  },

  scoreTimeline(timeline) {
    const scored = timeline.map(status => {
      status._score = [
        status.replies_count * 2,
        status.reblogs_count * 2,
        status.favourites_count,
        status.in_reply_to_id ? 0 : 2, // score replies lower
      ].reduce((a, b) => a + b, 0);

      return status;
    });

    return scored.sort(function(a, b) {
      return ((a._score > b._score) ? -1 : ((a._score < b._score) ? 1 : 0));
    });
  },

  today() {
    const now = new Date().toLocaleString('en-GB', {
      timeZone: 'America/Vancouver',
      hour12: false,
      dateStyle: 'short',
    });

    const year = now.slice(6, 10);
    const month = now.slice(3, 5);
    const day = now.slice(0, 2);

    const tzOffset = new Date().toLocaleString('en-US', {
      timeZone: 'America/Vancouver',
      timeZoneName: 'longOffset',
    }).slice(-6);

    return {
      startOfDay: new Date(`${year}-${month}-${day}T00:00:00${tzOffset}`),
      endOfDay: new Date(`${year}-${month}-${day}T23:59:59${tzOffset}`),
    };
  }

};
