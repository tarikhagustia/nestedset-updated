FROM php:8.2-alpine3.20

# Install postgresql php extension
RUN apk add --no-cache postgresql-dev \
    && docker-php-ext-install pdo_pgsql

WORKDIR /app

COPY ./ ./

# Install composer
RUN curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer

RUN composer install --no-dev --no-scripts

CMD ["php", "app.php"]