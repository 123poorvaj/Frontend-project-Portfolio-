# Poorvaj M Gowda Portfolio

Built with HTML5, CSS3, Vanilla JavaScript and Bootstrap 4.5.

## Files
- `index.html` — page structure
- `css/style.css` — styling and responsive design
- `js/script.js` — UI, contact form and admin dashboard
- `assets/Poorvaj-Resume.pdf` — add your resume PDF here

## Google Sheets / Apps Script
The JavaScript uses the Web App endpoint already present in your uploaded `script(7).js`.
It preserves the request actions and keys:
- `save_message`: `{ action, name, email, msg }`
- `login`: `{ action, username, password }`
- GET retrieval: expects `{ success: true, messages: [{name,email,msg,date}] }`

The original file did not include a separate API key; it included a Google Apps Script Web App URL. This URL is included in `js/script.js`.

## Important security note
The original GET call fetches messages without a session token. This frontend preserves that existing API behavior as requested, but the endpoint must enforce admin authorization server-side before exposing messages. If it currently returns all messages to anyone, do not publish it publicly until Apps Script is updated to protect the data. Never put a privileged secret key or admin password in frontend JavaScript.

## Run
Open `index.html` using VS Code Live Server. Bootstrap and Font Awesome are loaded from CDNs, so internet access is needed.


## Responsive layout
The CSS includes responsive breakpoints for wide screens, laptops, tablets, and small phones (including screens around 320–360px). Test the layout with browser DevTools device emulation and verify navigation, project cards, contact forms, and admin responses.


## Add new projects from the admin dashboard
After signing in through **Admin Login**, use the **Add a new project** form to enter a title, category, description, comma-separated technologies, GitHub URL, and live demo URL. Added projects appear in the Projects section and can be removed from the admin panel.

**Storage limitation:** this version saves added projects in the current browser's `localStorage`. That is suitable for testing and a single-browser demo, but it does not sync to other devices or visitors. To manage projects on a deployed public portfolio and have every visitor see updates, add a server-side project API or database and protect write operations with admin authentication. Do not put admin passwords or secret keys in frontend JavaScript.
