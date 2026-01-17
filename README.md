## Site vitrine - Kevin Bendjelloul (statique)

### Modifier téléphone / email

Dans `main.js`, éditez:

- `CONFIG.phoneDisplay`
- `CONFIG.phoneTel`
- `CONFIG.email`

### Lancer en local

Depuis ce dossier:

```bash
cd "/Users/dfilabs/Kevin Travaux 63B/kevin_site"
python3 -m http.server 8000
```

Puis ouvrir `http://localhost:8000`.

### Déployer sur GitHub Pages (simple)

Option la plus simple:

- Créez un repo GitHub (ex: `kevin-bendjelloul-site`)
- Uploadez **le contenu** de ce dossier (`index.html`, `styles.css`, `main.js`, `assets/`)
- Dans GitHub: **Settings → Pages**
  - Source: **Deploy from a branch**
  - Branch: **main** / folder **/(root)**

Votre site sera ensuite disponible à l’adresse:

`https://<votre-username>.github.io/<nom-du-repo>/`

