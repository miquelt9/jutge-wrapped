import { AuthProvider, useAuth } from "@/context/AuthContext"
import { ThemeProvider } from "@/context/ThemeContext"
import { WrappedProvider, useWrappedPeriod } from "@/context/WrappedContext"
import { LoginPage } from "@/features/auth/LoginPage"
import { DateRangePage } from "@/features/wrapped/DateRangePage"
import { WrappedDeck } from "@/features/wrapped/WrappedDeck"

function AppShell() {
  const { status } = useAuth()
  const { period } = useWrappedPeriod()

  if (status !== "authenticated") return <LoginPage />
  if (!period) return <DateRangePage />
  return <WrappedDeck />
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <WrappedProvider>
          <AppShell />
        </WrappedProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
