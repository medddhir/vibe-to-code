# Vibe to Code

Vibe to Code is a free, open-source learning platform for people who already build with AI and now want to understand the code they ship.

It teaches one idea at a time using plain language, small examples, predictions, debugging exercises, and practical projects. The interface is intentionally calm and readable enough for a young beginner without feeling childish.

**Live site:** [vibe-to-code-ten.vercel.app](https://vibe-to-code-ten.vercel.app)  
**Created by:** Medhir  
**An initiative by:** TurboPay Technologies

## What is included

- 60 fully mapped beta lessons across coding foundations, AI-assisted development, Python, and Git
- 160 additional mapped lessons for web development and SQL
- A six-level learning path from first principles to production systems
- A complete first lesson: “What code actually is”
- Open contribution paths for lesson corrections, new exercises, and future courses

## Run locally

You need [Node.js](https://nodejs.org/) 20.9 or newer.

```bash
git clone https://github.com/medddhir/vibe-to-code.git
cd vibe-to-code
npm install
npm run dev
```

Open `http://localhost:3000` in your browser.

## Quality checks

```bash
npm run typecheck
npm run lint
npm run build
```

Or run all three with:

```bash
npm run check
```

## Contributing

Contributions are welcome from beginners and experienced developers. Start with [CONTRIBUTING.md](CONTRIBUTING.md), use an issue template, or improve a lesson through a focused pull request.

Please keep explanations simple, accurate, encouraging, and free of unnecessary jargon.

## License

Released under the [MIT License](LICENSE).
