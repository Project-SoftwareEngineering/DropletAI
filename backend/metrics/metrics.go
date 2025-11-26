package metrics

import (
	"time"

	"github.com/gin-gonic/gin"
	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promauto"
)

var (
	// HTTP metrics
	HttpRequestsTotal = promauto.NewCounterVec(
		prometheus.CounterOpts{
			Name: "http_requests_total",
			Help: "Total number of HTTP requests",
		},
		[]string{"method", "endpoint", "status"},
	)

	HttpRequestDuration = promauto.NewHistogramVec(
		prometheus.HistogramOpts{
			Name:    "http_request_duration_seconds",
			Help:    "HTTP request latency in seconds",
			Buckets: prometheus.DefBuckets,
		},
		[]string{"method", "endpoint"},
	)

	// Training job metrics
	TrainingJobsTotal = promauto.NewCounterVec(
		prometheus.CounterOpts{
			Name: "training_jobs_total",
			Help: "Total number of training jobs created",
		},
		[]string{"training_mode", "data_mode"},
	)

	TrainingJobsActive = promauto.NewGauge(
		prometheus.GaugeOpts{
			Name: "training_jobs_active",
			Help: "Number of currently active training jobs",
		},
	)

	TrainingJobsCompletedTotal = promauto.NewCounterVec(
		prometheus.CounterOpts{
			Name: "training_jobs_completed_total",
			Help: "Total number of completed training jobs",
		},
		[]string{"training_mode", "data_mode"},
	)

	TrainingJobsFailedTotal = promauto.NewCounterVec(
		prometheus.CounterOpts{
			Name: "training_jobs_failed_total",
			Help: "Total number of failed training jobs",
		},
		[]string{"training_mode", "data_mode"},
	)

	TrainingJobDuration = promauto.NewHistogramVec(
		prometheus.HistogramOpts{
			Name:    "training_job_duration_seconds",
			Help:    "Training job duration in seconds",
			Buckets: []float64{60, 300, 600, 1800, 3600, 7200, 14400},
		},
		[]string{"training_mode", "data_mode", "status"},
	)

	// User metrics
	ActiveUsers = promauto.NewGauge(
		prometheus.GaugeOpts{
			Name: "active_users",
			Help: "Number of active users",
		},
	)

	UserSignupsTotal = promauto.NewCounter(
		prometheus.CounterOpts{
			Name: "user_signups_total",
			Help: "Total number of user signups",
		},
	)

	UserLoginsTotal = promauto.NewCounter(
		prometheus.CounterOpts{
			Name: "user_logins_total",
			Help: "Total number of user logins",
		},
	)
)

// PrometheusMiddleware tracks HTTP metrics
func PrometheusMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()

		// Process request
		c.Next()

		// Record metrics
		duration := time.Since(start).Seconds()
		status := c.Writer.Status()
		endpoint := c.FullPath()
		if endpoint == "" {
			endpoint = "unknown"
		}

		statusClass := "5xx"
		if status < 200 {
			statusClass = "1xx"
		} else if status < 300 {
			statusClass = "2xx"
		} else if status < 400 {
			statusClass = "3xx"
		} else if status < 500 {
			statusClass = "4xx"
		}

		HttpRequestsTotal.WithLabelValues(c.Request.Method, endpoint, statusClass).Inc()
		HttpRequestDuration.WithLabelValues(c.Request.Method, endpoint).Observe(duration)
	}
}
