# Juno Nestedset Fixer
Fix `left` and `right` values of nestedset model in Juno Dabatase

## Requirements
- PHP 8.2
- Composer

## Installation
```bash
composer install
```
Update `.env` file with your database credentials

## Usage
```bash
php app.php
```

## Run via Docker
```bash
docker build -t juno-nestedset-fixer .
docker run -it --rm juno-nestedset-fixer -e DB_HOST=host -e DB_PORT=port -e DB_DATABASE=database -e DB_USERNAME=username -e DB_PASSWORD=password
```