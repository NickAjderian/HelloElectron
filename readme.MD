# Nicks hello electron app as a test for the new AI PlantEX app

## GetProducts configuration

`MyService.GetProducts()` uses the `tedious` SQL Server client and returns up to 10 rows as an array of objects.

Create a local `local.settings.json` file before starting Electron:

```json
{
	"server": "localhost",
	"database": "MyDatabase",
	"authentication": {
		"type": "ntlm",
		"domain": "MYDOMAIN",
		"userName": "MyWindowsUser",
		"password": "MyWindowsPassword"
	},
	"options": {
		"encrypt": false,
		"trustServerCertificate": true
	}
}
```

The `ntlm` authentication type uses Windows credentials. Set `domain` to your Windows or Active Directory domain; for a local Windows account, use the computer name or the value expected by your SQL Server setup. `tedious` requires the username and password for NTLM authentication, so this does not automatically reuse the currently logged-in Windows desktop account.

`MyDatabase.js` reads this JSON with `readFileSync`, and `MyService.GetProducts()` uses the resulting TDS connection configuration. The default query is `SELECT TOP 10 * FROM Products`.

The renderer can call it through the preload bridge:

```javascript
const products = await window.electronAPI.getProducts();

To publish a new version...
Increment the version in your package.json (e.g., change 1.0.0 to 1.0.1).
set GH_TOKEN="github_pat_11AB4
Run the release command in your terminal:bashnpm run release
```