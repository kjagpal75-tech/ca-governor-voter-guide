// Cloudflare Worker for handling poll data
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url)
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }

    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders })
    }

    try {
      if (url.pathname === '/api/poll-data' && request.method === 'GET') {
        // Get all poll data
        const pollData = await env.POLL_KV.get('poll_data', 'json')
        const response = pollData || {
          responses: {},
          candidateMatches: {},
          totalResponders: 0
        }
        
        return new Response(JSON.stringify(response), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      if (url.pathname === '/api/poll-response' && request.method === 'POST') {
        // Save or update a poll response
        const body = await request.json()
        const { uniqueId, answers, topMatch } = body

        if (!uniqueId || !answers || !topMatch) {
          return new Response(JSON.stringify({ error: 'Missing required fields' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        // Get existing poll data
        const existingData = await env.POLL_KV.get('poll_data', 'json')
        const pollData = existingData || {
          responses: {},
          candidateMatches: {},
          totalResponders: 0
        }

        // Check if user already responded and update candidate matches accordingly
        const existingResponse = pollData.responses[uniqueId]
        let updatedCandidateMatches = { ...pollData.candidateMatches }

        if (existingResponse) {
          // User is updating - remove old match count
          const oldTopMatch = existingResponse.topMatch
          updatedCandidateMatches[oldTopMatch] = Math.max(0, (updatedCandidateMatches[oldTopMatch] || 0) - 1)
          
          // Remove old response
          delete pollData.responses[uniqueId]
        }

        // Add new response
        const newResponse = {
          timestamp: new Date().toISOString(),
          answers,
          topMatch
        }

        // Update candidate matches for new response
        updatedCandidateMatches[topMatch] = (updatedCandidateMatches[topMatch] || 0) + 1

        const updatedData = {
          ...pollData,
          responses: {
            ...pollData.responses,
            [uniqueId]: newResponse
          },
          candidateMatches: updatedCandidateMatches,
          totalResponders: existingResponse ? pollData.totalResponders : pollData.totalResponders + 1
        }

        // Save to KV
        await env.POLL_KV.put('poll_data', JSON.stringify(updatedData))

        return new Response(JSON.stringify({
          ...updatedData,
          updated: existingResponse ? true : false
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      if (url.pathname === '/api/poll-stats' && request.method === 'GET') {
        // Get aggregated statistics
        const pollData = await env.POLL_KV.get('poll_data', 'json')
        
        if (!pollData) {
          return new Response(JSON.stringify({
            totalResponders: 0,
            candidateMatches: {},
            issueStats: {}
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        // Calculate issue statistics
        const issueStats = {}
        const issues = ['healthcare', 'housing', 'environment', 'education', 'economy', 'immigration', 'crime', 'taxes', 'infrastructure', 'greenEnergy', 'technology', 'water', 'wildfires', 'reproductiveRights', 'gunPolicy', 'costOfLiving']

        issues.forEach(issueId => {
          let support = 0
          let oppose = 0

          Object.values(pollData.responses).forEach(response => {
            const issueAnswers = response.answers[issueId] || {}
            Object.values(issueAnswers).forEach(stance => {
              if (stance === 'support') support++
              else if (stance === 'oppose') oppose++
            })
          })

          issueStats[issueId] = { support, oppose, total: support + oppose }
        })

        return new Response(JSON.stringify({
          totalResponders: pollData.totalResponders,
          candidateMatches: pollData.candidateMatches,
          issueStats
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      return new Response('Not found', { status: 404, headers: corsHeaders })

    } catch (error) {
      console.error('Worker error:', error)
      return new Response(JSON.stringify({ error: 'Internal server error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
  }
}
