import { AuthProvider, useAuth } from "@/context/AuthContext"
import { ThemeProvider } from "@/context/ThemeContext"
import { SnapshotProvider, useSnapshot } from "@/context/SnapshotContext"
import { WrappedProvider, useWrappedPeriod } from "@/context/WrappedContext"
import { LoginPage } from "@/features/auth/LoginPage"
import { DateRangePage } from "@/features/wrapped/DateRangePage"
import { WrappedDeck } from "@/features/wrapped/WrappedDeck"

function AppShell() {
  const { status } = useAuth()
  const { period } = useWrappedPeriod()
  const { isSnapshotMode } = useSnapshot()

  if (isSnapshotMode) {
    if (!period) return <DateRangePage />
    return <WrappedDeck />
  }

  if (status !== "authenticated") return <LoginPage />
  if (!period) return <DateRangePage />
  return <WrappedDeck />
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <WrappedProvider>
          <SnapshotProvider>
            <AppShell />
          </SnapshotProvider>
        </WrappedProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
