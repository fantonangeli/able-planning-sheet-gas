# ABLE Team Initiatives Planning - GAS Automation

Google Apps Script automation for syncing GitHub issue statuses with the ABLE Team Initiatives Planning spreadsheet.

## Features

- 🔄 Automatically syncs GitHub issue states (open/closed) to spreadsheet
- 📧 Email notifications to responsible team members when issues are updated
- 🎯 Processes only "In progress" items
- 🧪 Mock mode for testing without hitting GitHub API rate limits
- ⚙️ Configurable processing limits and delays

### Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

3. **Login to Google Apps Script**
   ```bash
   npm run login
   ```

4. **Add the .clasp.json**
    Add the `.clasp.json` file with the settings. You should have received it already.


## Usage

### From Google Sheets UI

1. Open your spreadsheet
2. Click **ABLE Tools** menu → **Sync GH Issues Statuses**
3. Wait for processing to complete
4. Review the summary alert or the execution logs in the GAS Console for more details

### Manual Testing (Single Row)

From Apps Script editor:
1. Open the script editor
2. Select `updateCurrentRowGHStatus` function
3. Click Run
4. Select a cell in the row you want to test
5. Check execution logs

## Configuration

See `src/Config.js` to customize the behavior.

## Developing

- Push code to Google Apps Script

```bash
npm run push
```

- Open the App Script in the browser

```bash
npm run open-script
```

- Open the container Spreadsheet in the browser

```bash
npm run open-container
```

- Run unit tests

```bash
npm test
```

## License

Apache-2.0
