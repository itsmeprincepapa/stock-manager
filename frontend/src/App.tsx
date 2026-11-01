// Composant principal : pour l'instant, une page pour vérifier que Tailwind fonctionne
function App() {
  return (
    // Les classes Tailwind décrivent le style :
    // flex + items-center + justify-center = contenu centré,
    // min-h-screen = hauteur de l'écran, bg-slate-100 = fond gris clair
    <div className="flex min-h-screen items-center justify-center bg-slate-100">
      {/* text-3xl = grand texte, font-bold = gras, text-indigo-600 = couleur */ }
      <h1 className="text-3xl font-bold text-indigo-600">Stock Manager</h1>
    </div>
  )
}

export default App