import React, { Suspense, lazy } from 'react'
import { Route, Routes } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import AuthModal from './components/AuthModal'
import PageLoader from './components/PageLoader'
import AdminRoute from './components/AdminRoute'
import CommandPalette from './components/CommandPalette'

const Home = lazy(() => import('./pages/Home'))
const Layout = lazy(() => import('./pages/Layout'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const MyCreations = lazy(() => import('./pages/MyCreations'))
const ProfileSettings = lazy(() => import('./pages/ProfileSettings'))
const WriteArticle = lazy(() => import('./pages/WriteArticle'))
const SummarizeArticle = lazy(() => import('./pages/SummarizeArticle'))
const QuickCode = lazy(() => import('./pages/QuickCode'))
const GenerateImages = lazy(() => import('./pages/GenerateImages'))
const PhotoCleanup = lazy(() => import('./pages/PhotoCleanup'))
const ReviewResume = lazy(() => import('./pages/ReviewResume'))
const Community = lazy(() => import('./pages/Community'))
const PublicShare = lazy(() => import('./pages/PublicShare'))
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'))

const App = () => {
  return (
    <div className='min-h-screen bg-slate-950 font-sans'>
      <Toaster
        position='top-right'
        toastOptions={{
          style: {
            background: '#0f172a',
            color: '#f8fafc',
            border: '1px solid #334155',
            borderRadius: '16px',
            fontSize: '13px',
          },
        }}
      />
      <AuthModal />
      <CommandPalette />
      <Suspense fallback={<PageLoader text='Loading Visionary.ai...' />}>
        <Routes>
          <Route path='/' element={<Home />} />
          <Route path='/share/:id' element={<PublicShare />} />

          {/* Admin Control Center (Strictly Protected) */}
          <Route
            path='/admin'
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />

          {/* Workspace AI Tools */}
          <Route path='/ai' element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path='creations' element={<MyCreations />} />
            <Route path='profile' element={<ProfileSettings />} />
            <Route path='settings' element={<ProfileSettings />} />
            <Route path='write-article' element={<WriteArticle />} />
            <Route path='summarize-article' element={<SummarizeArticle />} />
            <Route path='quick-code' element={<QuickCode />} />
            <Route path='generate-images' element={<GenerateImages />} />
            <Route path='photo-cleanup' element={<PhotoCleanup />} />
            <Route path='remove-background' element={<PhotoCleanup initialMode='background' />} />
            <Route path='remove-object' element={<PhotoCleanup initialMode='object' />} />
            <Route path='review-resume' element={<ReviewResume />} />
            <Route path='community' element={<Community />} />
            <Route
              path='admin'
              element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              }
            />
          </Route>
        </Routes>
      </Suspense>
    </div>
  )
}

export default App
