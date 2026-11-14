# SSC MCQ Practice

Static site (HTML, CSS, JS). No build step, no backend.

## Deploy
1. Create a GitHub repo and upload everything in this folder (including the hidden `.github` folder).
2. Settings > Pages > deploy from the `main` branch, `/ (root)`.
3. Open `https://<username>.github.io/<repo>/`.

## Add a test
Drop a new JSON file into `exams/`. It appears in the list automatically:
- on github.io: read from the GitHub API, and `exams/index.json` is rebuilt by the included GitHub Action on every push
- locally: read from the folder listing of `python3 -m http.server`

```json
{
  "subject": "Physics", "lesson": "Motion", "name": "Motion: Practice Test 1",
  "questions": [
    {"q": "Question text", "options": ["A", "B", "C", "D"], "answer": 0, "explanation": "Why A is right."}
  ]
}
```
`answer` is the index of the correct option (0 = first). Each question gets 1 minute and is worth 1 mark.

## Run locally
`python3 -m http.server 8000` then open http://localhost:8000

## Menu structure
The site shows Subject > Lesson > Test, taken from the `subject`, `lesson` and `name` fields of each JSON file.
Files with the same `subject` and `lesson` text are grouped together (for example Math > Trigonometry > Test 1, Test 2).

## Bangla and English content
Any text field (`subject`, `lesson`, `name`, `q`, each option, `explanation`) can be plain text or `{"en": "...", "bn": "..."}`.
The language switch then changes the test content too. Use the same `en` text for the same subject or lesson in every file, because that is how files are grouped.
If a file is invalid, the home page lists it with the reason instead of hiding it.
