# Paste Bin Back-end
Back-end for a simple paste bin application for copying and pasting text to/from your clipboard.

[https://github.com/EmmaMcCracken/PasteBinFrontEnd](https://github.com/EmmaMcCracken/PasteBinFrontEnd)

## Table of contents
1. Technologies
2. Setup
3. Install dependencies
4. DB Setup
5. Running locally
6. Running on heroku

## Technologies
Project is created with:
- Cors: ^2.8.5
- Typescript: ^4.1.3
- Eslint: ^7.28.0
- Prettier: 2.3.1
- Postgres: ^8.5.1
- Express: ^4.17.1
- Dotenv: ^8.2.0

## Setup
To run this project, fork and copy the SSH (or HTTPS) link to your clipboard. Then run the command

```bash
$ git clone <link>
```

in your terminal to clone the repository.

## Install dependencies

`yarn`

## DB Setup

Copy .env.example to .env and set `DATABASE_URL` and `PORT` to your liking.

Example for a local database: `DATABASE_URL=postgres://neill@localhost/pastebin`

You will need to create your own databases for this project - one locally and one on Heroku.

## Running locally

`yarn start:dev`

This will set the env var LOCAL to true, which will cause the db connection configuration to NOT use SSL (appropriate for your local db)

## running on heroku

When the project is deployed to heroku, the command in your `Procfile` file will be run.
