import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import { Chart, registerables } from 'chart.js'
import Navbar from '../UI/Navbar'
import NavButton from '../UI/NavButton'
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
          aspectRatio: isMobile ? 1.3 : 2,
          plugins: {
            legend: { labels: { color: 'white' } }
          },
          scales: {
            x: { ticks: { color: '#aaa' }, grid: { color: 'rgba(255,255,255,0.05)' } },
            y: { ticks: { color: '#aaa', stepSize: 1 }, grid: { color: 'rgba(255,255,255,0.05)' } }
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
            x: { ticks: { color: '#aaa', stepSize: 1 }, grid: { color: 'rgba(255,255,255,0.05)' } },
            y: { ticks: { color: '#aaa' }, grid: { color: 'rgba(255,255,255,0.05)' } }
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
          aspectRatio: isMobile ? 1.3 : 2,
          plugins: {
            legend: { display: false }
          },
          scales: {
            x: { ticks: { color: '#aaa' }, grid: { color: 'rgba(255,255,255,0.05)' } },
            y: { ticks: { color: '#aaa', stepSize: 1 }, grid: { color: 'rgba(255,255,255,0.05)' } }
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
            x: { ticks: { color: '#aaa', stepSize: 1 }, grid: { color: 'rgba(255,255,255,0.05)' } },
            y: { ticks: { color: '#aaa' }, grid: { color: 'rgba(255,255,255,0.05)' } }
          }
        }
      })
    }
  }

  const chartPad = isMobile ? '1rem' : '1.5rem'
  const cardGap = isMobile ? '1.25rem' : '2rem'

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0a0a0a', color: 'white' }}>
      <Navbar>
        <NavButton onClick={() => navigate('/profile')}>
          ← Back to Profile
        </NavButton>
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
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(auto-fill, minmax(200px, 1fr))', gap: isMobile ? '0.75rem' : '1rem', marginBottom: cardGap }}>
              {[
                { icon: '🎬', label: 'Movies Watched', value: stats.totalMovies },
                { icon: '⏱', label: 'Hours Watched', value: `${stats.totalHours}h` },
                { icon: '⭐', label: 'Average Rating', value: `${stats.avgRating}/5` },
                { icon: '📅', label: 'This Year', value: stats.moviesPerMonth.reduce((a, b) => a + b, 0) },
              ].map((stat, i) => (
                <div key={i} style={{
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '16px', padding: isMobile ? '1rem 0.5rem' : '1.5rem',
                  textAlign: 'center'
                }}>
                  <p style={{ fontSize: isMobile ? '1.5rem' : '2rem', margin: '0 0 0.4rem 0' }}>{stat.icon}</p>
                  <p style={{ fontSize: isMobile ? '1.5rem' : '2rem', fontWeight: 'bold', margin: '0 0 0.25rem 0', color: '#e50914' }}>{stat.value}</p>
                  <p style={{ color: '#aaa', margin: 0, fontSize: isMobile ? '0.78rem' : '0.85rem' }}>{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Monthly Chart */}
            <div style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: chartPad, marginBottom: cardGap }}>
              <h3 style={{ marginBottom: '1rem', fontSize: isMobile ? '1rem' : undefined }}>📅 Movies This Year by Month</h3>
              <canvas ref={monthlyChartRef} />
            </div>

            {/* Decade Chart */}
            <div style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: chartPad }}>
              <h3 style={{ marginBottom: '1rem', fontSize: isMobile ? '1rem' : undefined }}>🎞️ Movies by Decade</h3>
              {Object.keys(stats.moviesPerDecade).length === 0 ? (
                <p style={{ color: '#aaa' }}>No data yet</p>
              ) : (
                <div style={{ maxWidth: '400px', margin: '0 auto' }}>
                  <canvas ref={decadeChartRef} />
                </div>
              )}
            </div>

            {/* Genre Chart */}
            <div style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: chartPad, marginTop: cardGap }}>
              <h3 style={{ marginBottom: '1rem', fontSize: isMobile ? '1rem' : undefined }}>🎭 Movies by Genre</h3>
              {Object.keys(stats.moviesPerGenre).length === 0 ? (
                <p style={{ color: '#aaa' }}>No data yet</p>
              ) : (
                <div style={{ height: `${Math.max(250, Object.keys(stats.moviesPerGenre).length * 32)}px` }}>
                  <canvas ref={genreChartRef} />
                </div>
              )}
            </div>

            {/* Rating Distribution Chart */}
            <div style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: chartPad, marginTop: cardGap }}>
              <h3 style={{ marginBottom: '1rem', fontSize: isMobile ? '1rem' : undefined }}>⭐ Rating Distribution</h3>
              {Object.values(stats.ratingDistribution).every(count => count === 0) ? (
                <p style={{ color: '#aaa' }}>No ratings yet</p>
              ) : (
                <canvas ref={ratingChartRef} />
              )}
            </div>

            {/* Top Directors Chart */}
            <div style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: chartPad, marginTop: cardGap }}>
              <h3 style={{ marginBottom: '1rem', fontSize: isMobile ? '1rem' : undefined }}>🎬 Top Directors</h3>
              {stats.topDirectors.length === 0 ? (
                <p style={{ color: '#aaa' }}>No data yet</p>
              ) : (
                <div style={{ height: `${Math.max(200, stats.topDirectors.length * 45)}px` }}>
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