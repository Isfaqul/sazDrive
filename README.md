# SazDrive

A stripped-down version of Google Drive built with JavaScript, Node.js, Express, Prisma, PostgreSQL, EJS, and Supabase Storage.

The project allows users to create folders, upload files, and organize their content in a familiar file-system-like interface.

## Features

- User authentication
- Create and manage folders
- Upload files
- Store files using Supabase Storage

## Tech Stack

- JavaScript
- Node.js
- Express
- PostgreSQL
- Prisma
- Passport.js
- Express Session
- EJS
- Supabase Storage

## Getting Started

Clone the repository:

```bash
git clone https://github.com/Isfaqul/sazDrive.git
cd sazDrive
```

Install dependencies:

```bash
npm install
```

Create a `.env` file and add the required environment variables.

Run migrations:

```bash
npm run migrate
```

Generate Prisma Client:

```bash
npm run generate
```

Start the server:

```bash
npm start
```

## Why I Built This

I wanted to learn how file uploads, cloud storage, authentication, and database relationships work together in a real application. Building a Google Drive-style project gave me the opportunity to work with all of these concepts in a single project.
