import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import { Chart, registerables } from 'chart.js'
import Navbar from '../UI/Navbar'
import NavButton from '../UI/NavButton'
Chart.register(...registerables)

function Stats() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  const monthlyChartRef = useRef(null)
  const decadeChartRef = useRef(null)
  const genreChartRef = useRef(null)
  const monthlyChartInstance = useRef(null)
  const decadeChartInstance = useRef(null)
  const genreChartInstance = useRef(null)

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
    }
  }, [stats])

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
              position: 'right',
              labels: { color: 'white', padding: 15 }
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
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0a0a0a', color: 'white' }}>
      <Navbar>
        <NavButton onClick={() => navigate('/profile')}>
          ← Back to Profile
        </NavButton>
      </Navbar>

      <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '2rem' }}>
          📊 My Statistics
        </h1>

        {loading ? (
          <p style={{ color: '#aaa' }}>Loading...</p>
        ) : !stats || stats.totalMovies === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '16px' }}>
            <p style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎬</p>
            <p style={{ color: '#aaa' }}>No movies logged yet. Start watching!</p>
          </div>
        ) : (
          <>
            {/* Stat Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
              {[
                { icon: '🎬', label: 'Movies Watched', value: stats.totalMovies },
                { icon: '⏱', label: 'Hours Watched', value: `${stats.totalHours}h` },
                { icon: '⭐', label: 'Average Rating', value: `${stats.avgRating}/5` },
                { icon: '📅', label: 'This Year', value: stats.moviesPerMonth.reduce((a, b) => a + b, 0) },
              ].map((stat, i) => (
                <div key={i} style={{
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '16px', padding: '1.5rem',
                  textAlign: 'center'
                }}>
                  <p style={{ fontSize: '2rem', margin: '0 0 0.5rem 0' }}>{stat.icon}</p>
                  <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0 0 0.25rem 0', color: '#e50914' }}>{stat.value}</p>
                  <p style={{ color: '#aaa', margin: 0, fontSize: '0.85rem' }}>{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Monthly Chart */}
            <div style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '1.5rem', marginBottom: '2rem' }}>
              <h3 style={{ marginBottom: '1rem' }}>📅 Movies This Year by Month</h3>
              <canvas ref={monthlyChartRef} />
            </div>

            {/* Decade Chart */}
            <div style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '1.5rem' }}>
              <h3 style={{ marginBottom: '1rem' }}>🎞️ Movies by Decade</h3>
              {Object.keys(stats.moviesPerDecade).length === 0 ? (
                <p style={{ color: '#aaa' }}>No data yet</p>
              ) : (
                <div style={{ maxWidth: '400px', margin: '0 auto' }}>
                  <canvas ref={decadeChartRef} />
                </div>
              )}
            </div>

            {/* Genre Chart */}
            <div style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '1.5rem', marginTop: '2rem' }}>
              <h3 style={{ marginBottom: '1rem' }}>🎭 Movies by Genre</h3>
              {Object.keys(stats.moviesPerGenre).length === 0 ? (
                <p style={{ color: '#aaa' }}>No data yet</p>
              ) : (
                <div style={{ height: `${Math.max(250, Object.keys(stats.moviesPerGenre).length * 32)}px` }}>
                  <canvas ref={genreChartRef} />
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