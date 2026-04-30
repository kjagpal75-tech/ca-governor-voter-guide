import { useState } from 'react'
import { candidates, issues } from './data/candidates'
import './App.css'

function App() {
  const [view, setView] = useState('home')
  const [selectedCandidates, setSelectedCandidates] = useState([])
  const [quizAnswers, setQuizAnswers] = useState({})
  const [quizResults, setQuizResults] = useState(null)
  const [partyFilter, setPartyFilter] = useState('All')

  const visibleCandidates = candidates.filter(c => !c.hidden)

  const toggleCandidate = (candidateId) => {
    setSelectedCandidates(prev =>
      prev.includes(candidateId)
        ? prev.filter(id => id !== candidateId)
        : [...prev, candidateId].slice(0, 3)
    )
  }

  const handleQuizAnswer = (issueId, position, stance) => {
    setQuizAnswers(prev => {
      const currentAnswers = prev[issueId] || {}
      if (currentAnswers[position] === stance) {
        // If clicking the same stance, remove it
        const newAnswers = { ...currentAnswers }
        delete newAnswers[position]
        return { ...prev, [issueId]: newAnswers }
      } else {
        // Set or update the stance for this position
        return { ...prev, [issueId]: { ...currentAnswers, [position]: stance } }
      }
    })
  }

  const calculateQuizResults = () => {
    const scores = candidates.map(candidate => {
      let matchScore = 0
      let totalMatches = 0
      
      issues.forEach(issue => {
        const userAnswers = quizAnswers[issue.id] || {}
        const candidatePosition = candidate.positions[issue.id]
        
        if (candidatePosition && candidatePosition.supports && candidatePosition.opposes) {
          Object.entries(userAnswers).forEach(([position, stance]) => {
            if (stance === 'support') {
              // User supports this position - check if candidate supports it
              if (candidatePosition.supports.includes(position)) {
                matchScore += 1
                totalMatches += 1
              } else if (candidatePosition.opposes.includes(position)) {
                matchScore -= 1
                totalMatches += 1
              }
            } else if (stance === 'oppose') {
              // User opposes this position - check if candidate opposes it
              if (candidatePosition.opposes.includes(position)) {
                matchScore += 1
                totalMatches += 1
              } else if (candidatePosition.supports.includes(position)) {
                matchScore -= 1
                totalMatches += 1
              }
            }
          })
        }
      })
      
      // Calculate percentage match
      const percentageMatch = totalMatches > 0 ? Math.round(((matchScore + totalMatches) / (totalMatches * 2)) * 100) : 0
      
      return { ...candidate, score: matchScore, totalMatches, percentageMatch }
    })
    setQuizResults(scores.sort((a, b) => b.percentageMatch - a.percentageMatch))
  }

  const getIssueOptions = (issueId) => {
    // Dynamically extract unique positions from all candidates for this issue
    const allPositions = new Set()
    candidates.forEach(candidate => {
      const position = candidate.positions[issueId]
      if (position && position.supports) {
        position.supports.forEach(pos => allPositions.add(pos))
      }
      if (position && position.opposes) {
        position.opposes.forEach(pos => allPositions.add(pos))
      }
    })
    // Filter out non-actionable positions and convert to array
    const positions = Array.from(allPositions).filter(pos => {
      // Filter out descriptive statements that don't make sense as user choices
      const nonActionablePatterns = [
        /outdated.*systems/i,
        /lack of.*services/i,
        /limited access to/i,
        /policies that don't/i,
        /underfunded.*systems/i,
        /bureaucratic.*barriers/i
      ]
      return !nonActionablePatterns.some(pattern => pattern.test(pos))
    })
    // Prioritize shorter, more understandable positions
    return positions
      .sort((a, b) => a.length - b.length) // Shorter positions first
      .slice(0, 6) // Limit to 6 for better user experience
  }

  if (view === 'home') {
    const filteredCandidates = partyFilter === 'All' 
      ? visibleCandidates 
      : visibleCandidates.filter(c => c.party === partyFilter)

    return (
      <div className="min-h-screen bg-gray-50 font-sans">
        <header className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <h1 className="text-2xl font-semibold text-gray-900">CA Governor Voter Guide</h1>
            <p className="text-sm text-gray-600 mt-1">Make an informed decision for California's future</p>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 py-6">
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-sm p-5 hover:shadow-md transition-shadow cursor-pointer" onClick={() => setView('compare')}>
              <div className="text-3xl mb-2">📊</div>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Compare Candidates</h2>
              <p className="text-sm text-gray-600">Side-by-side comparison of candidate positions on key issues</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-5 hover:shadow-md transition-shadow cursor-pointer" onClick={() => setView('quiz')}>
              <div className="text-3xl mb-2">🎯</div>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Find Your Match</h2>
              <p className="text-sm text-gray-600">Take a quick quiz to see which candidate aligns with your values</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">All Candidates ({filteredCandidates.length})</h2>
              <div className="flex flex-wrap gap-2">
                {['All', 'Democrat', 'Republican', 'Green Party', 'Libertarian Party', 'Peace and Freedom Party', 'No Party Preference'].filter(party => {
                  if (party === 'All') return true
                  return candidates.some(c => c.party === party)
                }).map(party => (
                  <button
                    key={party}
                    onClick={() => setPartyFilter(party)}
                    className={`px-3 py-1.5 rounded-md font-medium transition-colors text-xs ${
                      partyFilter === party
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {party}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4 w-full" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
              {filteredCandidates.map(candidate => (
                <div key={candidate.id} className="border rounded-md p-4 hover:border-blue-500 transition-colors cursor-pointer" onClick={() => {
                  setSelectedCandidates([candidate.id])
                  setView('compare')
                }}>
                  <div className="flex gap-3">
                    <div className="w-14 h-14 flex-shrink-0 rounded-md overflow-hidden bg-gray-100 flex items-center justify-center">
                      {candidate.image && candidate.image !== '👤' ? (
                        <img 
                          src={candidate.image}
                          alt={candidate.name}
                          className="w-full h-full object-cover"
                          style={{ width: '56px', height: '56px' }}
                        />
                      ) : (
                        <span className="text-2xl">👤</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-base font-semibold text-gray-900">{candidate.name}</h3>
                      <div className="mt-1 space-y-0.5">
                        <p className="text-xs text-gray-600"><span className="font-medium">Age:</span> {candidate.age}</p>
                        <p className="text-xs text-gray-600"><span className="font-medium">Party:</span> {candidate.party}</p>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{candidate.title}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (view === 'candidates') {
    return (
      <div className="min-h-screen bg-gray-50 font-sans">
        <header className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">All Candidates</h1>
              <p className="text-sm text-gray-600 mt-1">Meet the 2026 California Governor candidates</p>
            </div>
            <button
              onClick={() => setView('home')}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm"
            >
              ← Back
            </button>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 py-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {visibleCandidates.map(candidate => (
              <div key={candidate.id} className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-14 h-14 flex-shrink-0 rounded-md overflow-hidden bg-gray-100 flex items-center justify-center">
                    {candidate.image && candidate.image !== '👤' ? (
                      <img 
                        src={candidate.image}
                        alt={candidate.name}
                        className="w-full h-full object-cover"
                        style={{ width: '56px', height: '56px' }}
                        onLoad={(e) => {
                          console.log('Image loaded successfully:', candidate.image)
                        }}
                        onError={(e) => {
                          console.error('Image failed to load:', candidate.image)
                          e.target.style.display = 'none'
                          e.target.parentElement.innerHTML = '<span class="text-2xl">👤</span>'
                        }}
                      />
                    ) : (
                      <span className="text-2xl">👤</span>
                    )}
                  </div>
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-xs font-medium">
                    {candidate.party}
                  </span>
                </div>
                <h3 className="text-base font-semibold text-gray-900 mb-1">{candidate.name}</h3>
                <p className="text-sm text-gray-600 mb-3">{candidate.title}</p>
                <p className="text-gray-700 text-xs mb-3 line-clamp-3">{candidate.bio}</p>
                <div className="border-t pt-3">
                  <h4 className="font-semibold text-gray-900 mb-2 text-xs">Key Positions:</h4>
                  <ul className="text-xs text-gray-600 space-y-0.5">
                    <li>• {candidate.positions.healthcare.substring(0, 50)}...</li>
                    <li>• {candidate.positions.housing.substring(0, 50)}...</li>
                    <li>• {candidate.positions.environment.substring(0, 50)}...</li>
                  </ul>
                </div>
                <button
                  onClick={() => {
                    setSelectedCandidates([candidate.id])
                    setView('compare')
                  }}
                  className="mt-3 w-full bg-blue-600 text-white py-2 rounded-md font-medium hover:bg-blue-700 transition-colors text-xs"
                >
                  View Details
                </button>
              </div>
            ))}
          </div>
        </main>
      </div>
    )
  }

  if (view === 'compare') {
    const comparisonCandidates = selectedCandidates.length > 0
      ? candidates.filter(c => selectedCandidates.includes(c.id))
      : []

    return (
      <div className="min-h-screen bg-gray-50 font-sans">
        <header className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Compare Candidates</h1>
              <p className="text-sm text-gray-600 mt-1">Select up to 3 candidates to compare</p>
            </div>
            <button
              onClick={() => setView('home')}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm"
            >
              ← Back
            </button>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 py-6">
          <div className="bg-white rounded-lg shadow-sm p-5 mb-6">
            <h3 className="font-semibold text-gray-900 mb-4 text-sm">Select Candidates to Compare (up to 3):</h3>
            <div className="grid md:grid-cols-3 gap-4">
              {[0, 1, 2].map((slot) => (
                <div key={slot}>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Candidate {slot + 1}
                  </label>
                  <select
                    value={selectedCandidates[slot] || ''}
                    onChange={(e) => {
                      const newSelection = [...selectedCandidates]
                      if (e.target.value) {
                        newSelection[slot] = parseInt(e.target.value)
                      } else {
                        newSelection[slot] = null
                      }
                      setSelectedCandidates(newSelection.filter(id => id !== null))
                    }}
                    className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  >
                    <option value="">Select a candidate...</option>
                    {visibleCandidates
                      .filter(c => !selectedCandidates.includes(c.id) || selectedCandidates[slot] === c.id)
                      .map(candidate => (
                        <option key={candidate.id} value={candidate.id}>
                          {candidate.name} ({candidate.party})
                        </option>
                      ))}
                  </select>
                </div>
              ))}
            </div>
          </div>

          {comparisonCandidates.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
                <thead>
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-semibold bg-gray-50 text-gray-900 border-b">
                      Issue
                    </th>
                    {comparisonCandidates.map(candidate => (
                      <th key={candidate.id} className="px-3 py-2 text-left text-xs font-semibold bg-gray-50 text-gray-900 border-b border-l">
                        <div className="flex items-center gap-2">
                          <div className="w-10 h-10 rounded-md overflow-hidden bg-gray-100 flex items-center justify-center flex-shrink-0">
                            {candidate.image && candidate.image !== '👤' ? (
                              <img 
                                src={candidate.image}
                                alt={candidate.name}
                                className="w-full h-full object-cover"
                                style={{ width: '40px', height: '40px' }}
                              />
                            ) : (
                              <span className="text-xl">👤</span>
                            )}
                          </div>
                          <div>
                            {candidate.name}
                            <span className="block text-xs font-normal text-gray-500">{candidate.party}</span>
                          </div>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {issues.map((issue, index) => (
                    <tr key={issue.id}>
                      <td className="px-3 py-2 border border-gray-200 bg-white">
                        <div className="flex items-center gap-2">
                          <span className="text-xl bg-blue-50 p-1.5 rounded">{issue.icon}</span>
                          <span className="font-semibold text-gray-900 text-xs">{issue.name}</span>
                        </div>
                      </td>
                      {comparisonCandidates.map(candidate => {
                        const position = candidate.positions[issue.id];
                        
                        return (
                          <td 
                            key={candidate.id} 
                            className="px-4 py-3 text-sm text-gray-700 border border-gray-200 bg-white"
                          >
                            {position && position.supports && position.opposes ? (
                              <div className="space-y-1">
                                {position.supports.length > 0 && (
                                  <div>
                                    <div className="font-semibold text-sm mb-1 px-2 py-1 rounded inline-block" style={{ color: '#15803d', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0' }}>✓ Supports:</div>
                                    <ul className="space-y-0.5">
                                      {position.supports.map((item, idx) => (
                                        <li key={idx} className="text-sm text-gray-600 flex items-start gap-1 leading-relaxed">
                                          <span>•</span>
                                          <span>{item}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                                {position.opposes.length > 0 && (
                                  <div>
                                    <div className="font-semibold text-sm mb-1 px-2 py-1 rounded inline-block" style={{ color: '#dc2626', backgroundColor: '#fef2f2', border: '1px solid #fecaca' }}>✗ Opposes:</div>
                                    <ul className="space-y-0.5">
                                      {position.opposes.map((item, idx) => (
                                        <li key={idx} className="text-sm text-gray-600 flex items-start gap-1 leading-relaxed">
                                          <span>•</span>
                                          <span>{item}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                                {position.supports.length === 0 && position.opposes.length === 0 && (
                                  <span className="text-gray-400 text-xs">No position available</span>
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-400 text-xs">No position available</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                  <tr>
                    <td className="px-3 py-2 border border-gray-200 bg-white">
                      <div className="flex items-center gap-2">
                        <span className="text-xl bg-red-50 p-1.5 rounded">⚠️</span>
                        <span className="font-semibold text-gray-900 text-xs">Controversies</span>
                      </div>
                    </td>
                    {comparisonCandidates.map(candidate => (
                      <td key={candidate.id} className="px-3 py-2 text-xs text-gray-700 border border-gray-200 bg-white">
                        {candidate.controversies && candidate.controversies.length > 0 ? (
                          <ul className="space-y-0.5">
                            {candidate.controversies.map((controversy, idx) => (
                              <li key={idx} className="text-xs text-red-600 flex items-start gap-1">
                                <span>•</span>
                                <span>{controversy}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <span className="text-gray-400 text-xs">No known controversies</span>
                        )}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="px-3 py-2 border border-gray-200 bg-white">
                      <div className="flex items-center gap-2">
                        <span className="text-xl bg-blue-50 p-1.5 rounded">📊</span>
                        <span className="font-semibold text-gray-900 text-xs">Voting Record</span>
                      </div>
                    </td>
                    {comparisonCandidates.map(candidate => (
                      <td key={candidate.id} className="px-3 py-2 text-xs text-gray-700 border border-gray-200 bg-white">
                        {candidate.votingRecords && candidate.votingRecords.length > 0 ? (
                          <ul className="space-y-0.5">
                            {candidate.votingRecords.map((record, idx) => (
                              <li key={idx} className="text-xs text-blue-600 flex items-start gap-1">
                                <span>•</span>
                                <span>{record}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <span className="text-gray-400 text-xs">No voting record available</span>
                        )}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="px-3 py-2 border border-gray-200 bg-white">
                      <div className="flex items-center gap-2">
                        <span className="text-xl bg-green-50 p-1.5 rounded">💰</span>
                        <span className="font-semibold text-gray-900 text-xs">Campaign Finance</span>
                      </div>
                    </td>
                    {comparisonCandidates.map(candidate => (
                      <td key={candidate.id} className="px-3 py-2 text-xs text-gray-700 border border-gray-200 bg-white">
                        <div className="space-y-1">
                          <div>
                            <p className="text-xs font-medium text-green-700">Funds Raised:</p>
                            <p className="text-xs text-green-600">{candidate.campaignFinance?.fundsRaised || 'N/A'}</p>
                          </div>
                          {candidate.campaignFinance?.supportingPACs && candidate.campaignFinance.supportingPACs.length > 0 && (
                            <div>
                              <p className="text-xs font-medium text-green-700">Supporting PACs:</p>
                              <ul className="text-xs text-green-600 space-y-0.5">
                                {candidate.campaignFinance.supportingPACs.map((pac, idx) => (
                                  <li key={idx} className="flex items-start gap-1">
                                    <span>•</span>
                                    <span>{pac}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Select Candidates to Compare</h3>
              <p className="text-sm text-gray-600 mb-4">Choose up to 3 candidates from the dropdown menus above to see their positions side-by-side</p>
              <div className="text-xs text-gray-500">
                <p>Compare their stances on healthcare, housing, economy, and all major issues</p>
              </div>
            </div>
          )}
        </main>
      </div>
    )
  }

  if (view === 'quiz') {
    if (quizResults) {
      return (
        <div className="min-h-screen bg-gray-50 font-sans">
          <header className="bg-white border-b">
            <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">Your Results</h1>
                <p className="text-sm text-gray-600 mt-1">Based on your responses</p>
              </div>
              <button
                onClick={() => {
                  setQuizResults(null)
                  setQuizAnswers({})
                  setView('home')
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm"
              >
                ← Back
              </button>
            </div>
          </header>

          <main className="max-w-4xl mx-auto px-4 py-6">
            <div className="bg-white rounded-lg shadow-sm p-5">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Top Matches</h2>
              <div className="space-y-3">
                {quizResults.slice(0, 3).map((candidate, index) => (
                  <div key={candidate.id} className={`border rounded-md p-4 ${
                    index === 0 ? 'border-green-500 bg-green-50' : 'border-gray-200'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 flex-shrink-0 rounded-md overflow-hidden bg-gray-100 flex items-center justify-center">
                          {candidate.image && candidate.image !== '👤' ? (
                            <img 
                              src={candidate.image}
                              alt={candidate.name}
                              className="w-full h-full object-cover"
                              style={{ width: '48px', height: '48px' }}
                            />
                          ) : (
                            <span className="text-2xl">👤</span>
                          )}
                        </div>
                        <div>
                          <h3 className="text-base font-semibold text-gray-900">{candidate.name}</h3>
                          <p className="text-sm text-gray-600">{candidate.title}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-blue-600">{candidate.percentageMatch}%</div>
                        <div className="text-xs text-gray-500">Match</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setView('compare')}
                className="mt-4 w-full bg-blue-600 text-white py-2 rounded-md font-medium hover:bg-blue-700 transition-colors text-sm"
              >
                Compare Top Candidates
              </button>
            </div>
          </main>
        </div>
      )
    }

    return (
      <div className="min-h-screen bg-gray-50 font-sans">
        <header className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Find Your Match</h1>
              <p className="text-sm text-gray-600 mt-1">Answer questions to find your ideal candidate</p>
            </div>
            <button
              onClick={() => setView('home')}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm"
            >
              ← Back
            </button>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 py-6" style={{ pointerEvents: 'auto' }}>
          <div className="bg-white rounded-lg shadow-sm p-5" style={{ pointerEvents: 'auto' }}>
            {issues.map((issue, index) => (
              <div key={issue.id} className="mb-5 pb-5 border-b last:border-b-0" style={{ pointerEvents: 'auto' }}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">{issue.icon}</span>
                  <h3 className="text-base font-semibold text-gray-900">{issue.name}</h3>
                </div>
                <p className="text-sm text-gray-600 mb-2">These positions are based on actual candidate stances. Select your preference:</p>
                <div className="space-y-2" style={{ pointerEvents: 'auto' }}>
                  {getIssueOptions(issue.id).map(option => {
                    const currentStance = (quizAnswers[issue.id] || {})[option]
                    return (
                      <div key={option} className="p-3 rounded-md border bg-gray-50">
                        <p className="font-medium text-gray-900 mb-2 text-sm">{option}</p>
                        <div className="flex gap-4">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name={`${issue.id}-${option}`}
                              checked={currentStance === 'support'}
                              onChange={() => handleQuizAnswer(issue.id, option, 'support')}
                              className="w-4 h-4 text-green-600"
                            />
                            <span className="text-sm text-green-700">✓ Support</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name={`${issue.id}-${option}`}
                              checked={currentStance === 'oppose'}
                              onChange={() => handleQuizAnswer(issue.id, option, 'oppose')}
                              className="w-4 h-4 text-red-600"
                            />
                            <span className="text-sm text-red-700">✗ Oppose</span>
                          </label>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
            <button
              onClick={calculateQuizResults}
              className="w-full bg-blue-600 text-white py-2 rounded-md font-medium hover:bg-blue-700 transition-colors text-sm"
            >
              See My Results
            </button>
          </div>
        </main>
      </div>
    )
  }
}

export default App
