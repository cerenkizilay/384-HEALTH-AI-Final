import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from './ui/AppLayout'
import { LandingPage } from './ui/pages/LandingPage'
import { LoginPage } from './ui/pages/LoginPage'
import { RegisterPage } from './ui/pages/RegisterPage'
import { VerifyEmailPage } from './ui/pages/VerifyEmailPage'
import { PostsPage } from './ui/pages/PostsPage'
import { PostDetailPage } from './ui/pages/PostDetailPage'
import { PostEditorPage } from './ui/pages/PostEditorPage'
import { AdminPage } from './ui/pages/AdminPage'
import { RequireAuth } from './ui/RequireAuth'
import { RequireRole } from './ui/RequireRole'

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<LandingPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="verify-email" element={<VerifyEmailPage />} />

        <Route
          path="posts"
          element={
            <RequireAuth>
              <PostsPage />
            </RequireAuth>
          }
        />
        <Route
          path="posts/new"
          element={
            <RequireAuth>
              <PostEditorPage mode="create" />
            </RequireAuth>
          }
        />
        <Route
          path="posts/:postId"
          element={
            <RequireAuth>
              <PostDetailPage />
            </RequireAuth>
          }
        />
        <Route
          path="posts/:postId/edit"
          element={
            <RequireAuth>
              <PostEditorPage mode="edit" />
            </RequireAuth>
          }
        />

        <Route
          path="admin"
          element={
            <RequireAuth>
              <RequireRole role="admin">
                <AdminPage />
              </RequireRole>
            </RequireAuth>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
