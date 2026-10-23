FROM php:8.2-apache
COPY . /var/www/html/
RUN echo '{}' > /var/www/html/rooms.json && chmod 777 /var/www/html/rooms.json && chown -R www-data:www-data /var/www/html
EXPOSE 80
