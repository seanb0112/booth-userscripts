# BOOTH Download Row Stripes

A Tampermonkey userscript for [BOOTH](https://booth.pm) that makes download pages easier to read and keeps track of what you've already downloaded.

## Features

- **Striped rows**: alternating background colours on download lists, so you don't lose your place in long lists of files.
- **Downloaded marker**: clicking **Download** (or a link under **Other Downloads**) adds a green ✓ Downloaded badge with the date, and tints the row green.
- **Remembers your downloads**: the markers are still there after you reload the page or come back later.
- **Auto-updates**: Tampermonkey installs new versions automatically.

## Install

1. Install the [Tampermonkey](https://www.tampermonkey.net/) extension for your browser.
2. Click this link: **[Install BOOTH Download Row Stripes](https://raw.githubusercontent.com/Seanb0112/booth-userscripts/main/booth-download-stripes.user.js)**
3. Click **Install** on the Tampermonkey page that opens.
4. Go to your [BOOTH library](https://accounts.booth.pm/library) to see it working.

> **Chrome / Edge users:** if the script doesn't run, open the Tampermonkey extension settings and turn on **Allow User Scripts** (or enable **Developer mode** on the extensions page).

## Updating

Updates install automatically; Tampermonkey checks about once a day. To get an update straight away, open the Tampermonkey dashboard, select the script, and use **Check for updates**.

## Settings

You can change these at the top of the script (Tampermonkey dashboard → edit the script):

| Setting | Default | What it does |
|---|---|---|
| `COLOR_A` / `COLOR_B` | white / soft blue | The two alternating row colours |
| `HOVER` | light blue | Row colour on mouse-over |
| `DONE_A` / `DONE_B` | light greens | Row colours once downloaded |
| `BADGE_TEXT` | `Downloaded` | Text shown on the badge |
| `RESET_PER_ITEM` | `false` | `true` restarts the stripes for each product |
| `REMEMBER` | `true` | `false` forgets marks when you leave the page |

> Note: editing the script yourself means an update will overwrite your changes.

## Clearing the Downloaded marks

Open a BOOTH page, press **F12** to open the console, and run:

```js
localStorage.removeItem('bds-downloaded')
```

Then reload the page.

## Limitations

- The badge records that you **clicked** Download, not that the file finished downloading.
- Marks are saved per browser, so they don't sync between computers.

## Feedback

Found a bug or have an idea? [Open an issue](https://github.com/Seanb0112/booth-userscripts/issues).

## License

MIT
