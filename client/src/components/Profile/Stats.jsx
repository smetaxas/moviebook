import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import { Chart, registerables } from 'chart.js'
import Navbar from '../UI/Navbar'
import BackButton from '../UI/BackButton'
import useIsMobile from '../../hooks/useIsMobile'
Chart.register(...registerables)

function Stats() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const isMobile = useIsMobile()

  const monthlyChartRef = useRef(null)
  const decadeChartRef = useRef(null)
  const genreChartRef = useRef(null)
  const ratingChartRef = useRef(null)
  const directorChartRef = useRef(null)
  const monthlyChartInstance = useRef(null)
  const decadeChartInstance = useRef(null)
  const genreChartInstance = useRef(null)
  const ratingChartInstance = useRef(null)
  const directorChartInstance = useRef(null)

  useEffect(() => {
    fetchStats()
  }, [])

  useEffect(() => {
    if (stats) {
      renderCharts()
    }
    return () => {
      if (monthlyChartInstance.current) monthlyChartInstance.current.destroy()
      if (decadeChartInstance.current) decadeChartInstance.current.destroy()
      if (genreChartInstance.current) genreChartInstance.current.destroy()
      if (ratingChartInstance.current) ratingChartInstance.current.destroy()
      if (directorChartInstance.current) directorChartInstance.current.destroy()
    }
  }, [stats, isMobile])

  const fetchStats = async () => {
    try {
      const res = await api.get('/watched/stats')
      setStats(res.data)
    } catch (err) {
      console.error('Failed to load stats')
    } finally {
      setLoading(false)
    }
  }

  const renderCharts = () => {
    // Smaller axis text on phones.
    const mobileTicks = isMobile ? { font: { size: 11 } } : {}

    // Monthly chart
    if (monthlyChartRef.current) {
      if (monthlyChartInstance.current) monthlyChartInstance.current.destroy()
      monthlyChartInstance.current = new Chart(monthlyChartRef.current, {
        type: 'bar',
        data: {
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
          datasets: [{
            label: 'Movies Watched',
            data: stats.moviesPerMonth,
            backgroundColor: 'rgba(229,9,20,0.7)',
            borderColor: '#e50914',
            borderWidth: 1,
            borderRadius: 6
          }]
        },
        options: {
          responsive: true,
          // On phones the chart fills a fixed-height box (see the wrapper
          // around the canvas) instead of deriving its height from its width.
          maintainAspectRatio: !isMobile,
          plugins: {
            // The card title already says what the bars are.
            legend: { display: !isMobile, labels: { color: 'white' } }
          },
          scales: {
            x: {
              ticks: {
                color: '#aaa', ...mobileTicks,
                // 12 three-letter labels don't fit a phone without tilting —
                // single letters do.
                callback: function (value) {
                  const label = this.getLabelForValue(value)
                  return isMobile ? label[0] : label
                }
              },
              grid: { color: 'rgba(255,255,255,0.05)' }
            },
            y: { ticks: { color: '#aaa', stepSize: 1, ...mobileTicks }, grid: { color: 'rgba(255,255,255,0.05)' } }
          }
        }
      })
    }

    // Decade chart
    if (decadeChartRef.current) {
      if (decadeChartInstance.current) decadeChartInstance.current.destroy()
      const decades = Object.keys(stats.moviesPerDecade).sort()
      const counts = decades.map(d => stats.moviesPerDecade[d])
      decadeChartInstance.current = new Chart(decadeChartRef.current, {
        type: 'doughnut',
        data: {
          labels: decades,
          datasets: [{
            data: counts,
            backgroundColor: [
              '#e50914', '#ff6b6b', '#ffa500', '#ffd700',
              '#00c800', '#00bcd4', '#9c27b0', '#e91e63',
              '#3f51b5', '#009688'
            ],
            borderWidth: 2,
            borderColor: '#1a1a1a'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: !isMobile,
          plugins: {
            legend: {
              position: isMobile ? 'bottom' : 'right',
              labels: { color: 'white', padding: isMobile ? 10 : 15, boxWidth: isMobile ? 12 : 40 }
            }
          }
        }
      })
    }

    // Genre chart
    if (genreChartRef.current) {
      if (genreChartInstance.current) genreChartInstance.current.destroy()
      const genres = Object.keys(stats.moviesPerGenre).sort((a, b) => stats.moviesPerGenre[b] - stats.moviesPerGenre[a])
      const counts = genres.map(g => stats.moviesPerGenre[g])
      genreChartInstance.current = new Chart(genreChartRef.current, {
        type: 'bar',
        data: {
          labels: genres,
          datasets: [{
            label: 'Movies Watched',
            data: counts,
            backgroundColor: 'rgba(229,9,20,0.7)',
            borderColor: '#e50914',
            borderWidth: 1,
            borderRadius: 6
          }]
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false }
          },
          scales: {
            x: { ticks: { color: '#aaa', stepSize: 1, maxRotation: 0, maxTicksLimit: isMobile ? 6 : 12, ...mobileTicks }, grid: { color: 'rgba(255,255,255,0.05)' } },
            y: { ticks: { color: '#aaa', ...mobileTicks }, grid: { color: 'rgba(255,255,255,0.05)' } }
          }
        }
      })
    }

    // Rating distribution chart
    if (ratingChartRef.current) {
      if (ratingChartInstance.current) ratingChartInstance.current.destroy()
      const stars = [1, 2, 3, 4, 5]
      const counts = stars.map(s => stats.ratingDistribution[s] || 0)
      ratingChartInstance.current = new Chart(ratingChartRef.current, {
        type: 'bar',
        data: {
          labels: stars.map(s => `${s} ⭐`),
          datasets: [{
            label: 'Movies Rated',
            data: counts,
            backgroundColor: 'rgba(229,9,20,0.7)',
            borderColor: '#e50914',
            borderWidth: 1,
            borderRadius: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: !isMobile,
          plugins: {
            legend: { display: false }
          },
          scales: {
            x: { ticks: { color: '#aaa', ...mobileTicks }, grid: { color: 'rgba(255,255,255,0.05)' } },
            y: { ticks: { color: '#aaa', stepSize: 1, maxTicksLimit: isMobile ? 6 : 11, ...mobileTicks }, grid: { color: 'rgba(255,255,255,0.05)' } }
          }
        }
      })
    }

    // Top directors chart
    if (directorChartRef.current) {
      if (directorChartInstance.current) directorChartInstance.current.destroy()
      const directors = stats.topDirectors
      directorChartInstance.current = new Chart(directorChartRef.current, {
        type: 'bar',
        data: {
          labels: directors.map(d => d.name),
          datasets: [{
            label: 'Movies Watched',
            data: directors.map(d => d.count),
            backgroundColor: 'rgba(229,9,20,0.7)',
            borderColor: '#e50914',
            borderWidth: 1,
            borderRadius: 6
          }]
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false }
          },
          scales: {
            x: { ticks: { color: '#aaa', stepSize: 1, maxRotation: 0, maxTicksLimit: isMobile ? 6 : 12, ...mobileTicks }, grid: { color: 'rgba(255,255,255,0.05)' } },
            y: { ticks: { color: '#aaa', ...mobileTicks }, grid: { color: 'rgba(255,255,255,0.05)' } }
          }
        }
      })
    }
  }

  const chartPad = isMobile ? '1rem' : '1.5rem'
  const cardGap = isMobile ? '1rem' : '2rem'

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0a0a0a', color: 'white' }}>
      <Navbar>
        <BackButton onClick={() => navigate('/profile')}>Back to Profile</BackButton>
      </Navbar>

      <div style={{ padding: 'var(--page-pad)', maxWidth: '1000px', margin: '0 auto' }}>
        <h1 style={{ fontSize: 'clamp(1.5rem, 6vw, 2rem)', fontWeight: '800', marginBottom: isMobile ? '1.25rem' : '2rem' }}>
          📊 My Statistics
        </h1>

        {loading ? (
          <p style={{ color: '#aaa' }}>Loading...</p>
        ) : !stats || stats.totalMovies === 0 ? (
          <div style={{ textAlign: 'center', padding: isMobile ? '2.5rem 1rem' : '4rem', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '16px' }}>
            <p style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎬</p>
            <p style={{ color: '#aaa' }}>No movies logged yet. Start watching!</p>
          </div>
        ) : (
          <>
            {/* Stat Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(auto-fill, minmax(200px, 1fr))', gap: isMobile ? '0.6rem' : '1rem', marginBottom: cardGap }}>
              {[
                { icon: '🎬', label: 'Movies Watched', value: stats.totalMovies },
                { icon: '⏱', label: 'Hours Watched', value: `${stats.totalHours}h` },
                { icon: '⭐', label: 'Average Rating', value: `${stats.avgRating}/5` },
                { icon: '📅', label: 'This Year', value: stats.moviesPerMonth.reduce((a, b) => a + b, 0) },
              ].map((stat, i) => isMobile ? (
                // Phones: icon beside the number, so four tiles take two
                // short rows instead of two tall ones.
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: '0.6rem', minWidth: 0,
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '14px', padding: '0.7rem 0.75rem'
                }}>
                  <span style={{
                    flexShrink: 0, width: '36px', height: '36px', borderRadius: '10px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', lineHeight: 1,
                    backgroundColor: 'rgba(229,9,20,0.12)', border: '1px solid rgba(229,9,20,0.25)'
                  }}>{stat.icon}</span>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, lineHeight: 1.1, color: '#e50914' }}>{stat.value}</p>
                    <p style={{ color: '#aaa', margin: '0.15rem 0 0 0', fontSize: '0.72rem', lineHeight: 1.2 }}>{stat.label}</p>
                  </div>
                </div>
              ) : (
                <div key={i} style={{
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '16px', padding: '1.5rem',
                  textAlign: 'center'
                }}>
                  <p style={{ fontSize: '2rem', margin: '0 0 0.4rem 0' }}>{stat.icon}</p>
                  <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0 0 0.25rem 0', color: '#e50914' }}>{stat.value}</p>
                  <p style={{ color: '#aaa', margin: 0, fontSize: '0.85rem' }}>{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Monthly Chart */}
            <div style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: chartPad, marginBottom: cardGap }}>
              <h3 style={{ marginBottom: isMobile ? '0.75rem' : '1rem', fontSize: isMobile ? '1rem' : undefined }}>📅 Movies This Year by Month</h3>
<div style={{ position: 'relative', height: isMobile ? '200px' : 'auto' }}>
                <canvas ref={monthlyChartRef} />
              </div>
            </div>

            {/* Decade Chart */}
            <div style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: chartPad }}>
              <h3 style={{ marginBottom: isMobile ? '0.75rem' : '1rem', fontSize: isMobile ? '1rem' : undefined }}>🎞️ Movies by Decade</h3>
              {Object.keys(stats.moviesPerDecade).length === 0 ? (
                <p style={{ color: '#aaa' }}>No data yet</p>
              ) : (
                <div style={{ position: 'relative', maxWidth: '400px', margin: '0 auto', height: isMobile ? '270px' : 'auto' }}>
                  <canvas ref={decadeChartRef} />
                </div>
              )}
            </div>

            {/* Genre Chart */}
            <div style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: chartPad, marginTop: cardGap }}>
              <h3 style={{ marginBottom: isMobile ? '0.75rem' : '1rem', fontSize: isMobile ? '1rem' : undefined }}>🎭 Movies by Genre</h3>
              {Object.keys(stats.moviesPerGenre).length === 0 ? (
                <p style={{ color: '#aaa' }}>No data yet</p>
              ) : (
                <div style={{ position: 'relative', height: `${isMobile ? Math.max(180, Object.keys(stats.moviesPerGenre).length * 26) : Math.max(250, Object.keys(stats.moviesPerGenre).length * 32)}px` }}>
                  <canvas ref={genreChartRef} />
                </div>
              )}
            </div>

            {/* Rating Distribution Chart */}
            <div style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: chartPad, marginTop: cardGap }}>
              <h3 style={{ marginBottom: isMobile ? '0.75rem' : '1rem', fontSize: isMobile ? '1rem' : undefined }}>⭐ Rating Distribution</h3>
              {Object.values(stats.ratingDistribution).every(count => count === 0) ? (
                <p style={{ color: '#aaa' }}>No ratings yet</p>
              ) : (
<div style={{ position: 'relative', height: isMobile ? '190px' : 'auto' }}>
                  <canvas ref={ratingChartRef} />
                </div>
              )}
            </div>

            {/* Top Directors Chart */}
            <div style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: chartPad, marginTop: cardGap }}>
              <h3 style={{ marginBottom: isMobile ? '0.75rem' : '1rem', fontSize: isMobile ? '1rem' : undefined }}>🎬 Top Directors</h3>
              {stats.topDirectors.length === 0 ? (
                <p style={{ color: '#aaa' }}>No data yet</p>
              ) : (
                <div style={{ position: 'relative', height: `${isMobile ? Math.max(150, stats.topDirectors.length * 36) : Math.max(200, stats.topDirectors.length * 45)}px` }}>
                  <canvas ref={directorChartRef} />
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default Stats