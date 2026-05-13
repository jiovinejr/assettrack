# AssetTrack

A lightweight asset management web app I built for the produce warehouse I manage. The owner needed one place to track equipment — warranties, last service dates, condition, location — without digging through spreadsheets or trying to remember which forklift was last serviced and when.

## Live Demo

Scan this with your phone camera to see an asset page:

![AST-TEST](https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=4&format=png&data=https://assets.iovine.com/asset/AST-TEST)

Or open it directly: [assets.iovine.com/asset/AST-TEST](https://assets.iovine.com/asset/AST-TEST)

## The Problem

We have a decent amount of equipment spread across a warehouse floor. No one knew when something was last serviced, whether it was still under warranty, or where a specific piece of equipment even lived. It was all in someone's head or buried in an email chain.

## What I Built

A web app that lives at a custom domain where you can:

- Pull up any asset by scanning a QR code with your phone's camera — no app needed, it just opens a link
- See the full picture on that asset: location, condition, service history, warranty status, all color coded so overdue stuff is immediately obvious
- Manage everything from an admin panel — add, edit, delete assets, generate and print QR labels

## Tech Stack

- **Frontend** — Vanilla HTML, CSS, JavaScript split across logical files
- **Database** — Firebase Firestore
- **Hosting** — Firebase Hosting on a custom domain
- **QR Generation** — qrserver.com API, no library needed
- **QR Scanning** — native phone camera, the QR just encodes a URL

## How It Works

Each asset gets a URL like `assets.domain.com/asset/AST-0001`. That URL gets encoded into a QR code and printed as a label stuck to the physical asset. When someone scans it, their phone opens the asset page directly. No app install, no login, no scanning tech built into the web app itself — just a link.

The admin panel at `assets.domain.com` handles all the CRUD. Firestore makes this straightforward — the whole database interaction is about 20 lines of JavaScript.

## Background

I spent several years in the restaurant industry — bartending, cooking, managing. Three years ago I moved into tech and landed a role managing a produce wholesale warehouse. The job needed more technology injected into it so I started building internal tools to save time and reduce the kind of disorganization that costs money.

This is one of those tools.

## Running It Yourself

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable Firestore in production mode
3. Clone this repo
4. Copy `public/js/firebase-config.example.js` to `public/js/firebase-config.js` and fill in your Firebase project credentials
5. Install the Firebase CLI: `npm install -g firebase-tools`
6. Run `firebase login` then `firebase use --add` to connect your project
7. Run `firebase deploy`

## Firestore Rules

The current setup is open read/write — fine for an internal tool on a private domain. If you're adapting this for something public-facing, lock it down:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /assets/{assetId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```