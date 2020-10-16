    listen 8070 ssl;
    ssl_certificate     /etc/nginx/conf.d/richie.local.dev.pem;
    ssl_certificate_key /etc/nginx/conf.d/richie.local.dev.key;
    error_page 497 https://$host:$server_port$request_uri;

