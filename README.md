# Tag Notes

Aplikasi web catatan dengan sistem tagging.

## Setup

1. Clone repo dan masuk ke folder
2. Copy `.env` dan isi dengan konfigurasi yang sesuai
3. Jalankan schema database: `mysql -u root -p < config/schema.sql`
4. Install dependencies: `npm install`
5. Jalankan aplikasi: `npm start`

## Konfigurasi .env

```
DB_HOST=<RDS endpoint>
DB_PORT=3306
DB_USER=<username>
DB_PASSWORD=<password>
DB_NAME=tagnotes

AWS_REGION=ap-southeast-1
AWS_ACCESS_KEY_ID=<key>
AWS_SECRET_ACCESS_KEY=<secret>
S3_BUCKET_NAME=notes-storage-groupb-sab

PORT=3000
```

## Tech Stack

- Node.js + Express
- EJS + Bootstrap 5
- MySQL (Amazon RDS)
- Amazon S3 (image storage)
- Amazon EC2 (deployment)
