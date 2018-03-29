# Gunicorn-django settings
bind = ['0.0.0.0:8000']
graceful_timeout = 90
loglevel = 'error'
name = 'richie'
python_path = '/app'
timeout = 90
workers = 3
