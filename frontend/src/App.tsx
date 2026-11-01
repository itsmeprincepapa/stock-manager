import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './auth/auth-context'
import { ProtectedRoute } from './auth/ProtectedRoute'
import { AppLayout } from './components/AppLayout'
import { LoginPage } from './pages/LoginPage'
import { NewSalePage } from './pages/NewSalePage'
import { PlaceholderPage } from './pages/PlaceholderPage'
import { ProductsPage } from './pages/ProductsPage'
import { SalesPage } from './pages/SalesPage'

// Sur "/", on envoie chacun vers sa page d'accueil :
// le gérant vers le tableau de bord, le vendeur vers les produits
// (l'API refuse le tableau de bord aux vendeurs).
function HomeRedirect() {
  const { isManager } = useAuth()
  return <Navigate to={isManager ? '/dashboard' : '/products'} replace />
}

// La carte des pages : quelle adresse affiche quelle page
function App() {
  return (
    <Routes>
      {/* Page publique */}
      <Route path="/login" element={<LoginPage />} />

      {/* Tout ce qui est dans ce bloc demande d'être connecté */}
      <Route element={<ProtectedRoute />}>
        {/* ... et s'affiche dans le cadre avec le menu (AppLayout) */}
        <Route element={<AppLayout />}>
          <Route path="/" element={<HomeRedirect />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/sales/new" element={<NewSalePage />} />
          <Route path="/sales" element={<SalesPage />} />
          <Route path="/stock" element={<PlaceholderPage title="Historique du stock" />} />

          {/* Ces pages sont réservées au gérant */}
          <Route element={<ProtectedRoute managerOnly />}>
            <Route path="/dashboard" element={<PlaceholderPage title="Tableau de bord" />} />
            <Route path="/users" element={<PlaceholderPage title="Utilisateurs" />} />
          </Route>
        </Route>
      </Route>

      {/* Toute autre adresse renvoie vers l'accueil */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App