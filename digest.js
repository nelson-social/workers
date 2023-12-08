
export default {

    async fetch(request, env) {
      let maxId = null;
      let timeline = [];
  
      const midnight = new Date();
      midnight.setUTCHours(0, 0, 0, 0);
      midnight.setHours(midnight.getHours() - 8);
  
      try {
        while (true) {
          const statuses = await this.fetchStatuses(env.MASTODON_TOKEN, maxId);
  
          if (statuses.length === 0) {            
              break;
          }
  
          const lastId = Math.min(...statuses.map(status => status.id));
  
          timeline.push(...statuses.filter(
            status => new Date(status.created_at) >= midnight
          ));
  
          const pastMidnight = new Date(statuses.pop().created_at) < midnight;
  
          if (pastMidnight || maxId == lastId) {            
              break;
          }
  
          maxId = lastId;
        }
      } catch(err) {
        return new Response(err.stack, { status: 500 })
      }
  
      const scoredTimeline = this.scoreTimeline(timeline);
  
      return new Response(JSON.stringify(scoredTimeline, null, 2), {
        headers: {
          'content-type': 'application/json;charset=UTF-8',
        },
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
  
  };
  